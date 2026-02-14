/**
 * Branded Types System
 *
 * Branded types provide compile-time type safety by preventing
 * mixing up different string IDs (e.g., TemplateId vs UserId).
 *
 * @see https://egghead.io/blog/using-branded-types-in-typescript
 * @see CLAUDE.md Best Practice C-5: Prefer branded types for IDs
 */

/**
 * Brand utility type
 * Creates a nominal type by adding a phantom __brand property
 */
export type Brand<T, TBrand> = T & { readonly __brand: TBrand };

/**
 * Document generation branded types
 */

/**
 * Branded type for template IDs
 * Prevents mixing up template IDs with other string IDs
 */
export type TemplateId = Brand<string, "TemplateId">;

/**
 * Branded type for generation history IDs
 * Prevents mixing up generation history IDs with other string IDs
 */
export type GenerationHistoryId = Brand<string, "GenerationHistoryId">;

/**
 * Common branded types (reused from other parts of the system)
 */

/**
 * Branded type for user IDs
 */
export type UserId = Brand<string, "UserId">;

/**
 * Branded type for case IDs
 */
export type CaseId = Brand<string, "CaseId">;

/**
 * Branded type for organization IDs
 */
export type OrganizationId = Brand<string, "OrganizationId">;

/**
 * Branded type for document IDs
 */
export type DocumentId = Brand<string, "DocumentId">;

/**
 * Chatbot branded types
 */

/**
 * Branded type for chatbot IDs
 */
export type ChatbotId = Brand<string, "ChatbotId">;

/**
 * Branded type for chatbot conversation IDs
 */
export type ChatbotConversationId = Brand<string, "ChatbotConversationId">;

/**
 * Branded type for chatbot knowledge IDs
 */
export type ChatbotKnowledgeId = Brand<string, "ChatbotKnowledgeId">;

/**
 * Branded type for chatbot lead IDs
 */
export type ChatbotLeadId = Brand<string, "ChatbotLeadId">;

/**
 * Branded type for chatbot lead form IDs
 */
export type ChatbotLeadFormId = Brand<string, "ChatbotLeadFormId">;

/**
 * Branded type for chatbot message IDs
 */
export type ChatbotMessageId = Brand<string, "ChatbotMessageId">;

/**
 * Type guards and conversion helpers
 */

/**
 * Check if a string is a valid template ID format
 */
export function isTemplateId(id: string): id is TemplateId {
  return typeof id === "string" && id.length > 0 && id.startsWith("c");
}

/**
 * Convert a string to a TemplateId (with validation)
 * @throws Error if the ID is invalid
 */
export function toTemplateId(id: string): TemplateId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid template ID: must be a non-empty string");
  }
  return id as TemplateId;
}

/**
 * Safely convert a string to a TemplateId
 * Returns null if invalid
 */
export function safeToTemplateId(id: string): TemplateId | null {
  try {
    return toTemplateId(id);
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid generation history ID format
 */
export function isGenerationHistoryId(id: string): id is GenerationHistoryId {
  return typeof id === "string" && id.length > 0 && id.startsWith("c");
}

/**
 * Convert a string to a GenerationHistoryId (with validation)
 */
export function toGenerationHistoryId(id: string): GenerationHistoryId {
  if (!id || typeof id !== "string") {
    throw new Error(
      "Invalid generation history ID: must be a non-empty string",
    );
  }
  return id as GenerationHistoryId;
}

/**
 * Check if a string is a valid user ID format
 */
export function isUserId(id: string): id is UserId {
  return typeof id === "string" && id.length > 0 && id.startsWith("c");
}

/**
 * Convert a string to a UserId (with validation)
 */
export function toUserId(id: string): UserId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid user ID: must be a non-empty string");
  }
  return id as UserId;
}

/**
 * Check if a string is a valid case ID format
 */
export function isCaseId(id: string): id is CaseId {
  return typeof id === "string" && id.length > 0 && id.startsWith("c");
}

/**
 * Convert a string to a CaseId (with validation)
 */
export function toCaseId(id: string): CaseId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid case ID: must be a non-empty string");
  }
  return id as CaseId;
}

/**
 * Check if a string is a valid organization ID format
 */
export function isOrganizationId(id: string): id is OrganizationId {
  return typeof id === "string" && id.length > 0 && id.startsWith("c");
}

/**
 * Convert a string to an OrganizationId (with validation)
 */
export function toOrganizationId(id: string): OrganizationId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid organization ID: must be a non-empty string");
  }
  return id as OrganizationId;
}

/**
 * Check if a string is a valid chatbot ID format
 */
export function isChatbotId(id: string): id is ChatbotId {
  return typeof id === "string" && id.length > 0;
}

/**
 * Convert a string to a ChatbotId (with validation)
 */
export function toChatbotId(id: string): ChatbotId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid chatbot ID: must be a non-empty string");
  }
  return id as ChatbotId;
}

/**
 * Convert a string to a ChatbotConversationId (with validation)
 */
export function toChatbotConversationId(id: string): ChatbotConversationId {
  if (!id || typeof id !== "string") {
    throw new Error(
      "Invalid chatbot conversation ID: must be a non-empty string",
    );
  }
  return id as ChatbotConversationId;
}

/**
 * Convert a string to a ChatbotKnowledgeId (with validation)
 */
export function toChatbotKnowledgeId(id: string): ChatbotKnowledgeId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid chatbot knowledge ID: must be a non-empty string");
  }
  return id as ChatbotKnowledgeId;
}

/**
 * Convert a string to a ChatbotLeadId (with validation)
 */
export function toChatbotLeadId(id: string): ChatbotLeadId {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid chatbot lead ID: must be a non-empty string");
  }
  return id as ChatbotLeadId;
}

/**
 * Convert a string to a ChatbotLeadFormId (with validation)
 */
export function toChatbotLeadFormId(id: string): ChatbotLeadFormId {
  if (!id || typeof id !== "string") {
    throw new Error(
      "Invalid chatbot lead form ID: must be a non-empty string"
    );
  }
  return id as ChatbotLeadFormId;
}

/**
 * Unwrap a branded type back to its base type
 * Use sparingly - only when interfacing with external libraries
 */
export function unwrap<T>(branded: Brand<T, any>): T {
  return branded as T;
}
