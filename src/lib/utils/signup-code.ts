import type { SignupCode } from "@prisma/client";
import { customAlphabet } from "nanoid";

// Create a custom nanoid generator with uppercase letters and numbers only
const generateCodeSuffix = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  6,
);

/**
 * Generate a human-readable signup code in the format: ACME-YYYY-XXXXXX
 * Uses nanoid for cryptographically strong uniqueness guarantees
 */
export function generateSignupCode(): string {
  const prefix = "ACME";
  const year = new Date().getFullYear();
  const random = generateCodeSuffix();
  return `${prefix}-${year}-${random}`;
}

/**
 * Check if a signup code has expired
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if a signup code is active (not expired, used, or revoked)
 */
export function isCodeActive(code: SignupCode): boolean {
  if (code.usedAt) return false;
  if (code.revokedAt) return false;
  if (isCodeExpired(code.expiresAt)) return false;
  return true;
}

/**
 * Get the status of a signup code
 */
export function getCodeStatus(
  code: SignupCode,
): "active" | "used" | "expired" | "revoked" {
  if (code.revokedAt) return "revoked";
  if (code.usedAt) return "used";
  if (isCodeExpired(code.expiresAt)) return "expired";
  return "active";
}

/**
 * Calculate expiration date (3 days from now)
 */
export function getCodeExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);
  return expiresAt;
}

/**
 * Result of signup code validation
 */
export interface SignupCodeValidationResult {
  valid: boolean;
  error?: string;
  code?: SignupCode;
}

/**
 * Validate a signup code for use during registration
 * Returns validation result with error message if invalid
 */
export function validateSignupCodeForUse(
  code: SignupCode | null,
  providedEmail?: string,
): SignupCodeValidationResult {
  if (!code) {
    return { valid: false, error: "The code is invalid" };
  }

  // Validate email match if provided
  if (
    providedEmail &&
    code.email.toLowerCase() !== providedEmail.toLowerCase()
  ) {
    return {
      valid: false,
      error: "This code is not valid for your email address",
    };
  }

  if (!isCodeActive(code)) {
    if (code.revokedAt) {
      return { valid: false, error: "The code is invalid" };
    }
    if (code.usedAt) {
      return { valid: false, error: "The code has already been used" };
    }
    // Must be expired
    return { valid: false, error: "The code is expired" };
  }

  return { valid: true, code };
}
