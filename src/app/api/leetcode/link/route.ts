import type { NextRequest } from "next/server";
import { invalidateCache } from "@/server/cache/cache";
import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { badRequest, conflict, json, notFound, serviceUnavailable, withApiErrorHandling } from "@/server/http/api";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { leetcodeService } from "@/server/integrations/leetcode.service";

/** LeetCode's own rule for usernames: letters, numbers, underscores and hyphens. */
const USERNAME = /^[A-Za-z0-9_-]{1,40}$/;

/** Who this member has linked, and when their numbers were last updated. */
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const session = await requireSession(request);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      leetcodeUsername: true,
      leetcodeStats: { select: { totalSolved: true, easySolved: true, mediumSolved: true, hardSolved: true, lastSynced: true } },
    },
  });

  return json({ success: true, username: user?.leetcodeUsername ?? null, stats: user?.leetcodeStats ?? null });
});

/** Links a LeetCode account. We check that it exists and store the numbers straight away. The background job keeps them fresh after that. */
export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const session = await requireSession(request);
  // Linking calls LeetCode's servers, so it is limited more tightly than a plain read.
  await enforceRateLimit(`leetcode-link:${session.userId}`, 10, 60);
  const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username.trim().replace(/^@/, "") : "";

  if (!USERNAME.test(username)) {
    throw badRequest("A LeetCode username uses letters, numbers, underscores and hyphens only.");
  }

  const taken = await prisma.user.findFirst({
    where: { leetcodeUsername: { equals: username, mode: "insensitive" }, NOT: { id: session.userId } },
    select: { id: true },
  });
  if (taken) {
    throw conflict("Another member has already linked that LeetCode account.");
  }

  const stats = await leetcodeService.getUserStats(username);
  // Needing to try again is not the same as a wrong username: if nothing answered, the member should be told to come back rather than that
  // their profile does not exist.
  if (stats === undefined) {
    throw serviceUnavailable("LeetCode is not answering right now. Please try again in a moment.");
  }
  if (stats === null) {
    throw notFound("We couldn't find that LeetCode profile. Check the spelling, and that the profile is public.");
  }

  await prisma.user.update({ where: { id: session.userId }, data: { leetcodeUsername: stats.username } });
  await leetcodeService.saveStats(session.userId, stats.username, stats);
  await invalidateCache("dashboard", "leaderboard", "members");

  return json({ success: true, username: stats.username, stats });
});

/** Unlinks the account and removes the stored numbers. */
export const DELETE = withApiErrorHandling(async (request: NextRequest) => {
  const session = await requireSession(request);

  await prisma.$transaction([
    prisma.leetCodeStats.deleteMany({ where: { userId: session.userId } }),
    prisma.user.update({ where: { id: session.userId }, data: { leetcodeUsername: null } }),
  ]);
  await invalidateCache("dashboard", "leaderboard", "members");

  return json({ success: true });
});
