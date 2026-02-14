import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  BedrockRequest,
  BedrockResponse,
  BedrockModelConfig,
} from "@/types/bedrock";
import { DEFAULT_MODEL_CONFIG, BedrockError } from "@/types/bedrock";
import { claudeJsonExtractor } from "./jsonExtractor";
import { aiSystemMonitor } from "../monitoring/aiSystemMonitor";
import { logger } from "@/lib/utils/logger";

class BedrockClient {
  private client: BedrockRuntimeClient | null = null;
  private isInitialized = false;

  private initializeClient(): void {
    if (this.isInitialized) return;

    try {
      // Validate required environment variables
      const region = process.env.AWS_REGION;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "Missing AWS environment variables. Required: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY",
        );
      }

      this.client = new BedrockRuntimeClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        maxAttempts: 3, // Retry configuration
      });

      this.isInitialized = true;
    } catch (error) {
      logger.error("Bedrock client initialization failed", error, {
        component: "BedrockClient",
        action: "initializeClient",
      });
      throw error;
    }
  }

  private getClient(): BedrockRuntimeClient {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  }

  private sanitizeJSONString(jsonString: string): string {
    let sanitized = jsonString;
    let sanitizationApplied = false;

    // Handle JSON string values that contain problematic characters
    // This regex finds all JSON string values (key-value pairs where value is a string)
    sanitized = sanitized.replace(
      /"([^"]*(?:\\.[^"]*)*)":\s*"((?:[^"\\]|\\.)*)"/g,
      (match, key, value) => {
        let sanitizedValue = value;
        let valueSanitized = false;

        // Handle SQL-style escaped single quotes (only in SQL-like strings)
        // In SQL, '' is used to escape single quotes, but in JSON single quotes don't need escaping
        // So we convert '' to just ' (single quote)
        if (
          /\b(SELECT|FROM|WHERE|JOIN|AND|OR|LIKE|ILIKE|INSERT|UPDATE|DELETE)\b/i.test(
            value,
          )
        ) {
          if (value.includes("''")) {
            sanitizedValue = sanitizedValue.replace(/''/g, "'");
            valueSanitized = true;
          }
        }

        // Handle unescaped newlines
        if (sanitizedValue.includes("\n")) {
          sanitizedValue = sanitizedValue.replace(/\n/g, "\\n");
          valueSanitized = true;
        }

        // Handle unescaped carriage returns
        if (sanitizedValue.includes("\r")) {
          sanitizedValue = sanitizedValue.replace(/\r/g, "\\r");
          valueSanitized = true;
        }

        // Handle unescaped tabs
        if (sanitizedValue.includes("\t")) {
          sanitizedValue = sanitizedValue.replace(/\t/g, "\\t");
          valueSanitized = true;
        }

        if (valueSanitized) {
          sanitizationApplied = true;
          return `"${key}": "${sanitizedValue}"`;
        }

        return match;
      },
    );

    return sanitized;
  }

  async invokeModel(request: BedrockRequest): Promise<BedrockResponse> {
    const startTime = Date.now();
    let success = false;
    let errorType: string | undefined;
    let templateId: string | undefined;
    let totalTokens = 0;

    try {
      const client = this.getClient();
      const modelConfig = { ...DEFAULT_MODEL_CONFIG, ...request.modelConfig };

      // Extract template ID from system prompt for monitoring
      if (request.systemPrompt) {
        const templateMatch = request.systemPrompt.match(
          /Required JSON Schema \(([^)]+)\)/,
        );
        templateId = templateMatch
          ? templateMatch[1].toLowerCase().replace(/ /g, "_")
          : undefined;
      }

      // Prepare the request payload based on the model
      const payload = this.preparePayload(request, modelConfig);

      const command = new InvokeModelCommand({
        modelId: modelConfig.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const executionTime = Date.now() - startTime;

      // Parse the response body
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Extract content based on model response format
      const content = await this.extractContent(
        responseBody,
        request.responseFormat,
      );

      // Track token usage
      if (responseBody.usage) {
        totalTokens =
          (responseBody.usage.input_tokens || 0) +
          (responseBody.usage.output_tokens || 0);
      }

      success = true;

      // Record successful request in monitoring
      aiSystemMonitor.recordBedrockRequest(
        true,
        executionTime,
        undefined,
        templateId,
        totalTokens,
      );

      return {
        content,
        usage: responseBody.usage
          ? {
              inputTokens: responseBody.usage.input_tokens || 0,
              outputTokens: responseBody.usage.output_tokens || 0,
            }
          : undefined,
        stopReason: responseBody.stop_reason,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const handledError = this.handleError(error);

      // Determine error type for monitoring
      errorType = handledError.code;

      // Record failed request in monitoring
      aiSystemMonitor.recordBedrockRequest(
        false,
        executionTime,
        errorType,
        templateId,
        totalTokens,
      );

      logger.error("Bedrock model invocation failed", error, {
        component: "BedrockClient",
        action: "invokeModel",
        templateId,
        executionTime,
        totalTokens,
      });
      throw handledError;
    }
  }

  async invokeModelWithStream(
    request: BedrockRequest,
    onChunk: (chunk: string) => void,
  ): Promise<BedrockResponse> {
    const startTime = Date.now();
    let errorType: string | undefined;
    let templateId: string | undefined;
    let totalTokens = 0;

    try {
      const client = this.getClient();
      const modelConfig = { ...DEFAULT_MODEL_CONFIG, ...request.modelConfig };

      // Extract template ID from system prompt for monitoring
      if (request.systemPrompt) {
        const templateMatch = request.systemPrompt.match(
          /Required JSON Schema \(([^)]+)\)/,
        );
        templateId = templateMatch
          ? templateMatch[1].toLowerCase().replace(/ /g, "_")
          : undefined;
      }

      // Prepare the request payload based on the model
      const payload = this.preparePayload(request, modelConfig);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: modelConfig.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);

      let fullContent = "";
      let inputTokens = 0;
      let outputTokens = 0;
      let stopReason = "";

      // Track tool use for parameter accumulation
      let currentToolUse: {
        id: string;
        name: string;
        inputJson: string;
      } | null = null;

      // Stream the response chunks
      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const chunkData = JSON.parse(
              new TextDecoder().decode(chunk.chunk.bytes),
            );

            // Handle content block start (for tool_use)
            if (
              chunkData.type === "content_block_start" &&
              chunkData.content_block?.type === "tool_use"
            ) {
              // Start accumulating tool parameters
              currentToolUse = {
                id: chunkData.content_block.id,
                name: chunkData.content_block.name,
                inputJson: "",
              };
            }

            // Handle content block delta
            if (chunkData.type === "content_block_delta") {
              // Accumulate tool input JSON chunks
              if (
                chunkData.delta?.type === "input_json_delta" &&
                currentToolUse
              ) {
                currentToolUse.inputJson += chunkData.delta.partial_json || "";
              }

              // Accumulate text chunks
              if (chunkData.delta?.type === "text_delta") {
                const text = chunkData.delta?.text || "";
                fullContent += text;
                onChunk(text);
              }
            }

            // Handle content block stop (complete tool_use)
            if (chunkData.type === "content_block_stop" && currentToolUse) {
              try {
                // Parse the complete input JSON
                const input = currentToolUse.inputJson
                  ? JSON.parse(currentToolUse.inputJson)
                  : {};

                // Call the tool use callback with complete data
                if (request.onToolUse) {
                  request.onToolUse({
                    type: "tool_use",
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input,
                  });
                }
              } catch (error) {
                console.error(
                  "[BedrockClient] Failed to parse tool input JSON:",
                  error,
                  { inputJson: currentToolUse.inputJson },
                );
              }

              // Reset tool tracking
              currentToolUse = null;
            }

            // Handle message start (contains input token count)
            if (chunkData.type === "message_start") {
              inputTokens = chunkData.message?.usage?.input_tokens || 0;
            }

            // Handle message delta (contains output token count)
            if (chunkData.type === "message_delta") {
              outputTokens = chunkData.usage?.output_tokens || 0;
              stopReason = chunkData.delta?.stop_reason || stopReason;
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;
      totalTokens = inputTokens + outputTokens;

      // Record successful request in monitoring
      aiSystemMonitor.recordBedrockRequest(
        true,
        executionTime,
        undefined,
        templateId,
        totalTokens,
      );

      return {
        content: fullContent,
        usage: {
          inputTokens,
          outputTokens,
        },
        stopReason,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const handledError = this.handleError(error);

      // Determine error type for monitoring
      errorType = handledError.code;

      // Record failed request in monitoring
      aiSystemMonitor.recordBedrockRequest(
        false,
        executionTime,
        errorType,
        templateId,
        totalTokens,
      );

      logger.error("Bedrock model invocation with stream failed", error, {
        component: "BedrockClient",
        action: "invokeModelWithStream",
        templateId,
        executionTime,
        totalTokens,
      });
      throw handledError;
    }
  }

  private preparePayload(
    request: BedrockRequest,
    config: BedrockModelConfig,
  ): any {
    // Claude 3 format - support both message arrays and single prompts
    const messages = request.messages || [
      {
        role: "user" as const,
        content: request.prompt || "",
      },
    ];

    const payload: any = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: config.maxTokens,
      messages,
    };

    // Claude 4.5 Haiku doesn't support both temperature and top_p - use mutual exclusivity
    // Prefer temperature if both are set, otherwise use whichever is defined
    if (config.temperature !== undefined) {
      payload.temperature = config.temperature;
      // Explicitly don't set top_p when temperature is set
    } else if (config.topP !== undefined) {
      payload.top_p = config.topP;
    }

    // Add system prompt if provided
    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    // Add stop sequences if provided
    if (config.stopSequences && config.stopSequences.length > 0) {
      payload.stop_sequences = config.stopSequences;
    }

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools;
    }

    // Count multimodal content blocks for logging
    let imageCount = 0;
    let documentCount = 0;
    messages.forEach((msg) => {
      if (Array.isArray(msg.content)) {
        msg.content.forEach((block) => {
          if (block.type === "image") imageCount++;
          if (block.type === "document") documentCount++;
        });
      }
    });

    // Log payload for debugging
    logger.debug("Bedrock payload prepared", undefined, {
      component: "BedrockClient",
      action: "preparePayload",
      messagesCount: messages.length,
      hasSystemPrompt: !!request.systemPrompt,
      modelId: config.modelId,
      maxTokens: config.maxTokens,
      imageCount,
      documentCount,
    });

    return payload;
  }

  private async extractContent(
    responseBody: any,
    responseFormat?: string,
  ): Promise<string> {
    try {
      // Claude 3 response format
      if (responseBody.content && Array.isArray(responseBody.content)) {
        const textContent = responseBody.content
          .filter((item: any) => item.type === "text")
          .map((item: any) => item.text)
          .join("\n");

        if (responseFormat === "json") {
          // Use the enhanced JSON extractor with 5-strategy fallback
          const extractionResult =
            await claudeJsonExtractor.extractJSON(textContent);

          if (extractionResult.success && extractionResult.content) {
            return extractionResult.content;
          } else {
            logger.error("Bedrock JSON extraction failed", undefined, {
              component: "BedrockClient",
              action: "extractContent",
              error: extractionResult.error,
              responseFormat,
            });
            throw new Error(
              `All JSON extraction strategies failed: ${extractionResult.error}`,
            );
          }
        }

        return textContent;
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      logger.error("Bedrock content extraction failed", error, {
        component: "BedrockClient",
        action: "extractContent",
      });
      throw new Error("Failed to parse model response");
    }
  }

  private handleError(error: any): BedrockError {
    if (error.name === "ThrottlingException") {
      return new BedrockError(
        "THROTTLING",
        "Request was throttled. Please try again later.",
        true,
      );
    } else if (error.name === "ValidationException") {
      return new BedrockError(
        "VALIDATION_ERROR",
        error.message || "Invalid request parameters",
        false,
      );
    } else if (error.name === "AccessDeniedException") {
      return new BedrockError(
        "ACCESS_DENIED",
        "Access denied to Bedrock model. Check your permissions.",
        false,
      );
    } else if (error.name === "ResourceNotFoundException") {
      return new BedrockError(
        "MODEL_NOT_FOUND",
        "The specified model was not found or is not available.",
        false,
      );
    } else if (error.message) {
      return new BedrockError("UNKNOWN_ERROR", error.message, false);
    }

    return new BedrockError(
      "UNKNOWN_ERROR",
      "An unexpected error occurred",
      false,
    );
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    error?: string;
    region?: string;
  }> {
    try {
      const client = this.getClient();

      // Simple health check with a minimal request
      const testRequest: BedrockRequest = {
        prompt: "Hello",
        modelConfig: {
          modelId: DEFAULT_MODEL_CONFIG.modelId,
          maxTokens: 10,
          temperature: 0,
        },
      };

      await this.invokeModel(testRequest);

      return {
        healthy: true,
        region: process.env.AWS_REGION,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
        region: process.env.AWS_REGION,
      };
    }
  }
}

// Export singleton instance
export const bedrockClient = new BedrockClient();
