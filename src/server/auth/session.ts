import "server-only";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { needsSignIn } from "@/server/auth/reauth";
import { reauthRequired, unauthorized } from "@/server/http/api";

export interface AuthSession {
  userId: string;
  role: string;
  githubUsername: string;
}

type SessionRead = { session: AuthSession } | { session: null; reauth: boolean };

async function readSession(request: NextRequest): Promise<SessionRead> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || typeof token.userId !== "string" || typeof token.role !== "string" || typeof token.githubUsername !== "string") {
    return { session: null, reauth: false };
  }

  // Their GitHub connection has run out and could not be renewed, so the sign in cookie is no use any more: it is treated as signed out
  // until they sign in again (which takes them off the list).
  if (await needsSignIn(token.userId)) {
    return { session: null, reauth: true };
  }

  return {
    session: {
      userId: token.userId,
      role: token.role,
      githubUsername: token.githubUsername,
    },
  };
}

export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  return (await readSession(request)).session;
}

export async function requireSession(request: NextRequest): Promise<AuthSession> {
  const result = await readSession(request);

  if (!result.session) {
    // The page uses the "reauth" code to send them to sign in again instead of just showing an error.
    throw result.reauth ? reauthRequired() : unauthorized();
  }

  return result.session;
}
