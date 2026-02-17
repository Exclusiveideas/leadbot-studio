export type PlanTier = "BASIC" | "PRO" | "AGENCY";

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

type PlanConfig = {
  name: string;
  maxChatbots: number;
  maxConversationsPerMonth: number | null;
  features: ReadonlySet<Feature>;
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
  },
  PRO: {
    name: "Pro",
    maxChatbots: 3,
    maxConversationsPerMonth: null,
    features: PRO_FEATURES,
  },
  AGENCY: {
    name: "Agency",
    maxChatbots: 10,
    maxConversationsPerMonth: null,
    features: AGENCY_FEATURES,
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
