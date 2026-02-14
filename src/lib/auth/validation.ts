import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  mfaToken: z.string().optional(),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  signupCode: z.string().min(1, "Signup code is required"),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const setupMFASchema = z.object({
  token: z
    .string()
    .length(6, "Token must be 6 digits")
    .regex(/^\d+$/, "Token must contain only numbers"),
});

export const verifyMFASchema = z.object({
  token: z
    .string()
    .length(6, "Token must be 6 digits")
    .regex(/^\d+$/, "Token must contain only numbers"),
  backupCode: z.string().optional(),
});

// Schema for OAuth MFA verification endpoint - accepts either TOTP or backup code
export const oauthMfaVerifySchema = z.object({
  mfaToken: z
    .string()
    .min(1, "MFA token or backup code is required")
    .max(20, "Token too long"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const linkGoogleAccountSchema = z.object({
  password: z.string().min(1, "Password is required to link your account"),
  mfaToken: z.string().optional(),
});

export const unlinkGoogleAccountSchema = z.object({
  password: z.string().min(1, "Password is required to unlink your account"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type SetupMFAInput = z.infer<typeof setupMFASchema>;
export type VerifyMFAInput = z.infer<typeof verifyMFASchema>;
export type OAuthMfaVerifyInput = z.infer<typeof oauthMfaVerifySchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type LinkGoogleAccountInput = z.infer<typeof linkGoogleAccountSchema>;
export type UnlinkGoogleAccountInput = z.infer<
  typeof unlinkGoogleAccountSchema
>;
