"use client";

import PageLoadingError from "@/components/layout/pageLoadingError";
import MFASetup from "@/components/settings/MFASetup";
import SettingsProfileTabSkeleton from "@/components/settings/SettingsProfileTabSkeleton";
import SettingsSecurityTabSkeleton from "@/components/settings/SettingsSecurityTabSkeleton";
import { Shield, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ServerSessionData as SessionData } from "@/types/session";

const tabs = [
  { id: "profile", name: "Profile", icon: UserIcon },
  { id: "security", name: "Security", icon: Shield },
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-500">
              Manage your account settings and preferences.
            </p>
          </div>

          {/* Top Tabs Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-emerald-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-5 w-5 ${
                        activeTab === tab.id ? "text-gray-900" : "text-gray-500"
                      }`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200">
            {activeTab === "profile" && <SettingsProfileTabSkeleton />}
            {activeTab === "security" && <SettingsSecurityTabSkeleton />}
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Top Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-emerald-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? "text-gray-900" : "text-gray-500"
                    }`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200">
          {activeTab === "profile" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Profile Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user.name || ""}
                    disabled
                    className="w-full text-gray-900 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200/30 disabled:text-gray-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-200/30 text-gray-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Email address cannot be changed
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Security Settings
              </h2>
              <MFASetup user={user} onUpdate={fetchSession} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
