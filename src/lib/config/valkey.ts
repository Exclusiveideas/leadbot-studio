import Redis from "ioredis";

// Valkey connection configuration for client-side API routes
const getValkeyConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const host = process.env.VALKEY_HOST || "localhost";
  const port = parseInt(process.env.VALKEY_PORT || "6379");
  const password = process.env.VALKEY_PASSWORD || undefined;

  const config = {
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: isProduction ? 15000 : 10000, // Longer timeout for remote connections
    retryDelayOnFailover: 100,
    lazyConnect: true, // Don't connect immediately
    keepAlive: 30000, // Keep connection alive for remote instances
    family: 4, // Force IPv4 for better AWS EC2 compatibility
    // Additional settings for remote Redis instances
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300,
    enableOfflineQueue: false, // Fail fast instead of queuing when disconnected
  };

  // Add warning if connecting to localhost in production
  if (isProduction && host === "localhost") {
    console.warn(
      "[Valkey Client] WARNING: Using localhost in production environment. Consider using a remote Valkey instance.",
    );
  }

  return config;
};

const valkeyConfig = getValkeyConfig();

// Create separate connections for different purposes
export const cacheClient = new Redis({
  ...valkeyConfig,
  db: 0, // Database 0 for caching
  keyPrefix: "cache:",
});

export const sessionClient = new Redis({
  ...valkeyConfig,
  db: 1, // Database 1 for sessions
  keyPrefix: "session:",
});

// Connection management
let cacheConnected = false;
let sessionConnected = false;
let connectionPromise: Promise<void> | null = null;

