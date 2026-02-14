/**
 * Attachment Cache Manager
 *
 * In-memory cache for file attachments to avoid re-downloading from S3 on every message.
 * - Per-session storage (attachments don't mix between sessions)
 * - Individual attachment TTL: 5 minutes (configurable)
 * - Session cache TTL: 10 minutes (configurable)
 * - Automatic cleanup of expired items
 * - Fast access with Map-based storage
 */

export interface CachedAttachment {
  s3Key: string;
  fileName: string;
  mimeType: string;
  size: number;
  base64: string;
  cachedAt: number;
  expiresAt: number;
}

interface SessionCache {
  sessionId: string;
  attachments: Map<string, CachedAttachment>;
  createdAt: number;
  expiresAt: number;
}

export interface AttachmentCacheConfig {
  attachmentTTL?: number;
  sessionTTL?: number;
}

export class AttachmentCacheManager {
  private static readonly DEFAULT_ATTACHMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
  private static instance: AttachmentCacheManager;

  private caches: Map<string, SessionCache> = new Map();
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private attachmentTTL: number;
  private sessionTTL: number;

  private constructor(config?: AttachmentCacheConfig) {
    this.attachmentTTL =
      config?.attachmentTTL ?? AttachmentCacheManager.DEFAULT_ATTACHMENT_TTL_MS;
    this.sessionTTL =
      config?.sessionTTL ?? AttachmentCacheManager.DEFAULT_SESSION_TTL_MS;
    this.startCleanupInterval();
  }

  static getInstance(config?: AttachmentCacheConfig): AttachmentCacheManager {
    if (!AttachmentCacheManager.instance) {
      AttachmentCacheManager.instance = new AttachmentCacheManager(config);
    }
    return AttachmentCacheManager.instance;
  }

  /**
   * Get or create cache for a session
   */
  private getSessionCache(sessionId: string): SessionCache {
    let cache = this.caches.get(sessionId);

    if (!cache) {
      const now = Date.now();
      cache = {
        sessionId,
        attachments: new Map(),
        createdAt: now,
        expiresAt: now + this.sessionTTL,
      };
      this.caches.set(sessionId, cache);
    } else {
      // Extend session TTL on access
      cache.expiresAt = Date.now() + this.sessionTTL;
    }

    return cache;
  }

  /**
   * Add attachment to cache
   */
  addAttachment(
    sessionId: string,
    s3Key: string,
    fileName: string,
    mimeType: string,
    size: number,
    base64: string,
  ): void {
    const cache = this.getSessionCache(sessionId);
    const now = Date.now();

    const cachedAttachment: CachedAttachment = {
      s3Key,
      fileName,
      mimeType,
      size,
      base64,
      cachedAt: now,
      expiresAt: now + this.attachmentTTL,
    };

    cache.attachments.set(s3Key, cachedAttachment);
  }

  /**
   * Get attachment from cache if it exists and is not expired
   */
  getAttachment(
    sessionId: string,
    s3Key: string,
  ): CachedAttachment | undefined {
    const cache = this.caches.get(sessionId);
    if (!cache) {
      return undefined;
    }

    const attachment = cache.attachments.get(s3Key);
    if (!attachment) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > attachment.expiresAt) {
      cache.attachments.delete(s3Key);
      return undefined;
    }

    return attachment;
  }

  /**
   * Get multiple attachments from cache
   * Returns: { cached: CachedAttachment[], missing: string[] }
   */
  getAttachments(
    sessionId: string,
    s3Keys: string[],
  ): {
    cached: CachedAttachment[];
    missing: string[];
  } {
    const cached: CachedAttachment[] = [];
    const missing: string[] = [];

    for (const s3Key of s3Keys) {
      const attachment = this.getAttachment(sessionId, s3Key);
      if (attachment) {
        cached.push(attachment);
      } else {
        missing.push(s3Key);
      }
    }

    return { cached, missing };
  }

  /**
   * Check if attachment exists in cache and is not expired
   */
  hasAttachment(sessionId: string, s3Key: string): boolean {
    return this.getAttachment(sessionId, s3Key) !== undefined;
  }

  /**
   * Clear cache for a specific session
   */
  clearSession(sessionId: string): void {
    this.caches.delete(sessionId);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(sessionId?: string): {
    sessionCount: number;
    totalAttachments: number;
    sessionStats?: {
      sessionId: string;
      attachmentCount: number;
      createdAt: Date;
      expiresAt: Date;
      attachments: Array<{
        s3Key: string;
        fileName: string;
        size: number;
        cachedAt: Date;
        expiresAt: Date;
      }>;
    };
  } {
    const stats = {
      sessionCount: this.caches.size,
      totalAttachments: 0,
      sessionStats: undefined as any,
    };

    for (const cache of this.caches.values()) {
      stats.totalAttachments += cache.attachments.size;
    }

    if (sessionId) {
      const cache = this.caches.get(sessionId);
      if (cache) {
        stats.sessionStats = {
          sessionId: cache.sessionId,
          attachmentCount: cache.attachments.size,
          createdAt: new Date(cache.createdAt),
          expiresAt: new Date(cache.expiresAt),
          attachments: Array.from(cache.attachments.values()).map((att) => ({
            s3Key: att.s3Key,
            fileName: att.fileName,
            size: att.size,
            cachedAt: new Date(att.cachedAt),
            expiresAt: new Date(att.expiresAt),
          })),
        };
      }
    }

    return stats;
  }

  /**
   * Cleanup expired attachments and sessions
   */
  private cleanup(): void {
    const now = Date.now();
    let sessionsRemoved = 0;
    let attachmentsRemoved = 0;

    // Remove expired sessions
    for (const [sessionId, cache] of this.caches.entries()) {
      if (now > cache.expiresAt) {
        this.caches.delete(sessionId);
        sessionsRemoved++;
        continue;
      }

      // Remove expired attachments within session
      for (const [s3Key, attachment] of cache.attachments.entries()) {
        if (now > attachment.expiresAt) {
          cache.attachments.delete(s3Key);
          attachmentsRemoved++;
        }
      }

      // Remove session if no attachments left
      if (cache.attachments.size === 0) {
        this.caches.delete(sessionId);
        sessionsRemoved++;
      }
    }

    if (sessionsRemoved > 0 || attachmentsRemoved > 0) {
      console.log(
        `[AttachmentCache] Cleanup: removed ${sessionsRemoved} sessions and ${attachmentsRemoved} attachments`,
      );
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      return; // Already started
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, AttachmentCacheManager.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop automatic cleanup interval (useful for testing)
   */
  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get time until attachment expires (in milliseconds)
   */
  getTimeUntilExpiry(sessionId: string, s3Key: string): number | undefined {
    const attachment = this.getAttachment(sessionId, s3Key);
    if (!attachment) {
      return undefined;
    }

    return Math.max(0, attachment.expiresAt - Date.now());
  }

  /**
   * Get configuration values
   */
  getConfig(): {
    attachmentTTL: number;
    sessionTTL: number;
  } {
    return {
      attachmentTTL: this.attachmentTTL,
      sessionTTL: this.sessionTTL,
    };
  }
}

// Export singleton instance with default configuration
export const attachmentCache = AttachmentCacheManager.getInstance();
