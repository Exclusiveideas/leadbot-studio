import { withRLS } from "@/lib/middleware/rls-wrapper";
import {
  getChatbot,
  updateChatbot,
  deleteChatbot,
} from "@/lib/services/chatbotService";
import { updateChatbotSchema } from "@/lib/validation/chatbot";
import { createAuditLog } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  parseUpdateChatbotFormData,
  uploadThumbnailToS3,
  rollbackThumbnail,
} from "@/lib/services/chatbot/update-helpers";

/**
 * GET /api/chatbots/[id]
 * Get a single chatbot by ID
 */
export const GET = withRLS(
  async (request, session, rlsContext, tx, context) => {
    const { id } = await context.params;

    const chatbot = await getChatbot(id, tx);

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this chatbot
    // Personal chatbots (organizationId = null) can only be accessed by creator
    // Organization chatbots can be accessed by anyone in the organization
    const isPersonalChatbot = chatbot.organizationId === null;
    const isCreator = chatbot.createdBy === session.user.id;
    const isSameOrganization =
      chatbot.organizationId === session.user.organization?.id;

    if (isPersonalChatbot) {
      if (!isCreator) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    } else {
      if (!isSameOrganization) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: chatbot,
    });
  },
  {
    routeName: "GET /api/chatbots/[id]",
  },
);

/**
 * PATCH /api/chatbots/[id]
 * Update a chatbot
 */
export const PATCH = withRLS(
  async (request, session, rlsContext, tx, context) => {
    const { id } = await context.params;

    // Check if chatbot exists and user has access
    const existingChatbot = await tx.chatbot.findUnique({
      where: { id },
    });

    if (!existingChatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this chatbot
    const isPersonalChatbot = existingChatbot.organizationId === null;
    const isCreator = existingChatbot.createdBy === session.user.id;
    const isSameOrganization =
      existingChatbot.organizationId === session.user.organization?.id;

    if (isPersonalChatbot) {
      if (!isCreator) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    } else {
      if (!isSameOrganization) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    }

    // Parse and validate request body (FormData)
    const formData = await request.formData();
    const parseResult = await parseUpdateChatbotFormData(formData);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error,
          details: parseResult.details,
        },
        { status: 400 },
      );
    }

    const { data, thumbnailFile } = parseResult.data;

    // Upload new thumbnail if provided and delete old one
    let thumbnailS3Key: string | null = null;
    const oldThumbnail = existingChatbot.thumbnail;

    if (thumbnailFile) {
      try {
        // Upload new thumbnail first
        thumbnailS3Key = await uploadThumbnailToS3(thumbnailFile);
        data.thumbnail = thumbnailS3Key;

        // Delete old thumbnail after successful upload (best-effort)
        if (oldThumbnail) {
          await rollbackThumbnail(oldThumbnail).catch((err) =>
            console.error("Failed to delete old thumbnail:", oldThumbnail, err),
          );
        }
      } catch (error) {
        console.error("Failed to upload thumbnail:", error);
        return NextResponse.json(
          { success: false, error: "Failed to upload thumbnail" },
          { status: 500 },
        );
      }
    }

    // Set publishedAt timestamp if status is changing to PUBLISHED
    if (data.status === "PUBLISHED" && existingChatbot.status !== "PUBLISHED") {
      data.publishedAt = new Date();
    }

    // Update chatbot
    let chatbot;
    try {
      chatbot = await updateChatbot(id, data, tx);
    } catch (error) {
      // Rollback thumbnail upload if chatbot update fails
      await rollbackThumbnail(thumbnailS3Key);
      throw error;
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "chatbot.update",
      resource: "chatbot",
      resourceId: chatbot.id,
      details: {
        name: chatbot.name,
        changes: Object.keys(data),
      },
      oldValues: existingChatbot,
      newValues: data,
      severity: "INFO",
      request: request as NextRequest,
    });

    return NextResponse.json({
      success: true,
      data: chatbot,
    });
  },
  {
    routeName: "PATCH /api/chatbots/[id]",
  },
);

/**
 * DELETE /api/chatbots/[id]
 * Delete a chatbot
 */
export const DELETE = withRLS(
  async (request, session, rlsContext, tx, context) => {
    const { id } = await context.params;

    // Check if chatbot exists and user has access
    const existingChatbot = await tx.chatbot.findUnique({
      where: { id },
    });

    if (!existingChatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    // Check if user has access to this chatbot
    const isPersonalChatbot = existingChatbot.organizationId === null;
    const isCreator = existingChatbot.createdBy === session.user.id;
    const isSameOrganization =
      existingChatbot.organizationId === session.user.organization?.id;

    if (isPersonalChatbot) {
      if (!isCreator) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    } else {
      if (!isSameOrganization) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 },
        );
      }
    }

    // Delete chatbot
    await deleteChatbot(id, tx);

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "chatbot.delete",
      resource: "chatbot",
      resourceId: id,
      details: {
        name: existingChatbot.name,
      },
      oldValues: existingChatbot,
      severity: "WARNING",
      request: request as NextRequest,
    });

    return NextResponse.json({
      success: true,
      message: "Chatbot deleted successfully",
    });
  },
  {
    routeName: "DELETE /api/chatbots/[id]",
  },
);
