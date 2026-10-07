"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Wraps protected content. Redirects unauthenticated users to /auth.
 * Shows a branded loading screen while the session is being resolved.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__inner">
          <div className="auth-loading__spinner" />
          <p className="auth-loading__text">Loading LumiVue…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // While redirect is happening, show loading
    return (
      <div className="auth-loading">
        <div className="auth-loading__inner">
          <div className="auth-loading__spinner" />
          <p className="auth-loading__text">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
