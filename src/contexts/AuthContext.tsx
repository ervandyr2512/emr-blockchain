"use client";

/**
 * AuthContext.tsx
 * ---------------
 * Provides Firebase authentication state (user + role profile) to the entire app.
 * Wrap the root layout with <AuthProvider>.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { getUserProfile } from "@/lib/emr";
import type { UserProfile } from "@/types";

// ── Context type ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:           User | null;
  profile:        UserProfile | null;
  loading:        boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user:           null,
  profile:        null,
  loading:        true,
  refreshProfile: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) { setProfile(null); return; }
    const p = await getUserProfile(user.uid);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}
