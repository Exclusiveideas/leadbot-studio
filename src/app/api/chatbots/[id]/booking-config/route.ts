import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotBookingService } from "@/lib/services/chatbotBookingService";
import { updateBookingConfigSchema } from "@/lib/validation/chatbot-booking";
import { getChatbot } from "@/lib/services/chatbotService";

/**
 * GET /api/chatbots/[id]/booking-config - Get booking configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const chatbot = await getChatbot(id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (chatbot.organizationId !== session.organization.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = await chatbotBookingService.getBookingConfig(id);

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error("Error getting booking config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chatbots/[id]/booking-config - Update booking configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const chatbot = await getChatbot(id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (chatbot.organizationId !== session.organization.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateBookingConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 },
      );
    }

    const updated = await chatbotBookingService.updateBookingConfig(
      id,
      result.data,
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating booking config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
