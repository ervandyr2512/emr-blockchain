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

// ── Demo accounts — exempt from email verification ───────────────────────────
// These accounts are pre-seeded and do not go through the normal sign-up flow.
export const DEMO_EMAILS = new Set([
  "admin@emr.id",
  "dokter@emr.id",
  "perawat@emr.id",
  "apoteker@emr.id",
  "pasien@emr.id",
]);

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
  // Send verification email for all non-demo accounts
  if (!DEMO_EMAILS.has(email.toLowerCase())) {
    await sendEmailVerification(user);
  }
  return user;
}

// ── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // Skip verification check for demo accounts
  if (DEMO_EMAILS.has(email.toLowerCase())) {
    return user;
  }

  // Block unverified accounts
  if (!user.emailVerified) {
    // Try to resend verification email while we still have the session
    try { await sendEmailVerification(user); } catch { /* rate-limited — ignore */ }
    // Sign out so the unverified user doesn't get an active session
    await firebaseSignOut(auth);
    throw Object.assign(new Error("email-not-verified"), { code: "email-not-verified" });
  }

  return user;
}

// ── Resend verification email ────────────────────────────────────────────────
// Signs in temporarily, sends the email, then immediately signs out again.

export async function resendVerificationEmail(email: string, password: string): Promise<void> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  if (user.emailVerified) {
    await firebaseSignOut(auth);
    throw new Error("already-verified");
  }
  await sendEmailVerification(user);
  await firebaseSignOut(auth);
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
