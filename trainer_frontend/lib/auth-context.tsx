/**
 * React Context that wraps the entire app with Supabase auth state.
 *
 * Provides the current session, user, and loading flag, plus
 * sign-in / sign-up / sign-out helpers to every screen.
 */

import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "./supabase";

interface AuthState {
  /** The current Supabase session, or null if not authenticated. */
  session: Session | null;
  /** The authenticated user, or null. */
  user: User | null;
  /** True while the initial session is being restored from secure storage. */
  isLoading: boolean;
  /**
   * Sign in with email and password.
   * @returns An error message string on failure, or null on success.
   */
  signIn: (email: string, password: string) => Promise<string | null>;
  /**
   * Create a new account with email and password.
   * @returns An error message string on failure, or null on success.
   */
  signUp: (email: string, password: string) => Promise<string | null>;
  /** Sign out and clear the session. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

/** Shorthand hook for consuming auth state. */
export const useAuth = () => useContext(AuthContext);

/** Wrap the app tree with this provider so all screens have auth access. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Attempt email/password sign-in. */
  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  /** Attempt email/password sign-up. */
  async function signUp(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  }

  /** Sign out and clear session from secure storage. */
  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
