import { EmbeddingService } from "../embeddings/embeddingService";
import { DocumentChunkingService } from "../chunking/documentChunkingService";
import { Pinecone } from "@pinecone-database/pinecone";
import { logger } from "@/lib/utils/logger";
import { db } from "@/lib/db";
import type { DocumentForIndexing, DocumentChunk } from "@/types/pinecone";

export interface KnowledgeVectorizationResult {
  knowledgeId: string;
  chunksCreated: number;
  vectorsIndexed: number;
  executionTime: number;
  success: boolean;
  error?: string;
}

export class KnowledgeVectorizer {
  private embeddingService: EmbeddingService;
  private chunkingService: DocumentChunkingService;
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.chunkingService = new DocumentChunkingService({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    // Use separate chatbot index (not the AI query index)
    this.indexName =
      process.env.PINECONE_CHATBOT_INDEX_NAME ||
      "leadbotstudio-embeddings";
  }

  /**
   * Process a single knowledge entry: chunk, embed, and index
   */
  async processKnowledge(
    knowledgeId: string,
    chatbotId: string,
  ): Promise<KnowledgeVectorizationResult> {
    const startTime = Date.now();

    try {
      logger.debug(
        `[KnowledgeVectorizer] Processing knowledge ${knowledgeId} for chatbot ${chatbotId}`,
      );

      // 1. Get knowledge from DB
      const knowledge = await db.chatbotKnowledge.findUnique({
        where: { id: knowledgeId },
      });

      if (!knowledge) {
        throw new Error(`Knowledge ${knowledgeId} not found`);
      }

      if (!knowledge.content || knowledge.content.trim().length === 0) {
        throw new Error(`Knowledge ${knowledgeId} has no content to process`);
      }

      // 2. Chunk content
      const document: DocumentForIndexing = {
        id: knowledgeId,
        caseId: chatbotId, // Reusing caseId field for chatbotId
        text: knowledge.content,
        documentName: knowledge.title,
        documentType: knowledge.type,
        originalName: knowledge.title,
        metadata: knowledge.metadata as Record<string, any>,
      };

      const chunks = this.chunkingService.chunkDocument(document);

      if (chunks.length === 0) {
        throw new Error(
          `No chunks created for knowledge ${knowledgeId}. Content might be too short.`,
        );
      }

      logger.debug(
        `[KnowledgeVectorizer] Created ${chunks.length} chunks for knowledge ${knowledgeId}`,
      );

      // 3. Generate embeddings
      const texts = chunks.map((c) => c.text);
      const embeddingResponse =
        await this.embeddingService.generateEmbeddings(texts);

      logger.debug(
        `[KnowledgeVectorizer] Generated ${embeddingResponse.embeddings.length} embeddings`,
      );

      // 4. Index in Pinecone (namespace = chatbotId, must match Lambda embedding-generator)
      const namespace = chatbotId;
      const index = this.pinecone.index(this.indexName).namespace(namespace);

      const vectors = chunks.map((chunk, i) => ({
        id: `${knowledgeId}-chunk-${i}`,
        values: embeddingResponse.embeddings[i],
        metadata: {
          knowledgeId,
          chatbotId,
          chunkIndex: i,
          text: chunk.text,
          title: knowledge.title,
          type: knowledge.type,
          pageNumber: chunk.pageNumber,
          chunkSize: chunk.text.length,
          hasBeforeContext: chunk.hasBeforeContext,
          hasAfterContext: chunk.hasAfterContext,
        },
      }));

      await index.upsert(vectors);

      logger.debug(
        `[KnowledgeVectorizer] Indexed ${vectors.length} vectors in namespace ${namespace}`,
      );

      // 5. Update DB with processing status
      await db.chatbotKnowledge.update({
        where: { id: knowledgeId },
        data: {
          chunkCount: chunks.length,
          processedAt: new Date(),
          vectorNamespace: namespace,
          embeddingModel: "amazon.titan-embed-text-v2:0",
          embeddingDimensions: 1024,
        },
      });

      const executionTime = Date.now() - startTime;

      logger.info(
        `[KnowledgeVectorizer] Successfully processed knowledge ${knowledgeId}: ${chunks.length} chunks in ${executionTime}ms`,
      );

      return {
        knowledgeId,
        chunksCreated: chunks.length,
        vectorsIndexed: vectors.length,
        executionTime,
        success: true,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error(
        `[KnowledgeVectorizer] Failed to process knowledge ${knowledgeId}:`,
        error,
      );

      return {
        knowledgeId,
        chunksCreated: 0,
        vectorsIndexed: 0,
        executionTime,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process multiple knowledge entries in batch
   */
  async processBatch(
    knowledgeIds: string[],
    chatbotId: string,
  ): Promise<KnowledgeVectorizationResult[]> {
    logger.info(
      `[KnowledgeVectorizer] Processing batch of ${knowledgeIds.length} knowledge entries`,
    );

    const results: KnowledgeVectorizationResult[] = [];

    for (const knowledgeId of knowledgeIds) {
      const result = await this.processKnowledge(knowledgeId, chatbotId);
      results.push(result);

      // Small delay between processing to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(
      `[KnowledgeVectorizer] Batch processing complete: ${successful} successful, ${failed} failed`,
    );

    return results;
  }

  /**
   * Delete knowledge vectors from Pinecone
   */
  async deleteKnowledgeVectors(
    knowledgeId: string,
    chatbotId: string,
  ): Promise<void> {
    try {
      logger.debug(
        `[KnowledgeVectorizer] Deleting vectors for knowledge ${knowledgeId}`,
      );

      // Namespace = chatbotId (must match Lambda embedding-generator)
      const namespace = chatbotId;
      const index = this.pinecone.index(this.indexName).namespace(namespace);

      // Get knowledge to find chunk count
      const knowledge = await db.chatbotKnowledge.findUnique({
        where: { id: knowledgeId },
        select: { chunkCount: true },
      });

      if (!knowledge) {
        logger.warn(
          `[KnowledgeVectorizer] Knowledge ${knowledgeId} not found, skipping deletion`,
        );
        return;
      }

      // Delete all chunk vectors
      const vectorIds: string[] = [];
      for (let i = 0; i < knowledge.chunkCount; i++) {
        vectorIds.push(`${knowledgeId}-chunk-${i}`);
      }

      if (vectorIds.length > 0) {
        await index.deleteMany(vectorIds);
        logger.info(
          `[KnowledgeVectorizer] Deleted ${vectorIds.length} vectors for knowledge ${knowledgeId}`,
        );
      }
    } catch (error) {
      console.error(
        `[KnowledgeVectorizer] Failed to delete vectors for knowledge ${knowledgeId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete all vectors for a chatbot
   */
  async deleteChatbotVectors(chatbotId: string): Promise<void> {
    try {
      logger.info(
        `[KnowledgeVectorizer] Deleting all vectors for chatbot ${chatbotId}`,
      );

      // Namespace = chatbotId (must match Lambda embedding-generator)
      const namespace = chatbotId;
      const index = this.pinecone.index(this.indexName).namespace(namespace);

      // Delete entire namespace
      await index.deleteAll();

      logger.info(
        `[KnowledgeVectorizer] Deleted all vectors in namespace ${namespace}`,
      );
    } catch (error) {
      console.error(
        `[KnowledgeVectorizer] Failed to delete chatbot vectors:`,
        error,
      );
      throw error;
    }
  }
}

// Lazy singleton - avoids Pinecone initialization at module load time
let _knowledgeVectorizerInstance: KnowledgeVectorizer | null = null;
export function getKnowledgeVectorizer(): KnowledgeVectorizer {
  if (!_knowledgeVectorizerInstance) {
    _knowledgeVectorizerInstance = new KnowledgeVectorizer();
  }
  return _knowledgeVectorizerInstance;
}
