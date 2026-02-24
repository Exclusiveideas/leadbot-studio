import type { PrismaClient, PlanTier } from "@prisma/client";

type LimitCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

const PLAN_VOICE_MINUTES: Record<string, number> = {
  FREE: 0,
  BASIC: 60,
  PRO: 300,
  AGENCY: 1000,
};

function getMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function checkVoiceMinuteLimit(
  db: PrismaClient,
  organizationId: string,
  plan: PlanTier | null,
): Promise<LimitCheckResult> {
  const limit = PLAN_VOICE_MINUTES[plan ?? "FREE"] ?? 0;

  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
  }

  const month = getMonthStart();

  const usage = await db.voiceUsage.findUnique({
    where: { organizationId_month: { organizationId, month } },
  });

  const used = usage?.totalMinutes ?? 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

export async function recordVoiceMinutes(
  db: PrismaClient,
  organizationId: string,
  minutes: number,
  costCents: number = 0,
): Promise<void> {
  const month = getMonthStart();

  await db.voiceUsage.upsert({
    where: { organizationId_month: { organizationId, month } },
    create: {
      organizationId,
      month,
      totalCallCount: 1,
      totalMinutes: minutes,
      totalCostCents: costCents,
    },
    update: {
      totalCallCount: { increment: 1 },
      totalMinutes: { increment: minutes },
      totalCostCents: { increment: costCents },
    },
  });
}

export async function getVoiceUsage(
  db: PrismaClient,
  organizationId: string,
  plan: PlanTier | null,
): Promise<{ used: number; limit: number; callCount: number }> {
  const limit = PLAN_VOICE_MINUTES[plan ?? "FREE"] ?? 0;
  const month = getMonthStart();

  const usage = await db.voiceUsage.findUnique({
    where: { organizationId_month: { organizationId, month } },
  });

  return {
    used: usage?.totalMinutes ?? 0,
    limit,
    callCount: usage?.totalCallCount ?? 0,
  };
}
