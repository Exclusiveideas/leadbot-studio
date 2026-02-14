import type { TokenBudgetConfig, TokenBudgetStatus, TokenCount } from "./types";
import { asTokenCount } from "./types";

/**
 * Token Budget Management for Generate Page Chat
 *
 * Manages Claude's 200k context window allocation:
 * - System prompt: ~5k tokens
 * - AI response: ~15k tokens
 * - Conversation history: ~180k tokens
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default token budget for Claude 3.5 Sonnet (200k context window)
 */
export const DEFAULT_TOKEN_BUDGET: TokenBudgetConfig = {
  totalContextWindow: 200_000,
  systemPromptReserve: 5_000,
  responseReserve: 15_000,
  availableForHistory: 180_000,

  // Thresholds for budget management
  warningThreshold: 0.75, // 75% = 135k tokens
  compactionThreshold: 0.9, // 90% = 162k tokens
  emergencyThreshold: 0.95, // 95% = 171k tokens
};

/**
 * Token budget for Claude Haiku (smaller model, 200k window)
 */
export const HAIKU_TOKEN_BUDGET: TokenBudgetConfig = {
  totalContextWindow: 200_000,
  systemPromptReserve: 3_000,
  responseReserve: 10_000,
  availableForHistory: 187_000,

  warningThreshold: 0.75,
  compactionThreshold: 0.9,
  emergencyThreshold: 0.95,
};

// ============================================================================
// Budget Status Functions
// ============================================================================

/**
 * Get token budget health status
 *
 * @param totalTokens Current token count
 * @param config Token budget configuration
 * @returns Health status
 */
export function getTokenBudgetStatus(
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): TokenBudgetStatus {
  const usage = totalTokens / config.availableForHistory;

  if (usage >= config.emergencyThreshold) {
    return "emergency"; // Keep only last 10 messages
  }
  if (usage >= config.compactionThreshold) {
    return "critical"; // Drop oldest 30%
  }
  if (usage >= config.warningThreshold) {
    return "warning"; // Alert user
  }
  return "healthy"; // All good
}

/**
 * Check if compaction is needed
 *
 * @param totalTokens Current token count
 * @param config Token budget configuration
 * @returns True if compaction needed
 */
export function needsCompaction(
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): boolean {
  const status = getTokenBudgetStatus(totalTokens, config);
  return status === "critical" || status === "emergency";
}

/**
 * Get remaining token budget
 *
 * @param totalTokens Current token count
 * @param config Token budget configuration
 * @returns Remaining tokens available
 */
export function getRemainingTokens(
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): TokenCount {
  const remaining = config.availableForHistory - totalTokens;
  return asTokenCount(Math.max(0, remaining));
}

/**
 * Get token usage percentage
 *
 * @param totalTokens Current token count
 * @param config Token budget configuration
 * @returns Usage percentage (0-1)
 */
export function getTokenUsagePercent(
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): number {
  return totalTokens / config.availableForHistory;
}

/**
 * Get detailed budget info
 *
 * @param totalTokens Current token count
 * @param config Token budget configuration
 * @returns Detailed budget information
 */
export function getTokenBudgetInfo(
  totalTokens: TokenCount,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): {
  status: TokenBudgetStatus;
  totalTokens: TokenCount;
  availableForHistory: number;
  remaining: TokenCount;
  usagePercent: number;
  needsCompaction: boolean;
} {
  const status = getTokenBudgetStatus(totalTokens, config);
  const remaining = getRemainingTokens(totalTokens, config);
  const usagePercent = getTokenUsagePercent(totalTokens, config);

  return {
    status,
    totalTokens,
    availableForHistory: config.availableForHistory,
    remaining,
    usagePercent,
    needsCompaction: needsCompaction(totalTokens, config),
  };
}

/**
 * Calculate target token count for compaction
 *
 * @param status Budget status
 * @param config Token budget configuration
 * @returns Target token count after compaction
 */
export function getCompactionTarget(
  status: TokenBudgetStatus,
  config: TokenBudgetConfig = DEFAULT_TOKEN_BUDGET,
): TokenCount {
  if (status === "emergency") {
    // Emergency: aim for 50% usage
    return asTokenCount(Math.floor(config.availableForHistory * 0.5));
  }
  if (status === "critical") {
    // Critical: aim for 70% usage
    return asTokenCount(Math.floor(config.availableForHistory * 0.7));
  }
  // No compaction needed
  return asTokenCount(config.availableForHistory);
}
