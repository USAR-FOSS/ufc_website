"use client";

import { useMemo, useState } from "react";
import { Calendar, MapPin, Search } from "lucide-react";
import { GithubIcon } from "@/components/ui/social-icons";
import { Pin, Tape } from "@/components/home/scrap";
import { useApi, useVersionStream } from "@/components/dashboard/use-api";
import { Avatar, Empty, ErrorPanel, PageHeader, Pager, pageRange } from "@/components/dashboard/ui";
import { TAPE_CYCLE } from "@/data/tones";
import { SkeletonCards, SkeletonShell } from "@/components/dashboard/skeleton";

interface Member {
  id: string;
  name: string;
  githubUsername?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  joinedAt: string;
  rank: number;
  points: number;
  githubStats?: { commits: number; pullRequests: number; issues: number; contributions: number };
}

const PER_PAGE = 20;
const TILT = [-1.4, 1, -0.8, 1.5, -1.1, 0.8];

type MembersResponse = { members?: Member[]; total?: number };

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Everyone is loaded once, and searching and turning pages happen here in the browser, so typing never asks the server anything.
  const { data, error, loading, reload, refresh } = useApi<MembersResponse>("/api/dashboard/members?all=1", {
    errorMessage: "We couldn't load the member list just now.",
  });
  useVersionStream("members", refresh); // someone joined or changed their profile: pick it up quietly

  const all = useMemo(() => data?.members ?? [], [data]);
  const needle = search.trim().toLowerCase();
  const matches = useMemo(
    () =>
      needle ? all.filter((m) => `${m.name ?? ""} ${m.githubUsername ?? ""} ${m.location ?? ""}`.toLowerCase().includes(needle)) : all,
    [all, needle],
  );
  const total = matches.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  // A shorter list (a search, or someone leaving) can leave the current page past the end.
  const current = Math.min(page, pages);
  const members = matches.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="§ members · the whole club"
        title="Our"
        accent="people."
        tone="lilac"
        art="heart"
        sub={
          all.length
            ? `${all.length} ${all.length === 1 ? "person" : "people"} building in the open together.`
            : "Everyone who has signed in, in one place."
        }
      >
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--ink)]/55" strokeWidth={2.6} />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, username or place…"
            className="field !pl-12"
          />
        </label>
      </PageHeader>

      {loading ? (
        <SkeletonShell label="Finding everyone" caption="finding everyone">
          <SkeletonCards count={8} className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        </SkeletonShell>
      ) : error ? (
        <ErrorPanel title="Couldn't load members" message={error} onRetry={reload} />
      ) : members.length === 0 ? (
        <Empty
          art="heart"
          title={needle ? "Nobody found" : "No members yet"}
          body={needle ? `Nobody matches "${search.trim()}". Try a different name.` : "Be the first one in."}
        />
      ) : (
        <ul className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m, i) => (
            <li key={m.id}>
              <Pin r={TILT[i % TILT.length]} drag={false} delay={(i % 3) * 0.06} className="h-full">
                <article className="paper relative flex h-full flex-col px-6 pb-6 pt-9">
                  <Tape tone={TAPE_CYCLE[i % TAPE_CYCLE.length]} className="-top-3 left-1/2 -translate-x-1/2" rotate={-3} />
                  <div className="flex items-center gap-4">
                    <Avatar src={m.avatar} name={m.name || m.githubUsername} size={64} />
                    <div className="min-w-0">
                      <h3 className="truncate text-[1.35rem] leading-tight">{m.name || "Anonymous"}</h3>
                      {m.githubUsername && (
                        <p className="code flex items-center gap-1.5 text-[0.76rem] font-bold text-[var(--ink)]/60">
                          <GithubIcon className="size-3.5" />@{m.githubUsername}
                        </p>
                      )}
                    </div>
                  </div>

                  {m.bio && <p className="mt-4 line-clamp-2 text-[0.95rem] leading-[1.55] text-[var(--ink)]/75">{m.bio}</p>}

                  <ul className="mt-4 space-y-1.5 text-[0.88rem] text-[var(--ink)]/65">
                    {m.location && (
                      <li className="flex items-center gap-2">
                        <MapPin size={14} strokeWidth={2.4} />
                        {m.location}
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Calendar size={14} strokeWidth={2.4} />
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </li>
                  </ul>

                  {m.githubStats && (
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t-2 border-dashed border-[var(--ink)]/25 pt-4 text-center">
                      {[
                        ["commits", m.githubStats.commits, "#9af2c6"],
                        ["PRs", m.githubStats.pullRequests, "#ffe36e"],
                        ["issues", m.githubStats.issues, "#ffb3cf"],
                      ].map(([label, n, bg]) => (
                        <div
                          key={label as string}
                          className="rounded-xl border-2 border-[var(--ink)] py-1.5 leading-none shadow-[2px_2px_0_var(--ink)]"
                          style={{ background: bg as string }}
                        >
                          <div className="text-[1.15rem] font-extrabold">{n}</div>
                          <div className="code mt-1 text-[0.58rem] font-bold uppercase tracking-widest text-[var(--ink)]/65">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.githubUsername && (
                    <a
                      href={`https://github.com/${m.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-paper mt-auto w-full justify-center !pr-4 pt-0"
                      style={{ marginTop: "1.25rem" }}
                    >
                      View on GitHub
                    </a>
                  )}
                </article>
              </Pin>
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={current}
        pages={pages}
        onChange={setPage}
        label={pageRange(current, PER_PAGE, total, "members", needle ? ` matching "${search.trim()}"` : "")}
      />
    </div>
  );
}
