"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { MaskLine, Reveal } from "@/components/home/motion-primitives";
import { Badge, Barcode, Mark, Pin, Sticker, Tape } from "@/components/home/scrap";
import { Logo } from "@/components/home/logo";
import { StickerArt } from "@/components/home/sticker-art";
import { GithubIcon } from "@/components/ui/social-icons";
import { useAuth } from "@/features/auth/auth-provider";
import { ArrowLink } from "@/components/home/arrow-link";

const PERKS = [
  { t: "Your dashboard", b: "Your GitHub activity, contributions and streaks, all in one place." },
  { t: "The leaderboard", b: "See how the club is doing and where you stand. Friendly competition only." },
  { t: "Events", b: "Browse upcoming events and register for them." },
  { t: "The member list", b: "Find the rest of the club and see what they're building." },
];

function Pass({ githubStep = false, hint }: { githubStep?: boolean; hint?: string }) {
  const { loginWithGitHub } = useAuth();
  const [redirecting, setRedirecting] = useState(githubStep);
  const [failed, setFailed] = useState(false);

  const go = async (options?: { github?: boolean; hint?: string }) => {
    setRedirecting(true);
    setFailed(false);
    try {
      await loginWithGitHub(options);
    } catch {
      setRedirecting(false);
      setFailed(true);
    }
  };

  // The second step of a shared sign in: this site needs GitHub's connection for the member's stats, so it goes to GitHub straight away.
  // GitHub does not ask again for someone who has already allowed the app.
  const started = useRef(false);
  useEffect(() => {
    if (!githubStep || started.current) return;
    started.current = true;
    void go({ github: true, ...(hint ? { hint } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubStep, hint]);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* the lanyard */}
      <svg
        className="pointer-events-none absolute -top-24 left-1/2 z-0 h-28 w-20 -translate-x-1/2"
        viewBox="0 0 80 112"
        fill="none"
        aria-hidden="true"
      >
        <path d="M6 0 L38 104 M74 0 L42 104" stroke="#14140f" strokeWidth="9" strokeLinecap="round" />
        <path d="M6 0 L38 104 M74 0 L42 104" stroke="#2ee58f" strokeWidth="5" strokeLinecap="round" />
      </svg>

      <Pin r={-2} drag className="relative z-10" hint="drag me">
        <article
          className="relative border-[2.5px] border-[var(--ink)] bg-[var(--cream)] p-7 text-[var(--ink)] shadow-[8px_8px_0_var(--ink)] sm:p-9"
          style={{ borderRadius: "1.5rem" }}
        >
          <Tape tone="butter" className="-top-3 left-8" rotate={-6} />
          <Tape tone="pink" className="-top-3 right-8" rotate={5} />
          <span
            className="absolute left-1/2 top-3 block h-3 w-16 -translate-x-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]"
            aria-hidden="true"
          />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="pixel text-[3rem] leading-[0.9] tracking-wide">MEMBER</p>
              <p className="pixel -mt-0.5 text-[3rem] leading-[0.9] tracking-wide text-[var(--signal-deep)]">PASS</p>
            </div>
            <Logo size={72} className="-rotate-3 rounded-2xl border-2 border-[var(--ink)]" />
          </div>

          <p className="serif mt-4 text-[1.55rem] leading-[1.05]">USAR FOSS Club</p>

          <ul className="mt-5 space-y-1.5 border-y-2 border-dashed border-[var(--ink)]/25 py-4 text-[0.98rem] font-semibold leading-snug">
            {["Free for every student", "No password to remember", "Powered by your GitHub"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--signal)]">
                  <Check size={11} strokeWidth={3.4} />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => void go()}
            disabled={redirecting}
            className="btn btn-ink mt-6 w-full justify-between disabled:cursor-wait disabled:opacity-70"
          >
            <span className="flex items-center gap-3">
              <GithubIcon className="size-5" />
              {redirecting ? "Taking you to GitHub…" : "Continue with GitHub"}
            </span>
            <span className="disc">
              <ArrowUpRight size={15} strokeWidth={2.6} />
            </span>
          </button>

          {failed && (
            <p role="alert" className="mt-3 rounded-lg border-2 border-[var(--ink)] bg-[var(--pink)] px-3 py-2 text-sm font-semibold">
              Couldn&apos;t reach GitHub just now. Give it another go in a moment.
            </p>
          )}

          <p className="mt-4 text-[0.8rem] leading-relaxed text-[var(--ink)]/65">
            Your GitHub access token stays on our server and is only used to read your own GitHub activity for the dashboard.
          </p>

          <div className="mt-5 flex items-end justify-between gap-4">
            <Barcode bars={38} />
            <span className="code text-[0.62rem] font-bold uppercase tracking-widest text-[var(--ink)]/50">no. open</span>
          </div>
        </article>
      </Pin>

      <Pin r={10} delay={0.4} className="absolute -right-8 top-24 z-20 hidden w-20 sm:block" hint="drag me">
        <Sticker src="/collage/tux.webp" alt="Tux, the Linux penguin" className="aspect-[607/720] w-full" sizes="90px" />
      </Pin>
      <Pin r={-8} delay={0.5} className="absolute -left-8 bottom-24 z-20 hidden w-20 sm:block" hint="drag me">
        <div className="die-cut">
          <StickerArt id="heart" className="w-full" />
        </div>
      </Pin>
    </div>
  );
}

