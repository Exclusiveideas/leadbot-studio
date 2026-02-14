/**
 * Centralized JWT secret management with validation.
 *
 * This module provides validated access to JWT secrets, ensuring:
 * 1. No hardcoded fallbacks that could be exploited
 * 2. Clear error messages when secrets are missing
 * 3. Consistent secret resolution across the application
 *
 * Secret resolution order (NextAuth convention):
 * 1. AUTH_SECRET (NextAuth v5 / Auth.js)
 * 2. NEXTAUTH_SECRET (NextAuth v4 compatibility)
 * 3. JWT_SECRET (custom JWT operations)
 */

let cachedSecret: string | null = null;
let cachedEncodedSecret: Uint8Array | null = null;

/**
 * Get the validated JWT secret string.
 * Use this for jsonwebtoken operations.
 *
 * @throws Error if no JWT secret is configured
 */
export function getJwtSecret(): string {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT secret is required. Set AUTH_SECRET, NEXTAUTH_SECRET, or JWT_SECRET in your environment variables.",
    );
  }

  cachedSecret = secret;
  return secret;
}

/**
 * Get the validated JWT secret as Uint8Array for jose library.
 * Use this for jose SignJWT/jwtVerify operations.
 *
 * @throws Error if no JWT secret is configured
 */
export function getEncodedJwtSecret(): Uint8Array {
  if (cachedEncodedSecret) {
    return cachedEncodedSecret;
  }

  const secret = getJwtSecret();
  cachedEncodedSecret = new TextEncoder().encode(secret);
  return cachedEncodedSecret;
}

/**
 * Get the NextAuth-compatible secret.
 * This follows the same resolution order as NextAuth.
 *
 * @throws Error if no secret is configured
 */
export function getNextAuthSecret(): string {
  return getJwtSecret();
}
