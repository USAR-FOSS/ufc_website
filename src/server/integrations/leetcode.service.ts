import "server-only";

export interface LeetCodeUserStats {
  username: string;
  ranking: number | null;
  reputation: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number | null;
}

export interface LeetCodeSubmission {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timestamp: string;
}

export class LeetCodeService {
  /**
   * LeetCode's own numbers. Returns the stats, `null` if LeetCode says the user does not exist, and `undefined` if we simply could not get an
   * answer (a timeout, a block, a bad reply), so the caller knows whether to try somewhere else.
   */
  private async fromLeetCode(username: string): Promise<LeetCodeUserStats | null | undefined> {
    try {
      const response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          query: `
            query getUserProfile($username: String!) {
              matchedUser(username: $username) {
                username
                profile { ranking reputation }
                submitStats { acSubmissionNum { difficulty count } }
              }
            }
          `,
          variables: { username },
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) return undefined;

      const result = await response.json();
      const userData = result.data?.matchedUser;
      if (!userData) return result.errors?.some((e: { message?: string }) => /does not exist/i.test(e.message ?? "")) ? null : undefined;

      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;
      for (const sub of userData.submitStats?.acSubmissionNum || []) {
        if (sub.difficulty === "Easy") easySolved = sub.count;
        else if (sub.difficulty === "Medium") mediumSolved = sub.count;
        else if (sub.difficulty === "Hard") hardSolved = sub.count;
      }

      return {
        username: userData.username,
        ranking: userData.profile?.ranking || null,
        reputation: userData.profile?.reputation || 0,
        totalSolved: easySolved + mediumSolved + hardSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate: null,
      };
    } catch (error) {
      console.error("LeetCode GraphQL API failed:", error);
      return undefined;
    }
  }

  /**
   * The community mirror of LeetCode's numbers. It sleeps when idle, rate-limits, and can lag behind, so it is only a last resort.
   * It answers in the same three states as LeetCode itself: the stats, `null` when it says the user does not exist, and `undefined` when it
   * could not be asked. A reply we cannot read is not evidence that a member's profile has gone.
   */
  private async fromCommunityApi(username: string): Promise<LeetCodeUserStats | null | undefined> {
    try {
      const response = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6_000),
      });
      if (!response.ok) return undefined;

      const data = (await response.json()) as {
        solvedProblem?: number;
        ranking?: number;
        reputation?: number;
        easySolved?: number;
        mediumSolved?: number;
        hardSolved?: number;
        acceptanceRate?: number | null;
        errors?: { message?: string }[];
      };
      // For a name that does not exist this service still answers 200, with the error instead of numbers. Only that explicit message says
      // the profile is missing; any other body without numbers is a reply we could not read, so we do not yet know anything.
      if (typeof data?.solvedProblem !== "number" || data?.errors) {
        return data?.errors?.some((e) => /does not exist/i.test(e?.message ?? "")) ? null : undefined;
      }

      return {
        username,
        ranking: data.ranking || null,
        reputation: data.reputation || 0,
        totalSolved: data.solvedProblem || 0,
        easySolved: data.easySolved || 0,
        mediumSolved: data.mediumSolved || 0,
        hardSolved: data.hardSolved || 0,
        acceptanceRate: data.acceptanceRate || null,
      };
    } catch (error) {
      console.warn("Community LeetCode API failed:", error);
      return undefined;
    }
  }

  /**
   * A member's LeetCode numbers. LeetCode itself is always asked first, and every caller (linking, the live poll, the daily refresh) gets
   * its answer, so they all see the same numbers. The community API is only a fallback when LeetCode could not be reached, and `fast` skips it
   * (the live poll would rather try again in a minute than wait on a slow service).
   * Two sources that can disagree, taking turns, made one member's numbers (and leaderboard place) swing back and forth.
   *
   * The answer keeps the same three states all the way out to the caller: the stats, `null` when a source said the username does not exist, and
   * `undefined` when no source could be asked. Only the second of those is the member's mistake.
   */
  async getUserStats(username: string, options: { fast?: boolean } = {}): Promise<LeetCodeUserStats | null | undefined> {
    const official = await this.fromLeetCode(username);
    if (official !== undefined) return official;
    // LeetCode itself could not answer, so all we know is that we do not know. The live poll would rather try again in a minute than wait on
    // the slow mirror, and either way nobody may be told the profile is missing yet.
    if (options.fast) return undefined;
    return this.fromCommunityApi(username);
  }

  /**
   * Writes numbers we already have to the database, but only if they differ from what is stored. The solved counts are what people see and what
   * the leaderboard uses, so those decide. Ranking and reputation drift on their own and differ a little between the two sources we read, so
   * they are saved along with a real change and never cause a write by themselves.
   *
   * When the counts went up for a member we already knew, a line is added to the activity feed for each difficulty that rose ("Solved 2 Medium
   * problems on LeetCode"). LeetCode only gives totals, so that is all it can say: how many, and when we noticed. A first link adds nothing, so
   * nobody's whole history lands in the feed, and a count that went down adds nothing either.
   */
  async saveStats(userId: string, leetcodeUsername: string, stats: LeetCodeUserStats) {
    const { prisma } = await import("@/server/db/prisma");
    const stored = await prisma.leetCodeStats.findUnique({ where: { userId } });
    if (
      stored &&
      stored.leetcodeUsername === leetcodeUsername &&
      stored.totalSolved === stats.totalSolved &&
      stored.easySolved === stats.easySolved &&
      stored.mediumSolved === stats.mediumSolved &&
      stored.hardSolved === stats.hardSolved
    ) {
      return { changed: false, activityAdded: false };
    }

    // Solved counts only go up. A fall is not believed the first time: it may be a failed or partial reply. If the next look says the same, it is real.
    if (stored && stored.leetcodeUsername === leetcodeUsername && stats.totalSolved < stored.totalSolved) {
      const { seenTwice } = await import("@/server/cache/confirm");
      if (!(await seenTwice(`leetcode:${userId}`, `${stats.easySolved}/${stats.mediumSolved}/${stats.hardSolved}`))) {
        console.warn(
          `LeetCode count for ${leetcodeUsername} fell (${stored.totalSolved} to ${stats.totalSolved}); waiting for a second look.`,
        );
        // Take that second look in a minute, for this member only (quiet members are otherwise only checked every six hours).
        const { allowRecheck } = await import("@/server/cache/confirm");
        if (await allowRecheck(`leetcode:${userId}`)) {
          const { enqueueLeetCodeSync } = await import("@/server/jobs/leetcode-sync");
          await enqueueLeetCodeSync(userId, "recheck", 60).catch((error) => console.error("Could not queue the re-check:", error));
        }
        return { changed: false, activityAdded: false };
      }
    }

    const data = {
      leetcodeUsername,
      totalSolved: stats.totalSolved,
      easySolved: stats.easySolved,
      mediumSolved: stats.mediumSolved,
      hardSolved: stats.hardSolved,
      ranking: stats.ranking,
      reputation: stats.reputation,
      acceptanceRate: stats.acceptanceRate,
      lastSynced: new Date(),
    };

    // Only for the same account as before: a different username is a different history, not new solves.
    const rises =
      stored && stored.leetcodeUsername === leetcodeUsername
        ? (
            [
              { type: "LEETCODE_EASY", label: "Easy", before: stored.easySolved, after: stats.easySolved },
              { type: "LEETCODE_MEDIUM", label: "Medium", before: stored.mediumSolved, after: stats.mediumSolved },
              { type: "LEETCODE_HARD", label: "Hard", before: stored.hardSolved, after: stats.hardSolved },
            ] as const
          ).filter((r) => r.after > r.before)
        : [];
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.leetCodeStats.upsert({ where: { userId }, update: data, create: { userId, ...data } });
      if (rises.length) {
        await tx.activity.createMany({
          data: rises.map((r) => ({
            type: r.type,
            userId,
            description: `Solved ${r.after - r.before} ${r.label} problem${r.after - r.before === 1 ? "" : "s"} on LeetCode`,
            // One line per new total, so noticing the same rise twice can never add it twice.
            sourceKey: `leetcode:${userId}:${r.label.toLowerCase()}:${r.after}`,
            metadata: { source: "leetcode", difficulty: r.label, solved: r.after - r.before, total: r.after },
            createdAt: now,
          })),
          skipDuplicates: true,
        });
      }
    });
    return { changed: true, activityAdded: rises.length > 0 };
  }

  /**
   * Fetches the numbers from LeetCode and stores them. A profile a source has confirmed is gone comes back as `skipped`, because asking again
   * changes nothing. An answer we could not get throws instead, so the job that called us is retried rather than counted as done.
   */
  async syncUserStats(userId: string, leetcodeUsername: string) {
    const stats = await this.getUserStats(leetcodeUsername);

    if (stats === null) {
      return { skipped: "profile not found" as const };
    }

    if (stats === undefined) {
      throw new Error(`LeetCode could not be reached for ${leetcodeUsername}`);
    }

    const { changed, activityAdded } = await this.saveStats(userId, leetcodeUsername, stats);
    return { success: true, stats, changed, activityAdded };
  }

  calculatePoints(stats: { easySolved: number; mediumSolved: number; hardSolved: number }): number {
    return stats.easySolved * 2 + stats.mediumSolved * 4 + stats.hardSolved * 6;
  }
}

// Lazy-loaded singleton
let _leetcodeService: LeetCodeService | null = null;

export const leetcodeService = {
  getUserStats: async (username: string, options?: { fast?: boolean }) => {
    if (!_leetcodeService) _leetcodeService = new LeetCodeService();
    return _leetcodeService.getUserStats(username, options);
  },
  syncUserStats: async (userId: string, username: string) => {
    if (!_leetcodeService) _leetcodeService = new LeetCodeService();
    return _leetcodeService.syncUserStats(userId, username);
  },
  saveStats: async (userId: string, username: string, stats: LeetCodeUserStats) => {
    if (!_leetcodeService) _leetcodeService = new LeetCodeService();
    return _leetcodeService.saveStats(userId, username, stats);
  },
  calculatePoints: (stats: { easySolved: number; mediumSolved: number; hardSolved: number }) => {
    if (!_leetcodeService) _leetcodeService = new LeetCodeService();
    return _leetcodeService.calculatePoints(stats);
  },
};
