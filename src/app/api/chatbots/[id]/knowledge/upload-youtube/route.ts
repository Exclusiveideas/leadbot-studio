import { NextRequest, NextResponse } from "next/server";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import {
  validateYouTubeUrl,
  fetchYouTubeVideoTitle,
} from "@/lib/services/chatbot/youtube-helper";
import { createAuditLog } from "@/lib/utils/audit";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export const POST = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    try {
      const { id: chatbotId } = await params;
      const { url } = await request.json();

      // Validate inputs
      if (!url) {
        return NextResponse.json(
          { error: "Missing required field: url" },
          { status: 400 },
        );
      }

      // Validate chatbot exists and user has access
      const chatbot = await tx.chatbot.findUnique({
        where: { id: chatbotId },
        select: { organizationId: true, createdBy: true },
      });

      if (!chatbot) {
        return NextResponse.json(
          { error: "Chatbot not found" },
          { status: 404 },
        );
      }

      if (chatbot.organizationId !== session.user.organization.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Validate YouTube URL
      const validation = validateYouTubeUrl(url);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Check for duplicate video in knowledge base
      const existingVideo = await tx.chatbotKnowledge.findFirst({
        where: {
          chatbotId,
          type: "YOUTUBE",
          youtubeVideoId: validation.videoId,
        },
      });

      if (existingVideo) {
        return NextResponse.json(
          { error: "This YouTube video is already in the knowledge base" },
          { status: 409 },
        );
      }

      // Fetch video title (best effort, fallback to URL)
      const videoTitle =
        (await fetchYouTubeVideoTitle(validation.videoId!)) ||
        `YouTube Video ${validation.videoId}`;

      // Create knowledge source with processing status
      const knowledgeSource = await tx.chatbotKnowledge.create({
        data: {
          chatbotId,
          type: "YOUTUBE",
          title: videoTitle,
          content: validation.normalizedUrl!,
          youtubeVideoId: validation.videoId,
          vectorNamespace: `chatbot-${chatbotId}`,
          status: "PENDING",
          stage: "QUEUED",
          progress: 0,
          metadata: {
            url: validation.normalizedUrl,
          },
        },
      });

      // Defense-in-depth: verify knowledge belongs to validated chatbot
      if (knowledgeSource.chatbotId !== chatbotId) {
        throw new Error("Knowledge validation failed: chatbot ID mismatch");
      }

      // Invoke YouTube processor Lambda (async)
      if (process.env.YOUTUBE_PROCESSOR_LAMBDA_ARN) {
        try {
          const lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION,
          });
          await lambdaClient.send(
            new InvokeCommand({
              FunctionName: process.env.YOUTUBE_PROCESSOR_LAMBDA_ARN,
              InvocationType: "Event", // async
              Payload: Buffer.from(
                JSON.stringify({
                  sourceId: knowledgeSource.id,
                  chatbotId,
                  youtubeUrl: validation.normalizedUrl,
                  videoId: validation.videoId,
                }),
              ),
            }),
          );
          console.log(
            `YouTube processor Lambda invoked for source ${knowledgeSource.id}`,
          );
        } catch (lambdaError) {
          // Log error but don't fail the request - Lambda will retry
          console.error(
            "Failed to invoke YouTube processor Lambda:",
            lambdaError,
          );
        }
      } else {
        console.warn(
          "YOUTUBE_PROCESSOR_LAMBDA_ARN not configured - YouTube processing skipped",
        );
      }

      // Log audit event
      await createAuditLog({
        userId: session.user.id,
        action: "chatbot.knowledge.youtube_added",
        resource: "ChatbotKnowledge",
        resourceId: knowledgeSource.id,
        details: {
          chatbotId,
          youtubeUrl: validation.normalizedUrl,
          videoId: validation.videoId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: knowledgeSource.id,
          chatbotId,
          type: knowledgeSource.type,
          title: knowledgeSource.title,
          youtubeVideoId: knowledgeSource.youtubeVideoId,
          vectorNamespace: knowledgeSource.vectorNamespace,
          status: knowledgeSource.status,
          stage: knowledgeSource.stage,
          progress: knowledgeSource.progress,
        },
        message:
          "YouTube video added successfully. Processing will start automatically via Lambda.",
      });
    } catch (error) {
      console.error("Error in upload-youtube:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
