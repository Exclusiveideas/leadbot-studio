"use client";

import PageLoadingError from "@/components/layout/pageLoadingError";
import MFASetup from "@/components/settings/MFASetup";
import SettingsProfileTabSkeleton from "@/components/settings/SettingsProfileTabSkeleton";
import SettingsSecurityTabSkeleton from "@/components/settings/SettingsSecurityTabSkeleton";
import TeamTab from "@/components/settings/TeamTab";
import WorkspaceTab from "@/components/settings/WorkspaceTab";
import PlanGate from "@/components/shared/PlanGate";
import {
  Building,
  CreditCard,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { PageTransition } from "@/components/dashboard/PageTransition";
import type { ServerSessionData as SessionData } from "@/types/session";

const tabs = [
  { id: "profile", name: "Profile", icon: UserIcon },
  { id: "security", name: "Security", icon: Shield },
  { id: "billing", name: "Billing", icon: CreditCard },
  { id: "team", name: "Team", icon: Users },
  { id: "workspace", name: "Workspace", icon: Building },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabFromUrl = searchParams.get("tab");
  const validTabs = tabs.map((t) => t.id);
  const initialTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "security";
  const [activeTab, setActiveTab] = useState(initialTab);

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
    <div className="border-b border-brand-border mb-6 md:mb-8">
      <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-transparent text-brand-primary tab-active-border"
                  : "border-transparent text-brand-muted hover:text-brand-primary hover:border-brand-border"
              }`}
            >
              <Icon
                className={`mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 ${
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-brand-primary">
              Settings
            </h1>
            <p className="mt-2 text-sm sm:text-base text-brand-muted">
              Manage your account settings and preferences.
            </p>
          </div>

          {renderTabs()}

          <div className="bg-white rounded-xl border border-brand-border elevation-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-accent" />
            {activeTab === "profile" && <SettingsProfileTabSkeleton />}
            {activeTab === "security" && <SettingsSecurityTabSkeleton />}
            {(activeTab === "billing" ||
              activeTab === "team" ||
              activeTab === "workspace") && (
              <div className="p-4 sm:p-6 space-y-4">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-brand-primary">
              Settings
            </h1>
            <p className="mt-2 text-sm sm:text-base text-brand-muted">
              Manage your account settings and preferences.
            </p>
          </div>

          {renderTabs()}

          <div className="bg-white rounded-xl border border-brand-border elevation-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-accent" />
            {activeTab === "profile" && (
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold font-heading text-brand-primary mb-4 sm:mb-6">
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
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold font-heading text-brand-primary mb-4 sm:mb-6">
                  Security Settings
                </h2>
                <MFASetup user={user} onUpdate={fetchSession} />
              </div>
            )}

            {activeTab === "team" && (
              <PlanGate requiredFeature="team_management">
                <TeamTab user={user} />
              </PlanGate>
            )}

            {activeTab === "billing" && (
              <BillingTab plan={user.organization?.plan} />
            )}

            {activeTab === "workspace" && <WorkspaceTab user={user} />}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import { PLAN_CONFIG } from "@/lib/constants/plans";
import type {
  PlanTier,
  PaidPlanTier,
  BillingInterval,
} from "@/lib/constants/plans";
import { Check, ArrowRight, Loader2 } from "lucide-react";

type SubscriptionData = {
  plan: PlanTier;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  isTrialing: boolean;
};

const PLAN_DESCRIPTIONS: Record<PaidPlanTier, string> = {
  BASIC: "For solo practitioners getting started",
  PRO: "For growing practices that need more power",
  AGENCY: "For agencies managing multiple clients",
};

function BillingTab({
  plan,
}: {
  plan?: "FREE" | "BASIC" | "PRO" | "AGENCY" | null;
}) {
  const currentPlan = (plan ?? "FREE") as PlanTier;
  const config = PLAN_CONFIG[currentPlan];
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      addToast("Subscription activated!", "success");
    } else if (checkout === "canceled") {
      addToast("Checkout was canceled.", "info");
    }
  }, [searchParams, addToast]);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/billing/subscription", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSubscription(data.data);
          }
        }
      } catch {
        // Silently fail — subscription info is supplementary
      }
    }
    fetchSubscription();
  }, []);

  const handleUpgrade = async (targetPlan: PaidPlanTier) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: targetPlan,
          interval: billingInterval,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.url;
      } else {
        addToast(data.error || "Failed to start checkout", "error");
      }
    } catch {
      addToast("Failed to start checkout", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.url;
      } else {
        addToast(data.error || "Failed to open billing portal", "error");
      }
    } catch {
      addToast("Failed to open billing portal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const statusLabel = subscription?.isTrialing
    ? "Trial"
    : subscription?.cancelAtPeriodEnd
      ? "Canceling"
      : subscription?.status === "PAST_DUE"
        ? "Past Due"
        : "Active";

  const statusColor = subscription?.isTrialing
    ? "bg-blue-100 text-blue-800"
    : subscription?.cancelAtPeriodEnd
      ? "bg-orange-100 text-orange-800"
      : subscription?.status === "PAST_DUE"
        ? "bg-red-100 text-red-800"
        : "bg-gradient-accent text-brand-primary";

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold font-heading text-brand-primary mb-1">
        Billing & Plan
      </h2>
      <p className="text-sm text-brand-muted mb-6">
        Manage your subscription and billing details.
      </p>

      {/* Current Plan */}
      <div className="bg-brand-surface rounded-xl p-5 mb-8 border border-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
              Current Plan
            </p>
            <p className="text-2xl font-bold text-brand-primary mt-1">
              {config.name}
            </p>
            <p className="text-sm text-brand-muted mt-0.5">
              {config.maxChatbots} chatbot{config.maxChatbots > 1 ? "s" : ""}
              {config.maxConversationsPerMonth
                ? ` · ${config.maxConversationsPerMonth} conversations/mo`
                : " · Unlimited conversations"}
            </p>
            {subscription?.isTrialing && subscription.trialEndsAt && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                Trial ends{" "}
                {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Subscription will cancel at end of billing period
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {statusLabel}
            </span>
            {currentPlan !== "FREE" && (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-medium text-brand-primary bg-white border border-brand-border rounded-lg hover:bg-brand-surface transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Manage Subscription"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-1 mb-6 bg-brand-surface rounded-lg p-1 w-fit mx-auto">
        <button
          onClick={() => setBillingInterval("monthly")}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
            billingInterval === "monthly"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-brand-muted hover:text-brand-primary"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval("annual")}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            billingInterval === "annual"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-brand-muted hover:text-brand-primary"
          }`}
        >
          Annual
          <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
            Save 17%
          </span>
        </button>
      </div>

      {/* Plan Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["BASIC", "PRO", "AGENCY"] as PaidPlanTier[]).map((tier) => {
          const isCurrent = tier === currentPlan;
          const tierConfig = PLAN_CONFIG[tier];
          const price =
            billingInterval === "monthly"
              ? tierConfig.pricing.monthly
              : Math.round(tierConfig.pricing.annual / 12);

          return (
            <div
              key={tier}
              className={`rounded-xl border p-5 transition-all ${
                isCurrent
                  ? "border-brand-blue/30 bg-brand-blue/5"
                  : "border-brand-border bg-white hover:border-brand-blue/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  {tierConfig.name}
                </p>
                {isCurrent && (
                  <span className="text-xs font-medium text-brand-blue">
                    Current
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-brand-primary">
                {price === 0 ? "Free" : `$${price}`}
                {price > 0 && (
                  <span className="text-sm font-normal text-brand-muted">
                    /mo
                  </span>
                )}
              </p>
              {billingInterval === "annual" && (
                <p className="text-[10px] text-green-600 mt-0.5">
                  ${tierConfig.pricing.annual}/yr (2 months free)
                </p>
              )}
              <p className="text-xs text-brand-muted mt-1 mb-4">
                {PLAN_DESCRIPTIONS[tier]}
              </p>
              <ul className="space-y-1.5 mb-5">
                <li className="flex items-center gap-2 text-xs text-brand-muted">
                  <Check className="h-3 w-3 text-brand-blue shrink-0" />
                  {tierConfig.maxChatbots} chatbot
                  {tierConfig.maxChatbots > 1 ? "s" : ""}
                </li>
                <li className="flex items-center gap-2 text-xs text-brand-muted">
                  <Check className="h-3 w-3 text-brand-blue shrink-0" />
                  {tierConfig.maxConversationsPerMonth
                    ? `${tierConfig.maxConversationsPerMonth} conversations/mo`
                    : "Unlimited conversations"}
                </li>
                <li className="flex items-center gap-2 text-xs text-brand-muted">
                  <Check className="h-3 w-3 text-brand-blue shrink-0" />
                  {tierConfig.features.size} features included
                </li>
              </ul>
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg text-xs font-medium border border-brand-border text-brand-muted cursor-default"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={isLoading}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-gradient-accent text-brand-primary hover:brightness-105 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      Upgrade
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-brand-muted mt-6 text-center">
        All paid plans include a 7-day free trial. Need help?{" "}
        <a
          href="mailto:ed@seira.ai"
          className="text-brand-blue hover:underline"
        >
          ed@seira.ai
        </a>
      </p>
    </div>
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
