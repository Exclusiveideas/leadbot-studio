import { prisma } from "@/lib/db";
import type { PlanTier, Feature } from "@/lib/constants/plans";
import {
  getChatbotLimit,
  getConversationLimit,
  hasFeature,
} from "@/lib/constants/plans";

type LimitCheckResult = {
  allowed: boolean;
  current: number;
  limit: number | null;
};

export async function checkChatbotLimit(
  organizationId: string,
  plan: PlanTier,
): Promise<LimitCheckResult> {
  const limit = getChatbotLimit(plan);
  const current = await prisma.chatbot.count({
    where: { organizationId },
  });

  return { allowed: current < limit, current, limit };
}

export async function checkConversationLimit(
  organizationId: string,
  plan: PlanTier,
): Promise<LimitCheckResult> {
  const limit = getConversationLimit(plan);

  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const orgChatbots = await prisma.chatbot.findMany({
    where: { organizationId },
    select: { id: true },
  });

  if (orgChatbots.length === 0) {
    return { allowed: true, current: 0, limit };
  }

  const chatbotIds = orgChatbots.map((c) => c.id);

  const result = await prisma.chatbotDailyAnalytics.aggregate({
    where: {
      chatbotId: { in: chatbotIds },
      date: { gte: startOfMonth },
    },
    _sum: { conversations: true },
  });

  const current = result._sum.conversations ?? 0;

  return { allowed: current < limit, current, limit };
}

export class PlanFeatureError extends Error {
  constructor(
    public readonly feature: Feature,
    public readonly plan: PlanTier,
  ) {
    super(`Feature "${feature}" is not available on the ${plan} plan`);
    this.name = "PlanFeatureError";
  }
}

export function assertFeature(plan: PlanTier, feature: Feature): void {
  if (!hasFeature(plan, feature)) {
    throw new PlanFeatureError(feature, plan);
  }
}
