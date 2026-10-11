"use client";

import { createContext, type ReactNode, useContext } from "react";
import { SessionProvider, getProviders, signIn, signOut, useSession } from "next-auth/react";

export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  githubUsername?: string;
  leetcodeUsername?: string;
  image?: string | null;
}

/** The id of the shared sign in service among the providers the server offers (see server/auth/oidc.ts). */
const SHARED_SIGN_IN = "fossclub";

export interface LoginOptions {
  /** Go straight to GitHub, even if the shared sign in is on. This is the second, quiet step of a shared sign in. */
  github?: boolean;
  /** The GitHub username to suggest to GitHub, so the second step is for the same person as the first. */
  hint?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loginWithGitHub: (options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-reads the signed in member from the server, for after something on their profile changed. */
  refresh: () => Promise<void>;
  loading: boolean;
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        githubUsername: session.user.githubUsername,
        leetcodeUsername: session.user.leetcodeUsername,
        image: session.user.image,
      }
    : null;

  const value: AuthContextValue = {
    user,
    loginWithGitHub: async (options) => {
      // With the shared sign in switched on, the server lists it as a provider and people go through it first. Otherwise (or for the
      // second step) it is GitHub directly, as it always was.
      const shared = !options?.github && !!(await getProviders())?.[SHARED_SIGN_IN];
      if (shared) {
        await signIn(SHARED_SIGN_IN, { callbackUrl: "/dashboard" });
      } else {
        await signIn("github", { callbackUrl: "/dashboard" }, options?.hint ? { login: options.hint } : undefined);
      }
    },
    logout: async () => {
      // Clears this site's session, then asks the shared service to end its session too (it just goes home when that is switched off).
      await signOut({ redirect: false });
      // A full page load on purpose: that route is not a page, it redirects out to the shared service.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/api/auth/oidc-logout");
    },
    refresh: async () => {
      await update();
    },
    loading: status === "loading",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
