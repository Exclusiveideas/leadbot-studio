import type { GenerateChatMessage } from "@/types/legal-chat";
import type {
  CompactionResult,
  TokenBudgetConfig,
  TokenBudgetStatus,
  TokenCount,
} from "./types";
import { asTokenCount } from "./types";
import {
  calculateTotalTokens,
  estimateMessageTokens,
} from "./token-calculator";
import {
  DEFAULT_TOKEN_BUDGET,
  getTokenBudgetStatus,
  getCompactionTarget,
} from "./token-budget";

/**
 * Context Compactor for Generate Page Chat
 *
 * Implements FIFO (First-In-First-Out) compaction strategy:
 * - Drops oldest messages first
 * - Always keeps minimum number of recent messages
 * - Never drops system messages
 *
 * Compaction Strategies:
 * - Normal (90% full): Drop oldest 30% of messages
 * - Emergency (95% full): Keep only last 10 messages
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimum messages to always keep (safety net)
 */
const MIN_MESSAGES_TO_KEEP = 10;

/**
 * Emergency mode: keep only this many recent messages
 */
const EMERGENCY_MESSAGE_LIMIT = 10;

/**
 * Normal compaction: drop this percentage of oldest messages
 */
const NORMAL_DROP_PERCENTAGE = 0.3; // 30%

// ============================================================================
// Main Compaction Function
// ============================================================================

/**
 * Compact conversation context to fit within token budget
 *
 * @param messages Current messages
 * @param totalTokens Current total token count
 * @param config Token budget configuration
 * @returns Compaction result with new message list
 */
export function compactContext(
  messages: GenerateChatMessage[],
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): CompactionResult {
  const status = getTokenBudgetStatus(totalTokens, config);

  // No compaction needed
  if (status === "healthy" || status === "warning") {
    return {
      compactedMessages: messages,
      droppedMessages: [],
      tokensSaved: asTokenCount(0),
      newTotalTokens: totalTokens,
      strategy: "none",
    };
  }

  // Emergency compaction: keep only last N messages
  if (status === "emergency") {
    return applyEmergencyCompaction(messages, totalTokens);
  }

  // Normal compaction: drop oldest percentage
  return applyNormalCompaction(messages, totalTokens);
}

// ============================================================================
// Compaction Strategies
// ============================================================================

/**
 * Emergency compaction: keep only last N messages
 *
 * Used when token usage exceeds 95% of budget.
 * Keeps only the most recent EMERGENCY_MESSAGE_LIMIT messages.
 *
 * @param messages Current messages
 * @param totalTokens Current total tokens
 * @returns Compaction result
 */
function applyEmergencyCompaction(
  messages: GenerateChatMessage[],
  totalTokens: TokenCount,
): CompactionResult {
  // Keep only last N messages
  const messagesToKeep = Math.max(
    MIN_MESSAGES_TO_KEEP,
    Math.min(EMERGENCY_MESSAGE_LIMIT, messages.length),
  );

  const compactedMessages = messages.slice(-messagesToKeep);
  const droppedMessages = messages.slice(0, -messagesToKeep);

  const newTotalTokens = calculateTotalTokens(compactedMessages);
  const tokensSaved = asTokenCount(totalTokens - newTotalTokens);

  return {
    compactedMessages,
    droppedMessages,
    tokensSaved,
    newTotalTokens,
    strategy: "emergency",
  };
}

/**
 * Normal compaction: drop oldest percentage of messages
 *
 * Used when token usage exceeds 90% of budget.
 * Drops oldest 30% of messages while respecting minimum.
 *
 * @param messages Current messages
 * @param totalTokens Current total tokens
 * @returns Compaction result
 */
function applyNormalCompaction(
  messages: GenerateChatMessage[],
  totalTokens: TokenCount,
): CompactionResult {
  const totalMessages = messages.length;
  const messagesToDrop = Math.ceil(totalMessages * NORMAL_DROP_PERCENTAGE);

  // Ensure we keep at least MIN_MESSAGES_TO_KEEP
  const messagesToKeep = Math.max(
    MIN_MESSAGES_TO_KEEP,
    totalMessages - messagesToDrop,
  );

  const compactedMessages = messages.slice(-messagesToKeep);
  const droppedMessages = messages.slice(0, -messagesToKeep);

  const newTotalTokens = calculateTotalTokens(compactedMessages);
  const tokensSaved = asTokenCount(totalTokens - newTotalTokens);

  return {
    compactedMessages,
    droppedMessages,
    tokensSaved,
    newTotalTokens,
    strategy: "normal",
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if messages need compaction
 *
 * @param messages Messages to check
 * @param config Token budget configuration
 * @returns True if compaction is needed
 */
export function shouldCompact(
  messages: GenerateChatMessage[],
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): boolean {
  const totalTokens = calculateTotalTokens(messages);
  const status = getTokenBudgetStatus(totalTokens, config);
  return status === "critical" || status === "emergency";
}

/**
 * Get messages that would be dropped by compaction
 *
 * Preview which messages would be removed without actually compacting.
 *
 * @param messages Current messages
 * @param config Token budget configuration
 * @returns Messages that would be dropped
 */
export function previewCompaction(
  messages: GenerateChatMessage[],
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): GenerateChatMessage[] {
  const totalTokens = calculateTotalTokens(messages);
  const result = compactContext(messages, totalTokens, config);
  return result.droppedMessages;
}

/**
 * Get compaction statistics
 *
 * @param messages Current messages
 * @param config Token budget configuration
 * @returns Compaction statistics
 */
export function getCompactionStats(
  messages: GenerateChatMessage[],
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): {
  currentTokens: TokenCount;
  currentMessages: number;
  tokensAfterCompaction: TokenCount;
  messagesAfterCompaction: number;
  tokensSaved: TokenCount;
  messagesDropped: number;
  strategy: CompactionResult["strategy"];
} {
  const totalTokens = calculateTotalTokens(messages);
  const result = compactContext(messages, totalTokens, config);

  return {
    currentTokens: totalTokens,
    currentMessages: messages.length,
    tokensAfterCompaction: result.newTotalTokens,
    messagesAfterCompaction: result.compactedMessages.length,
    tokensSaved: result.tokensSaved,
    messagesDropped: result.droppedMessages.length,
    strategy: result.strategy,
  };
}
