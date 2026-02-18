"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { PlanTier, Feature } from "@/lib/constants/plans";
import { hasFeature, PLAN_CONFIG } from "@/lib/constants/plans";

type PlanGateProps = {
  requiredFeature: Feature;
  children: ReactNode;
};

export function useOrganizationPlan(): PlanTier {
  const [plan, setPlan] = useState<PlanTier>("BASIC");

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.organization?.plan) {
          setPlan(data.user.organization.plan as PlanTier);
        }
      })
      .catch(() => {});
  }, []);

  return plan;
}

function getMinimumPlanForFeature(feature: Feature): PlanTier {
  const tiers: PlanTier[] = ["BASIC", "PRO", "AGENCY"];
  for (const tier of tiers) {
    if (hasFeature(tier, feature)) return tier;
  }
  return "AGENCY";
}

export default function PlanGate({ requiredFeature, children }: PlanGateProps) {
  const plan = useOrganizationPlan();
  const allowed = hasFeature(plan, requiredFeature);

  if (allowed) {
    return <>{children}</>;
  }

  const requiredPlan = getMinimumPlanForFeature(requiredFeature);
  const planName = PLAN_CONFIG[requiredPlan].name;

  return (
    <div className="relative">
      <div className="blur-[3px] pointer-events-none select-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm border border-brand-border rounded-2xl p-8 text-center shadow-lg max-w-sm mx-4">
          <div className="h-12 w-12 rounded-xl bg-brand-surface flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-brand-muted" />
          </div>
          <h3 className="text-lg font-semibold text-brand-primary mb-2">
            {planName} Plan Feature
          </h3>
          <p className="text-sm text-brand-muted mb-5 leading-relaxed">
            This feature is available on the {planName} plan and above. Upgrade
            to unlock it.
          </p>
          <Link
            href="/settings?tab=billing"
            className="bg-gradient-accent inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-brand-primary shadow-md hover:shadow-lg transition-all hover:brightness-105"
          >
            Upgrade to {planName}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
