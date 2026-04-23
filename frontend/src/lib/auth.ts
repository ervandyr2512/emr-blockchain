/**
 * auth.ts
 * -------
 * Firebase Authentication helpers (Email/Password).
 * On sign-up the user profile (including role) is written to Firebase RTDB.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getUserProfile } from "./emr";
import type { UserProfile, UserRole } from "@/types";

// ── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email:    string,
  password: string,
  name:     string,
  role:     UserRole = "patient"
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const profile: UserProfile = {
    uid:       user.uid,
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  };
  await createUserProfile(profile);
  await sendEmailVerification(user);
  return user;
}

// ── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ── Password Reset ───────────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Auth state listener ──────────────────────────────────────────────────────

export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ── Get current user profile from DB ────────────────────────────────────────

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return getUserProfile(user.uid);
}

// ── Role guard (used in middleware / layout) ─────────────────────────────────

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    admin:          "/admin",
    doctor:         "/doctor",
    nurse:          "/nurse",
    patient:        "/patient",
    pharmacist:     "/pharmacist",
    pending_doctor: "/pending-approval",
  };
  return paths[role] ?? "/login";
}
