import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { invalidateCache } from "@/server/cache/cache";
import { prisma } from "@/server/db/prisma";
import { leetcodeService } from "@/server/integrations/leetcode.service";

export const runtime = "nodejs";

/** Pulls one member's LeetCode numbers and stores them, the same shape of job as the GitHub sync. Called by QStash. */
const handler = async (request: Request) => {
  const body = (await request.json()) as { userId?: string; reason?: string };

  if (!body.userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, leetcodeUsername: true } });

  // Unlinked since the job was queued: nothing to do, and no point having QStash retry it.
  if (!user?.leetcodeUsername) {
    return Response.json({ success: true, reason: body.reason, skipped: "no LeetCode username" });
  }

  const result = await leetcodeService.syncUserStats(user.id, user.leetcodeUsername);

  // LeetCode says this username is gone: there is nothing to fetch, and nothing for QStash to retry. (An outage still throws, so that one is
  // retried.)
  if ("skipped" in result) {
    return Response.json({ success: true, reason: body.reason, skipped: result.skipped });
  }

  // Caches are only cleared when the database really changed.
  if (result.changed)
    await invalidateCache("dashboard", "leaderboard", "members", ...(result.activityAdded ? (["activity-feed"] as const) : []));

  return Response.json({ success: true, reason: body.reason, solved: result.stats.totalSolved, changed: result.changed });
};

const qstashSigningKeysConfigured = Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY);

export const POST = qstashSigningKeysConfigured
  ? verifySignatureAppRouter(handler)
  : async () => Response.json({ error: "QStash signing keys are not configured" }, { status: 503 });
