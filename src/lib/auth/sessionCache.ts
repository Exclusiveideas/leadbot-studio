/**
 * Distributed session invalidation cache using Valkey
 *
 * Architecture:
 * - In-memory cache for fast local reads (30s TTL)
 * - Valkey backing for distributed invalidation propagation
 * - Only stores invalidated sessions (not valid ones)
 * - Immediate propagation across all instances on logout
 *
 * Flow:
 * 1. On logout: Write invalidation to both local cache and Valkey
 * 2. On request: Check local cache first, then Valkey if not found
 * 3. If session marked invalid in either, reject the request
 */

import { sessionClient, ensureConnected } from "@/lib/config/valkey";

interface CachedSession {
  sessionId: string;
  isValid: boolean;
  expiresAt: number;
  lastAccess: number;
}

// Valkey key prefix for invalidated sessions
const INVALIDATION_KEY_PREFIX = "invalidated:";
// TTL for invalidation records (matches session max age: 2 hours)
const INVALIDATION_TTL_SECONDS = 7200;
// Timeout for Valkey operations (fail fast)
const VALKEY_TIMEOUT_MS = 200;

/**
 * Wrap a promise with timeout to prevent blocking on slow Valkey.
 * Returns fallback on timeout OR error (fail-open for availability).
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

class SessionCache {
  private cache: Map<string, CachedSession> = new Map();
  private readonly TTL_MS = 30 * 1000; // 30 seconds local cache TTL
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000;
  private readonly MAX_SIZE = 1000;
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof setInterval !== "undefined") {
      this.cleanupIntervalId = setInterval(() => {
        this.cleanup();
      }, this.CLEANUP_INTERVAL_MS);
    }
  }

  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get cached session validation result
   * Checks local cache first, then Valkey for distributed invalidations
   */
  get(sessionId: string): CachedSession | null {
    // Check local cache first (fast path)
    const cached = this.cache.get(sessionId);
    if (cached) {
      const now = Date.now();
      if (now > cached.expiresAt) {
        this.cache.delete(sessionId);
      } else {
        cached.lastAccess = now;
        return cached;
      }
    }

    return null;
  }

  /**
   * Check if session is invalidated (async, checks Valkey)
   * Use this for distributed invalidation checks
   */
  async isInvalidated(sessionId: string): Promise<boolean> {
    // Check local cache first
    const cached = this.get(sessionId);
    if (cached && !cached.isValid) {
      return true; // Locally marked as invalid
    }

    // Check Valkey for distributed invalidation
    try {
      const operation = async () => {
        await ensureConnected();
        const key = `${INVALIDATION_KEY_PREFIX}${sessionId}`;
        const result = await sessionClient.exists(key);
        return result === 1;
      };

      const isInvalidatedInValkey = await withTimeout(
        operation(),
        VALKEY_TIMEOUT_MS,
        false, // On timeout, assume not invalidated (fail open for availability)
      );

      if (isInvalidatedInValkey) {
        // Update local cache to avoid future Valkey calls
        this.setLocal(sessionId, false);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[SessionCache] Valkey check error:", error);
      // On error, fall back to local cache result
      return cached ? !cached.isValid : false;
    }
  }

  /**
   * Set session validation status
   * For invalidations (isValid=false), also writes to Valkey for distribution
   */
  set(sessionId: string, isValid: boolean): void {
    this.setLocal(sessionId, isValid);

    // For invalidations, also write to Valkey for cross-instance propagation
    if (!isValid) {
      this.setValkeyInvalidation(sessionId).catch((error) => {
        console.error(
          "[SessionCache] Failed to set Valkey invalidation:",
          error,
        );
      });
    }
  }

  /**
   * Set session validation status with async Valkey write
   * Use this when you need to await the Valkey write
   */
  async setAsync(sessionId: string, isValid: boolean): Promise<void> {
    this.setLocal(sessionId, isValid);

    if (!isValid) {
      await this.setValkeyInvalidation(sessionId);
    }
  }

  /**
   * Set local cache entry
   */
  private setLocal(sessionId: string, isValid: boolean): void {
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(sessionId)) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(sessionId, {
      sessionId,
      isValid,
      expiresAt: now + this.TTL_MS,
      lastAccess: now,
    });
  }

  /**
   * Write invalidation to Valkey for distributed propagation
   */
  private async setValkeyInvalidation(sessionId: string): Promise<void> {
    try {
      await ensureConnected();
      const key = `${INVALIDATION_KEY_PREFIX}${sessionId}`;
      await withTimeout(
        sessionClient.setex(key, INVALIDATION_TTL_SECONDS, "1"),
        VALKEY_TIMEOUT_MS,
        "TIMEOUT",
      );
    } catch (error) {
      console.error("[SessionCache] Valkey setex error:", error);
      throw error;
    }
  }

  /**
   * Remove invalidation from Valkey (for session restoration if needed)
   */
  async clearInvalidation(sessionId: string): Promise<void> {
    this.cache.delete(sessionId);

    try {
      await ensureConnected();
      const key = `${INVALIDATION_KEY_PREFIX}${sessionId}`;
      await withTimeout(sessionClient.del(key), VALKEY_TIMEOUT_MS, 0);
    } catch (error) {
      console.error("[SessionCache] Valkey del error:", error);
    }
  }

  invalidate(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(sessionId);
      }
    }
  }

  private evictOldest(): void {
    let oldestSessionId: string | null = null;
    let oldestAccess = Infinity;

    for (const [sessionId, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestSessionId = sessionId;
      }
    }

    if (oldestSessionId !== null) {
      this.cache.delete(oldestSessionId);
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
    };
  }
}

export const sessionCache = new SessionCache();