/** `reauth` is set when the site signed someone out because their GitHub connection ran out (GitHub only keeps these for 8 hours). */
export function Login({ reauth = false, githubStep = false, hint }: { reauth?: boolean; githubStep?: boolean; hint?: string }) {
  return (
    <section className="pat-dots relative flex min-h-[100svh] items-center overflow-hidden bg-[var(--butter)] text-[var(--ink)]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-36">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="eyebrow mb-8 inline-block bg-[var(--cream)] px-2 py-1 text-[var(--signal-deep)]">§ sign in · members</p>
          </Reveal>
          <h1 className="text-[clamp(2.8rem,7.4vw,7rem)] leading-[0.95]">
            <MaskLine>Welcome</MaskLine>
            <MaskLine delay={0.1}>
              <span className="serif underline decoration-[var(--signal)] decoration-[0.07em] underline-offset-[0.1em]">back, friend.</span>
            </MaskLine>
          </h1>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-[1.18rem] leading-[1.65] text-[var(--ink)]/80">
              Sign in with GitHub to see <Mark tone="var(--cream)">your dashboard</Mark>, the club leaderboard and what everyone is
              building. No new password, no sign-up form.
            </p>
          </Reveal>

          {reauth && (
            <Reveal delay={0.15}>
              <p
                role="status"
                className="mt-6 max-w-xl rounded-lg border-2 border-[var(--ink)] bg-[var(--cream)] px-4 py-3 text-[0.98rem] font-semibold leading-snug"
              >
                Your GitHub connection ran out, so your stats had stopped updating. Sign in once more and it will keep itself fresh from
                here.
              </p>
            </Reveal>
          )}

          <ul className="mt-10 grid max-w-2xl gap-x-6 gap-y-5 sm:grid-cols-2">
            {PERKS.map((p, i) => (
              <li key={p.t}>
                <Pin r={[-1.2, 1, 1.2, -1][i]} drag={false} delay={0.15 + i * 0.07}>
                  <div className="paper relative h-full px-5 pb-5 pt-7">
                    <Tape tone={(["pink", "sky", "butter", "signal"] as const)[i]} className="-top-3 left-6 !w-14" rotate={-4} />
                    <p className="text-[1.15rem] font-extrabold leading-tight tracking-[-0.02em]">{p.t}</p>
                    <p className="mt-1.5 text-[0.95rem] leading-[1.55] text-[var(--ink)]/70">{p.b}</p>
                  </div>
                </Pin>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
            <ArrowLink href="/" className="btn btn-sm btn-paper" size={13}>
              Back to the site
            </ArrowLink>
          </div>
        </div>

        <div className="order-first lg:order-none lg:col-span-5">
          <div className="relative pt-20 lg:pt-24">
            <Pass githubStep={githubStep} {...(hint ? { hint } : {})} />
          </div>
        </div>
      </div>

      <Pin r={-8} delay={0.3} className="absolute bottom-10 left-[44%] hidden lg:block" hint="drag me">
        <Badge tone="signal" className="!text-base">
          no experience needed
        </Badge>
      </Pin>
    </section>
  );
}