// Ensure clients are connected before use
export async function ensureConnected(): Promise<void> {
  // If already connecting, wait for that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // If already connected, return immediately
  if (cacheConnected && sessionConnected) {
    return;
  }

  // Start connection process
  connectionPromise = (async () => {
    try {
      // Connect cache client if not connected
      if (!cacheConnected && cacheClient.status === "wait") {
        await cacheClient.connect();
        cacheConnected = true;
      } else if (cacheConnected) {
      }

      // Connect session client if not connected
      if (!sessionConnected && sessionClient.status === "wait") {
        await sessionClient.connect();
        sessionConnected = true;
      } else if (sessionConnected) {
      }
    } catch (error) {
      console.error("[Valkey Connection Monitor] Connection error:", error);
      // Reset connection state on error
      cacheConnected = false;
      sessionConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

// Error handling for all clients
const clients = [
  { name: "Cache", client: cacheClient },
  { name: "Session", client: sessionClient },
];

clients.forEach(({ name, client }) => {
  client.on("error", (err) => {
    console.error(`[${name} Client] Valkey connection error:`, err.message);
    // Log additional context for remote connection errors
    if (
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ETIMEDOUT")
    ) {
      console.error(
        `[${name} Client] Network connectivity issue. Check if Valkey instance is accessible at ${valkeyConfig.host}:${valkeyConfig.port}`,
      );
    }
    // Mark as disconnected on error
    if (name === "Cache") cacheConnected = false;
    if (name === "Session") sessionConnected = false;
  });

  client.on("connect", () => {
    // Mark as connected
    if (name === "Cache") cacheConnected = true;
    if (name === "Session") sessionConnected = true;
  });

  client.on("ready", () => {
    // Mark as connected when ready
    if (name === "Cache") cacheConnected = true;
    if (name === "Session") sessionConnected = true;
  });

  client.on("close", () => {
    console.warn(`[${name} Client] Valkey connection closed`);
    // Mark as disconnected
    if (name === "Cache") cacheConnected = false;
    if (name === "Session") sessionConnected = false;
  });

  client.on("reconnecting", (_ms: number) => {});

  client.on("end", () => {
    console.warn(`[${name} Client] Valkey connection ended`);
    // Mark as disconnected
    if (name === "Cache") cacheConnected = false;
    if (name === "Session") sessionConnected = false;
  });
});

// Timeout constant for cache operations (ms)
const CACHE_OPERATION_TIMEOUT = 200; // Fast-fail to prevent blocking transactions

/**
 * Wraps a promise with a timeout to prevent long waits on slow/unavailable cache
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

// Cache helper functions
export const cache = {
  async get(key: string): Promise<any> {
    try {
      const operation = async () => {
        await ensureConnected();
        const data = await cacheClient.get(key);
        return data ? JSON.parse(data) : null;
      };
      return await withTimeout(operation(), CACHE_OPERATION_TIMEOUT, null);
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const operation = async () => {
        await ensureConnected();
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          await cacheClient.setex(key, ttlSeconds, serialized);
        } else {
          await cacheClient.set(key, serialized);
        }
        return true;
      };
      return await withTimeout(operation(), CACHE_OPERATION_TIMEOUT, false);
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      const operation = async () => {
        await ensureConnected();
        await cacheClient.del(key);
        return true;
      };
      return await withTimeout(operation(), CACHE_OPERATION_TIMEOUT, false);
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  },

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const operation = async () => {
        await ensureConnected();
        const keys = await cacheClient.keys(`cache:${pattern}`);
        if (keys.length === 0) return 0;

        // Remove the prefix before deleting
        const keysToDelete = keys.map((key) => key.replace("cache:", ""));
        return await cacheClient.del(...keysToDelete);
      };
      return await withTimeout(operation(), CACHE_OPERATION_TIMEOUT, 0);
    } catch (error) {
      console.error("Cache invalidate pattern error:", error);
      return 0;
    }
  },
};

// TTL constants for different cache types
export const CACHE_TTL = {
  DOCUMENT_METADATA: 3600, // 1 hour
  USER_PERMISSIONS: 900, // 15 minutes
  PROCESSING_RESULTS: 86400, // 24 hours
  SEARCH_RESULTS: 300, // 5 minutes
  SESSION: 7200, // 2 hours
  // Dashboard-specific cache TTLs
  DASHBOARD_DATA: 120, // 2 minutes - balanced between freshness and performance
  SYSTEM_STATS: 300, // 5 minutes - system data changes less frequently
  CASES_DATA: 180, // 3 minutes - case data moderately dynamic
  AUDIT_LOGS: 60, // 1 minute - activity feed should be fairly fresh
};

// Connection health check utility
export const healthCheck = {
  async checkConnection(): Promise<{
    cache: boolean;
    session: boolean;
    latency: { cache: number; session: number };
    error?: string;
  }> {
    try {
      const start = Date.now();

      // Ensure connection before testing
      await ensureConnected();

      // Test cache connection
      const cacheStart = Date.now();
      await cacheClient.ping();
      const cacheLatency = Date.now() - cacheStart;

      // Test session connection
      const sessionStart = Date.now();
      await sessionClient.ping();
      const sessionLatency = Date.now() - sessionStart;

      const total = Date.now() - start;
      console.log(
        `[Valkey Health] All connections healthy. Total check time: ${total}ms`,
      );

      return {
        cache: true,
        session: true,
        latency: {
          cache: cacheLatency,
          session: sessionLatency,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[Valkey Health] Connection check failed:", errorMsg);

      return {
        cache: false,
        session: false,
        latency: { cache: -1, session: -1 },
        error: errorMsg,
      };
    }
  },

  async getConnectionInfo(): Promise<{
    host: string;
    port: number;
    hasPassword: boolean;
    status: string;
  }> {
    try {
      await ensureConnected();
      const info = await cacheClient.info("server");
      return {
        host: valkeyConfig.host,
        port: valkeyConfig.port,
        hasPassword: !!valkeyConfig.password,
        status: info ? "connected" : "unknown",
      };
    } catch (error) {
      return {
        host: valkeyConfig.host,
        port: valkeyConfig.port,
        hasPassword: !!valkeyConfig.password,
        status: "error",
      };
    }
  },
};
