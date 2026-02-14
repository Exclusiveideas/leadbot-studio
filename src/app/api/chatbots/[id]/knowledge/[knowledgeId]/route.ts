import { withRLS } from "@/lib/middleware/rls-wrapper";
import { deleteFile } from "@/lib/storage/aws-server";
import { createAuditLog } from "@/lib/utils/audit";
import { NextRequest, NextResponse } from "next/server";

// Pinecone client configuration (use chatbot-specific index, not AI query index)
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME =
  process.env.PINECONE_CHATBOT_INDEX_NAME || "leadbotstudio-embeddings";

/**
 * Delete vectors from Pinecone for a specific knowledge source
 */
async function deletePineconeVectors(
  namespace: string,
  knowledgeSourceId: string,
): Promise<boolean> {
  try {
    if (!PINECONE_API_KEY) {
      console.warn("Pinecone API key not configured, skipping vector deletion");
      return true; // Skip gracefully if not configured
    }

    const { Pinecone } = await import("@pinecone-database/pinecone");
    const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const namespacedIndex = index.namespace(namespace);

    // Delete all vectors with this knowledgeSourceId
    const filter = {
      knowledgeSourceId: { $eq: knowledgeSourceId },
    };

    await namespacedIndex.deleteMany(filter);
    return true;
  } catch (error: any) {
    // Handle 404 as successful deletion (vectors don't exist)
    if (error.status === 404) {
      console.log(
        `Vectors not found in Pinecone (already deleted): ${knowledgeSourceId}`,
      );
      return true;
    }

    console.error(
      `[Pinecone] Failed to delete vectors for ${knowledgeSourceId}:`,
      error,
    );
    return false;
  }
}

/**
 * DELETE /api/chatbots/[id]/knowledge/[knowledgeId]
 * Delete a knowledge item and all associated resources
 */
export const DELETE = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    const startTime = Date.now();
    const deletionResults = {
      database: false,
      s3Storage: false,
      pineconeVectors: false,
      errors: [] as string[],
    };

    try {
      const { id: chatbotId, knowledgeId } = await params;

      // 1. Fetch knowledge item with chatbot access check
      const knowledge = await tx.chatbotKnowledge.findFirst({
        where: {
          id: knowledgeId,
          chatbotId,
          chatbot: {
            OR: [
              {
                organizationId: session.user.organization?.id || null,
              },
              {
                organizationId: null,
                createdBy: session.user.id,
              },
            ],
          },
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              organizationId: true,
              createdBy: true,
            },
          },
        },
      });

      if (!knowledge) {
        return NextResponse.json(
          {
            success: false,
            error: "Knowledge item not found or access denied",
          },
          { status: 404 },
        );
      }

      // Store metadata for audit logs
      const knowledgeMetadata = {
        id: knowledge.id,
        title: knowledge.title,
        type: knowledge.type,
        chatbotId: knowledge.chatbotId,
        chatbotName: knowledge.chatbot.name,
        s3Key: knowledge.s3Key,
        vectorNamespace: knowledge.vectorNamespace,
        chunkCount: knowledge.chunkCount,
      };

      // 2. Delete from S3 (if s3Key exists)
      if (knowledge.s3Key) {
        try {
          deletionResults.s3Storage = await deleteFile(knowledge.s3Key);
          if (!deletionResults.s3Storage) {
            deletionResults.errors.push("S3: File deletion failed");
          }
        } catch (error) {
          console.error(`S3 deletion failed:`, error);
          deletionResults.errors.push(
            `S3: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          deletionResults.s3Storage = false;
        }
      } else {
        // No S3 file to delete (e.g., FAQ or text-only knowledge)
        deletionResults.s3Storage = true;
      }

      // 3. Delete from Pinecone (namespace = chatbotId, must match Lambda)
      try {
        const namespace = knowledge.vectorNamespace || chatbotId;
        deletionResults.pineconeVectors = await deletePineconeVectors(
          namespace,
          knowledgeId,
        );

        if (!deletionResults.pineconeVectors) {
          deletionResults.errors.push("Pinecone: Vector deletion failed");
        }
      } catch (error) {
        console.error(`Pinecone deletion failed:`, error);
        deletionResults.errors.push(
          `Pinecone: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        deletionResults.pineconeVectors = false;
      }

      // 4. Pre-deletion audit log
      const preDeleteTime = Date.now();
      const preDeleteAuditData = {
        userId: session.user.id,
        action: "chatbot.knowledge.delete_initiated",
        resource: "ChatbotKnowledge",
        resourceId: knowledge.id,
        details: {
          chatbotId: knowledge.chatbotId,
          chatbotName: knowledge.chatbot.name,
          knowledgeId: knowledge.id,
          title: knowledge.title,
          type: knowledge.type,
          s3Key: knowledge.s3Key,
          chunkCount: knowledge.chunkCount,
          deletionResults: {
            ...deletionResults,
            database: false, // Not deleted yet
          },
          executionTimeMs: preDeleteTime - startTime,
          deletionSteps: {
            s3Storage: deletionResults.s3Storage,
            pineconeVectors: deletionResults.pineconeVectors,
            database: false,
          },
        },
        oldValues: {
          title: knowledge.title,
          type: knowledge.type,
          content: knowledge.content,
          s3Key: knowledge.s3Key,
          chatbotId: knowledge.chatbotId,
          vectorNamespace: knowledge.vectorNamespace,
          chunkCount: knowledge.chunkCount,
        },
        severity: deletionResults.errors.length > 0 ? "WARNING" : "INFO",
      } as const;

      // 5. Delete from database (CRITICAL STEP - last)
      try {
        // Create pre-deletion audit log
        await tx.auditLog.create({ data: preDeleteAuditData });

        // Delete the knowledge item
        await tx.chatbotKnowledge.delete({
          where: { id: knowledgeId },
        });

        deletionResults.database = true;
      } catch (error) {
        console.error(`Database deletion failed:`, error);
        deletionResults.errors.push(
          `Database: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        deletionResults.database = false;
        // If database deletion fails, this is critical - return error
        throw new Error(
          `Database deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // 7. Post-deletion audit log (using stored metadata)
      const totalTime = Date.now() - startTime;
      try {
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "chatbot.knowledge.delete_completed",
            resource: "ChatbotKnowledge",
            resourceId: knowledgeMetadata.id,
            details: {
              chatbotId: knowledgeMetadata.chatbotId,
              chatbotName: knowledgeMetadata.chatbotName,
              knowledgeId: knowledgeMetadata.id,
              title: knowledgeMetadata.title,
              type: knowledgeMetadata.type,
              deletionResults,
              executionTimeMs: totalTime,
              deletionSteps: {
                s3Storage: deletionResults.s3Storage,
                pineconeVectors: deletionResults.pineconeVectors,
                database: deletionResults.database,
              },
              completionStatus: "SUCCESS",
            },
            oldValues: {
              title: knowledgeMetadata.title,
              type: knowledgeMetadata.type,
              chatbotId: knowledgeMetadata.chatbotId,
              s3Key: knowledgeMetadata.s3Key,
              chunkCount: knowledgeMetadata.chunkCount,
            },
            severity: deletionResults.errors.length > 0 ? "WARNING" : "INFO",
          } as const,
        });
      } catch (auditError) {
        console.error(`Failed to create completion audit log:`, auditError);
        // Don't throw here - deletion was successful, just audit logging failed
      }

      // Determine overall success
      const criticalStepsSuccess = deletionResults.database; // Database is critical
      const hasWarnings = deletionResults.errors.length > 0;

      return NextResponse.json({
        success: criticalStepsSuccess,
        message: hasWarnings
          ? `Knowledge deleted with warnings. Some cleanup steps failed.`
          : "Knowledge deleted successfully",
        deletionResults,
        executionTimeMs: totalTime,
        warnings: deletionResults.errors,
      });
    } catch (error) {
      console.error("Error deleting knowledge:", error);

      // Create error audit log
      try {
        const { knowledgeId } = await params;
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "chatbot.knowledge.delete_failed",
            resource: "ChatbotKnowledge",
            resourceId: knowledgeId,
            details: {
              error: error instanceof Error ? error.message : "Unknown error",
              deletionResults,
              executionTimeMs: Date.now() - startTime,
            },
            severity: "ERROR",
          } as const,
        });
      } catch (auditError) {
        console.error(
          "Failed to create audit log for deletion failure:",
          auditError,
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete knowledge",
          details: error instanceof Error ? error.message : "Unknown error",
          deletionResults,
        },
        { status: 500 },
      );
    }
  },
  {
    routeName: "DELETE /api/chatbots/[id]/knowledge/[knowledgeId]",
    timeout: 20000, // 20 seconds for multi-step deletion
  },
);

