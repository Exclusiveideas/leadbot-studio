"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Settings, HelpCircle, LayoutDashboard } from "lucide-react";
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
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <LayoutDashboard className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">LeadBotStudio</span>
      </div>

      {/* Workspace name */}
      {orgName && (
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Workspace
          </p>
          <p className="text-sm font-medium text-gray-700 truncate mt-0.5">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Help */}
      <div className="border-t border-gray-200 p-3">
        <Link
          href="mailto:support@leadbotstudio.com"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </Link>
      </div>
    </aside>
  );
}
