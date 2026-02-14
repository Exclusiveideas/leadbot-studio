import { z } from "zod";

/**
 * Field validation schema
 */
export const formFieldSchema = z.object({
  id: z.string().min(1, "Field ID is required"),
  type: z.enum([
    "text",
    "email",
    "phone",
    "select",
    "multiselect",
    "textarea",
    "date",
    "checkbox",
    "radio",
  ]),
  label: z.string().min(1, "Label is required").max(200, "Label too long"),
  placeholder: z.string().max(200).optional(),
  required: z.boolean(),
  order: z.number().int().min(0),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      customError: z.string().optional(),
    })
    .optional(),
  conditionalDisplay: z
    .object({
      field: z.string(),
      operator: z.enum([
        "equals",
        "notEquals",
        "contains",
        "greaterThan",
        "lessThan",
      ]),
      value: z.any(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  aiExtractable: z.boolean().optional(),
  aiExtractionKey: z.string().optional(),
  step: z.number().int().min(1).optional(),
});

/**
 * Form configuration schema
 */
export const formConfigSchema = z.object({
  fields: z
    .array(formFieldSchema)
    .min(1, "At least one field is required")
    .max(50, "Maximum 50 fields allowed"),
  appearance: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format"),
      accentColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format"),
      buttonText: z
        .string()
        .min(1, "Button text is required")
        .max(50, "Button text too long"),
    })
    .optional(),
  behavior: z
    .object({
      showSuccessMessage: z.boolean(),
      successMessage: z.string().max(500).optional(),
      redirectUrl: z.string().url("Invalid URL format").optional(),
      multiStep: z
        .object({
          enabled: z.boolean(),
          steps: z
            .array(
              z.object({
                title: z
                  .string()
                  .min(1, "Step title is required")
                  .max(100, "Step title too long"),
                description: z.string().max(200).optional(),
              }),
            )
            .min(1)
            .max(10),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Create form schema
 */
export const createLeadFormSchema = z.object({
  name: z
    .string()
    .min(1, "Form name is required")
    .max(100, "Form name too long"),
  description: z.string().max(500, "Description too long").optional(),
  fields: formConfigSchema.shape.fields,
  appearance: formConfigSchema.shape.appearance,
  behavior: formConfigSchema.shape.behavior,
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

/**
 * Update form schema
 */
export const updateLeadFormSchema = createLeadFormSchema.partial();

/**
 * Type exports
 */
export type FormField = z.infer<typeof formFieldSchema>;
export type FormConfig = z.infer<typeof formConfigSchema>;
export type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;
export type UpdateLeadFormInput = z.infer<typeof updateLeadFormSchema>;
