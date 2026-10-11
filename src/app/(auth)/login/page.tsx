import type { Metadata } from "next";
import { pageMetadata } from "@/data/site";
import { HomeShell } from "@/components/home/home-shell";
import { Footer } from "@/components/home/footer";
import { Login } from "@/components/auth/login";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to the USAR FOSS Club with your GitHub account to see your dashboard and the club leaderboard.",
  path: "/login",
  noindex: true,
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reauth?: string; step?: string; hint?: string }> }) {
  const { reauth, step, hint } = await searchParams;
  // `hint` only suggests an account to GitHub, so it is cut down to what a GitHub username can be.
  const safeHint = hint && /^[A-Za-z0-9-]{1,39}$/.test(hint) ? hint : undefined;
  return (
    <HomeShell>
      <main>
        <Login reauth={reauth === "1"} githubStep={step === "github"} {...(safeHint ? { hint: safeHint } : {})} />
      </main>
      <Footer />
    </HomeShell>
  );
}
