"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Settings, HelpCircle, LogOut, X } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const navigation = [
  { name: "Chatbots", href: "/chatbots", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch {
      setIsSigningOut(false);
      setShowSignOut(false);
    }
  };

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

  // Close sidebar on route change (mobile)
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-primary border-r border-white/10 transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Accent gradient top line */}
        <div className="h-0.5 bg-gradient-accent shrink-0" />

        {/* Logo + Mobile close */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Bot className="h-4 w-4 text-brand-primary" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Leadbot<span className="text-gradient">Partners</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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

        {/* Help & Sign Out */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href="mailto:support@leadbotstudio.com"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all duration-150 hover:bg-white/[0.06] hover:text-white"
          >
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </Link>
          <button
            onClick={() => setShowSignOut(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
      {showSignOut &&
        createPortal(
          <ConfirmDialog
            isOpen={showSignOut}
            onClose={() => setShowSignOut(false)}
            onConfirm={handleSignOut}
            title="Sign Out"
            message="Are you sure you want to sign out? You'll need to log in again to access your account."
            confirmText="Sign Out"
            cancelText="Cancel"
            variant="warning"
            icon={<LogOut className="w-6 h-6" />}
            isLoading={isSigningOut}
          />,
          document.body,
        )}
    </>
  );
}
