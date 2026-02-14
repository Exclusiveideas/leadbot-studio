/**
 * Security Constants
 *
 * Shared constants for security-related validations across the application.
 */

/**
 * Maximum allowed length for user prompts/messages to AI endpoints.
 * This limit is enforced both at the API validation layer AND in the
 * prompt injection detector to prevent:
 * - DoS attacks via extremely long prompts
 * - Increased costs from processing large prompts
 * - Potential injection attacks hidden after truncation points
 */
export const MAX_PROMPT_LENGTH = 10000;

/**
 * Maximum allowed length for query strings (stricter limit for search queries).
 * Used by QuerySecurityValidator for search-specific endpoints.
 */
export const MAX_QUERY_LENGTH = 1000;
