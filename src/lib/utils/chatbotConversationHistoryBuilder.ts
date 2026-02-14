import type { ChatbotMessage } from "@prisma/client";
import type { TokenCount, TokenBudgetConfig } from "@/lib/context/types";
import { calculateTotalTokens } from "@/lib/context/token-calculator";
import { compactContext } from "@/lib/context/context-compactor";
import { DEFAULT_TOKEN_BUDGET } from "@/lib/context/token-budget";

/**
 * Chatbot Conversation History Builder
 *
 * Builds conversation history with the following constraints:
 * - Token budget management (default: 180k tokens)
 * - RAG-aware budget allocation (accounts for RAG context tokens)
 * - FIFO compaction when budget exceeded
 * - Minimum message retention (10 messages)
 * - Session-specific (only messages from current conversation)
 *
 * This is separate from conversationHistoryBuilder.ts which is for legal chat (Generate Page).
 * Key difference: This version accounts for RAG context tokens in budget calculation.
 */

export interface ChatbotConversationHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatbotConversationHistory {
  messages: ChatbotConversationHistoryMessage[];
  metadata: {
    totalTokens: TokenCount;
    wasCompacted: boolean;
    messagesDropped: number;
    ragTokensUsed: number;
  };
}

interface BuildChatbotConversationHistoryConfig {
  maxMessagePairs?: number; // Legacy: Default 10 pairs (20 total messages)
  maxTokens?: number; // New: Token budget (default: 180k)
  ragContextTokens?: number; // Tokens used by RAG context (default: 0)
  minMessages?: number; // Minimum messages to keep (default: 10)
  tokenBudgetConfig?: TokenBudgetConfig; // Custom token budget config
  useTokenBudget?: boolean; // Enable token-based limiting (default: true)
}

const DEFAULT_CONFIG: BuildChatbotConversationHistoryConfig = {
  maxMessagePairs: 10, // Legacy fallback
  maxTokens: DEFAULT_TOKEN_BUDGET.availableForHistory,
  ragContextTokens: 0,
  minMessages: 10,
  useTokenBudget: true,
};

/**
 * Build chatbot conversation history from chat messages
 *
 * Key Feature: RAG-Aware Budget Allocation
 * - If RAG context uses 5k tokens, only 175k is available for conversation
 * - Ensures total context (conversation + RAG) never exceeds 180k budget
 *
 * @param messages All messages from the chat database
 * @param conversationId Current conversation ID (for filtering)
 * @param config Optional configuration
 * @returns Conversation history with messages and metadata
 */
export function buildChatbotConversationHistory(
  messages: ChatbotMessage[],
  conversationId: string | null,
  config: BuildChatbotConversationHistoryConfig = {},
): ChatbotConversationHistory {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Return empty if no conversation
  if (!conversationId) {
    return {
      messages: [],
      metadata: {
        totalTokens: 0 as TokenCount,
        wasCompacted: false,
        messagesDropped: 0,
        ragTokensUsed: fullConfig.ragContextTokens ?? 0,
      },
    };
  }

  // Filter: Only messages from this conversation, exclude failed messages
  const validMessages = messages.filter(
    (msg) =>
      msg.conversationId === conversationId &&
      msg.status !== "failed" &&
      msg.status !== null, // Exclude messages with null status
  );

  let recentMessages: ChatbotMessage[];
  let wasCompacted = false;
  let messagesDropped = 0;
  let totalTokens: TokenCount;

  // Use token budget management if enabled
  if (fullConfig.useTokenBudget) {
    const inputTokens = calculateTotalTokens(validMessages);

    // CRITICAL: Adjust budget to account for RAG context
    // If RAG uses 5k tokens, only 175k available for conversation history
    const ragTokens = fullConfig.ragContextTokens ?? 0;
    const adjustedBudget: TokenBudgetConfig = {
      ...DEFAULT_TOKEN_BUDGET,
      availableForHistory: DEFAULT_TOKEN_BUDGET.availableForHistory - ragTokens,
    };

    // Apply compaction if needed
    const compactionResult = compactContext(
      validMessages,
      inputTokens,
      adjustedBudget,
    );

    recentMessages = compactionResult.compactedMessages;
    wasCompacted = compactionResult.strategy !== "none";
    messagesDropped = compactionResult.droppedMessages.length;
    // Reuse token count from compaction result instead of recalculating
    totalTokens = compactionResult.newTotalTokens;
  } else {
    // Legacy behavior: use message pair limit
    const maxMessages = (fullConfig.maxMessagePairs ?? 10) * 2;
    recentMessages = validMessages.slice(-maxMessages);
    messagesDropped = Math.max(0, validMessages.length - maxMessages);
    // Calculate tokens only once for legacy path
    totalTokens = calculateTotalTokens(recentMessages);
  }

  // Convert to conversation history format
  const historyMessages: ChatbotConversationHistoryMessage[] =
    recentMessages.map((msg) => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content,
    }));

  return {
    messages: historyMessages,
    metadata: {
      totalTokens,
      wasCompacted,
      messagesDropped,
      ragTokensUsed: fullConfig.ragContextTokens ?? 0,
    },
  };
}

/**
 * Get count of message pairs in history
 */
export function getChatbotMessagePairCount(
  history: ChatbotConversationHistory,
): number {
  // Count user messages (each represents a Q&A pair)
  return history.messages.filter((msg) => msg.role === "user").length;
}

/**
 * Get total message count in history
 */
export function getChatbotMessageCount(
  history: ChatbotConversationHistory,
): number {
  return history.messages.length;
}
