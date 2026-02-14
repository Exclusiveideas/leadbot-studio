import type { GenerateChatMessage } from "@/types/legal-chat";
import type { ChatbotMessage } from "@prisma/client";
import type { TokenCount } from "./types";
import { asTokenCount } from "./types";

/**
 * Token Calculator for Chat Systems
 *
 * Supports both Generate Page Chat and Chatbots Chat
 * Estimates token usage for messages using Claude's tokenization model.
 * Uses a conservative 4 characters ≈ 1 token estimate (actual is ~3.5 for English).
 *
 * Note: For production, consider using tiktoken library for accurate counts.
 */

// Generic message type that works for both GenerateChatMessage and ChatbotMessage
type ChatMessage = GenerateChatMessage | ChatbotMessage;

// ============================================================================
// Constants
// ============================================================================

/**
 * Conservative estimate: 4 characters per token
 * Actual Claude ratio is ~3.5 chars/token for English
 */
const CHARS_PER_TOKEN = 4;

/**
 * Base overhead per message (role, metadata, formatting)
 */
const MESSAGE_OVERHEAD_TOKENS = 10;

/**
 * Attachment overhead per file
 */
const ATTACHMENT_OVERHEAD_TOKENS = 20;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Estimate tokens for a single message
 *
 * @param message Chat message (GenerateChatMessage or ChatbotMessage)
 * @returns Estimated token count
 */
export function estimateMessageTokens(message: ChatMessage): TokenCount {
  // If tokensUsed is already stored, use it
  if (message.tokensUsed && message.tokensUsed > 0) {
    return asTokenCount(message.tokensUsed);
  }

  // Estimate from content
  const contentTokens = Math.ceil(message.content.length / CHARS_PER_TOKEN);

  // Add attachment overhead
  const attachmentTokens =
    (message.attachments?.length || 0) * ATTACHMENT_OVERHEAD_TOKENS;

  // Total with message overhead
  const total = contentTokens + attachmentTokens + MESSAGE_OVERHEAD_TOKENS;

  return asTokenCount(total);
}

/**
 * Calculate total tokens for multiple messages
 *
 * @param messages Array of messages (GenerateChatMessage or ChatbotMessage)
 * @returns Total token count
 */
export function calculateTotalTokens(messages: ChatMessage[]): TokenCount {
  const total = messages.reduce((sum, msg) => {
    return sum + estimateMessageTokens(msg);
  }, 0);

  return asTokenCount(total);
}

/**
 * Estimate tokens for a text string
 *
 * @param text Text to estimate
 * @returns Estimated token count
 */
export function estimateTextTokens(text: string): TokenCount {
  return asTokenCount(Math.ceil(text.length / CHARS_PER_TOKEN));
}

/**
 * Get message with cached token count
 *
 * If tokensUsed is not set, calculates and returns message with estimated tokens.
 * Does not mutate the original message.
 *
 * @param message Chat message
 * @returns Message with tokensUsed set
 */
export function withTokenCount(
  message: GenerateChatMessage,
): GenerateChatMessage {
  if (message.tokensUsed && message.tokensUsed > 0) {
    return message;
  }

  const tokens = estimateMessageTokens(message);

  return {
    ...message,
    tokensUsed: tokens,
  };
}

/**
 * Batch process messages to add token counts
 *
 * @param messages Array of messages
 * @returns Messages with tokensUsed set
 */
export function batchAddTokenCounts(
  messages: GenerateChatMessage[],
): GenerateChatMessage[] {
  return messages.map(withTokenCount);
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Get token distribution summary
 *
 * @param messages Array of messages
 * @returns Token distribution statistics
 */
export function getTokenDistribution(messages: GenerateChatMessage[]): {
  total: TokenCount;
  byRole: Record<string, TokenCount>;
  average: number;
  max: number;
  min: number;
} {
  const tokensPerMessage = messages.map((msg) => estimateMessageTokens(msg));

  const byRole = messages.reduce(
    (acc, msg, idx) => {
      const role = msg.role.toLowerCase();
      acc[role] = asTokenCount((acc[role] || 0) + tokensPerMessage[idx]);
      return acc;
    },
    {} as Record<string, TokenCount>,
  );

  // Reuse already computed tokensPerMessage instead of recalculating
  const totalTokens = tokensPerMessage.length
    ? tokensPerMessage.reduce((a, b) => a + b, 0)
    : 0;

  return {
    total: asTokenCount(totalTokens),
    byRole,
    average: tokensPerMessage.length
      ? totalTokens / tokensPerMessage.length
      : 0,
    max: Math.max(...tokensPerMessage, 0),
    min: Math.min(...tokensPerMessage, Number.MAX_SAFE_INTEGER),
  };
}
