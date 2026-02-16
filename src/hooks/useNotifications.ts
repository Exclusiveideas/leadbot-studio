"use client";

import type { ClientNotification } from "@/types/notification";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchNotifications = useCallback(async (loadMore = false) => {
    try {
      setIsLoading(true);
      const cursor = loadMore ? cursorRef.current : undefined;
      const url = cursor
        ? `/api/notifications?cursor=${cursor}`
        : "/api/notifications";

      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const fetched = data.notifications as ClientNotification[];
      setNotifications((prev) => (loadMore ? [...prev, ...fetched] : fetched));
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);

      if (fetched.length > 0) {
        cursorRef.current = fetched[fetched.length - 1].id;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silent fail for polling
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationId }),
      });

      if (!res.ok) {
        await fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const res = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      let wasUnread = false;
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === notificationId);
        wasUnread = !!target && !target.read;
        return prev.filter((n) => n.id !== notificationId);
      });
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        await fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(pollUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    loadMore: () => fetchNotifications(true),
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
