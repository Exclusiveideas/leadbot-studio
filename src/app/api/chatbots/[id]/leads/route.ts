import type { LeadSource } from "@prisma/client";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import { listLeads } from "@/lib/services/chatbotService";
import { NextResponse } from "next/server";

/**
 * GET /api/chatbots/[id]/leads
 * Get all leads for a chatbot
 */
export const GET = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    const { id } = await params;

    // Check if chatbot exists and user has access
    const chatbot = await tx.chatbot.findUnique({
      where: { id },
      select: { organizationId: true, createdBy: true },
    });

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    // Allow access if:
    // 1. Chatbot has organizationId and it matches user's organizationId
    // 2. Chatbot has no organizationId and user is the creator
    const hasOrgAccess =
      chatbot.organizationId &&
      chatbot.organizationId === session.user.organization?.id;
    const hasCreatorAccess =
      !chatbot.organizationId && chatbot.createdBy === session.user.id;

    if (!hasOrgAccess && !hasCreatorAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;
    const source = searchParams.get("source") as LeadSource | null;

    // Get leads
    const result = await listLeads(id, limit, offset, tx, source || undefined);

    return NextResponse.json({
      success: true,
      data: {
        leads: result.leads,
        total: result.total,
      },
    });
  },
  {
    routeName: "GET /api/chatbots/[id]/leads",
    timeout: 15000, // 15 seconds for complex queries
  },
);
