"use client";

import PageLoadingError from "@/components/layout/pageLoadingError";
import MFASetup from "@/components/settings/MFASetup";
import SettingsProfileTabSkeleton from "@/components/settings/SettingsProfileTabSkeleton";
import SettingsSecurityTabSkeleton from "@/components/settings/SettingsSecurityTabSkeleton";
import TeamTab from "@/components/settings/TeamTab";
import WorkspaceTab from "@/components/settings/WorkspaceTab";
import { Building, Shield, User as UserIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { PageTransition } from "@/components/dashboard/PageTransition";
import type { ServerSessionData as SessionData } from "@/types/session";

const tabs = [
  { id: "profile", name: "Profile", icon: UserIcon },
  { id: "security", name: "Security", icon: Shield },
  { id: "team", name: "Team", icon: Users },
  { id: "workspace", name: "Workspace", icon: Building },
];

function SettingsContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("security");

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch session");
      }

      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      setError("Failed to load session data");
      console.error("Session error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabs = () => (
    <div className="border-b border-brand-border mb-8">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-transparent text-brand-primary tab-active-border"
                  : "border-transparent text-brand-muted hover:text-brand-primary hover:border-brand-border"
              }`}
            >
              <Icon
                className={`mr-2 h-5 w-5 ${
                  activeTab === tab.id
                    ? "text-brand-primary"
                    : "text-brand-muted"
                }`}
              />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-brand-primary">
              Settings
            </h1>
            <p className="mt-2 text-brand-muted">
              Manage your account settings and preferences.
            </p>
          </div>

          {renderTabs()}

          <div className="bg-white rounded-xl border border-brand-border elevation-1">
            {activeTab === "profile" && <SettingsProfileTabSkeleton />}
            {activeTab === "security" && <SettingsSecurityTabSkeleton />}
            {(activeTab === "team" || activeTab === "workspace") && (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="h-9 w-9 rounded-full bg-brand-surface" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-brand-surface rounded" />
                      <div className="h-3 w-48 bg-brand-surface rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return <PageLoadingError error={error} />;
  }

  const { user } = sessionData;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-heading text-brand-primary">
              Settings
            </h1>
            <p className="mt-2 text-brand-muted">
              Manage your account settings and preferences.
            </p>
          </div>

          {renderTabs()}

          <div className="bg-white rounded-xl border border-brand-border elevation-1">
            {activeTab === "profile" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-brand-primary mb-6">
                  Profile Settings
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user.name || ""}
                      disabled
                      className="w-full text-brand-primary px-3 py-2.5 border border-brand-border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:bg-brand-surface disabled:text-brand-muted"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-muted"
                    />
                    <p className="mt-1.5 text-xs text-brand-muted">
                      Email address cannot be changed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-brand-primary mb-6">
                  Security Settings
                </h2>
                <MFASetup user={user} onUpdate={fetchSession} />
              </div>
            )}

            {activeTab === "team" && <TeamTab user={user} />}

            {activeTab === "workspace" && <WorkspaceTab user={user} />}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
