import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotLeadFormService } from "@/lib/services/chatbotLeadFormService";
import { createLeadFormSchema } from "@/lib/validation/chatbot-lead-form";
import { getChatbot } from "@/lib/services/chatbotService";

/**
 * GET /api/chatbots/[id]/lead-forms - List all forms for a chatbot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to chatbot
    const chatbot = await getChatbot(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Check ownership
    if (
      chatbot.createdBy !== session.userId &&
      chatbot.organizationId !== session.organization?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const forms = await chatbotLeadFormService.listForms(params.id);

    return NextResponse.json({ data: forms });
  } catch (error) {
    console.error("Error listing lead forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chatbots/[id]/lead-forms - Create a new form
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify access
    const chatbot = await getChatbot(params.id);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (
      chatbot.createdBy !== session.userId &&
      chatbot.organizationId !== session.organization?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const result = createLeadFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 },
      );
    }

    const form = await chatbotLeadFormService.createForm(
      params.id,
      result.data,
    );

    return NextResponse.json({ data: form }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
