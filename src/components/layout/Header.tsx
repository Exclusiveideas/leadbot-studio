"use client";

import { Bell, User } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between bg-white px-6 elevation-1">
      <div />
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-2 text-brand-muted transition-all hover:bg-brand-surface hover:text-brand-primary">
          <Bell className="h-5 w-5" />
        </button>
        <button className="flex items-center gap-2 rounded-lg p-2 text-brand-muted transition-all hover:bg-brand-surface hover:text-brand-primary">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
