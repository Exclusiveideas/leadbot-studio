import { cache, CACHE_TTL } from "@/lib/config/valkey";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export class CacheService {
  /**
   * Generic cache get method
   */
  static async get(key: string): Promise<any | null> {
    try {
      return await cache.get(key);
    } catch (error) {
      console.error(`[CacheService] Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Batch get multiple cache keys at once (more efficient than separate calls)
   */
  static async getMany(keys: string[]): Promise<Record<string, any>> {
    try {
      const results: Record<string, any> = {};

      // Use Promise.all for parallel fetching
      const values = await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await cache.get(key);
            return { key, value };
          } catch (error) {
            console.error(
              `[CacheService] Failed to get cache key ${key}:`,
              error,
            );
            return { key, value: null };
          }
        }),
      );

      // Build results object
      values.forEach(({ key, value }) => {
        if (value !== null) {
          results[key] = value;
        }
      });

      return results;
    } catch (error) {
      console.error(`[CacheService] Failed to get multiple cache keys:`, error);
      return {};
    }
  }

  /**
   * Generic cache set method
   */
  static async set(
    key: string,
    value: any,
    ttl: number = CACHE_TTL.SEARCH_RESULTS,
  ): Promise<void> {
    try {
      await cache.set(key, value, ttl);
    } catch (error) {
      console.error(`[CacheService] Failed to set cache key ${key}:`, error);
      // Continue without caching - don't throw error
    }
  }

  /**
   * Generic cache delete method
   */
  static async delete(key: string): Promise<void> {
    try {
      await cache.invalidatePattern(key);
    } catch (error) {
      console.error(`[CacheService] Failed to delete cache key ${key}:`, error);
    }
  }

  /**
   * Cache document metadata
   */
  static async cacheDocumentMetadata(
    documentId: string,
    metadata: any,
  ): Promise<void> {
    try {
      const cacheKey = `document:metadata:${documentId}`;
      await cache.set(cacheKey, metadata, CACHE_TTL.DOCUMENT_METADATA);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache document metadata for ${documentId}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Cache signed URL for document downloads
   */
  static async cacheSignedUrl(
    documentId: string,
    signedUrl: string,
    ttl: number = 1800,
  ): Promise<void> {
    try {
      const cacheKey = `document:signedUrl:${documentId}`;
      await cache.set(cacheKey, signedUrl, ttl);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache signed URL for ${documentId}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Get cached signed URL for document
   */
  static async getCachedSignedUrl(documentId: string): Promise<string | null> {
    try {
      const cacheKey = `document:signedUrl:${documentId}`;
      return await cache.get(cacheKey);
    } catch (error) {
      console.error(
        `[CacheService] Failed to get cached signed URL for ${documentId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get cached document metadata
   */
  static async getCachedDocumentMetadata(
    documentId: string,
  ): Promise<any | null> {
    const cacheKey = `document:metadata:${documentId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Batch get document metadata and signed URL together (more efficient)
   */
  static async getCachedDocumentWithUrl(documentId: string): Promise<{
    metadata: any | null;
    signedUrl: string | null;
  }> {
    const keys = [
      `document:metadata:${documentId}`,
      `document:signedUrl:${documentId}`,
    ];

    const results = await this.getMany(keys);

    return {
      metadata: results[`document:metadata:${documentId}`] || null,
      signedUrl: results[`document:signedUrl:${documentId}`] || null,
    };
  }

  /**
   * Cache user permissions
   */
  static async cacheUserPermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    try {
      const cacheKey = `user:permissions:${userId}`;
      await cache.set(cacheKey, permissions, CACHE_TTL.USER_PERMISSIONS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache user permissions for ${userId}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Get cached user permissions
   */
  static async getCachedUserPermissions(
    userId: string,
  ): Promise<string[] | null> {
    const cacheKey = `user:permissions:${userId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Cache case access permission
   */
  static async cacheCaseAccess(
    userId: string,
    caseId: string,
    hasAccess: boolean,
  ): Promise<void> {
    try {
      const cacheKey = `case:access:${userId}:${caseId}`;
      await cache.set(cacheKey, hasAccess, CACHE_TTL.USER_PERMISSIONS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache case access for ${userId}:${caseId}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Get cached case access permission
   */
  static async getCachedCaseAccess(
    userId: string,
    caseId: string,
  ): Promise<boolean | null> {
    const cacheKey = `case:access:${userId}:${caseId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Invalidate case access cache for a specific user and case
   */
  static async invalidateCaseAccess(
    userId: string,
    caseId: string,
  ): Promise<void> {
    const cacheKey = `case:access:${userId}:${caseId}`;
    await cache.del(cacheKey);
  }

  /**
   * Cache search results
   */
  static async cacheSearchResults(
    searchHash: string,
    results: any,
  ): Promise<void> {
    try {
      const cacheKey = `search:${searchHash}`;
      await cache.set(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache search results for ${searchHash}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Get cached search results
   */
  static async getCachedSearchResults(searchHash: string): Promise<any | null> {
    const cacheKey = `search:${searchHash}`;
    return await cache.get(cacheKey);
  }

  /**
   * Cache case documents list
   */
  static async cacheCaseDocuments(
    caseId: string,
    filters: any,
    documents: any,
  ): Promise<void> {
    try {
      const filterHash = this.hashObject(filters);
      const cacheKey = `case:${caseId}:documents:${filterHash}`;
      await cache.set(cacheKey, documents, CACHE_TTL.SEARCH_RESULTS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache case documents for ${caseId}:`,
        error,
      );
      // Continue without caching - don't throw error
    }
  }

  /**
   * Get cached case documents
   */
  static async getCachedCaseDocuments(
    caseId: string,
    filters: any,
  ): Promise<any | null> {
    const filterHash = this.hashObject(filters);
    const cacheKey = `case:${caseId}:documents:${filterHash}`;
    return await cache.get(cacheKey);
  }

  /**
   * Invalidate document-related caches
   */
  static async invalidateDocumentCaches(
    documentId: string,
    caseId?: string,
  ): Promise<void> {
    const patterns = [
      `document:${documentId}*`,
      `document:metadata:${documentId}`,
      `tika:${documentId}`,
      `textract:${documentId}`,
      `nlp:${documentId}`,
    ];

    if (caseId) {
      patterns.push(`case:${caseId}:documents:*`);
    }

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
  }

  /**
   * Invalidate user-related caches
   */
  static async invalidateUserCaches(userId: string): Promise<void> {
    const patterns = [`user:permissions:${userId}`, `user:${userId}:*`];

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
  }

  /**
   * Invalidate case-related caches
   */
  static async invalidateCaseCaches(caseId: string): Promise<void> {
    const patterns = [`case:${caseId}:*`];

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
  }

  /**
   * Cache frequently accessed documents
   */
  static async warmDocumentCache(caseId: string): Promise<void> {
    try {
      // Get most recently accessed documents for the case
      const recentDocuments = await prisma.document.findMany({
        where: { caseId },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          status: true,
          documentType: true,
          confidenceScore: true,
          piiDetected: true,
          createdAt: true,
        },
      });

      // Cache each document's metadata
      const cachePromises = recentDocuments.map((doc) =>
        this.cacheDocumentMetadata(doc.id, doc),
      );

      await Promise.all(cachePromises);
      logger.debug(
        `Warmed cache for ${recentDocuments.length} documents in case ${caseId}`,
      );
    } catch (error) {
      console.error("[Cache] Error warming document cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      // This would require Redis INFO command access
      // For now, return basic stats
      return {
        totalKeys: 0,
        memoryUsage: "N/A",
      };
    } catch (error) {
      console.error("[Cache] Error getting cache stats:", error);
      return {
        totalKeys: 0,
        memoryUsage: "Error",
      };
    }
  }

  /**
   * Clear all caches (use with caution)
   */
  static async clearAllCaches(): Promise<void> {
    logger.debug("Clearing all caches");
    await cache.invalidatePattern("*");
  }

  /**
   * Dashboard-specific cache methods for optimal performance
   */

  /**
   * Cache dashboard data with optimized TTL
   */
  static async cacheDashboardData(
    userId: string,
    data: any,
    organizationId?: string | null,
  ): Promise<void> {
    try {
      const cacheKey = organizationId
        ? `dashboard:org:${organizationId}`
        : `dashboard:user:${userId}`;
      await cache.set(cacheKey, data, CACHE_TTL.DASHBOARD_DATA);
      logger.debug(
        `Dashboard data cached for ${organizationId ? `organization ${organizationId}` : `user ${userId}`}`,
      );
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache dashboard data for ${userId}:`,
        error,
      );
    }
  }

  /**
   * Get cached dashboard data
   * Cache key includes organizationId for org-scoped data to prevent data leakage
   */
  static async getCachedDashboardData(
    userId: string,
    organizationId?: string | null,
  ): Promise<any | null> {
    const cacheKey = organizationId
      ? `dashboard:org:${organizationId}`
      : `dashboard:user:${userId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Cache system statistics with longer TTL
   */
  static async cacheSystemStats(data: any): Promise<void> {
    try {
      const cacheKey = "system:stats";
      await cache.set(cacheKey, data, CACHE_TTL.SYSTEM_STATS);
      logger.debug("System stats cached");
    } catch (error) {
      console.error("[CacheService] Failed to cache system stats:", error);
    }
  }

  /**
   * Get cached system statistics
   */
  static async getCachedSystemStats(): Promise<any | null> {
    return await cache.get("system:stats");
  }

  /**
   * Cache user's cases data
   */
  static async cacheCasesData(userId: string, data: any): Promise<void> {
    try {
      const cacheKey = `cases:${userId}`;
      await cache.set(cacheKey, data, CACHE_TTL.CASES_DATA);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache cases data for ${userId}:`,
        error,
      );
    }
  }

  /**
   * Get cached cases data
   */
  static async getCachedCasesData(userId: string): Promise<any | null> {
    const cacheKey = `cases:${userId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Cache user's audit logs (activity feed)
   */
  static async cacheAuditLogs(userId: string, data: any): Promise<void> {
    try {
      const cacheKey = `audit:${userId}`;
      await cache.set(cacheKey, data, CACHE_TTL.AUDIT_LOGS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache audit logs for ${userId}:`,
        error,
      );
    }
  }

  /**
   * Get cached audit logs
   */
  static async getCachedAuditLogs(userId: string): Promise<any | null> {
    const cacheKey = `audit:${userId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Invalidate all dashboard-related caches for a user
   */
  static async invalidateDashboardCaches(userId: string): Promise<void> {
    const patterns = [
      `dashboard:${userId}`,
      `cases:${userId}`,
      `audit:${userId}`,
      "system:stats", // System stats affect all users
    ];

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
    logger.debug(`Invalidated dashboard caches for user ${userId}`);
  }

  /**
   * Real-time cache invalidation for document updates
   * Triggered by Supabase real-time events
   */
  static async invalidateDocumentOnUpdate(
    documentId: string,
    caseId: string,
    changes: any,
  ): Promise<void> {
    logger.debug(`Real-time invalidation for document ${documentId}`, changes);

    const patterns = [
      `document:metadata:${documentId}`,
      `document:${documentId}*`,
      `case:${caseId}:documents:*`,
      `search:*`, // Invalidate all search results as they might contain this document
    ];

    // If status changed, also invalidate processing-related caches
    if (
      changes.status ||
      changes.extractedText ||
      changes.processingCompletedAt
    ) {
      patterns.push(
        `tika:${documentId}`,
        `textract:${documentId}`,
        `nlp:${documentId}`,
      );
    }

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
    logger.debug(
      `Invalidated ${patterns.length} cache patterns for document update`,
    );
  }

  /**
   * Force refresh document metadata from database
   * Used when real-time events indicate stale cache
   */
  static async refreshDocumentMetadata(
    documentId: string,
  ): Promise<any | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          cases: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              userId: true,
            },
          },
        },
      });

      if (document) {
        // Update cache with fresh data
        await this.cacheDocumentMetadata(documentId, document);
        logger.debug(`Refreshed metadata for document ${documentId}`);
        return document;
      }

      return null;
    } catch (error) {
      console.error(
        `[Cache] Error refreshing document metadata for ${documentId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Bulk invalidate documents by case ID
   * Useful when multiple documents in a case are updated
   */
  static async bulkInvalidateDocuments(
    caseId: string,
    documentIds: string[],
  ): Promise<void> {
    logger.debug(
      `Bulk invalidation for case ${caseId}, documents:`,
      documentIds,
    );

    const patterns = [
      `case:${caseId}:documents:*`,
      `search:*`, // Search results might contain any of these documents
      ...documentIds.flatMap((docId) => [
        `document:metadata:${docId}`,
        `document:${docId}*`,
        `tika:${docId}`,
        `textract:${docId}`,
        `nlp:${docId}`,
      ]),
    ];

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
    logger.debug(`Bulk invalidated ${patterns.length} cache patterns`);
  }

  /**
   * Smart cache refresh based on document processing status
   * Determines what needs to be refreshed based on the document state
   */
  static async smartRefreshDocument(
    documentId: string,
    previousStatus?: string,
    newStatus?: string,
  ): Promise<void> {
    logger.debug(
      `Smart refresh for document ${documentId}: ${previousStatus} -> ${newStatus}`,
    );

    // Always invalidate basic document cache
    await cache.invalidatePattern(`document:metadata:${documentId}`);

    // Get fresh document data
    const document = await this.refreshDocumentMetadata(documentId);
    if (!document) return;

    // Invalidate case documents list
    await cache.invalidatePattern(`case:${document.caseId}:documents:*`);

    // Status-specific invalidations
    if (newStatus === "COMPLETED" || newStatus?.includes("FAILED")) {
      // Processing completed/failed - invalidate processing-related caches
      await Promise.all([
        cache.invalidatePattern(`tika:${documentId}`),
        cache.invalidatePattern(`textract:${documentId}`),
        cache.invalidatePattern(`nlp:${documentId}`),
        cache.invalidatePattern(`search:*`), // Search results might now include extracted text
      ]);
    }

    logger.debug(`Smart refresh completed for document ${documentId}`);
  }

  /**
   * Cache document generation template
   */
  static async cacheTemplate(templateId: string, template: any): Promise<void> {
    try {
      const cacheKey = `template:${templateId}`;
      await cache.set(cacheKey, template, CACHE_TTL.USER_PERMISSIONS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache template ${templateId}:`,
        error,
      );
    }
  }

  /**
   * Get cached template
   */
  static async getCachedTemplate(templateId: string): Promise<any | null> {
    const cacheKey = `template:${templateId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Cache template list for user
   */
  static async cacheTemplateList(
    userId: string,
    templates: any[],
  ): Promise<void> {
    try {
      const cacheKey = `templates:${userId}`;
      await cache.set(cacheKey, templates, CACHE_TTL.USER_PERMISSIONS);
    } catch (error) {
      console.error(
        `[CacheService] Failed to cache template list for ${userId}:`,
        error,
      );
    }
  }

  /**
   * Get cached template list
   */
  static async getCachedTemplateList(userId: string): Promise<any[] | null> {
    const cacheKey = `templates:${userId}`;
    return await cache.get(cacheKey);
  }

  /**
   * Invalidate template caches
   */
  static async invalidateTemplateCaches(templateId?: string): Promise<void> {
    const patterns = templateId
      ? [`template:${templateId}`, "templates:*"]
      : ["template:*", "templates:*"];

    await Promise.all(
      patterns.map((pattern) => cache.invalidatePattern(pattern)),
    );
  }

  /**
   * Utility function to hash objects for cache keys
   */
  public static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Invalidate chatbot conversation cache
   *
   * Clears cached conversations for a specific chatbot.
   * Call this when chatbot knowledge base is updated.
   *
   * @param chatbotId Chatbot ID
   */
  static async invalidateChatbotConversations(
    chatbotId: string,
  ): Promise<void> {
    try {
      const patterns = [
        `chatbot:${chatbotId}:*`, // All conversations for this chatbot
        `chatbot:conversation:${chatbotId}:*`, // Conversation-specific caches
      ];

      await Promise.all(
        patterns.map((pattern) => cache.invalidatePattern(pattern)),
      );
      logger.debug(`Invalidated conversation caches for chatbot ${chatbotId}`);
    } catch (error) {
      console.error(
        `[CacheService] Failed to invalidate chatbot conversations for ${chatbotId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate specific chatbot conversation
   *
   * @param conversationId Conversation ID
   */
  static async invalidateChatbotConversation(
    conversationId: string,
  ): Promise<void> {
    try {
      const pattern = `chatbot:conversation:${conversationId}*`;
      await cache.invalidatePattern(pattern);
      logger.debug(`Invalidated cache for conversation ${conversationId}`);
    } catch (error) {
      console.error(
        `[CacheService] Failed to invalidate conversation ${conversationId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate chatbot knowledge base cache
   *
   * Call this when knowledge base items are added, updated, or deleted.
   * This will force all conversations to perform fresh RAG searches.
   *
   * @param chatbotId Chatbot ID
   */
  static async invalidateChatbotKnowledge(chatbotId: string): Promise<void> {
    try {
      // Invalidate all conversation caches for this chatbot
      // Since knowledge base changed, all cached RAG results are stale
      await this.invalidateChatbotConversations(chatbotId);

      logger.info(
        `Invalidated knowledge base cache for chatbot ${chatbotId} - all RAG caches cleared`,
      );
    } catch (error) {
      console.error(
        `[CacheService] Failed to invalidate chatbot knowledge for ${chatbotId}:`,
        error,
      );
    }
  }
}

// Enhanced middleware for caching frequently accessed endpoints
export function cacheMiddleware(ttl: number = CACHE_TTL.SEARCH_RESULTS) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create cache key from URL and query params
    const cacheKey = `api:${req.originalUrl}:${CacheService.hashObject(req.query)}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${req.originalUrl}`);
        return res.json(cached);
      }
    } catch (error) {
      console.error("[Cache] Middleware error:", error);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (data: any) {
      // Only cache successful responses
      if (data.success) {
        cache.set(cacheKey, data, ttl).catch((error) => {
          console.error("[Cache] Failed to cache response:", error);
        });
      }
      return originalJson.call(this, data);
    };

    next();
  };
}