/**
 * PUT /api/chatbots/[id]/knowledge/[knowledgeId]
 * Update knowledge item status and processing metadata
 * Used by Lambda to update processing progress
 */
export const PUT = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    try {
      const { id: chatbotId, knowledgeId } = await params;
      const body = await request.json();

      // Build update data from body
      const updateData: any = {};

      // Status fields
      if (body.status !== undefined) updateData.status = body.status;
      if (body.stage !== undefined) updateData.stage = body.stage;
      if (body.progress !== undefined) updateData.progress = body.progress;
      if (body.totalChunks !== undefined)
        updateData.totalChunks = body.totalChunks;
      if (body.processedChunks !== undefined)
        updateData.processedChunks = body.processedChunks;
      if (body.failedChunks !== undefined)
        updateData.failedChunks = body.failedChunks;
      if (body.retryCount !== undefined)
        updateData.retryCount = body.retryCount;

      // Timestamps
      if (body.processingStartedAt)
        updateData.processingStartedAt = new Date(body.processingStartedAt);
      if (body.processingCompletedAt)
        updateData.processingCompletedAt = new Date(body.processingCompletedAt);

      // Error handling
      if (body.processingError !== undefined)
        updateData.processingError = body.processingError;

      // Content fields
      if (body.title !== undefined) updateData.title = body.title;
      if (body.content !== undefined) updateData.content = body.content;
      if (body.extractedText !== undefined)
        updateData.extractedText = body.extractedText;
      if (body.chunkCount !== undefined)
        updateData.chunkCount = body.chunkCount;

      // Update the knowledge item
      const knowledge = await tx.chatbotKnowledge.update({
        where: {
          id: knowledgeId,
          chatbotId,
        },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: knowledge,
      });
    } catch (error) {
      console.error("Error updating knowledge:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update knowledge",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  },
  {
    routeName: "PUT /api/chatbots/[id]/knowledge/[knowledgeId]",
  },
);
