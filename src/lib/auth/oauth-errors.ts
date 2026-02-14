/**
 * OAuth error codes for NextAuth callback redirects
 * These codes are passed via URL params and mapped to user-friendly messages
 */
export const OAUTH_ERROR_CODES = {
  SIGNUP_CODE_EXPIRED: "signup_code_expired",
  SIGNUP_CODE_USED: "signup_code_used",
  SIGNUP_CODE_REVOKED: "signup_code_revoked",
  SIGNUP_CODE_INVALID: "signup_code_invalid",
  EMAIL_MISMATCH: "email_mismatch",
  ACCOUNT_INACTIVE: "account_inactive",
  AUTH_METHOD_MISMATCH: "auth_method_mismatch",
  NO_SIGNUP_TOKEN: "no_signup_token",
  TOKEN_EXPIRED: "token_expired",
  TOKEN_INVALID: "token_invalid",
  LINK_EMAIL_MISMATCH: "link_email_mismatch",
  ORG_MFA_REQUIRED: "org_mfa_required",
} as const;

export type OAuthErrorCode =
  (typeof OAUTH_ERROR_CODES)[keyof typeof OAUTH_ERROR_CODES];

/**
 * User-friendly error messages for each OAuth error code
 */
export const OAUTH_ERROR_MESSAGES: Record<OAuthErrorCode, string> = {
  [OAUTH_ERROR_CODES.SIGNUP_CODE_EXPIRED]:
    "Your signup code has expired. Please request a new one from your administrator.",
  [OAUTH_ERROR_CODES.SIGNUP_CODE_USED]:
    "This signup code has already been used.",
  [OAUTH_ERROR_CODES.SIGNUP_CODE_REVOKED]:
    "This signup code has been revoked. Please contact your administrator.",
  [OAUTH_ERROR_CODES.SIGNUP_CODE_INVALID]:
    "Invalid signup code. Please check your code and try again.",
  [OAUTH_ERROR_CODES.EMAIL_MISMATCH]:
    "The Google account email doesn't match your signup email. Please use the correct Google account.",
  [OAUTH_ERROR_CODES.ACCOUNT_INACTIVE]:
    "Your account has been deactivated. Please contact support.",
  [OAUTH_ERROR_CODES.AUTH_METHOD_MISMATCH]:
    "This email is already registered with email/password login. Please use that method instead.",
  [OAUTH_ERROR_CODES.NO_SIGNUP_TOKEN]:
    "Your signup session has expired. Please start the signup process again.",
  [OAUTH_ERROR_CODES.TOKEN_EXPIRED]:
    "Your signup session has expired. Please start the signup process again.",
  [OAUTH_ERROR_CODES.TOKEN_INVALID]:
    "Invalid signup session. Please start the signup process again.",
  [OAUTH_ERROR_CODES.LINK_EMAIL_MISMATCH]:
    "Please use a Google account with the same email as your Seira account to link.",
  [OAUTH_ERROR_CODES.ORG_MFA_REQUIRED]:
    "Your organization requires multi-factor authentication. Please set up MFA to continue.",
};

/**
 * Get error message for an OAuth error code
 * Returns undefined for unknown error codes
 */
export function getOAuthErrorMessage(errorCode: string): string | undefined {
  return OAUTH_ERROR_MESSAGES[errorCode as OAuthErrorCode];
}

/**
 * Build redirect URL with OAuth error code
 */
export function buildOAuthErrorRedirect(
  errorCode: OAuthErrorCode,
  basePath: string = "/login",
): string {
  return `${basePath}?error=${errorCode}`;
}
