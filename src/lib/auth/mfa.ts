import speakeasy from "speakeasy";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { MFA_VALIDITY_MS } from "./constants";

export interface MFASecret {
  base32: string;
  otpauth_url: string;
}

export interface BackupCodeResult {
  plainCodes: string[];
  hashedCodes: string[];
}

const SALT_ROUNDS = 10;

export function generateMFASecret(
  email: string,
  appName: string = "Leadbot Partners",
): MFASecret {
  const secret = speakeasy.generateSecret({
    name: `${appName} (${email})`,
    length: 32,
  });

  return {
    base32: secret.base32,
    otpauth_url: secret.otpauth_url || "",
  };
}

export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
}

export function verifyMFAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps in each direction for clock skew
  });
}

export function generateMFAToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: "base32",
  });
}

/**
 * Generate backup codes with cryptographically secure random values.
 * Returns both plain codes (to show user once) and hashed codes (to store in DB).
 */
export async function generateBackupCodes(
  count: number = 8,
): Promise<BackupCodeResult> {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Use crypto.randomBytes for cryptographic security
    const bytes = crypto.randomBytes(4);
    const code = bytes.toString("hex").toUpperCase().slice(0, 8);
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;

    plainCodes.push(formatted);
    hashedCodes.push(await bcrypt.hash(formatted, SALT_ROUNDS));
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify a backup code against stored codes.
 * Supports both hashed codes (new) and plaintext codes (legacy/backward compatibility).
 * Hashed codes start with "$2" (bcrypt prefix).
 */
export async function verifyBackupCode(
  code: string,
  storedCodes: string[],
): Promise<{
  isValid: boolean;
  remainingCodes: string[];
  usedIndex: number;
}> {
  // Normalize input: uppercase, remove spaces and dashes for comparison
  const normalizedInput = code.toUpperCase().replace(/[\s-]/g, "");
  // Format to XXXX-XXXX for bcrypt comparison
  const formattedCode =
    normalizedInput.length === 8
      ? `${normalizedInput.slice(0, 4)}-${normalizedInput.slice(4)}`
      : code.toUpperCase().replace(/\s/g, "");

  for (let i = 0; i < storedCodes.length; i++) {
    const storedCode = storedCodes[i];

    // Check if this is a hashed code (bcrypt hashes start with $2)
    const isHashed = storedCode.startsWith("$2");

    let matches: boolean;
    if (isHashed) {
      // Compare against bcrypt hash
      matches = await bcrypt.compare(formattedCode, storedCode);
    } else {
      // Legacy plaintext comparison (backward compatibility)
      const normalizedStored = storedCode.toUpperCase().replace(/[\s-]/g, "");
      matches = normalizedInput === normalizedStored;
    }

    if (matches) {
      // Remove used code and return remaining
      const remainingCodes = [...storedCodes];
      remainingCodes.splice(i, 1);
      return { isValid: true, remainingCodes, usedIndex: i };
    }
  }

  return { isValid: false, remainingCodes: storedCodes, usedIndex: -1 };
}

type MfaVerificationInput = {
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaLastVerifiedAt: Date | null;
};

/**
 * Determines if MFA verification is needed based on user's MFA status.
 * Used for both email/password and OAuth login flows.
 *
 * MFA verification is required when:
 * - User has MFA enabled (mfaEnabled = true)
 * - User has an MFA secret configured (mfaSecret != null)
 * - Either: mfaLastVerifiedAt is null (never verified)
 *   OR: more than 7 days have passed since last verification
 */
export function needsMfaVerification(user: MfaVerificationInput): boolean {
  if (!user.mfaEnabled || !user.mfaSecret) {
    return false;
  }

  if (!user.mfaLastVerifiedAt) {
    return true;
  }

  const timeSinceLastVerification =
    Date.now() - new Date(user.mfaLastVerifiedAt).getTime();
  return timeSinceLastVerification > MFA_VALIDITY_MS;
}

type OrganizationMfaCheckInput = {
  organizationRequiresMfa: boolean;
  userMfaEnabled: boolean;
};

/**
 * Checks if user must set up MFA because their organization requires it.
 * Returns true if organization requires MFA but user hasn't enabled it yet.
 */
export function requiresOrganizationMfaSetup(
  input: OrganizationMfaCheckInput,
): boolean {
  return input.organizationRequiresMfa && !input.userMfaEnabled;
}

type DeviceChangeInput = {
  lastIpAddress: string | null;
  lastUserAgent: string | null;
  currentIpAddress: string;
  currentUserAgent: string;
};

/**
 * Normalize IP addresses to handle localhost variations.
 * Treats ::1, 127.0.0.1, and localhost as equivalent.
 */
function normalizeIpAddress(ip: string | null): string | null {
  if (!ip) return null;

  const localhostVariants = [
    "::1",
    "127.0.0.1",
    "localhost",
    "::ffff:127.0.0.1",
  ];
  if (localhostVariants.includes(ip.toLowerCase())) {
    return "localhost";
  }

  // Strip ::ffff: prefix from IPv4-mapped IPv6 addresses
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  return ip;
}

/**
 * Extract browser name from user agent.
 */
function extractBrowserName(ua: string): string {
  if (ua.includes("edg")) return "edge";
  if (ua.includes("chrome")) return "chrome";
  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("safari")) return "safari";
  return "unknown";
}

