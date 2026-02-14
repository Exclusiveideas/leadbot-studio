import { z } from "zod";
import { CHATBOT_FORM_VALIDATION } from "@/lib/constants/chatbot";
import { countWords } from "@/lib/utils/validation-helpers";
import { textConfigSchema } from "./chatbot-text";

/**
 * Schema for creating a new chatbot
 */
export const createChatbotSchema = z.object({
  name: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${CHATBOT_FORM_VALIDATION.NAME_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.NAME_MAX_LENGTH,
      `Name must be less than ${CHATBOT_FORM_VALIDATION.NAME_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_LENGTH,
      `Description must be at least ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_LENGTH,
      `Description must be less than ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_LENGTH} characters`,
    )
    .refine(
      (val) => countWords(val) >= CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_WORDS,
      `Description must be at least ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_WORDS} words`,
    )
    .refine(
      (val) => countWords(val) <= CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS,
      `Description must be at most ${CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_WORDS} words`,
    ),
  persona: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.PERSONA_MIN_LENGTH,
      `Persona must be at least ${CHATBOT_FORM_VALIDATION.PERSONA_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.PERSONA_MAX_LENGTH,
      `Persona must be less than ${CHATBOT_FORM_VALIDATION.PERSONA_MAX_LENGTH} characters`,
    ),
  customInstructions: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MIN_LENGTH,
      `Custom instructions must be at least ${CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MIN_LENGTH} characters`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MAX_LENGTH,
      `Custom instructions must be less than ${CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MAX_LENGTH} characters`,
    ),
  welcomeMessage: z
    .string()
    .min(
      CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MIN_LENGTH,
      `Welcome message must be at least ${CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MIN_LENGTH} character`,
    )
    .max(
      CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MAX_LENGTH,
      `Welcome message must be less than ${CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MAX_LENGTH} characters`,
    )
    .optional()
    .default("Hi! How can I help you today?"),
  aiModel: z.string().default("claude-3-5-haiku"),
  allowedDomains: z.array(z.string()).min(1, "At least one domain is required"),
});

/**
 * Schema for updating an existing chatbot
 */
export const updateChatbotSchema = z
  .object({
    name: z
      .string()
      .min(CHATBOT_FORM_VALIDATION.NAME_MIN_LENGTH)
      .max(CHATBOT_FORM_VALIDATION.NAME_MAX_LENGTH)
      .optional(),
    description: z
      .string()
      .min(CHATBOT_FORM_VALIDATION.DESCRIPTION_MIN_LENGTH)
      .max(CHATBOT_FORM_VALIDATION.DESCRIPTION_MAX_LENGTH)
      .optional(),
    persona: z
      .string()
      .min(CHATBOT_FORM_VALIDATION.PERSONA_MIN_LENGTH)
      .max(CHATBOT_FORM_VALIDATION.PERSONA_MAX_LENGTH)
      .optional(),
    customInstructions: z
      .string()
      .min(CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MIN_LENGTH)
      .max(CHATBOT_FORM_VALIDATION.INSTRUCTIONS_MAX_LENGTH)
      .optional(),
    welcomeMessage: z
      .string()
      .min(CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MIN_LENGTH)
      .max(CHATBOT_FORM_VALIDATION.WELCOME_MESSAGE_MAX_LENGTH)
      .optional(),
    aiModel: z.string().optional(),
    allowedDomains: z.array(z.string()).optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    thumbnail: z.string().optional(),
    publishedAt: z.date().optional(),
    chatGreeting: z
      .string()
      .min(1, "Chat greeting must not be empty")
      .max(200, "Chat greeting must be less than 200 characters")
      .optional(),
    appearance: z
      .object({
        primaryColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
        animationEnabled: z.boolean().optional(),
        animationCycles: z.number().min(1).max(20).optional(),
      })
      .optional(),
    suggestedQuestions: z
      .array(z.string().min(1).max(200))
      .max(10, "Maximum 10 suggested questions allowed")
      .optional(),
    calendlyLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    bookingConfig: z
      .object({
        enabled: z.boolean(),
        categories: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            subCategories: z
              .array(z.object({ id: z.string(), name: z.string() }))
              .optional(),
          }),
        ),
        locations: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            address: z.string(),
            timeSlots: z.array(
              z.object({ start: z.string(), end: z.string() }),
            ),
            availableDays: z.array(z.string()),
          }),
        ),
        requireCaseDescription: z.boolean().optional(),
      })
      .optional(),
    textConfig: textConfigSchema.optional(),
  })
  .partial();

/**
 * Schema for chatbot filters
 */
export const chatbotFiltersSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * Schema for adding knowledge to a chatbot
 */
export const addKnowledgeSchema = z.object({
  type: z.enum(["FAQ", "DOCUMENT", "TEXT", "URL"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  s3Key: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for updating knowledge
 */
export const updateKnowledgeSchema = z
  .object({
    type: z.enum(["FAQ", "DOCUMENT", "TEXT", "URL"]).optional(),
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    s3Key: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .partial();

/**
 * Schema for capturing a lead
 */
export const captureLeadSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(20).optional(),
  caseType: z.string().max(100).optional(),
  urgency: z
    .enum(["IMMEDIATE", "THIS_WEEK", "THIS_MONTH", "EXPLORING"])
    .optional(),
  budget: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema for file attachment in chat
 */
export const chatFileSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z
    .number()
    .min(1)
    .max(50 * 1024 * 1024), // 50MB max
  base64: z.string().min(1),
});

/**
 * Schema for sending a chat message
 */
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(50)
    .optional(),
  files: z.array(chatFileSchema).max(5).optional(),
});

/**
 * Type exports
 */
export type CreateChatbotInput = z.infer<typeof createChatbotSchema>;
export type UpdateChatbotInput = z.infer<typeof updateChatbotSchema>;
export type ChatbotFilters = z.infer<typeof chatbotFiltersSchema>;
export type AddKnowledgeInput = z.infer<typeof addKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
export type CaptureLeadInput = z.infer<typeof captureLeadSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
