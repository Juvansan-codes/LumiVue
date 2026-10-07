"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  verifyOtp: (
    email: string,
    token: string,
    type?: "signup" | "email",
  ) => Promise<{ error: AuthError | null }>;
  verifyTokenHash: (
    tokenHash: string,
    type?: "signup" | "email",
  ) => Promise<{ error: AuthError | null }>;
  resendOtp: (
    email: string,
    type?: "signup",
  ) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: any } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, s: any) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      return { error };
    },
    [supabase],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const verifyOtp = useCallback(
    async (
      email: string,
      token: string,
      type: "signup" | "email" = "signup",
    ) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.user);
      }
      return { error };
    },
    [supabase],
  );

  const verifyTokenHash = useCallback(
    async (
      tokenHash: string,
      type: "signup" | "email" = "signup",
    ) => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.user);
      }
      return { error };
    },
    [supabase],
  );

  const resendOtp = useCallback(
    async (email: string, type: "signup" = "signup") => {
      const { error } = await supabase.auth.resend({
        email,
        type,
      });
      return { error };
    },
    [supabase],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        verifyOtp,
        verifyTokenHash,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
