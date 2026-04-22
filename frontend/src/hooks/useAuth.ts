"use client";
/**
 * useAuth.ts
 * ----------
 * Simple hook that reads from AuthContext.
 * The Provider lives in src/contexts/AuthContext.tsx.
 */
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
export { AuthContext };
export function useAuth() {
  return useContext(AuthContext);
}
