import type { GenerateChatMessage } from "@/types/legal-chat";
import type { ChatbotMessage } from "@prisma/client";
import type { RAGChunk } from "@/lib/services/chatbot/chatbot-rag";

/**
 * Context Management Types for Chat Systems
 *
 * Supports both Generate Page Chat and Chatbots Chat
 * Inspired by notebook-lm's intelligent context management architecture
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Session identifier (branded type for type safety)
 */
export type SessionId = string & { readonly __brand: "SessionId" };

/**
 * Token count
 */
export type TokenCount = number & { readonly __brand: "TokenCount" };

/**
 * Cast helper for SessionId
 */
export const asSessionId = (id: string): SessionId => id as SessionId;

/**
 * Cast helper for TokenCount
 */
export const asTokenCount = (count: number): TokenCount => count as TokenCount;

// ============================================================================
// Context State
// ============================================================================

/**
 * Cached context state for a conversation session
 */
export interface ContextState {
  __type: "generate";
  sessionId: SessionId;
  messages: GenerateChatMessage[];
  totalTokens: TokenCount;
  messageCount: number;
  lastUpdated: number; // Timestamp
  version: number; // For cache invalidation
}

// ============================================================================
// Cache Tiers
// ============================================================================

/**
 * Cache tier where context was loaded from
 */
export type CacheTier = "hot" | "warm" | "cold";

/**
 * Result from cache rehydration
 */
export interface RehydrationResult {
  state: ContextState;
  source: CacheTier;
  loadTimeMs: number;
  wasCompacted: boolean;
}

// ============================================================================
// Token Budget
// ============================================================================

/**
 * Token budget health status
 */
export type TokenBudgetStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "emergency";

/**
 * Token budget configuration
 */
export interface TokenBudgetConfig {
  /** Total context window available */
  totalContextWindow: number;
  /** Tokens reserved for system prompt */
  systemPromptReserve: number;
  /** Tokens reserved for AI response */
  responseReserve: number;
  /** Available tokens for conversation history */
  availableForHistory: number;
  /** Warning threshold (0-1) */
  warningThreshold: number;
  /** Compaction threshold (0-1) */
  compactionThreshold: number;
  /** Emergency threshold (0-1) */
  emergencyThreshold: number;
}

// ============================================================================
// Compaction
// ============================================================================

/**
 * Result from context compaction
 */
export interface CompactionResult {
  compactedMessages: GenerateChatMessage[];
  droppedMessages: GenerateChatMessage[];
  tokensSaved: TokenCount;
  newTotalTokens: TokenCount;
  strategy: "none" | "normal" | "emergency";
}

// ============================================================================
// Hot Cache Types
// ============================================================================

/**
 * Hot cache statistics
 */
export interface HotCacheStats {
  size: number;
  ultraHotSize: number;
  oldestAccess: number;
  newestAccess: number;
  totalTokensCached: number;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccess: number;
}

// ============================================================================
// Chatbot-Specific Types
// ============================================================================

/**
 * Conversation identifier for chatbots (alias for SessionId)
 */
export type ConversationId = SessionId;

/**
 * Cast helper for ConversationId
 */
export const asConversationId = (id: string): ConversationId =>
  id as ConversationId;

/**
 * Cached context state for a chatbot conversation
 *
 * Extends ContextState with RAG-specific data
 */
export interface ChatbotContextState {
  __type: "chatbot";
  conversationId: ConversationId;
  messages: ChatbotMessage[];
  ragChunks?: RAGChunk[]; // Optional: Cached RAG results
  ragQueryHash?: string; // Hash of query that generated RAG results
  knowledgeBaseVersion?: number; // Version of knowledge base when RAG was cached
  totalTokens: TokenCount;
  messageCount: number;
  lastUpdated: number; // Timestamp
  version: number; // For cache invalidation
}
