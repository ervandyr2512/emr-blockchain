/**
 * notifications.ts
 * ----------------
 * Firebase Realtime Database helpers for live notifications.
 *
 * Schema:
 *   notifications/{notifId}  — global notification entries
 *
 * Each notification has a `targetRoles` array; the hook filters by current
 * user's role so every role only sees relevant notifications.
 */

import { ref, push, onValue, off, update, get } from "firebase/database";
import { db } from "./firebase";
import type { AppNotification } from "@/types";

// ── Write ────────────────────────────────────────────────────────────────────

/** Push a new notification to Firebase. Returns the new notification ID. */
export async function createNotification(
  notif: Omit<AppNotification, "id">
): Promise<string> {
  const notifRef = ref(db, "notifications");
  const snap = await push(notifRef, notif);
  return snap.key ?? "";
}

// ── Subscribe (realtime) ─────────────────────────────────────────────────────

/**
 * Subscribe to all notifications visible to a given role.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeNotifications(
  role: string,
  callback: (notifs: AppNotification[]) => void
): () => void {
  const notifRef = ref(db, "notifications");

  const handler = (snap: ReturnType<typeof ref> extends infer R ? any : any) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const val = snap.val() as Record<string, Omit<AppNotification, "id">>;
    const notifs: AppNotification[] = Object.entries(val)
      .map(([id, n]) => ({ ...n, id }))
      // Filter: show if targetRoles is empty/undefined (=all) or includes this role
      .filter((n) => !n.targetRoles?.length || n.targetRoles.includes(role))
      // Newest first
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 50); // keep last 50 per role

    callback(notifs);
  };

  onValue(notifRef, handler);
  return () => off(notifRef, "value", handler);
}

// ── Mark read ────────────────────────────────────────────────────────────────

export async function markNotificationRead(notifId: string): Promise<void> {
  await update(ref(db, `notifications/${notifId}`), { unread: false });
}

export async function markAllNotificationsRead(role: string): Promise<void> {
  const snap = await get(ref(db, "notifications"));
  if (!snap.exists()) return;

  const updates: Record<string, boolean> = {};
  snap.forEach((child) => {
    const n = child.val() as Omit<AppNotification, "id">;
    if (
      n.unread &&
      (!n.targetRoles?.length || n.targetRoles.includes(role))
    ) {
      updates[`notifications/${child.key}/unread`] = false;
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}
