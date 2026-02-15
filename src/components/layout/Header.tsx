"use client";

import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Menu } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type HeaderProps = {
  onMenuToggle: () => void;
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleToggle = useCallback(() => {
    setIsNotificationsOpen((prev) => {
      if (!prev) {
        fetchNotifications();
      }
      return !prev;
    });
  }, [fetchNotifications]);

  const handleClose = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  return (
    <header className="flex h-14 md:h-16 items-center justify-between bg-white px-4 md:px-6 elevation-1">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-brand-muted transition-all hover:bg-brand-surface hover:text-brand-primary md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden md:block" />
      <div ref={containerRef} className="relative flex items-center gap-2">
        <button
          onClick={handleToggle}
          className="relative rounded-lg p-2 text-brand-muted transition-all hover:bg-brand-surface hover:text-brand-primary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <NotificationPanel
          isOpen={isNotificationsOpen}
          onClose={handleClose}
          containerRef={containerRef}
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          hasMore={hasMore}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onLoadMore={loadMore}
        />
      </div>
    </header>
  );
}
