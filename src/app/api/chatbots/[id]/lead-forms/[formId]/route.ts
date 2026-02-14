import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { chatbotLeadFormService } from "@/lib/services/chatbotLeadFormService";
import { updateLeadFormSchema } from "@/lib/validation/chatbot-lead-form";
import { getChatbot } from "@/lib/services/chatbotService";

/**
 * GET /api/chatbots/[id]/lead-forms/[formId] - Get a single form
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; formId: string } },
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

    if (
      chatbot.createdBy !== session.userId &&
      chatbot.organizationId !== session.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await chatbotLeadFormService.getForm(params.formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Verify form belongs to chatbot
    if (form.chatbot.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: form });
  } catch (error) {
    console.error("Error getting lead form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chatbots/[id]/lead-forms/[formId] - Update a form
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; formId: string } },
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
      chatbot.organizationId !== session.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify form exists and belongs to chatbot
    const existingForm = await chatbotLeadFormService.getForm(params.formId);
    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (existingForm.chatbot.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const result = updateLeadFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 },
      );
    }

    const form = await chatbotLeadFormService.updateForm(
      params.formId,
      result.data,
    );

    return NextResponse.json({ data: form });
  } catch (error) {
    console.error("Error updating lead form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/chatbots/[id]/lead-forms/[formId] - Delete a form
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; formId: string } },
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
      chatbot.organizationId !== session.organizationId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify form exists and belongs to chatbot
    const existingForm = await chatbotLeadFormService.getForm(params.formId);
    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (existingForm.chatbot.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await chatbotLeadFormService.deleteForm(params.formId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead form:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
