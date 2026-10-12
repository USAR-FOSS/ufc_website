import { afterEach, test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { LeetCodeService } from "./leetcode.service";

/**
 * Two sources can answer for a member's LeetCode numbers, and both can fail. These tests hold the difference the whole fix rests on: an answer
 * of "we could not ask" is never allowed to come out as "that profile is not there".
 */

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Both sources log when they fail, and failing is the point here, so the noise is silenced per test. */
const silence = (t: TestContext) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** LeetCode's own answer for a member who exists. */
const leetCodeFound = (easy: number, medium: number, hard: number) =>
  json({
    data: {
      matchedUser: {
        username: "octocat",
        profile: { ranking: 100, reputation: 0 },
        submitStats: {
          acSubmissionNum: [
            { difficulty: "Easy", count: easy },
            { difficulty: "Medium", count: medium },
            { difficulty: "Hard", count: hard },
          ],
        },
      },
    },
  });

/** What both sources send for a username they do not know. */
const doesNotExist = () => json({ errors: [{ message: "That user does not exist." }], data: { matchedUser: null } });

/** The community mirror's answer for a member who exists. */
const mirrorFound = (solved: number) => json({ solvedProblem: solved, easySolved: 4, mediumSolved: 3, hardSolved: 2, ranking: 120 });

/** Answers fetch in order, recording the URLs asked for, and never runs out of answers. */
function stubFetch(answers: (Response | Error)[]) {
  const asked: string[] = [];
  let next = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    asked.push(String(input));
    const answer = answers[Math.min(next++, answers.length - 1)];
    if (answer instanceof Error) throw answer;
    return answer;
  }) as typeof fetch;
  return asked;
}

test("LeetCode's own numbers are used, and the mirror is never asked", async (t) => {
  silence(t);
  const asked = stubFetch([leetCodeFound(5, 4, 3)]);

  const stats = await new LeetCodeService().getUserStats("octocat");

  assert.equal(stats?.totalSolved, 12);
  assert.equal(stats?.easySolved, 5);
  assert.equal(stats?.mediumSolved, 4);
  assert.equal(stats?.hardSolved, 3);
  assert.equal(asked.length, 1);
  assert.match(asked[0], /leetcode\.com/);
});

test("a username LeetCode does not know is reported as missing", async (t) => {
  silence(t);
  const asked = stubFetch([doesNotExist()]);

  assert.equal(await new LeetCodeService().getUserStats("ghost"), null);
  assert.equal(asked.length, 1);
});

test("an outage at both sources is reported as unknown, not missing", async (t) => {
  silence(t);
  const asked = stubFetch([new Response("down", { status: 500 }), new Response("down", { status: 503 })]);

  assert.equal(await new LeetCodeService().getUserStats("octocat"), undefined);
  assert.equal(asked.length, 2);
});

test("the mirror fills in when LeetCode cannot be reached", async (t) => {
  silence(t);
  const asked = stubFetch([new Response("down", { status: 500 }), mirrorFound(9)]);

  const stats = await new LeetCodeService().getUserStats("octocat");

  assert.equal(stats?.totalSolved, 9);
  assert.equal(stats?.hardSolved, 2);
  assert.equal(asked.length, 2);
  assert.match(asked[1], /alfa-leetcode-api/);
});

test("the mirror saying the username does not exist is believed", async (t) => {
  silence(t);
  stubFetch([new Response("down", { status: 500 }), doesNotExist()]);

  assert.equal(await new LeetCodeService().getUserStats("ghost"), null);
});

test("a mirror reply with neither numbers nor that message is not called missing", async (t) => {
  silence(t);
  stubFetch([new Response("down", { status: 500 }), json({})]);

  assert.equal(await new LeetCodeService().getUserStats("octocat"), undefined);
});

test("a mirror reply that is not JSON is not called missing", async (t) => {
  silence(t);
  stubFetch([new Response("down", { status: 500 }), new Response("<html>rate limited</html>", { status: 200 })]);

  assert.equal(await new LeetCodeService().getUserStats("octocat"), undefined);
});

test("a request that never comes back is unknown, not a missing profile", async (t) => {
  silence(t);
  stubFetch([new Error("timed out"), new Error("timed out")]);

  assert.equal(await new LeetCodeService().getUserStats("octocat"), undefined);
});

test("fast mode skips the mirror and admits it does not know", async (t) => {
  silence(t);
  const asked = stubFetch([new Response("down", { status: 500 })]);

  assert.equal(await new LeetCodeService().getUserStats("octocat", { fast: true }), undefined);
  assert.equal(asked.length, 1);
});

test("a confirmed-missing profile is skipped by the sync job instead of failing it", async (t) => {
  silence(t);
  stubFetch([doesNotExist()]);

  assert.deepEqual(await new LeetCodeService().syncUserStats("member-1", "ghost"), { skipped: "profile not found" });
});

test("an outage makes the sync job throw, so it is retried", async (t) => {
  silence(t);
  stubFetch([new Response("down", { status: 500 }), new Response("down", { status: 500 })]);

  await assert.rejects(() => new LeetCodeService().syncUserStats("member-1", "octocat"), /LeetCode could not be reached/);
});
