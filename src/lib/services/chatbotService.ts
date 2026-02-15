import type { LeadSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import type {
  CreateChatbotInput,
  UpdateChatbotInput,
  ChatbotFilters,
  AddKnowledgeInput,
  UpdateKnowledgeInput,
  CaptureLeadInput,
} from "@/lib/validation/chatbot";

export async function listChatbots(
  filters: ChatbotFilters,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  const where: Prisma.ChatbotWhereInput = {};

  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [chatbots, total] = await Promise.all([
    db.chatbot.findMany({
      where,
      include: {
        _count: {
          select: {
            leads: true,
            knowledgeBase: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    db.chatbot.count({ where }),
  ]);

  return { chatbots, total };
}

export async function getChatbot(
  chatbotId: string,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      _count: {
        select: {
          leads: true,
          knowledgeBase: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function createChatbot(
  data: CreateChatbotInput,
  organizationId: string,
  userId: string,
  thumbnail: string | null,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  const embedCode = nanoid(16);

  return db.chatbot.create({
    data: {
      name: data.name,
      description: data.description,
      thumbnail,
      persona: data.persona,
      customInstructions: data.customInstructions,
      welcomeMessage: data.welcomeMessage,
      aiModel: data.aiModel,
      allowedDomains: data.allowedDomains,
      embedCode,
      organizationId,
      createdBy: userId,
      status: "DRAFT", // Always create as DRAFT
    },
    include: {
      _count: {
        select: {
          leads: true,
          knowledgeBase: true,
        },
      },
    },
  });
}

export async function updateChatbot(
  chatbotId: string,
  data: UpdateChatbotInput,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbot.update({
    where: { id: chatbotId },
    data,
    include: {
      _count: {
        select: {
          leads: true,
          knowledgeBase: true,
        },
      },
    },
  });
}

export async function deleteChatbot(
  chatbotId: string,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbot.delete({
    where: { id: chatbotId },
  });
}

export async function addKnowledge(
  chatbotId: string,
  data: AddKnowledgeInput,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbotKnowledge.create({
    data: {
      chatbotId,
      type: data.type,
      title: data.title,
      content: data.content,
      s3Key: data.s3Key,
      metadata: data.metadata,
    },
  });
}

export async function listKnowledge(
  chatbotId: string,
  db: Omit<typeof prisma, "$transaction"> = prisma,
  statusFilter?: string[],
) {
  const where: Prisma.ChatbotKnowledgeWhereInput = {
    chatbotId,
    ...(statusFilter && statusFilter.length > 0
      ? { status: { in: statusFilter as any } }
      : {}),
  };

  const allKnowledge = await db.chatbotKnowledge.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Import the constant (could be moved to top of file in production)
  const ORPHANED_RECORD_TIMEOUT_MINUTES = 10;

  // Filter out incomplete uploads (DOCUMENT type without s3Key)
  // These are failed uploads that didn't complete confirmation
  const timeoutMs = ORPHANED_RECORD_TIMEOUT_MINUTES * 60 * 1000;
  const cutoffTime = new Date(Date.now() - timeoutMs);

  return allKnowledge.filter((item) => {
    // If it's a DOCUMENT type and has no s3Key, it's an incomplete upload
    if (item.type === "DOCUMENT" && !item.s3Key) {
      const createdAt = new Date(item.createdAt);

      // Hide if older than timeout (definitely failed)
      // Show if newer (might still be uploading)
      return createdAt >= cutoffTime;
    }

    // Show all other types and completed documents
    return true;
  });
}

export async function updateKnowledge(
  knowledgeId: string,
  data: UpdateKnowledgeInput,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbotKnowledge.update({
    where: { id: knowledgeId },
    data,
  });
}

export async function deleteKnowledge(
  knowledgeId: string,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  return db.chatbotKnowledge.delete({
    where: { id: knowledgeId },
  });
}

export async function listLeads(
  chatbotId: string,
  limit: number = 50,
  offset: number = 0,
  db: Omit<typeof prisma, "$transaction"> = prisma,
  source?: LeadSource,
) {
  const where = {
    chatbotId,
    ...(source && { source }),
  };

  const [leads, total] = await Promise.all([
    db.chatbotLead.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        conversation: {
          select: {
            id: true,
            startedAt: true,
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    }),
    db.chatbotLead.count({ where }),
  ]);

  return { leads, total };
}

export async function captureLead(
  chatbotId: string,
  conversationId: string,
  data: CaptureLeadInput,
  db: Omit<typeof prisma, "$transaction"> = prisma,
) {
  // Execute both operations in a transaction to ensure atomicity
  // Use 30 second timeout for slow networks/API calls
  return prisma.$transaction(
    async (tx) => {
      // Create lead
      const lead = await tx.chatbotLead.create({
        data: {
          chatbotId,
          conversationId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          caseType: data.caseType,
          urgency: data.urgency,
          budget: data.budget,
          notes: data.notes,
          metadata: data.metadata,
        },
      });

      // Update conversation leadCaptured flag
      await tx.chatbotConversation.update({
        where: { id: conversationId },
        data: { leadCaptured: true },
      });

      return lead;
    },
    {
      maxWait: 30000, // 30 seconds max wait to acquire transaction
      timeout: 30000, // 30 seconds timeout for transaction execution
    },
  );
}
