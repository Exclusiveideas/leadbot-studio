import { withRLS } from "@/lib/middleware/rls-wrapper";
import { listChatbots, createChatbot } from "@/lib/services/chatbotService";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { chatbotFiltersSchema } from "@/lib/validation/chatbot";
import { createAuditLog } from "@/lib/utils/audit";
import {
  parseChatbotFormData,
  uploadThumbnailToS3,
  rollbackThumbnail,
} from "@/lib/services/chatbot/create-helpers";

/**
 * GET /api/chatbots
 * List all chatbots for the user's organization
 */
export const GET = withRLS(
  async (request, session, rlsContext, tx) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      organizationId: session.user.organization?.id || undefined,
      userId: session.user.id,
      search: searchParams.get("search") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 20,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    };

    // Validate filters
    const validation = chatbotFiltersSchema.safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid filter parameters",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    // Get chatbots
    const result = await listChatbots(validation.data, tx);

    return NextResponse.json({
      success: true,
      data: {
        chatbots: result.chatbots,
        total: result.total,
      },
    });
  },
  {
    routeName: "GET /api/chatbots",
  },
);

/**
 * POST /api/chatbots
 * Create a new chatbot
 */
export const POST = withRLS(
  async (request, session, rlsContext, tx) => {
    // Parse and validate form data
    const formData = await request.formData();
    const parseResult = await parseChatbotFormData(formData);

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
    let thumbnailS3Key: string | null = null;

    // Upload thumbnail to S3 if provided
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        thumbnailS3Key = await uploadThumbnailToS3(thumbnailFile);
      } catch (error) {
        console.error("Failed to upload thumbnail:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload thumbnail",
          },
          { status: 500 },
        );
      }
    }

    // Create chatbot (organizationId can be null for personal chatbots)
    try {
      const chatbot = await createChatbot(
        data,
        session.user.organization?.id || null,
        session.user.id,
        thumbnailS3Key,
        tx,
      );

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "chatbot.create",
        resource: "chatbot",
        resourceId: chatbot.id,
        details: {
          name: chatbot.name,
          embedCode: chatbot.embedCode,
        },
        severity: "INFO",
        request: request as NextRequest,
      });

      return NextResponse.json({
        success: true,
        data: chatbot,
      });
    } catch (error) {
      // Rollback: Delete S3 file if chatbot creation fails
      await rollbackThumbnail(thumbnailS3Key);
      throw error;
    }
  },
  {
    routeName: "POST /api/chatbots",
  },
);
