import { NextRequest, NextResponse } from "next/server";
import { withRLS } from "@/lib/middleware/rls-wrapper";
import { createPresignedPostUrl } from "@/lib/storage/aws-server";
import {
  validateFileUpload,
  generateChatbotKnowledgeS3Key,
} from "@/lib/validation/file-validation";
export const POST = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    try {
      const { id: chatbotId } = await params;
      const { fileName, fileSize, fileType } = await request.json();

      // Validate inputs
      if (!fileName || !fileSize || !fileType) {
        return NextResponse.json(
          { error: "Missing required fields: fileName, fileSize, fileType" },
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

      // Validate file upload
      const validation = validateFileUpload(fileName, fileSize, fileType);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Create knowledge source with processing status
      const knowledgeSource = await tx.chatbotKnowledge.create({
        data: {
          chatbotId,
          type: validation.sourceType!,
          title: fileName,
          content: "", // Empty until processed
          vectorNamespace: chatbotId,
          status: "PENDING",
          stage: "QUEUED",
          progress: 0,
          totalChunks: 0,
          processedChunks: 0,
          failedChunks: 0,
          retryCount: 0,
          maxRetries: 3,
        },
      });

      // Generate S3 key
      const s3Key = generateChatbotKnowledgeS3Key(
        chatbotId,
        knowledgeSource.id,
        fileName,
      );

      // Update knowledge record with s3Key
      await tx.chatbotKnowledge.update({
        where: { id: knowledgeSource.id },
        data: { s3Key },
      });

      // Get max file size for presigned URL
      const maxSizeBytes = fileSize + 1024; // Add 1KB buffer

      try {
        // Generate presigned POST URL
        const { url, fields } = await createPresignedPostUrl(
          s3Key,
          fileType,
          maxSizeBytes,
          300, // 5 minutes
        );

        return NextResponse.json({
          knowledgeSource: {
            id: knowledgeSource.id,
            chatbotId,
            type: knowledgeSource.type,
            title: knowledgeSource.title,
            vectorNamespace: knowledgeSource.vectorNamespace,
            status: knowledgeSource.status,
            stage: knowledgeSource.stage,
            progress: knowledgeSource.progress,
            totalChunks: knowledgeSource.totalChunks,
            processedChunks: knowledgeSource.processedChunks,
            failedChunks: knowledgeSource.failedChunks,
            s3Key,
          },
          upload: {
            url,
            fields,
            s3Key,
          },
          message: "Presigned URL generated successfully",
        });
      } catch (presignedError) {
        // Compensating transaction: delete created knowledge source
        await tx.chatbotKnowledge.delete({
          where: { id: knowledgeSource.id },
        });

        console.error("Error generating presigned URL:", presignedError);
        return NextResponse.json(
          { error: "Failed to generate upload URL" },
          { status: 500 },
        );
      }
    } catch (error) {
      console.error("Error in presigned-upload:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  {
    routeName: "POST /api/chatbots/[id]/knowledge/presigned-upload",
  },
);
