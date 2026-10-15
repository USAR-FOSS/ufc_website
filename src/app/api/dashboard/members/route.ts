import type { NextRequest } from "next/server";
import { getOrSetCached } from "@/server/cache/cache";
import { prisma } from "@/server/db/prisma";
import { requireSession } from "@/server/auth/session";
import { json, withApiErrorHandling } from "@/server/http/api";

/** The most members `?all=1` returns. A club of this size is far below it; the cap only keeps one response from growing without bound. */
const ALL_CAP = 2000;
/** The page shows two lines of a bio, so there is no use sending more than this. */
const BIO_MAX = 240;

export const GET = withApiErrorHandling(async (request: NextRequest) => {
  // Members only. Email addresses are never part of this list, and cannot be searched either, so the list can't be used to find out whose email is whose.
  await requireSession(request);
  const { searchParams } = new URL(request.url);

  // Everyone in one answer, so the page can search and turn pages itself without asking the server again for each keystroke. The answer is
  // the same for every member, so it is built once and shared (and rebuilt when the member list changes).
  if (searchParams.get("all") === "1") {
    const order = searchParams.get("sortBy") === "joined" ? "joined" : searchParams.get("sortBy") === "name" ? "name" : "rank";
    const payload = await getOrSetCached("members", `all:${order}`, 120, async () => {
      const users = await prisma.user.findMany({
        take: ALL_CAP + 1,
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          name: true,
          githubUsername: true,
          location: true,
          bio: true,
          avatar: true,
          joinedAt: true,
          githubStats: { select: { commits: true, pullRequests: true, issues: true, contributions: true } },
        },
      });
      const truncated = users.length > ALL_CAP;
      const rows = users.slice(0, ALL_CAP).map((user) => ({
        id: user.id,
        name: user.name,
        githubUsername: user.githubUsername,
        location: user.location,
        bio: user.bio ? user.bio.slice(0, BIO_MAX) : user.bio,
        avatar: user.avatar,
        joinedAt: user.joinedAt.toISOString(),
        contributions: user.githubStats?.contributions ?? 0,
        points: (user.githubStats?.commits || 0) + (user.githubStats?.pullRequests || 0) * 5 + (user.githubStats?.issues || 0) * 2,
        githubStats: user.githubStats,
      }));
      // Sorted here (not by the database) so members with no stats yet are placed at the end, the same way every time.
      rows.sort((a, b) => {
        if (order === "joined") return b.joinedAt.localeCompare(a.joinedAt);
        if (order === "name") return (a.name ?? "\uffff").localeCompare(b.name ?? "\uffff");
        return b.contributions - a.contributions || a.joinedAt.localeCompare(b.joinedAt);
      });
      const members = rows.map((row, index) => ({
        id: row.id,
        name: row.name,
        githubUsername: row.githubUsername,
        location: row.location,
        bio: row.bio,
        avatar: row.avatar,
        joinedAt: row.joinedAt,
        rank: index + 1,
        points: row.points,
        githubStats: row.githubStats,
      }));
      return { success: true, members, total: members.length, truncated };
    });
    return json(payload);
  }

  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const search = (searchParams.get("search")?.trim() || "").slice(0, 60);
  const sortBy = searchParams.get("sortBy") || "rank";
  const payload = await getOrSetCached("members", `${limit}:${offset}:${sortBy}:${search.toLowerCase()}`, 120, async () => {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { githubUsername: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy:
          sortBy === "joined" ? { joinedAt: "desc" } : sortBy === "name" ? { name: "asc" } : { githubStats: { contributions: "desc" } },
        select: {
          id: true,
          name: true,
          githubUsername: true,
          location: true,
          bio: true,
          avatar: true,
          joinedAt: true,
          githubStats: { select: { commits: true, pullRequests: true, issues: true, contributions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    const members = users.map((user, index) => ({
      id: user.id,
      name: user.name,
      githubUsername: user.githubUsername,
      location: user.location,
      bio: user.bio,
      avatar: user.avatar,
      joinedAt: user.joinedAt.toISOString(),
      rank: offset + index + 1,
      points: (user.githubStats?.commits || 0) + (user.githubStats?.pullRequests || 0) * 5 + (user.githubStats?.issues || 0) * 2,
      githubStats: user.githubStats,
    }));

    return {
      success: true,
      members,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasMore: offset + members.length < total,
      search: search || null,
    };
  });

  return json(payload);
});
