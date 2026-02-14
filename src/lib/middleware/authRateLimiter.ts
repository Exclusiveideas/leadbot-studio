import { cache, CACHE_TTL } from "@/lib/config/valkey";

/**
 * Rate limit configurations for auth endpoints
 * Uses stricter limits than general API rate limiting
 */
export const AUTH_RATE_LIMITS = {
  login: { maxAttempts: 5, windowSeconds: 300 }, // 5 attempts per 5 min
  signup: { maxAttempts: 3, windowSeconds: 600 }, // 3 attempts per 10 min
  ssoSignup: { maxAttempts: 3, windowSeconds: 600 }, // 3 attempts per 10 min
  resetPassword: { maxAttempts: 3, windowSeconds: 600 }, // 3 attempts per 10 min
  mfaSetup: { maxAttempts: 5, windowSeconds: 300 }, // 5 TOTP verification attempts per 5 min
  mfaGenerate: { maxAttempts: 10, windowSeconds: 600 }, // 10 QR code generations per 10 min
} as const;

export type AuthEndpoint = keyof typeof AUTH_RATE_LIMITS;

export type AuthRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

/**
 * Generate a rate limit key for auth endpoints
 * Uses IP + email (if available) for better tracking
 */
function getRateLimitKey(
  endpoint: AuthEndpoint,
  ip: string,
  email?: string,
): string {
  const identifier = email ? `${ip}:${email.toLowerCase()}` : ip;
  return `auth_ratelimit:${endpoint}:${identifier}`;
}

/**
 * Trusted proxy CIDRs (load balancers, CDNs, etc.)
 * Add your trusted proxy IPs/CIDRs here
 * Environment variable: TRUSTED_PROXIES (comma-separated)
 */
const TRUSTED_PROXIES = (process.env.TRUSTED_PROXIES || "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

// Common private network ranges that can be trusted as proxy IPs
const PRIVATE_NETWORK_PREFIXES = [
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "127.",
  "::1",
  "fc",
  "fd",
];

/**
 * Check if an IP is from a private network
 */
function isPrivateIp(ip: string): boolean {
  return PRIVATE_NETWORK_PREFIXES.some(
    (prefix) => ip.startsWith(prefix) || ip === "::1" || ip === "localhost",
  );
}

/**
 * Check if an IP is in the trusted proxy list
 */
function isTrustedProxy(ip: string): boolean {
  if (TRUSTED_PROXIES.length === 0) {
    // If no proxies configured, trust private IPs (common in cloud deployments)
    return isPrivateIp(ip);
  }
  return TRUSTED_PROXIES.includes(ip);
}

/**
 * Validate an IP address format (basic validation)
 */
function isValidIpFormat(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split(".").map(Number);
    return octets.every((o) => o >= 0 && o <= 255);
  }

  return ipv6Pattern.test(ip);
}

/**
 * Extract client IP address from request headers
 *
 * Security considerations:
 * - X-Forwarded-For can be spoofed by clients
 * - Only trust the rightmost IP that comes from a trusted proxy
 * - Fall back to X-Real-IP or "unknown" if no valid IP found
 *
 * X-Forwarded-For format: client, proxy1, proxy2, ...
 * We traverse from right (most trusted) to left (least trusted)
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());

    // Find all valid IPs
    const validIps = ips.filter((ip) => isValidIpFormat(ip));

    if (validIps.length === 0) {
      // No valid IPs in header, fall through to other headers
    } else if (validIps.length === 1) {
      // Only one valid IP, return it
      return validIps[0];
    } else {
      // Multiple valid IPs - traverse from right to left
      // The rightmost IPs are added by trusted proxies, so we look for
      // the first non-trusted IP from the right (that's the actual client)
      for (let i = validIps.length - 1; i >= 0; i--) {
        const ip = validIps[i];

        if (i === 0) {
          // Leftmost IP is the client
          return ip;
        }

        if (!isTrustedProxy(ip)) {
          // First non-trusted IP from the right is the client
          return ip;
        }
      }

      // All IPs are trusted, return leftmost
      return validIps[0];
    }
  }

  // Fallback to X-Real-IP header
  const realIp = headers.get("x-real-ip");
  if (realIp && isValidIpFormat(realIp.trim())) {
    return realIp.trim();
  }

  // Check CF-Connecting-IP for Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && isValidIpFormat(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  return "unknown";
}

/**
 * Check if a request is rate limited for auth endpoints
 * Uses Redis/Valkey for distributed rate limiting
 */
export async function checkAuthRateLimit(
  endpoint: AuthEndpoint,
  ip: string,
  email?: string,
): Promise<AuthRateLimitResult> {
  const config = AUTH_RATE_LIMITS[endpoint];
  const key = getRateLimitKey(endpoint, ip, email);

  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  // Get current rate limit data from cache
  const data = await cache.get(key);

  if (!data) {
    // No existing data, allow request and initialize counter
    const resetAt = new Date(now + config.windowSeconds * 1000);
    await cache.set(
      key,
      { count: 1, windowStart: now, resetAt: resetAt.getTime() },
      config.windowSeconds,
    );

    return {
      allowed: true,
      limit: config.maxAttempts,
      remaining: config.maxAttempts - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Check if window has expired
  if (data.windowStart < windowStart) {
    // Window expired, reset counter
    const resetAt = new Date(now + config.windowSeconds * 1000);
    await cache.set(
      key,
      { count: 1, windowStart: now, resetAt: resetAt.getTime() },
      config.windowSeconds,
    );

    return {
      allowed: true,
      limit: config.maxAttempts,
      remaining: config.maxAttempts - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Window still active, check count
  const resetAt = new Date(data.resetAt);
  const retryAfterSeconds = Math.ceil((data.resetAt - now) / 1000);

  if (data.count >= config.maxAttempts) {
    // Rate limited
    return {
      allowed: false,
      limit: config.maxAttempts,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(0, retryAfterSeconds),
    };
  }

  // Increment counter
  const newCount = data.count + 1;
  await cache.set(
    key,
    { count: newCount, windowStart: data.windowStart, resetAt: data.resetAt },
    Math.max(1, retryAfterSeconds),
  );

  return {
    allowed: true,
    limit: config.maxAttempts,
    remaining: config.maxAttempts - newCount,
    resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit for a specific identifier (e.g., after successful login)
 */
export async function resetAuthRateLimit(
  endpoint: AuthEndpoint,
  ip: string,
  email?: string,
): Promise<void> {
  const key = getRateLimitKey(endpoint, ip, email);
  await cache.del(key);
}

/**
 * Build rate limit headers for HTTP response
 */
export function buildRateLimitHeaders(
  result: AuthRateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
    ...(result.retryAfterSeconds > 0 && {
      "Retry-After": result.retryAfterSeconds.toString(),
    }),
  };
}

/**
 * Format rate limit error message for user display
 */
export function formatRateLimitError(result: AuthRateLimitResult): string {
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  if (minutes <= 1) {
    return `Too many attempts. Please try again in ${result.retryAfterSeconds} seconds.`;
  }
  return `Too many attempts. Please try again in ${minutes} minutes.`;
}
