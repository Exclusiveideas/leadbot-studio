import { z } from "zod";

/**
 * Field configuration schema for individual form fields
 */
export const textFieldConfigSchema = z.object({
  required: z.boolean().default(true),
});

/**
 * Email field configuration (can be enabled/disabled)
 */
export const emailFieldConfigSchema = z.object({
  enabled: z.boolean().default(true),
  required: z.boolean().default(false),
});

/**
 * Fields configuration schema
 */
export const textFieldsConfigSchema = z.object({
  firstName: textFieldConfigSchema.default({ required: true }),
  lastName: textFieldConfigSchema.default({ required: true }),
  phone: textFieldConfigSchema.default({ required: true }),
  email: emailFieldConfigSchema.default({ enabled: true, required: false }),
  message: textFieldConfigSchema.default({ required: true }),
});

/**
 * Default consent text for TCPA compliance
 */
export const DEFAULT_CONSENT_TEXT =
  "By submitting, you agree to receive text messages from us at the number provided, including those related to your inquiry, follow-ups, and review requests, via automated technology. Consent is not a condition of purchase. Msg & data rates may apply. Msg frequency may vary. Reply STOP to cancel or HELP for assistance.";

/**
 * Full text request configuration schema
 */
export const textConfigSchema = z.object({
  enabled: z.boolean().default(false),
  consentText: z.string().default(DEFAULT_CONSENT_TEXT),
  fields: textFieldsConfigSchema.default({
    firstName: { required: true },
    lastName: { required: true },
    phone: { required: true },
    email: { enabled: true, required: false },
    message: { required: true },
  }),
});

/**
 * Create/Update text config schema
 */
export const updateTextConfigSchema = textConfigSchema.partial();

/**
 * Public text request submission schema (base - all optional for dynamic validation)
 */
export const createTextRequestBaseSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  message: z.string().max(5000).optional(),
});

/**
 * Create text request with dynamic validation based on config
 */
export function createTextRequestSchema(config: TextConfig) {
  const fields = config.fields;

  return z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    firstName: fields.firstName.required
      ? z.string().min(1, "First name is required").max(100)
      : z.string().max(100).optional(),
    lastName: fields.lastName.required
      ? z.string().min(1, "Last name is required").max(100)
      : z.string().max(100).optional(),
    email: fields.email.enabled
      ? fields.email.required
        ? z.string().email("Invalid email address")
        : z.string().email("Invalid email address").optional().or(z.literal(""))
      : z.string().optional(),
    phone: fields.phone.required
      ? z.string().min(1, "Phone number is required").max(30)
      : z.string().max(30).optional(),
    message: fields.message.required
      ? z.string().min(1, "Message is required").max(5000)
      : z.string().max(5000).optional(),
  });
}

/**
 * Text request status update schema
 */
export const updateTextRequestStatusSchema = z.object({
  status: z.enum(["PENDING", "SEEN", "RESPONDED"]),
});

/**
 * Type exports
 */
export type TextFieldConfig = z.infer<typeof textFieldConfigSchema>;
export type EmailFieldConfig = z.infer<typeof emailFieldConfigSchema>;
export type TextFieldsConfig = z.infer<typeof textFieldsConfigSchema>;
export type TextConfig = z.infer<typeof textConfigSchema>;
export type UpdateTextConfigInput = z.infer<typeof updateTextConfigSchema>;
export type CreateTextRequestInput = {
  sessionId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
};
export type UpdateTextRequestStatusInput = z.infer<
  typeof updateTextRequestStatusSchema
>;

/**
 * Get default text config
 */
export function getDefaultTextConfig(): TextConfig {
  return textConfigSchema.parse({});
}
