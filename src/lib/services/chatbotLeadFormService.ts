import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  CreateLeadFormInput,
  UpdateLeadFormInput,
} from "@/lib/validation/chatbot-lead-form";

class ChatbotLeadFormService {
  /**
   * List all lead forms for a chatbot
   */
  async listForms(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotLeadForm.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });
  }

  /**
   * Get a single lead form by ID
   */
  async getForm(
    formId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotLeadForm.findUnique({
      where: { id: formId },
      include: {
        _count: {
          select: { leads: true },
        },
        chatbot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create a new lead form
   */
  async createForm(
    chatbotId: string,
    data: CreateLeadFormInput,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.chatbotLeadForm.updateMany({
        where: { chatbotId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return db.chatbotLeadForm.create({
      data: {
        chatbotId,
        name: data.name,
        description: data.description,
        fields: data.fields as Prisma.JsonArray,
        appearance: data.appearance as Prisma.JsonObject | undefined,
        behavior: data.behavior as Prisma.JsonObject | undefined,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Update an existing lead form
   */
  async updateForm(
    formId: string,
    data: UpdateLeadFormInput,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    // Get form to check chatbotId
    const form = await db.chatbotLeadForm.findUnique({
      where: { id: formId },
      select: { chatbotId: true },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.chatbotLeadForm.updateMany({
        where: {
          chatbotId: form.chatbotId,
          isDefault: true,
          NOT: { id: formId },
        },
        data: { isDefault: false },
      });
    }

    return db.chatbotLeadForm.update({
      where: { id: formId },
      data: {
        name: data.name,
        description: data.description,
        fields: data.fields as Prisma.JsonArray | undefined,
        appearance: data.appearance as Prisma.JsonObject | undefined,
        behavior: data.behavior as Prisma.JsonObject | undefined,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Delete a lead form
   */
  async deleteForm(
    formId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    // Check if form has leads
    const form = await db.chatbotLeadForm.findUnique({
      where: { id: formId },
      include: {
        _count: { select: { leads: true } },
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    if (form._count.leads > 0) {
      throw new Error(
        `Cannot delete form with ${form._count.leads} captured leads. Set as inactive instead.`,
      );
    }

    return db.chatbotLeadForm.delete({
      where: { id: formId },
    });
  }

  /**
   * Get the default form for a chatbot
   */
  async getDefaultForm(
    chatbotId: string,
    db: Omit<typeof prisma, "$transaction"> = prisma,
  ) {
    return db.chatbotLeadForm.findFirst({
      where: { chatbotId, isDefault: true, isActive: true },
    });
  }
}

export const chatbotLeadFormService = new ChatbotLeadFormService();
