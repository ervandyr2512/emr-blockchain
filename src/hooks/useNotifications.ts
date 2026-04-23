/**
 * useNotifications.ts
 * --------------------
 * Realtime notifications hook backed by Firebase Realtime Database.
 * Subscribes on mount, unsubscribes on unmount.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications";
import { useAuth } from "./useAuth";
import type { AppNotification } from "@/types";

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const role = profile?.role;
    if (!role) return;

    const unsubscribe = subscribeNotifications(role, setNotifications);
    return unsubscribe;
  }, [profile?.role]);

  const markRead = useCallback((id: string) => {
    markNotificationRead(id).catch(console.error);
  }, []);

  const markAllRead = useCallback(() => {
    if (!profile?.role) return;
    markAllNotificationsRead(profile.role).catch(console.error);
  }, [profile?.role]);

  return { notifications, markRead, markAllRead };
}
