import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { logger } from "@/lib/utils/logger";
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  EmbeddingError,
  PineconeConfig,
} from "@/types/pinecone";

export class EmbeddingService {
  private client: BedrockRuntimeClient;
  private config: {
    model: string;
    dimensions: number;
    region: string;
    maxRetries: number;
    timeoutMs: number;
  };

  constructor() {
    this.config = {
      // Must match Lambda embedding-generator (leadbotstudio/embedding-generator/src/bedrock.ts)
      model:
        process.env.TITAN_EMBEDDING_MODEL || "amazon.titan-embed-text-v2:0",
      dimensions: parseInt(process.env.TITAN_EMBEDDING_DIMENSIONS || "1024"),
      region: process.env.AWS_BEDROCK_REGION || "us-east-1",
      maxRetries: 3,
      timeoutMs: 30000,
    };

    this.client = new BedrockRuntimeClient({
      region: this.config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.generateEmbeddings([text]);
    return response.embeddings[0];
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
    const startTime = Date.now();

    if (texts.length === 0) {
      throw new Error("No texts provided for embedding generation");
    }

    // Validate and clean texts
    const cleanedTexts = texts.map((text) => this.cleanTextForEmbedding(text));
    const embeddings: number[][] = [];
    let totalTokens = 0;

    try {
      // Process texts in batches to avoid rate limits
      const batchSize = 10; // Amazon Titan can handle multiple texts, but let's be conservative

      for (let i = 0; i < cleanedTexts.length; i += batchSize) {
        const batch = cleanedTexts.slice(i, i + batchSize);

        const batchEmbeddings = await this.processBatch(batch);
        embeddings.push(...batchEmbeddings);
        totalTokens += batch.reduce(
          (sum, text) => sum + this.estimateTokens(text),
          0,
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < cleanedTexts.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        embeddings,
        model: this.config.model,
        dimensions: this.config.dimensions,
        tokensUsed: totalTokens,
        executionTime,
      };
    } catch (error) {
      console.error("[EmbeddingService] Failed to generate embeddings:", error);
      throw this.handleEmbeddingError(error);
    }
  }

  /**
   * Process a batch of texts through Amazon Titan
   */
  private async processBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Amazon Titan requires individual calls per text
    for (const text of texts) {
      const embedding = await this.callTitanEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Call Amazon Titan embedding API for a single text
   */
  private async callTitanEmbedding(text: string): Promise<number[]> {
    const payload = {
      inputText: text,
    };

    const command = new InvokeModelCommand({
      modelId: this.config.model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    try {
      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error("No response body from Titan embedding");
      }

      const responseData = JSON.parse(new TextDecoder().decode(response.body));

      if (!responseData.embedding) {
        throw new Error("No embedding in Titan response");
      }

      const embedding = responseData.embedding;

      // Validate embedding dimensions
      if (embedding.length !== this.config.dimensions) {
        console.warn(
          `[EmbeddingService] Expected ${this.config.dimensions} dimensions, got ${embedding.length}`,
        );
      }

      return embedding;
    } catch (error) {
      console.error(`[EmbeddingService] Titan API call failed:`, error);
      throw error;
    }
  }

  /**
   * Clean and prepare text for embedding generation
   */
  private cleanTextForEmbedding(text: string): string {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid text provided for embedding");
    }

    // Remove excessive whitespace and normalize
    let cleaned = text.replace(/\s+/g, " ").trim();

    // Ensure text is not empty after cleaning
    if (!cleaned) {
      throw new Error("Text is empty after cleaning");
    }

    // Truncate if too long (Titan has token limits)
    const maxTokens = 8000; // Conservative limit for Titan
    const estimatedTokens = this.estimateTokens(cleaned);

    if (estimatedTokens > maxTokens) {
      console.warn(
        `[EmbeddingService] Text too long (${estimatedTokens} tokens), truncating to ${maxTokens} tokens`,
      );

      // Rough truncation based on character count
      const maxChars = Math.floor(maxTokens * 4); // ~4 chars per token
      cleaned = cleaned.substring(0, maxChars) + "...";
    }

    return cleaned;
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Handle and transform embedding errors
   */
  private handleEmbeddingError(error: any): EmbeddingError {
    console.error("[EmbeddingService] Embedding error details:", error);

    let code: string;
    let retryable = false;
    let message = "Failed to generate embeddings";

    if (
      error.name === "ThrottlingException" ||
      error.code === "ThrottlingException"
    ) {
      code = "RATE_LIMIT";
      retryable = true;
      message = "Embedding service rate limited";
    } else if (error.name === "ValidationException") {
      code = "INVALID_REQUEST";
      retryable = false;
      message = "Invalid request for embedding generation";
    } else if (
      error.code === "NetworkingError" ||
      error.name === "NetworkingError"
    ) {
      code = "CONNECTION_ERROR";
      retryable = true;
      message = "Network error connecting to embedding service";
    } else {
      code = "EMBEDDING_ERROR";
      retryable = true;
      message = error.message || "Unknown embedding error";
    }

    return {
      message,
      code,
      retryable,
      details: error,
    };
  }

  /**
   * Generate embedding for search query with optimization
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    // Optimize query for embedding
    const optimizedQuery = this.optimizeQueryForEmbedding(query);

    return this.generateEmbedding(optimizedQuery);
  }

  /**
   * Optimize query text for better embedding generation
   */
  private optimizeQueryForEmbedding(query: string): string {
    // Convert questions to statements for better semantic matching
    let optimized = query.trim();

    // Remove question words that might not add semantic value
    optimized = optimized.replace(
      /^(who|what|when|where|why|how|show me|find|search for|tell me about)\s+/i,
      "",
    );

    // Convert "evidence of X" to just "X" for better matching
    optimized = optimized.replace(/evidence\s+of\s+/i, "");

    // Remove common legal query patterns that might interfere
    optimized = optimized.replace(
      /\b(in this case|in these documents|mentioned|discussed)\b/gi,
      "",
    );

    return optimized;
  }

  /**
   * Health check for the embedding service
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Test with a small text
      await this.generateEmbedding("Health check test");

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 5000 ? "healthy" : "degraded",
        responseTime,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      model: this.config.model,
      dimensions: this.config.dimensions,
      region: this.config.region,
    };
  }
}
