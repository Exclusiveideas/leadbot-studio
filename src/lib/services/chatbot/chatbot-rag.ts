import { EmbeddingService } from "../embeddings/embeddingService";
import { Pinecone } from "@pinecone-database/pinecone";
import { logger } from "@/lib/utils/logger";
import { prisma } from "@/lib/db";

export interface RAGChunk {
  text: string;
  knowledgeId: string;
  title: string;
  type: string;
  pageNumber?: number;
  score: number;
  chunkIndex: number;
}

export interface SourceReference {
  id: string;
  name: string;
  type: string;
}

export interface ChatbotRAGResult {
  chunks: RAGChunk[];
  sources: SourceReference[];
  totalFound: number;
  searchTime: number;
}

export class ChatbotRAG {
  private embeddingService: EmbeddingService;
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    this.embeddingService = new EmbeddingService();
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.indexName =
      process.env.PINECONE_CHATBOT_INDEX_NAME ||
      "leadbotstudio-embeddings";
  }

  /**
   * Perform RAG retrieval for a chatbot query
   */
  async performRAG(
    query: string,
    chatbotId: string,
    options: {
      topK?: number;
      minScore?: number;
    } = {},
  ): Promise<ChatbotRAGResult> {
    const startTime = Date.now();
    const topK = options.topK || 10;
    const minScore = options.minScore || 0.0; // No minimum score by default

    try {
      logger.debug(
        `[ChatbotRAG] Performing RAG for chatbot ${chatbotId} with query: ${query.substring(0, 100)}...`,
      );

      // 1. Generate query embedding
      const queryEmbedding =
        await this.embeddingService.generateQueryEmbedding(query);

      // 2. Search Pinecone in chatbot namespace
      // IMPORTANT: Namespace must match Lambda embedding-generator (leadbotstudio/embedding-generator/src/pinecone.ts)
      // Both use chatbotId directly as namespace (not prefixed)
      const namespace = chatbotId;
      const index = this.pinecone.index(this.indexName).namespace(namespace);

      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false,
      });

      logger.debug(
        `[ChatbotRAG] Found ${searchResponse.matches?.length || 0} matches in namespace ${namespace}`,
      );

      // 3. Filter by minimum score and convert to RAG chunks
      const matches = searchResponse.matches || [];
      const filteredMatches = matches.filter(
        (match) => match.score && match.score >= minScore,
      );

      const chunks: RAGChunk[] = filteredMatches.map((match) => ({
        text: (match.metadata?.text as string) || "",
        knowledgeId: (match.metadata?.knowledgeId as string) || "",
        title: (match.metadata?.title as string) || "",
        type: (match.metadata?.type as string) || "",
        pageNumber: match.metadata?.pageNumber as number | undefined,
        score: match.score || 0,
        chunkIndex: (match.metadata?.chunkIndex as number) || 0,
      }));

      // 4. Deduplicate sources
      const sourceMap = new Map<string, SourceReference>();
      chunks.forEach((chunk) => {
        if (!sourceMap.has(chunk.knowledgeId)) {
          sourceMap.set(chunk.knowledgeId, {
            id: chunk.knowledgeId,
            name: chunk.title,
            type: chunk.type,
          });
        }
      });

      const sources = Array.from(sourceMap.values());

      const searchTime = Date.now() - startTime;

      logger.info(
        `[ChatbotRAG] Retrieved ${chunks.length} chunks from ${sources.length} sources in ${searchTime}ms`,
      );

      return {
        chunks,
        sources,
        totalFound: matches.length,
        searchTime,
      };
    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error("[ChatbotRAG] RAG retrieval failed:", error);

      // Return empty result on error rather than throwing
      return {
        chunks: [],
        sources: [],
        totalFound: 0,
        searchTime,
      };
    }
  }

  /**
   * Get knowledge base statistics for a chatbot
   */
  async getKnowledgeBaseStats(chatbotId: string): Promise<{
    totalKnowledge: number;
    processedKnowledge: number;
    totalChunks: number;
    lastProcessedAt?: Date;
  }> {
    try {
      const knowledge = await prisma.chatbotKnowledge.findMany({
        where: { chatbotId },
        select: {
          id: true,
          chunkCount: true,
          processedAt: true,
        },
      });

      const totalKnowledge = knowledge.length;
      const processedKnowledge = knowledge.filter(
        (k) => k.processedAt !== null,
      ).length;
      const totalChunks = knowledge.reduce((sum, k) => sum + k.chunkCount, 0);
      const lastProcessed = knowledge
        .filter((k) => k.processedAt)
        .sort(
          (a, b) =>
            (b.processedAt?.getTime() || 0) - (a.processedAt?.getTime() || 0),
        )[0];

      return {
        totalKnowledge,
        processedKnowledge,
        totalChunks,
        lastProcessedAt: lastProcessed?.processedAt || undefined,
      };
    } catch (error) {
      console.error("[ChatbotRAG] Failed to get knowledge base stats:", error);
      return {
        totalKnowledge: 0,
        processedKnowledge: 0,
        totalChunks: 0,
      };
    }
  }

  /**
   * Get knowledge base version for cache invalidation
   *
   * Version is based on the most recent knowledge item (by createdAt).
   * When knowledge is added or deleted, the version changes.
   *
   * @param chatbotId Chatbot ID
   * @returns Version number (timestamp) or 0 if no knowledge
   */
  async getKnowledgeBaseVersion(chatbotId: string): Promise<number> {
    try {
      const latestKnowledge = await prisma.chatbotKnowledge.findFirst({
        where: { chatbotId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      if (!latestKnowledge) {
        return 0; // No knowledge base yet
      }

      // Use timestamp as version number
      return latestKnowledge.createdAt.getTime();
    } catch (error) {
      console.error(
        "[ChatbotRAG] Failed to get knowledge base version:",
        error,
      );
      return 0;
    }
  }

  /**
   * Build context string from RAG chunks for AI prompting
   */
  buildContextString(chunks: RAGChunk[], maxChunks: number = 5): string {
    if (chunks.length === 0) {
      return "";
    }

    const selectedChunks = chunks.slice(0, maxChunks);
    const contextParts = selectedChunks.map((chunk, index) => {
      let context = `[Source ${index + 1}: ${chunk.title}`;
      if (chunk.pageNumber) {
        context += `, Page ${chunk.pageNumber}`;
      }
      context += `]\n${chunk.text}`;
      return context;
    });

    return contextParts.join("\n\n");
  }
}

// Lazy singleton - avoids Pinecone initialization at module load time
let _chatbotRAGInstance: ChatbotRAG | null = null;
export function getChatbotRAG(): ChatbotRAG {
  if (!_chatbotRAGInstance) {
    _chatbotRAGInstance = new ChatbotRAG();
  }
  return _chatbotRAGInstance;
}
