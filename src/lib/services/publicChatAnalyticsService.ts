import { prisma } from "@/lib/db";

type AnalyticsField = "conversations" | "messages" | "leads";

/**
 * Increment daily analytics counter for a chatbot.
 * Uses upsert to create the record if it doesn't exist for today.
 */
export async function incrementDailyCounter(
  chatbotId: string,
  field: AnalyticsField,
  count: number = 1,
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.chatbotDailyAnalytics.upsert({
    where: { chatbotId_date: { chatbotId, date: today } },
    create: {
      chatbotId,
      date: today,
      [field]: count,
    },
    update: {
      [field]: { increment: count },
    },
  });
}

/**
 * Increment total counter on the Chatbot model.
 */
export async function incrementTotalCounter(
  chatbotId: string,
  field: "totalPublicConversations" | "totalPublicMessages",
  count: number = 1,
): Promise<void> {
  await prisma.chatbot.update({
    where: { id: chatbotId },
    data: {
      [field]: { increment: count },
    },
  });
}

/**
 * Record a new public conversation (increments both daily and total counters).
 */
export async function recordNewConversation(chatbotId: string): Promise<void> {
  await Promise.all([
    incrementDailyCounter(chatbotId, "conversations", 1),
    incrementTotalCounter(chatbotId, "totalPublicConversations", 1),
  ]);
}

/**
 * Record messages exchanged (increments both daily and total counters).
 * Typically called with count=2 for a user message + assistant response pair.
 */
export async function recordMessages(
  chatbotId: string,
  count: number = 2,
): Promise<void> {
  await Promise.all([
    incrementDailyCounter(chatbotId, "messages", count),
    incrementTotalCounter(chatbotId, "totalPublicMessages", count),
  ]);
}

/**
 * Record a lead capture (increments daily counter only - total is from ChatbotLead count).
 */
export async function recordLeadCapture(chatbotId: string): Promise<void> {
  await incrementDailyCounter(chatbotId, "leads", 1);
}

/**
 * Clean up old daily analytics records (older than retentionDays).
 * Should be called periodically via a cron job or scheduled task.
 */
export async function cleanupOldAnalytics(
  retentionDays: number = 90,
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  cutoffDate.setHours(0, 0, 0, 0);

  const result = await prisma.chatbotDailyAnalytics.deleteMany({
    where: {
      date: { lt: cutoffDate },
    },
  });

  return result.count;
}
