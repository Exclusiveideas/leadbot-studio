"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Settings, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Chatbots", href: "/chatbots", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.organization?.name) {
          setOrgName(data.user.organization.name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="flex h-full w-64 flex-col bg-brand-primary border-r border-white/10">
      {/* Accent gradient top line */}
      <div className="h-0.5 bg-gradient-accent shrink-0" />

      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
        <div className="h-7 w-7 rounded-lg bg-gradient-accent flex items-center justify-center">
          <Bot className="h-4 w-4 text-brand-primary" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          LeadBot<span className="text-gradient">Studio</span>
        </span>
      </div>

      {/* Workspace name */}
      {orgName && (
        <div className="px-6 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Workspace
          </p>
          <p className="text-sm font-medium text-white/80 truncate mt-0.5">
            {orgName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/10 text-white sidebar-active-indicator"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Help */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="mailto:support@leadbotstudio.com"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all duration-150 hover:bg-white/[0.06] hover:text-white"
        >
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </Link>
      </div>
    </aside>
  );
}
