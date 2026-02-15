import { withRLS } from "@/lib/middleware/rls-wrapper";
import { listKnowledge } from "@/lib/services/chatbotService";
import { createAuditLog } from "@/lib/utils/audit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { getKnowledgeProcessor } from "@/lib/services/knowledgeProcessors";
import {
  isKnowledgeContentSafe,
  scanKnowledgeContent,
} from "@/lib/security/knowledge-content-scanner";

/**
 * GET /api/chatbots/[id]/knowledge
 * List all knowledge items for a chatbot
 * Supports optional status filtering via query param: ?status=PENDING,PROCESSING
 */
export const GET = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

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

    if (chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Parse status filter
    const statusFilter = statusParam
      ? statusParam.split(",").filter((s) => s.trim())
      : undefined;

    // Get knowledge items with optional status filtering
    const knowledge = await listKnowledge(id, tx, statusFilter);

    return NextResponse.json({
      success: true,
      data: knowledge,
      items: knowledge, // For compatibility with polling hook
      total: knowledge.length,
    });
  },
  {
    routeName: "GET /api/chatbots/[id]/knowledge",
  },
);

/**
 * POST /api/chatbots/[id]/knowledge
 * Add knowledge to a chatbot (FAQ, TEXT, URL types)
 */
export const POST = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    const { id: chatbotId } = await params;

    // Check if chatbot exists and user has access
    const chatbot = await tx.chatbot.findUnique({
      where: { id: chatbotId },
      select: { organizationId: true, createdBy: true, name: true },
    });

    if (!chatbot) {
      return NextResponse.json(
        { success: false, error: "Chatbot not found" },
        { status: 404 },
      );
    }

    if (chatbot.organizationId !== session.user.organization.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { type, title, content } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: type, title, content",
        },
        { status: 400 },
      );
    }

    // Get processor for knowledge type
    const processor = getKnowledgeProcessor(type);
    if (!processor) {
      return NextResponse.json(
        { success: false, error: `Unsupported knowledge type: ${type}` },
        { status: 400 },
      );
    }

    // Validate content using processor
    const validation = processor.validate(content);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    // Security scan: Check content for malicious patterns
    const contentType =
      type === "FAQ" ? "FAQ" : type === "URL" ? "URL" : "TEXT";
    const securityCheck = isKnowledgeContentSafe(content, contentType);
    if (!securityCheck.safe) {
      // Log security event
      await createAuditLog({
        userId: session.user.id,
        action: "knowledge.security_blocked",
        resource: "ChatbotKnowledge",
        resourceId: chatbotId,
        details: {
          chatbotId,
          title,
          type,
          reason: securityCheck.reason,
          contentPreview: content.substring(0, 200),
        },
        severity: "WARNING",
        request: request as NextRequest,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Content blocked for security reasons",
          details: securityCheck.reason,
        },
        { status: 400 },
      );
    }

    // Get full scan result for audit logging (includes detailed threats)
    const scanResult = scanKnowledgeContent(content, contentType);
    if (scanResult.requiresReview) {
      // Log for manual review even if not blocked
      await createAuditLog({
        userId: session.user.id,
        action: "knowledge.flagged_for_review",
        resource: "ChatbotKnowledge",
        resourceId: chatbotId,
        details: {
          chatbotId,
          title,
          type,
          risk: scanResult.risk,
          threatCount: scanResult.threats.length,
          threats: scanResult.threats.map((t) => ({
            category: t.category,
            severity: t.severity,
            location: t.location,
          })),
        },
        severity: "INFO",
        request: request as NextRequest,
      });
    }

    // Prepare knowledge data using processor
    const knowledgeData = processor.prepareKnowledgeData({
      chatbotId,
      title,
      content,
      validationData: validation.data,
    });

    // Create knowledge record
    const knowledge = await tx.chatbotKnowledge.create({
      data: knowledgeData,
    });

    // Defense-in-depth: verify knowledge belongs to validated chatbot
    if (knowledge.chatbotId !== chatbotId) {
      throw new Error("Knowledge validation failed: chatbot ID mismatch");
    }

    // Prepare Lambda payload
    const lambdaPayload: Record<string, any> = {
      knowledgeId: knowledge.id,
      chatbotId,
    };

    // Add type-specific payload data
    if (type === "FAQ" || type === "TEXT") {
      lambdaPayload.extractedText = knowledge.extractedText;
    } else if (type === "URL") {
      lambdaPayload.url = content;
    }

    // Invoke appropriate Lambda
    await invokeLambda(processor.getLambdaEnvVar(), lambdaPayload);

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: processor.getAuditAction(),
      resource: "ChatbotKnowledge",
      resourceId: knowledge.id,
      details: {
        chatbotId,
        title,
        type,
        ...(type === "FAQ" && validation.data
          ? { pairCount: validation.data.length }
          : {}),
        ...(type === "TEXT" ? { textLength: content.length } : {}),
        ...(type === "URL" ? { url: content } : {}),
      },
      severity: "INFO",
      request: request as NextRequest,
    });

    return NextResponse.json({
      success: true,
      data: knowledge,
      message: processor.getSuccessMessage(),
    });
  },
  {
    routeName: "POST /api/chatbots/[id]/knowledge",
  },
);

/**
 * Helper function to invoke Lambda functions
 */
async function invokeLambda(
  envVarName: string,
  payload: Record<string, any>,
): Promise<void> {
  const lambdaArn = process.env[envVarName];

  if (!lambdaArn) {
    console.warn(
      `${envVarName} not configured - processing will not start automatically`,
    );
    return;
  }

  try {
    const lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION,
    });

    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambdaArn,
        InvocationType: "Event", // async invocation
        Payload: Buffer.from(JSON.stringify(payload)),
      }),
    );

    // Redact sensitive data from logs
    console.log(`Lambda ${envVarName} invoked successfully`, {
      knowledgeId: payload.knowledgeId,
      chatbotId: payload.chatbotId,
      textLength: payload.extractedText?.length || payload.url?.length || 0,
    });
  } catch (error) {
    // Log error but don't fail the request - processing can be retried
    console.error(`Failed to invoke Lambda ${envVarName}:`, error);
  }
}