/**
 * Extract browser major version from user agent.
 * Matches patterns like Chrome/120.0.0.0, Firefox/121.0, Version/17.1
 */
function extractBrowserVersion(ua: string): string | null {
  // Edge: Edg/120.0.0.0
  const edgeMatch = ua.match(/edg\/(\d+)/i);
  if (edgeMatch) return edgeMatch[1];

  // Chrome: Chrome/120.0.0.0
  const chromeMatch = ua.match(/chrome\/(\d+)/i);
  if (chromeMatch) return chromeMatch[1];

  // Firefox: Firefox/121.0
  const firefoxMatch = ua.match(/firefox\/(\d+)/i);
  if (firefoxMatch) return firefoxMatch[1];

  // Safari: Version/17.1 (Safari uses Version/ not Safari/)
  const safariMatch = ua.match(/version\/(\d+)/i);
  if (safariMatch) return safariMatch[1];

  return null;
}

/**
 * Extract OS name from user agent.
 */
function extractOsName(ua: string): string {
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macos";
  if (ua.includes("iphone")) return "ios";
  if (ua.includes("ipad")) return "ipados";
  if (ua.includes("android")) return "android";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

/**
 * Extract OS major version from user agent.
 * Matches patterns like Windows NT 10.0, Mac OS X 10_15, iPhone OS 17_1, Android 14
 */
function extractOsVersion(ua: string): string | null {
  // Windows NT 10.0 → "10"
  const windowsMatch = ua.match(/windows nt (\d+)/i);
  if (windowsMatch) return windowsMatch[1];

  // Mac OS X 10_15 or Mac OS X 14_0 → major version
  const macMatch = ua.match(/mac os x (\d+)[_.](\d+)/i);
  if (macMatch) {
    // macOS 11+ uses first number as major, earlier uses 10.x
    return macMatch[1] === "10" ? "10" : macMatch[1];
  }

  // iPhone OS 17_1 or CPU OS 17_1 → "17"
  const iosMatch = ua.match(/(?:iphone os|cpu os) (\d+)/i);
  if (iosMatch) return iosMatch[1];

  // Android 14 → "14"
  const androidMatch = ua.match(/android (\d+)/i);
  if (androidMatch) return androidMatch[1];

  return null;
}

/**
 * Extract device type from user agent.
 */
function extractDeviceType(ua: string): string {
  if (ua.includes("iphone")) return "phone";
  if (ua.includes("ipad")) return "tablet";
  if (ua.includes("android")) {
    // Android tablets typically don't have "Mobile" in UA
    return ua.includes("mobile") ? "phone" : "tablet";
  }
  return "desktop";
}

/**
 * Extract device fingerprint from user agent for device change detection.
 * Includes browser name, major version, OS, OS version, and device type.
 * This provides better device differentiation while avoiding false positives
 * from minor version updates.
 *
 * Example outputs:
 * - "chrome-120-windows-10-desktop"
 * - "safari-17-ios-17-phone"
 * - "firefox-121-macos-14-desktop"
 */
function extractDeviceFingerprint(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();

  const browser = extractBrowserName(ua);
  const browserVer = extractBrowserVersion(userAgent); // Use original case for regex
  const os = extractOsName(ua);
  const osVer = extractOsVersion(userAgent); // Use original case for regex
  const deviceType = extractDeviceType(ua);

  const parts = [browser, browserVer, os, osVer, deviceType].filter(Boolean);
  return parts.join("-");
}

/**
 * Checks if the device or IP address has changed from the last session.
 * Used to trigger MFA re-verification on suspicious login attempts.
 *
 * Uses normalized comparisons to avoid false positives:
 * - IPs: localhost variations (::1, 127.0.0.1) are treated as equal
 * - User agents: compares browser+OS fingerprint, not exact string
 */
export function hasDeviceOrIpChanged(input: DeviceChangeInput): {
  ipChanged: boolean;
  deviceChanged: boolean;
  requiresMfa: boolean;
} {
  // If no previous session data, don't require MFA for this reason
  if (!input.lastIpAddress && !input.lastUserAgent) {
    return { ipChanged: false, deviceChanged: false, requiresMfa: false };
  }

  // Normalize IPs to handle localhost variations
  const normalizedLastIp = normalizeIpAddress(input.lastIpAddress);
  const normalizedCurrentIp = normalizeIpAddress(input.currentIpAddress);

  const ipChanged =
    !!normalizedLastIp && normalizedLastIp !== normalizedCurrentIp;

  // Compare device fingerprints instead of exact user agent strings
  const lastFingerprint = extractDeviceFingerprint(input.lastUserAgent);
  const currentFingerprint = extractDeviceFingerprint(input.currentUserAgent);

  const deviceChanged =
    !!lastFingerprint && lastFingerprint !== currentFingerprint;

  return {
    ipChanged,
    deviceChanged,
    requiresMfa: ipChanged || deviceChanged,
  };
}
