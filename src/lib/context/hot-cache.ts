import type {
  ContextState,
  ChatbotContextState,
  HotCacheStats,
  SessionId,
  ConversationId,
  CacheEntry,
} from "./types";

/**
 * Hot Cache for Generate Page Chat
 *
 * In-memory cache with two tiers:
 * 1. Regular cache: TTL-based expiration (15 minutes)
 * 2. Ultra-hot LRU: Top 10 most active sessions (no TTL)
 *
 * Performance: 1-5ms access time
 * Capacity: ~1000 sessions (~5MB max)
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default TTL for regular cache entries (15 minutes)
 */
const DEFAULT_TTL_MS = 15 * 60 * 1000;

/**
 * Ultra-hot LRU size (top N most active sessions)
 */
const ULTRA_HOT_MAX_SIZE = 10;

/**
 * Max regular cache size (prevent unbounded growth)
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Cleanup interval (remove expired entries)
 */
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

// ============================================================================
// Hot Cache Class
// ============================================================================

/**
 * In-memory hot cache with LRU ultra-hot tier
 */
export class HotCache {
  private cache = new Map<SessionId, CacheEntry<ContextState>>();
  private ultraHotLRU = new Map<SessionId, ContextState>();
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private readonly ttlMs: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;

    // Start automatic cleanup in production
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
      this.startCleanup();
    }
  }

  // ==========================================================================
  // Core Operations
  // ==========================================================================

  /**
   * Get context state from cache
   *
   * @param sessionId Session ID
   * @returns Context state or null if not found/expired
   */
  get(sessionId: SessionId): ContextState | null {
    // Check ultra-hot LRU first (fastest path)
    const ultraHot = this.ultraHotLRU.get(sessionId);
    if (ultraHot) {
      // Move to end (most recently used)
      this.ultraHotLRU.delete(sessionId);
      this.ultraHotLRU.set(sessionId, ultraHot);
      return ultraHot;
    }

    // Check regular cache
    const entry = this.cache.get(sessionId);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(sessionId);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccess = Date.now();

    // Promote to ultra-hot if frequently accessed
    if (entry.accessCount >= 3) {
      this.promoteToUltraHot(sessionId, entry.value);
    }

    return entry.value;
  }

  /**
   * Set context state in cache
   *
   * @param sessionId Session ID
   * @param state Context state
   */
  set(sessionId: SessionId, state: ContextState): void {
    const now = Date.now();

    // Enforce max cache size
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(sessionId)) {
      this.evictOldest();
    }

    // Create/update cache entry
    this.cache.set(sessionId, {
      value: state,
      expiresAt: now + this.ttlMs,
      accessCount: 1,
      lastAccess: now,
    });

    // Also update ultra-hot if already there
    if (this.ultraHotLRU.has(sessionId)) {
      this.ultraHotLRU.delete(sessionId);
      this.ultraHotLRU.set(sessionId, state);
    }
  }

  /**
   * Delete session from cache
   *
   * @param sessionId Session ID
   */
  delete(sessionId: SessionId): void {
    this.cache.delete(sessionId);
    this.ultraHotLRU.delete(sessionId);
  }

  /**
   * Check if session is in cache
   *
   * @param sessionId Session ID
   * @returns True if in cache and not expired
   */
  has(sessionId: SessionId): boolean {
    return this.get(sessionId) !== null;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.ultraHotLRU.clear();
  }

  // ==========================================================================
  // Ultra-Hot LRU Management
  // ==========================================================================

  /**
   * Promote session to ultra-hot LRU
   *
   * Ultra-hot sessions are kept in memory without expiration
   * for ultra-fast access (1-5ms).
   *
   * @param sessionId Session ID
   * @param state Context state
   */
  private promoteToUltraHot(sessionId: SessionId, state: ContextState): void {
    // If already in ultra-hot, move to end (most recent)
    if (this.ultraHotLRU.has(sessionId)) {
      this.ultraHotLRU.delete(sessionId);
      this.ultraHotLRU.set(sessionId, state);
      return;
    }

    // If ultra-hot is full, evict oldest
    if (this.ultraHotLRU.size >= ULTRA_HOT_MAX_SIZE) {
      const oldestKey = this.ultraHotLRU.keys().next().value;
      if (oldestKey) {
        this.ultraHotLRU.delete(oldestKey);
      }
    }

    // Add to ultra-hot
    this.ultraHotLRU.set(sessionId, state);
  }

  // ==========================================================================
  // Cache Maintenance
  // ==========================================================================

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupIntervalId) {
      return; // Already started
    }

    this.cleanupIntervalId = setInterval(() => {
      this.removeExpired();
    }, CLEANUP_INTERVAL_MS);

    // Prevent Node.js from waiting for this interval
    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Remove expired entries from cache
   */
  private removeExpired(): void {
    const now = Date.now();
    const keysToDelete: SessionId[] = [];

    for (const [sessionId, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        keysToDelete.push(sessionId);
      }
    }

    for (const sessionId of keysToDelete) {
      this.cache.delete(sessionId);
    }
  }

  /**
   * Evict oldest entry (by last access time)
   */
  private evictOldest(): void {
    let oldestKey: SessionId | null = null;
    let oldestTime = Infinity;

    for (const [sessionId, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = sessionId;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // ==========================================================================
  // Statistics & Monitoring
  // ==========================================================================

  /**
   * Get cache statistics
   *
   * @returns Cache stats
   */
  getStats(): HotCacheStats {
    const now = Date.now();
    let oldestAccess = now;
    let newestAccess = 0;
    let totalTokens = 0;

    for (const entry of Array.from(this.cache.values())) {
      oldestAccess = Math.min(oldestAccess, entry.lastAccess);
      newestAccess = Math.max(newestAccess, entry.lastAccess);
      totalTokens += entry.value.totalTokens;
    }

    for (const state of Array.from(this.ultraHotLRU.values())) {
      totalTokens += state.totalTokens;
    }

    return {
      size: this.cache.size,
      ultraHotSize: this.ultraHotLRU.size,
      oldestAccess: oldestAccess === now ? 0 : oldestAccess,
      newestAccess,
      totalTokensCached: totalTokens,
    };
  }

  /**
   * Get size of cache
   *
   * @returns Number of entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }

  // ==========================================================================
  // Chatbot-Specific Methods
  // ==========================================================================

  /**
   * Get chatbot conversation from cache
   *
   * Includes both messages AND RAG results for chatbot conversations.
   * Uses same cache infrastructure but with chatbot-specific typing.
   *
   * @param conversationId Conversation ID
   * @returns Chatbot context state or null if not found/expired
   */
  getChatbotConversation(
    conversationId: ConversationId,
  ): ChatbotContextState | null {
    // Reuse existing get() method with type assertion
    const state = this.get(conversationId as SessionId);
    if (!state) {
      return null;
    }

    // Type guard: Check discriminator field
    // Cast to any first to bypass TypeScript's strict union checking
    const stateWithType = state as any;
    if (stateWithType.__type === "chatbot") {
      return state as unknown as ChatbotContextState;
    }

    // If it's a generate context state, it's not a chatbot conversation
    return null;
  }

  /**
   * Set chatbot conversation in cache
   *
   * Stores messages + optional RAG results together for optimal performance.
   * RAG results are cached to avoid re-running semantic search on every message.
   *
   * @param conversationId Conversation ID
   * @param state Chatbot context state
   */
  setChatbotConversation(state: ChatbotContextState): void {
    // Reuse existing set() method
    this.set(
      state.conversationId as SessionId,
      state as unknown as ContextState,
    );
  }

  /**
   * Delete chatbot conversation from cache
   *
   * @param conversationId Conversation ID
   */
  deleteChatbotConversation(conversationId: ConversationId): void {
    this.delete(conversationId as SessionId);
  }

  /**
   * Check if chatbot conversation is in cache
   *
   * @param conversationId Conversation ID
   * @returns True if in cache and not expired
   */
  hasChatbotConversation(conversationId: ConversationId): boolean {
    return this.getChatbotConversation(conversationId) !== null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global hot cache instance
 *
 * Shared across all chat sessions for optimal memory usage.
 */
let globalHotCache: HotCache | null = null;

/**
 * Get global hot cache instance
 *
 * @returns Hot cache singleton
 */
export function getHotCache(): HotCache {
  if (!globalHotCache) {
    globalHotCache = new HotCache();
  }
  return globalHotCache;
}

/**
 * Reset global hot cache (for testing)
 */
export function resetHotCache(): void {
  if (globalHotCache) {
    globalHotCache.destroy();
    globalHotCache = null;
  }
}
