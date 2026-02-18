export type PlanTier = "BASIC" | "PRO" | "AGENCY";

export type BillingInterval = "monthly" | "annual";

export type Feature =
  | "knowledge_base"
  | "lead_forms"
  | "email_notifications"
  | "calendly"
  | "basic_analytics"
  | "booking_wizard"
  | "text_request"
  | "white_label"
  | "advanced_analytics"
  | "conditional_forms"
  | "multi_step_forms"
  | "team_management"
  | "priority_support"
  | "dedicated_account_manager"
  | "custom_onboarding";

type PlanPricing = {
  monthly: number;
  annual: number;
  stripePriceMonthly: string | null;
  stripePriceAnnual: string | null;
};

type PlanConfig = {
  name: string;
  maxChatbots: number;
  maxConversationsPerMonth: number | null;
  features: ReadonlySet<Feature>;
  pricing: PlanPricing;
};

const BASIC_FEATURES: ReadonlySet<Feature> = new Set([
  "knowledge_base",
  "lead_forms",
  "email_notifications",
  "calendly",
  "basic_analytics",
]);

const PRO_FEATURES: ReadonlySet<Feature> = new Set([
  ...BASIC_FEATURES,
  "booking_wizard",
  "text_request",
  "white_label",
  "advanced_analytics",
  "conditional_forms",
  "multi_step_forms",
  "priority_support",
]);

const AGENCY_FEATURES: ReadonlySet<Feature> = new Set([
  ...PRO_FEATURES,
  "team_management",
  "dedicated_account_manager",
  "custom_onboarding",
]);

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  BASIC: {
    name: "Basic",
    maxChatbots: 1,
    maxConversationsPerMonth: 500,
    features: BASIC_FEATURES,
    pricing: {
      monthly: 0,
      annual: 0,
      stripePriceMonthly: null,
      stripePriceAnnual: null,
    },
  },
  PRO: {
    name: "Pro",
    maxChatbots: 3,
    maxConversationsPerMonth: null,
    features: PRO_FEATURES,
    pricing: {
      monthly: 50,
      annual: 500,
      stripePriceMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
      stripePriceAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? null,
    },
  },
  AGENCY: {
    name: "Agency",
    maxChatbots: 10,
    maxConversationsPerMonth: null,
    features: AGENCY_FEATURES,
    pricing: {
      monthly: 150,
      annual: 1500,
      stripePriceMonthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? null,
      stripePriceAnnual: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? null,
    },
  },
};

export function hasFeature(plan: PlanTier, feature: Feature): boolean {
  return PLAN_CONFIG[plan].features.has(feature);
}

export function getChatbotLimit(plan: PlanTier): number {
  return PLAN_CONFIG[plan].maxChatbots;
}

export function getConversationLimit(plan: PlanTier): number | null {
  return PLAN_CONFIG[plan].maxConversationsPerMonth;
}

export function getStripePriceId(
  plan: PlanTier,
  interval: BillingInterval,
): string | null {
  const { pricing } = PLAN_CONFIG[plan];
  return interval === "monthly"
    ? pricing.stripePriceMonthly
    : pricing.stripePriceAnnual;
}

export function getPlanFromStripePriceId(priceId: string): PlanTier | null {
  for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
    if (
      config.pricing.stripePriceMonthly === priceId ||
      config.pricing.stripePriceAnnual === priceId
    ) {
      return tier as PlanTier;
    }
  }
  return null;
}
