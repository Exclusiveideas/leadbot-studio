import type { TextRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CreateTextRequestInput,
  TextConfig,
} from "@/lib/validation/chatbot-text";
import { getDefaultTextConfig } from "@/lib/validation/chatbot-text";

class ChatbotTextService {
  /**
   * List all text requests for a chatbot with optional filters
   */
  async listTextRequests(
    chatbotId: string,
    options: {
      status?: TextRequestStatus;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const { status, fromDate, toDate, limit = 50, offset = 0 } = options;

    const where: Prisma.ChatbotTextRequestWhereInput = {
      chatbotId,
      ...(status && { status }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    };

    const [textRequests, total] = await Promise.all([
      db.chatbotTextRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.chatbotTextRequest.count({ where }),
    ]);

    return { textRequests, total };
  }

  /**
   * Get a single text request by ID
   */
  async getTextRequest(
    textRequestId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotTextRequest.findUnique({
      where: { id: textRequestId },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            createdBy: true,
            organizationId: true,
          },
        },
      },
    });
  }

  /**
   * Create a new text request (public submission)
   */
  async createTextRequest(
    chatbotId: string,
    data: CreateTextRequestInput,
    metadata: { ipAddress?: string; userAgent?: string } = {},
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotTextRequest.create({
      data: {
        chatbotId,
        sessionId: data.sessionId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || null,
        phone: data.phone || "",
        message: data.message || "",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }

  /**
   * Update text request status
   */
  async updateTextRequestStatus(
    textRequestId: string,
    status: TextRequestStatus,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotTextRequest.update({
      where: { id: textRequestId },
      data: { status },
    });
  }

  /**
   * Get text configuration for a chatbot
   */
  async getTextConfig(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ): Promise<TextConfig> {
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { textConfig: true },
    });

    if (!chatbot?.textConfig) {
      return getDefaultTextConfig();
    }

    return chatbot.textConfig as TextConfig;
  }

  /**
   * Update text configuration for a chatbot
   */
  async updateTextConfig(
    chatbotId: string,
    config: Partial<TextConfig>,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const existingConfig = await this.getTextConfig(chatbotId, db);
    const mergedConfig = {
      ...existingConfig,
      ...config,
      fields: {
        ...existingConfig.fields,
        ...(config.fields || {}),
      },
    };

    return db.chatbot.update({
      where: { id: chatbotId },
      data: {
        textConfig: mergedConfig as Prisma.JsonObject,
      },
      select: {
        id: true,
        textConfig: true,
      },
    });
  }

  /**
   * Get text request statistics for a chatbot
   */
  async getTextRequestStats(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    const [total, pending, seen, responded] = await Promise.all([
      db.chatbotTextRequest.count({ where: { chatbotId } }),
      db.chatbotTextRequest.count({ where: { chatbotId, status: "PENDING" } }),
      db.chatbotTextRequest.count({ where: { chatbotId, status: "SEEN" } }),
      db.chatbotTextRequest.count({
        where: { chatbotId, status: "RESPONDED" },
      }),
    ]);

    return { total, pending, seen, responded };
  }
}

export const chatbotTextService = new ChatbotTextService();
