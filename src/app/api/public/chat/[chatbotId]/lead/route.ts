import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordLeadCapture } from "@/lib/services/publicChatAnalyticsService";
import { notifyLeadCapture } from "@/lib/services/leadNotificationService";
import { parseLeadData } from "@/lib/utils/lead-data-parser";
import { validateConversationSnapshot } from "@/lib/validation/conversation-snapshot";

/**
 * Build CORS headers for public chatbot endpoints
 */
function buildCorsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
  };
}

/**
 * OPTIONS /api/public/chat/[chatbotId]/lead
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}

/**
 * POST /api/public/chat/[chatbotId]/lead
 * Capture a lead from a public embed conversation.
 * No conversation record required - sessionId is optional reference only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> },
) {
  const { chatbotId } = await params;
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const { sessionId, conversationSnapshot, source } = body;

    // Parse lead data (handles both dynamic forms and legacy format)
    let leadData;
    try {
      leadData = parseLeadData(body);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: error.message || "Invalid lead data",
          details: error.details,
        },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    // Validate conversation snapshot if provided
    let validatedSnapshot = null;
    if (conversationSnapshot) {
      try {
        validatedSnapshot = validateConversationSnapshot(conversationSnapshot);
      } catch (error: any) {
        return NextResponse.json(
          {
            error: "Invalid conversation snapshot",
            details: error.message,
          },
          { status: 400, headers: buildCorsHeaders(origin) },
        );
      }
    }

    const {
      email,
      name,
      phone,
      caseType,
      urgency,
      budget,
      notes,
      metadata,
      formData,
    } = leadData;

    // Get chatbot and check CORS (accept both ID and embedCode)
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id: chatbotId }, { embedCode: chatbotId }],
      },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        createdBy: true,
        organizationId: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    // Check CORS
    if (
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    // Check if lead with same email already exists for this chatbot (prevent duplicates)
    // Use chatbot.id (not chatbotId URL param which could be embedCode)
    const existingLead = await prisma.chatbotLead.findFirst({
      where: {
        chatbotId: chatbot.id,
        email,
      },
    });

    if (existingLead) {
      // Return success but indicate it's a duplicate (don't create another)
      return NextResponse.json(
        {
          success: true,
          data: {
            leadId: existingLead.id,
            message: "Lead already captured",
            isDuplicate: true,
          },
        },
        { headers: buildCorsHeaders(origin) },
      );
    }

    // Create lead (no conversationId required for public embed)
    // Use chatbot.id (not chatbotId URL param which could be embedCode)
    const lead = await prisma.chatbotLead.create({
      data: {
        chatbotId: chatbot.id,
        sessionId: sessionId || null, // Optional reference
        email,
        name,
        phone,
        caseType,
        urgency,
        budget,
        notes,
        metadata: metadata ? (metadata as object) : undefined,
        formData: formData ? (formData as object) : undefined,
        conversationSnapshot: validatedSnapshot
          ? (validatedSnapshot as object) // Prisma requires Json fields as 'object' type
          : undefined,
        source:
          source === "BOOKING_FALLBACK" ? "BOOKING_FALLBACK" : "LEAD_FORM",
      },
    });

    // Record lead capture in analytics (fire and forget)
    // Use chatbot.id (not chatbotId URL param which could be embedCode)
    recordLeadCapture(chatbot.id).catch((err) =>
      console.error("[LeadCapture] Failed to record analytics:", err),
    );

    // Send notifications to chatbot creator and org admins (fire and forget)
    const leadSource =
      source === "BOOKING_FALLBACK" ? "BOOKING_FALLBACK" : "LEAD_FORM";
    notifyLeadCapture({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        createdBy: chatbot.createdBy,
        organizationId: chatbot.organizationId,
      },
      lead: {
        id: lead.id,
        name,
        email,
        phone: phone || null,
      },
      source: leadSource,
    }).catch((err) =>
      console.error("[LeadCapture] Failed to send notifications:", err),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          leadId: lead.id,
          message: "Lead captured successfully",
        },
      },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}
