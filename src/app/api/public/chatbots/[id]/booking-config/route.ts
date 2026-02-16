import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatbotBookingService } from "@/lib/services/chatbotBookingService";

/**
 * Build CORS headers for public chatbot endpoints
 */
function buildCorsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
 * OPTIONS /api/public/chatbots/[id]/booking-config
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
 * GET /api/public/chatbots/[id]/booking-config
 * Get booking configuration for public widget
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = request.headers.get("origin");

  try {
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        OR: [{ id }, { embedCode: id }],
      },
      select: {
        id: true,
        name: true,
        allowedDomains: true,
        bookingConfig: true,
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

    const config = await chatbotBookingService.getBookingConfig(chatbot.id);

    return NextResponse.json(
      { data: config },
      { headers: buildCorsHeaders(origin) },
    );
  } catch (error) {
    console.error("Error getting public booking config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: buildCorsHeaders(origin) },
    );
  }
}
