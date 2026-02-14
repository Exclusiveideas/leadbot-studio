import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { getJwtSecret } from "./jwt-secret";

const JWT_EXPIRES_IN = "7d";
const RESET_TOKEN_EXPIRES_IN = "1h";
const EMAIL_TOKEN_EXPIRES_IN = "24h";
const MFA_SETUP_TOKEN_EXPIRES_IN = "15m";

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId?: string;
}

export interface TokenPayload extends JWTPayload {
  type: "access" | "reset" | "email_verification" | "mfa_setup";
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign({ ...payload, type: "access" }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function generateResetToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: "reset" }, getJwtSecret(), {
    expiresIn: RESET_TOKEN_EXPIRES_IN,
  });
}

export function generateEmailVerificationToken(
  userId: string,
  email: string,
): string {
  return jwt.sign(
    { userId, email, type: "email_verification" },
    getJwtSecret(),
    {
      expiresIn: EMAIL_TOKEN_EXPIRES_IN,
    },
  );
}

export function generateMfaSetupToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: "mfa_setup" }, getJwtSecret(), {
    expiresIn: MFA_SETUP_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export function generateSecureToken(length: number = 32): string {
  return nanoid(length);
}

export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => nanoid(8).toUpperCase());
}
