import "server-only";
import type { OAuthConfig } from "next-auth/providers/oauth";
import { needsSignIn } from "@/server/auth/reauth";
import { TOKEN_LIFETIME_MS } from "@/server/integrations/github-token";

/**
 * Signing in through the club's shared sign in service (the separate `OIDC` project, at OIDC_ISSUER).
 *
 * It is a switch, off unless OIDC_LOGIN=on, and the site then works exactly as before (GitHub only). When it is on, the sign in page sends
 * people to the shared service first. That gives them one session across every club app. GitHub is still used by this site, in a second,
 * quiet step, only when a member has no usable GitHub connection stored: the shared service never hands a GitHub token to an app.
 */

export const OIDC_PROVIDER_ID = "fossclub";

export interface OidcSettings {
  issuer: string;
  clientId: string;
  clientSecret: string;
}

/** The settings, or null when the shared sign in is off or not completely configured (which leaves GitHub sign in exactly as it was). */
export function oidcSettings(env: Record<string, string | undefined> = process.env): OidcSettings | null {
  if (env.OIDC_LOGIN !== "on") return null;
  const issuer = env.OIDC_ISSUER?.trim().replace(/\/+$/, "");
  const clientId = env.OIDC_CLIENT_ID?.trim();
  const clientSecret = env.OIDC_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) {
    console.error("OIDC_LOGIN is on but OIDC_ISSUER, OIDC_CLIENT_ID or OIDC_CLIENT_SECRET is missing. Using GitHub sign in only.");
    return null;
  }
  return { issuer, clientId, clientSecret };
}

interface OidcProfile {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  picture?: string;
  github_id?: string;
}

export function oidcProvider(settings: OidcSettings): OAuthConfig<OidcProfile> {
  return {
    id: OIDC_PROVIDER_ID,
    name: "USAR FOSS Club",
    type: "oauth",
    wellKnown: `${settings.issuer}/.well-known/openid-configuration`,
    // `github` asks for the person's GitHub id, which this one app is allowed to receive: members are matched by it, never by a username.
    authorization: { params: { scope: "openid profile email club github" } },
    idToken: true,
    checks: ["pkce", "state", "nonce"],
    clientId: settings.clientId,
    clientSecret: settings.clientSecret,
    client: { id_token_signed_response_alg: "RS256" },
    profile: (profile) => ({
      id: profile.sub,
      name: profile.name ?? profile.preferred_username ?? null,
      email: profile.email ?? null,
      image: profile.picture ?? null,
    }),
  };
}

/** What a sign in through the shared service tells this site about the person. Null if the id the site matches on is missing. */
export function oidcClaims(profile: unknown): { githubId: string; login: string } | null {
  if (!profile || typeof profile !== "object") return null;
  const p = profile as { github_id?: unknown; preferred_username?: unknown };
  const githubId = typeof p.github_id === "string" ? p.github_id : typeof p.github_id === "number" ? String(p.github_id) : "";
  if (!/^[0-9]{1,20}$/.test(githubId)) return null;
  return { githubId, login: typeof p.preferred_username === "string" ? p.preferred_username : "" };
}

interface ConnectionRow {
  id: string;
  githubTokenCiphertext: string | null;
  githubRefreshTokenCiphertext: string | null;
  githubTokenExpiresAt: Date | null;
  githubTokenUpdatedAt: Date | null;
}

/**
 * Does this member already have a GitHub connection the site can use? If so, signing in through the shared service is enough. If not, they
 * are sent through GitHub once, quietly, which stores a fresh token and keeps their stats updating.
 */
export async function hasUsableGitHubConnection(row: ConnectionRow, now = Date.now()): Promise<boolean> {
  if (!row.githubTokenCiphertext) return false;
  const expiry =
    row.githubTokenExpiresAt ?? (row.githubTokenUpdatedAt ? new Date(row.githubTokenUpdatedAt.getTime() + TOKEN_LIFETIME_MS) : null);
  // A token that has run out and has nothing to renew it with is of no use.
  if (expiry && expiry.getTime() <= now && !row.githubRefreshTokenCiphertext) return false;
  return !(await needsSignIn(row.id));
}
