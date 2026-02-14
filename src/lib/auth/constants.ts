// Session configuration
export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
export const SESSION_DURATION_SECONDS = 2 * 60 * 60; // 2 hours
export const SESSION_WARNING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiration
export const SESSION_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

// MFA configuration
export const MFA_VALIDITY_DAYS = 7;
export const MFA_VALIDITY_MS = MFA_VALIDITY_DAYS * 24 * 60 * 60 * 1000;

// API endpoints
export const AUTH_API_ENDPOINTS = {
  LOGOUT: "/api/auth/logout",
  LOGIN: "/api/auth/login",
  SIGNUP: "/api/auth/signup",
  RESET_PASSWORD: "/api/auth/reset-password",
  VERIFY_EMAIL: "/api/auth/verify-email",
  SETUP_MFA: "/api/auth/setup-mfa",
  SESSION: "/api/auth/session",
} as const;
