import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { NEVER_EXPIRES, TOKEN_LIFETIME_MS, createTokenService, type TokenDeps, type TokenRow } from "./github-token";
import { needsSignIn } from "@/server/auth/reauth";
import { encryptToken } from "@/server/security/token-encryption";

/**
 * A member's GitHub token lasts eight hours, and the refresh token that replaces it can only be used once. Everything the site does for a
 * member (the live poll, the syncs) asks this module for a token, so telling "renew it", "they have to sign in again" and "GitHub was not
 * answering, try again later" apart is the difference between a working dashboard and a member being signed out for no reason.
 *
 * Every dependency this module has on the outside world sits behind TokenDeps, which exists for exactly this, so nothing here needs a
 * database, Redis, the network or a real wait.
 */

// A key only these tests use. The service reads it when it needs one rather than at import time, so setting it here is in time.
process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

/** One fixed moment, so nothing here depends on how long the test takes. */
const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

/** A member whose stored pair is good for another hour, unless a case says otherwise. */
const rowFor = (id: string, over: Partial<TokenRow> = {}): TokenRow => ({
  id,
  githubTokenCiphertext: encryptToken("gho_stored"),
  githubRefreshTokenCiphertext: encryptToken("ghr_stored"),
  githubTokenExpiresAt: new Date(NOW + 60 * 60 * 1000),
  githubTokenUpdatedAt: new Date(NOW),
  ...over,
});

/** The same member, with the token already run out. */
const runOut = (id: string, over: Partial<TokenRow> = {}): TokenRow => rowFor(id, { githubTokenExpiresAt: new Date(NOW - 1000), ...over });

/** Failing is the point of a few of these cases, and the module logs when it fails, so the noise is silenced per test. */
const silence = (t: TestContext) => t.mock.method(console, "error", () => {});

interface Options {
  /** A fresh answer for every load, for the cases where the stored row changes mid call. */
  loadRows?: (TokenRow | null)[];
  /** The same answer every time. */
  row?: TokenRow | null;
  saveSucceeds?: boolean;
  renew?: TokenDeps["renew"];
  lockAcquired?: boolean;
}

/** The service with everything outside it replaced. */
const build = (options: Options = {}) => {
  const saved: { userId: string; usedRefresh: string; data: Omit<TokenRow, "id"> }[] = [];
  const renewals: string[] = [];
  const counted = { locks: 0, waits: 0, loads: 0 };
  let loaded = 0;

  const deps: TokenDeps = {
    now: () => NOW,
    load: async () => {
      counted.loads++;
      const rows = options.loadRows;
      return rows ? rows[Math.min(loaded++, rows.length - 1)] : (options.row ?? null);
    },
    saveRenewed: async (userId, usedRefresh, data) => {
      saved.push({ userId, usedRefresh, data });
      return options.saveSucceeds ?? true;
    },
    renew: async (refreshToken) => {
      renewals.push(refreshToken);
      if (options.renew) return options.renew(refreshToken);
      return { kind: "retry" };
    },
    lock: async () => {
      counted.locks++;
      return options.lockAcquired === false ? null : async () => {};
    },
    wait: async () => {
      counted.waits++;
    },
  };

  return { service: createTokenService(deps), saved, renewals, counted };
};

const renewed = (accessToken: string, refreshToken: string | null, expiresInSeconds: number | null) =>
  ({ kind: "ok", accessToken, refreshToken, expiresInSeconds }) as const;

test("a token with time left is handed back as it is", async () => {
  const row = rowFor("time-left");
  const { service, counted } = build({ row });

  assert.deepEqual(await service.usable(row), { token: "gho_stored" });
  assert.equal(counted.locks, 0);
});

test("a token close to its end is renewed before it is used, and the new pair is saved", async () => {
  const row = rowFor("expiring", { githubTokenExpiresAt: new Date(NOW + 4 * 60 * 1000) });
  const { service, saved, renewals } = build({ row, renew: async () => renewed("gho_new", "ghr_new", 28800) });

  assert.deepEqual(await service.usable(row), { token: "gho_new" });
  assert.deepEqual(renewals, ["ghr_stored"]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].userId, "expiring");
  assert.equal(saved[0].usedRefresh, row.githubRefreshTokenCiphertext);
  assert.equal(saved[0].data.githubTokenExpiresAt?.getTime(), NOW + 28800 * 1000);
  assert.equal(saved[0].data.githubTokenUpdatedAt?.getTime(), NOW);
});

test("a renewal that returns no new refresh token keeps the one on file", async () => {
  const row = runOut("keep-refresh");
  const { service, saved } = build({ row, renew: async () => renewed("gho_new", null, 3600) });

  await service.usable(row);
  assert.equal(saved[0].data.githubRefreshTokenCiphertext, row.githubRefreshTokenCiphertext);
});

test("a renewal that reports no lifetime stores a token that does not run out", async () => {
  const row = runOut("never");
  const { service, saved } = build({ row, renew: async () => renewed("gho_new", "ghr_new", null) });

  await service.usable(row);
  assert.equal(saved[0].data.githubTokenExpiresAt, NEVER_EXPIRES);
});

