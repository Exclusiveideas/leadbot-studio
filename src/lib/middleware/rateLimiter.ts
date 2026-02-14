import { cache } from "@/lib/config/valkey";

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS_PER_WINDOW = 10;

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
};

type RateLimitData = {
  count: number;
  windowStart: number;
  resetAt: number;
};

/**
 * Generate a rate limit key for general API endpoints
 * Uses userId as the primary identifier
 */
function getRateLimitKey(userId: string, endpoint?: string): string {
  const suffix = endpoint ? `:${endpoint}` : "";
  return `api_ratelimit:${userId}${suffix}`;
}

/**
 * Check if a request is rate limited for general API endpoints
 * Uses Redis/Valkey for distributed rate limiting across server instances
 */
export async function checkRateLimit(
  userId: string,
  limit: number = DEFAULT_MAX_REQUESTS_PER_WINDOW,
  windowMs: number = DEFAULT_RATE_LIMIT_WINDOW_MS,
  endpoint?: string
): Promise<RateLimitResult> {
  const key = getRateLimitKey(userId, endpoint);
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);
  const windowStart = now - windowMs;

  // Get current rate limit data from cache
  const data = await cache.get(key) as RateLimitData | null;

  if (!data) {
    // No existing data, allow request and initialize counter
    const resetAt = now + windowMs;
    await cache.set(
      key,
      { count: 1, windowStart: now, resetAt },
      windowSeconds
    );

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Check if window has expired
  if (data.windowStart < windowStart) {
    // Window expired, reset counter
    const resetAt = now + windowMs;
    await cache.set(
      key,
      { count: 1, windowStart: now, resetAt },
      windowSeconds
    );

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Window still active, check count
  const retryAfterSeconds = Math.ceil((data.resetAt - now) / 1000);

  if (data.count >= limit) {
    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      reset: data.resetAt,
      retryAfterSeconds: Math.max(0, retryAfterSeconds),
    };
  }

  // Increment counter
  const newCount = data.count + 1;
  await cache.set(
    key,
    { count: newCount, windowStart: data.windowStart, resetAt: data.resetAt },
    Math.max(1, retryAfterSeconds)
  );

  return {
    success: true,
    limit,
    remaining: limit - newCount,
    reset: data.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit for a specific user (e.g., after successful operation)
 */
export async function resetRateLimit(
  userId: string,
  endpoint?: string
): Promise<void> {
  const key = getRateLimitKey(userId, endpoint);
  await cache.del(key);
}

/**
 * Build rate limit headers for HTTP response
 */
export function buildRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  };

  if (result.retryAfterSeconds > 0) {
    headers["Retry-After"] = result.retryAfterSeconds.toString();
  }

  return headers;
}

/**
 * Format rate limit error message for user display
 */
export function formatRateLimitError(result: RateLimitResult): string {
  const seconds = result.retryAfterSeconds;
  if (seconds <= 60) {
    return `Too many requests. Please try again in ${seconds} seconds.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many requests. Please try again in ${minutes} minutes.`;
}
