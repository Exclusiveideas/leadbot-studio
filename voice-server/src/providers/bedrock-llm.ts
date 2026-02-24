import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
  VoiceLLMProvider,
  VoiceLLMStreamParams,
  VoiceLLMResult,
} from "./llm.js";

const VOICE_MODEL_ID = "global.anthropic.claude-haiku-4-5-20251001-v1:0";
const MAX_TOKENS = 512;

export function createBedrockLLM(config: {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}): VoiceLLMProvider {
  const client = new BedrockRuntimeClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    maxAttempts: 2,
    requestHandler: {
      requestTimeout: 15_000,
    } as any,
  });

  return {
    async streamConversation(
      params: VoiceLLMStreamParams,
    ): Promise<VoiceLLMResult> {
      const payload: Record<string, unknown> = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: MAX_TOKENS,
        system: params.systemPrompt,
        messages: params.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.3,
      };

      if (params.tools && params.tools.length > 0) {
        payload.tools = params.tools;
      }

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: VOICE_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command, {
        abortSignal: params.signal,
      });

      let fullContent = "";
      let inputTokens = 0;
      let outputTokens = 0;

      let currentToolUse: {
        id: string;
        name: string;
        inputJson: string;
      } | null = null;

      if (response.body) {
        for await (const chunk of response.body) {
          if (params.signal?.aborted) break;

          if (chunk.chunk?.bytes) {
            const chunkData = JSON.parse(
              new TextDecoder().decode(chunk.chunk.bytes),
            );

            if (
              chunkData.type === "content_block_start" &&
              chunkData.content_block?.type === "tool_use"
            ) {
              currentToolUse = {
                id: chunkData.content_block.id,
                name: chunkData.content_block.name,
                inputJson: "",
              };
            }

            if (chunkData.type === "content_block_delta") {
              if (
                chunkData.delta?.type === "input_json_delta" &&
                currentToolUse
              ) {
                currentToolUse.inputJson += chunkData.delta.partial_json || "";
              }

              if (chunkData.delta?.type === "text_delta") {
                const text = chunkData.delta.text || "";
                fullContent += text;
                params.onChunk(text);
              }
            }

            if (chunkData.type === "content_block_stop" && currentToolUse) {
              if (params.onToolUse) {
                try {
                  const input = currentToolUse.inputJson
                    ? JSON.parse(currentToolUse.inputJson)
                    : {};
                  params.onToolUse({
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input,
                  });
                } catch {
                  console.error(
                    "[BedrockLLM] Failed to parse tool input:",
                    currentToolUse.inputJson,
                  );
                }
              }
              currentToolUse = null;
            }

            if (chunkData.type === "message_start") {
              inputTokens = chunkData.message?.usage?.input_tokens || 0;
            }

            if (chunkData.type === "message_delta") {
              outputTokens = chunkData.usage?.output_tokens || 0;
            }
          }
        }
      }

      return {
        content: fullContent,
        usage: { inputTokens, outputTokens },
      };
    },
  };
}
