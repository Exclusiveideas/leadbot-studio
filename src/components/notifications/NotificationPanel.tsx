"use client";

import type { ClientNotification } from "@/types/notification";
import type { NotificationType } from "@/types/notification";
import { Bell, Check, CheckCheck, Loader2, Trash2, X } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { getNotificationIcon } from "./notificationIcons";

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: ClientNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    icon: Icon,
    colorClass,
    bgClass,
  } = getNotificationIcon(notification.type as NotificationType);

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
        !notification.read ? "bg-blue-50/40" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgClass}`}
      >
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${!notification.read ? "font-semibold text-brand-primary" : "font-medium text-brand-secondary"}`}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-brand-muted">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-brand-light">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            className="rounded p-1 text-brand-muted hover:bg-gray-200 hover:text-brand-primary"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="rounded p-1 text-brand-muted hover:bg-red-100 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationPanel({
  isOpen,
  onClose,
  containerRef,
  notifications,
  unreadCount,
  isLoading,
  hasMore,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
}: {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  notifications: ClientNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, containerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-brand-border bg-white elevation-2"
    >
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-brand-primary">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-primary"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-brand-muted" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-2 h-8 w-8 text-brand-light" />
            <p className="text-sm font-medium text-brand-muted">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-brand-light">
              You&apos;ll see updates here when something happens
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-brand-border/50">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
            {hasMore && (
              <div className="border-t border-brand-border p-2">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="w-full rounded-lg py-2 text-center text-xs font-medium text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-primary disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
