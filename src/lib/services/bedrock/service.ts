import type {
  BedrockContentBlock,
  BedrockModelConfig,
  BedrockRequest,
  BedrockResponse,
} from "@/types/bedrock";
import { BEDROCK_MODELS } from "@/types/bedrock";
import { bedrockClient } from "./client";
import { promptEngine } from "./prompts";
import { apiLogger } from "@/lib/utils/logger";

export interface BedrockServiceConfig {
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

export class BedrockService {
  private config: BedrockServiceConfig;

  constructor(config: BedrockServiceConfig = {}) {
    this.config = {
      defaultModel: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Dynamically update the service configuration
   */
  setModelConfig(config: Partial<BedrockServiceConfig>): BedrockServiceConfig {
    const previousConfig = { ...this.config };
    this.config = {
      ...this.config,
      ...config,
    };
    return previousConfig;
  }

  /**
   * Get current model configuration
   */
  getModelConfig(): BedrockServiceConfig {
    return { ...this.config };
  }

  /**
   * Restore a previous configuration
   */
  restoreModelConfig(config: BedrockServiceConfig): void {
    this.config = { ...config };
  }

  async classifyDocument(
    content: string,
    metadata: {
      filename: string;
      fileType: string;
      caseContext?: string;
    },
  ): Promise<any> {
    try {
      const promptData = promptEngine.renderPrompt("document-classification", {
        content: content.substring(0, 4000), // Limit content length
        filename: metadata.filename,
        fileType: metadata.fileType,
        caseContext: metadata.caseContext || "Family law case",
      });

      if (!promptData) {
        throw new Error("Failed to render document classification prompt");
      }

      const bedrockRequest: BedrockRequest = {
        prompt: promptData.prompt,
        systemPrompt: promptData.systemPrompt,
        modelConfig: promptData.modelConfig,
        responseFormat: "json",
      };

      const response = await bedrockClient.invokeModel(bedrockRequest);
      return JSON.parse(response.content);
    } catch (error) {
      apiLogger.error("Document classification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to classify document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async analyzeCommunication(
    content: string,
    metadata: {
      participants?: string;
      date?: string;
      caseContext?: string;
    },
  ): Promise<any> {
    try {
      const promptData = promptEngine.renderPrompt("communication-analysis", {
        content: content.substring(0, 3000), // Limit content length
        participants: metadata.participants || "Unknown",
        date: metadata.date || "Unknown",
        caseContext: metadata.caseContext || "Family law case",
      });

      if (!promptData) {
        throw new Error("Failed to render communication analysis prompt");
      }

      const bedrockRequest: BedrockRequest = {
        prompt: promptData.prompt,
        systemPrompt: promptData.systemPrompt,
        modelConfig: promptData.modelConfig,
        responseFormat: "json",
      };

      const response = await bedrockClient.invokeModel(bedrockRequest);
      return JSON.parse(response.content);
    } catch (error) {
      apiLogger.error("Communication analysis failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to analyze communication: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async analyzeFinancialDocument(
    content: string,
    metadata: {
      documentType?: string;
      dateRange?: string;
    },
  ): Promise<any> {
    try {
      const promptData = promptEngine.renderPrompt("financial-analysis", {
        content: content.substring(0, 4000), // Limit content length
        documentType: metadata.documentType || "Financial document",
        dateRange: metadata.dateRange || "Unknown",
      });

      if (!promptData) {
        throw new Error("Failed to render financial analysis prompt");
      }

      const bedrockRequest: BedrockRequest = {
        prompt: promptData.prompt,
        systemPrompt: promptData.systemPrompt,
        modelConfig: promptData.modelConfig,
        responseFormat: "json",
      };

      const response = await bedrockClient.invokeModel(bedrockRequest);
      return JSON.parse(response.content);
    } catch (error) {
      apiLogger.error("Financial analysis failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to analyze financial document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async generateCaseSummary(metadata: {
    documentsContext: string;
    caseNumber: string;
    parties: string;
    caseType?: string;
    dateRange?: string;
  }): Promise<any> {
    try {
      const promptData = promptEngine.renderPrompt("case-summary", {
        documentsContext: metadata.documentsContext.substring(0, 6000), // Limit content length
        caseNumber: metadata.caseNumber,
        parties: metadata.parties,
        caseType: metadata.caseType || "Family law",
        dateRange: metadata.dateRange || "Unknown",
      });

      if (!promptData) {
        throw new Error("Failed to render case summary prompt");
      }

      const bedrockRequest: BedrockRequest = {
        prompt: promptData.prompt,
        systemPrompt: promptData.systemPrompt,
        modelConfig: {
          ...promptData.modelConfig,
          maxTokens: 4096, // Longer responses for summaries
        },
        responseFormat: "text",
      };

      const response = await bedrockClient.invokeModel(bedrockRequest);
      return { summary: response.content, usage: response.usage };
    } catch (error) {
      apiLogger.error("Case summary generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to generate case summary: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async generateText(
    prompt: string,
    options: {
      systemPrompt?: string;
      modelConfig?: Partial<BedrockModelConfig>;
      responseFormat?: "text" | "json";
    } = {},
  ): Promise<BedrockResponse> {
    try {
      const bedrockRequest: BedrockRequest = {
        prompt,
        systemPrompt: options.systemPrompt,
        modelConfig: {
          modelId: this.config.defaultModel!,
          maxTokens: 2048,
          temperature: 0.3,
          ...options.modelConfig,
        },
        responseFormat: options.responseFormat || "text",
      };

      const result = await bedrockClient.invokeModel(bedrockRequest);
      return result;
    } catch (error) {
      apiLogger.error("Text generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to generate text: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async generateTextStream(
    prompt: string,
    options: {
      systemPrompt?: string;
      modelConfig?: Partial<BedrockModelConfig>;
      onChunk: (chunk: string) => void;
    },
  ): Promise<BedrockResponse> {
    try {
      const bedrockRequest: BedrockRequest = {
        prompt,
        systemPrompt: options.systemPrompt,
        modelConfig: {
          modelId: this.config.defaultModel!,
          maxTokens: 2048,
          temperature: 0.3,
          ...options.modelConfig,
        },
        responseFormat: "text",
      };

      const result = await bedrockClient.invokeModelWithStream(
        bedrockRequest,
        options.onChunk,
      );
      return result;
    } catch (error) {
      apiLogger.error("Text generation with stream failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to generate text with stream: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async generateConversation(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    options: {
      systemPrompt?: string;
      modelConfig?: Partial<BedrockModelConfig>;
      maxMessages?: number;
    } = {},
  ): Promise<BedrockResponse> {
    // Validate messages array early so we can capture counts in catch
    if (!messages || messages.length === 0) {
      throw new Error("Messages array cannot be empty");
    }

    const maxMessages = options.maxMessages ?? 20;
    const originalMessageCount = messages.length;

    try {
      // Ensure last message is from user (Claude API requirement)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== "user") {
        throw new Error(
          "Last message must be from user role, got: " + lastMessage.role,
        );
      }

      // Limit conversation history to last N messages (default 20)
      const limitedMessages = messages.slice(-maxMessages);

      const bedrockRequest: BedrockRequest = {
        messages: limitedMessages,
        systemPrompt: options.systemPrompt,
        modelConfig: {
          modelId: this.config.defaultModel!,
          maxTokens: 2048,
          temperature: 0.3,
          ...options.modelConfig,
        },
        responseFormat: "text",
      };

      const result = await bedrockClient.invokeModel(bedrockRequest);
      return result;
    } catch (error) {
      apiLogger.error("Conversation generation failed", {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        originalMessageCount,
        maxMessages,
      });
      throw new Error(
        `Failed to generate conversation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async generateConversationStream(
    messages: Array<{
      role: "user" | "assistant";
      content: string | BedrockContentBlock[];
    }>,
    options: {
      systemPrompt?: string;
      modelConfig?: Partial<BedrockModelConfig>;
      onChunk: (chunk: string) => void;
      maxMessages?: number;
      tools?: any[];
      onToolUse?: (toolCall: any) => void;
    },
  ): Promise<BedrockResponse> {
    // Validate messages array early so we can capture counts in catch
    if (!messages || messages.length === 0) {
      throw new Error("Messages array cannot be empty");
    }

    const maxMessages = options.maxMessages ?? 20;
    const originalMessageCount = messages.length;

    try {
      // Ensure last message is from user (Claude API requirement)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== "user") {
        throw new Error(
          "Last message must be from user role, got: " + lastMessage.role,
        );
      }

      // Limit conversation history to last N messages (default 20)
      const limitedMessages = messages.slice(-maxMessages);

      const bedrockRequest: BedrockRequest = {
        messages: limitedMessages,
        systemPrompt: options.systemPrompt,
        modelConfig: {
          modelId: this.config.defaultModel!,
          maxTokens: 2048,
          temperature: 0.3,
          ...options.modelConfig,
        },
        responseFormat: "text",
        tools: options.tools,
        onToolUse: options.onToolUse,
      };

      const result = await bedrockClient.invokeModelWithStream(
        bedrockRequest,
        options.onChunk,
      );
      return result;
    } catch (error) {
      apiLogger.error("Conversation generation with stream failed", {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorName: error instanceof Error ? error.name : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
        originalMessageCount,
        maxMessages,
      });
      throw new Error(
        `Failed to generate conversation with stream: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const clientHealth = await bedrockClient.healthCheck();

      if (!clientHealth.healthy) {
        return { healthy: false, error: clientHealth.error };
      }

      // Test prompt engine with AI search analysis
      const testPromptData = promptEngine.renderPrompt("search-analysis", {
        results: "Test results",
        query: "test query",
        context: "test context",
      });

      if (!testPromptData) {
        return { healthy: false, error: "Prompt engine not working" };
      }

      return {
        healthy: true,
        details: {
          client: clientHealth,
          promptTemplates: promptEngine.getAllTemplates().length,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Utility method for batch processing
  async processInBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 5,
    delayMs: number = 1000,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(processor);

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < items.length && delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        apiLogger.error("Batch processing failed", {
          batchStart: i,
          batchEnd: i + batchSize,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }

    return results;
  }

  // Get usage statistics (if needed for monitoring)
  getServiceStats(): {
    config: BedrockServiceConfig;
    availableTemplates: string[];
  } {
    return {
      config: this.config,
      availableTemplates: promptEngine.getAllTemplates().map((t) => t.id),
    };
  }
}

// Export singleton instance
export const bedrockService = new BedrockService();