test("a row from before expiry was recorded falls back to its sign in time", async () => {
  const stillGood = rowFor("legacy-good", {
    githubTokenExpiresAt: null,
    githubTokenUpdatedAt: new Date(NOW - TOKEN_LIFETIME_MS + 10 * 60 * 1000),
  });
  assert.deepEqual(await build({ row: stillGood }).service.usable(stillGood), { token: "gho_stored" });

  const tooOld = rowFor("legacy-old", { githubTokenExpiresAt: null, githubTokenUpdatedAt: new Date(NOW - TOKEN_LIFETIME_MS - 1000) });
  const { service } = build({ row: tooOld, renew: async () => renewed("gho_new", "ghr_new", 3600) });
  assert.deepEqual(await service.usable(tooOld), { token: "gho_new" });
});

test("a row with no expiry and no sign in time is tried as it is", async () => {
  const row = rowFor("no-hint", { githubTokenExpiresAt: null, githubTokenUpdatedAt: null });
  assert.deepEqual(await build({ row }).service.usable(row), { token: "gho_stored" });
});

test("a member who never connected GitHub has no token", async () => {
  const row = rowFor("never-connected", { githubTokenCiphertext: null });
  assert.deepEqual(await build({ row }).service.usable(row), { token: null, reason: "missing" });
});

test("a token cleared between the check and the lock is missing", async () => {
  const row = runOut("cleared");
  const cleared = runOut("cleared", { githubTokenCiphertext: null });
  assert.deepEqual(await build({ loadRows: [cleared] }).service.usable(row), { token: null, reason: "missing" });
});

test("an expired token with no refresh token sends the member to sign in again", async () => {
  const row = runOut("no-refresh", { githubRefreshTokenCiphertext: null });
  assert.deepEqual(await build({ row }).service.usable(row), { token: null, reason: "needs-sign-in" });
  assert.equal(await needsSignIn("no-refresh"), true);
});

test("a stored token that cannot be read sends the member to sign in again", async (t) => {
  silence(t);
  const row = rowFor("bad-access", { githubTokenCiphertext: "not-an-encrypted-token" });
  assert.deepEqual(await build({ row }).service.usable(row), { token: null, reason: "needs-sign-in" });
  assert.equal(await needsSignIn("bad-access"), true);
});

test("a refresh token that cannot be read sends the member to sign in again", async (t) => {
  silence(t);
  const row = runOut("bad-refresh", { githubRefreshTokenCiphertext: "not-an-encrypted-token" });
  assert.deepEqual(await build({ row }).service.usable(row), { token: null, reason: "needs-sign-in" });
  assert.equal(await needsSignIn("bad-refresh"), true);
});

test("GitHub saying the refresh token is no good sends the member to sign in again", async () => {
  const row = runOut("dead");
  const { service } = build({ row, renew: async () => ({ kind: "dead" }) as const });

  assert.deepEqual(await service.usable(row), { token: null, reason: "needs-sign-in" });
  assert.equal(await needsSignIn("dead"), true);
});

test("a dead refresh token is not believed if the stored pair was replaced and now has time left", async () => {
  const stale = runOut("replaced");
  const fresh = rowFor("replaced", {
    githubTokenCiphertext: encryptToken("gho_replaced"),
    githubRefreshTokenCiphertext: encryptToken("ghr_replaced"),
  });
  const { service } = build({ loadRows: [stale, fresh], renew: async () => ({ kind: "dead" }) as const });

  assert.deepEqual(await service.usable(stale), { token: "gho_replaced" });
  assert.equal(await needsSignIn("replaced"), false);
});

test("GitHub not answering is a retry, and does not sign the member out", async () => {
  const row = runOut("unreachable");
  const { service } = build({ row, renew: async () => ({ kind: "retry" }) as const });

  assert.deepEqual(await service.usable(row), { token: null, reason: "retry" });
  assert.equal(await needsSignIn("unreachable"), false);
});

test("a sign in during renewal wins over the token we just fetched", async () => {
  const stale = runOut("race");
  const signedIn = rowFor("race", { githubTokenCiphertext: encryptToken("gho_signin") });
  const { service } = build({
    loadRows: [stale, signedIn],
    saveSucceeds: false,
    renew: async () => renewed("gho_discarded", "ghr_new", 3600),
  });

  assert.deepEqual(await service.usable(stale), { token: "gho_signin" });
});

test("if the newer row has no token left, that is missing", async () => {
  const stale = runOut("race-gone");
  const cleared = runOut("race-gone", { githubTokenCiphertext: null });
  const { service } = build({ loadRows: [stale, cleared], saveSucceeds: false, renew: async () => renewed("gho_discarded", null, 1) });

  assert.deepEqual(await service.usable(stale), { token: null, reason: "missing" });
});

test("waiting for whoever holds the lock is better than renewing twice", async () => {
  const stale = runOut("waited");
  const fresh = rowFor("waited", { githubTokenCiphertext: encryptToken("gho_holder") });
  const { service, counted, renewals } = build({ loadRows: [fresh], lockAcquired: false });

  assert.deepEqual(await service.usable(stale), { token: "gho_holder" });
  assert.equal(counted.locks, 1);
  assert.equal(counted.waits, 1);
  assert.deepEqual(renewals, []);
});

test("a lock nobody gives back ends as busy, not as a second renewal", async () => {
  const stale = runOut("contended");
  const { service, counted, renewals } = build({ row: stale, lockAcquired: false });

  assert.deepEqual(await service.usable(stale), { token: null, reason: "busy" });
  assert.equal(counted.locks, 1);
  assert.equal(counted.waits, 10);
  assert.deepEqual(renewals, []);
  assert.equal(await needsSignIn("contended"), false);
});
