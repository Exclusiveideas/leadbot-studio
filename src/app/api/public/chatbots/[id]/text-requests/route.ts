import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatbotTextService } from "@/lib/services/chatbotTextService";
import {
  createTextRequestSchema,
  type TextConfig,
} from "@/lib/validation/chatbot-text";
import { notifyTextRequestCreated } from "@/lib/services/textNotificationService";

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

function isSameOrigin(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const origin = request.headers.get("origin");
  if (origin === appUrl) return true;
  const referer = request.headers.get("referer");
  if (referer?.startsWith(appUrl)) return true;
  return false;
}

/**
 * OPTIONS /api/public/chatbots/[id]/text-requests
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
 * POST /api/public/chatbots/[id]/text-requests
 * Create a new text request from the public widget
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();

    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id }, { embedCode: id }],
      },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        createdBy: true,
        organizationId: true,
        textConfig: true,
      },
    });

    if (!chatbot) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: buildCorsHeaders(origin) },
      );
    }

    if (
      !isSameOrigin(request) &&
      !chatbot.allowedDomains.includes("*") &&
      !chatbot.allowedDomains.includes(origin || "")
    ) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403, headers: buildCorsHeaders(origin) },
      );
    }

    const textConfig = chatbot.textConfig as TextConfig | null;
    if (!textConfig?.enabled) {
      return NextResponse.json(
        { error: "Text requests are not enabled for this chatbot" },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const schema = createTextRequestSchema(textConfig);
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.issues,
        },
        { status: 400, headers: buildCorsHeaders(origin) },
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const textRequest = await chatbotTextService.createTextRequest(
      chatbot.id,
      result.data,
      { ipAddress, userAgent },
    );

    notifyTextRequestCreated({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        createdBy: chatbot.createdBy,
        organizationId: chatbot.organizationId,
      },
      textRequest: {
        id: textRequest.id,
        firstName: textRequest.firstName,
        lastName: textRequest.lastName,
        email: textRequest.email,
        phone: textRequest.phone,
        message: textRequest.message,
      },
    }).catch((err) =>
      console.error("[TextRequest] Failed to send notifications:", err),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          textRequestId: textRequest.id,
          message: "Text request submitted successfully",
        },
      },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error creating text request:", error);
    return NextResponse.json(
      { error: "Failed to submit text request" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}
