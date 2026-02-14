/**
 * Document Generation Types
 * Types for template-based and freeform document generation
 */

import type { TemplateCategory, OutputFormat } from "@prisma/client";
import type {
  TemplateId,
  GenerationHistoryId,
  UserId,
  CaseId,
  OrganizationId,
} from "./branded";

export type { TemplateCategory, OutputFormat };
export type { TemplateId, GenerationHistoryId, UserId, CaseId, OrganizationId };

/**
 * Valid output formats
 */
export const VALID_OUTPUT_FORMATS: readonly OutputFormat[] = [
  "MARKDOWN",
  "HTML",
  "PLAIN_TEXT",
] as const;

/**
 * Validates and returns a valid output format from a string
 * @param format - Format string to validate
 * @returns Valid OutputFormat or "MARKDOWN" as default
 */
export function getValidOutputFormat(format?: string): OutputFormat {
  return format && VALID_OUTPUT_FORMATS.includes(format as OutputFormat)
    ? (format as OutputFormat)
    : "MARKDOWN";
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "textarea" | "select";
  label: string;
  required: boolean;
  defaultValue?: string | number;
  options?: string[]; // For select type
  placeholder?: string;
  description?: string;
}

/**
 * Template variable schema (stored in DB as JSON)
 */
export type TemplateVariableSchema = Record<string, TemplateVariable>;

/**
 * Template variable values (user input)
 */
export type TemplateVariableValues = Record<string, string | number>;

/**
 * Document template
 * Server response format with string dates (ISO 8601)
 */
export interface DocumentTemplate {
  id: TemplateId;
  name: string;
  description?: string;
  category: TemplateCategory;
  prompt: string;
  variables: TemplateVariableSchema;
  outputFormat: OutputFormat;
  isPublic: boolean;
  organizationId?: OrganizationId;
  createdBy: UserId;
  usageCount: number;
  lastUsedAt?: string; // ISO 8601 string from server
  createdAt: string; // ISO 8601 string from server
  updatedAt: string; // ISO 8601 string from server
}

/**
 * Generation request
 */
export interface GenerationRequest {
  type: "template" | "freeform";
  templateId?: TemplateId;
  variables?: TemplateVariableValues;
  customPrompt?: string;
  caseId?: CaseId;
  context?: string;
  outputFormat?: OutputFormat;
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    generationId?: GenerationHistoryId;
    templateId?: TemplateId;
    templateName?: string;
    category?: TemplateCategory;
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
  };
}

/**
 * Generation history entry
 * Server response format with string dates (ISO 8601)
 */
export interface GenerationHistoryEntry {
  id: GenerationHistoryId;
  userId: UserId;
  templateId?: TemplateId;
  generationType: "template" | "freeform";
  prompt: string;
  variables?: TemplateVariableValues;
  generatedContent: string;
  metadata?: {
    templateName?: string;
    category?: TemplateCategory;
    tokensUsed?: number;
    model?: string;
    format?: OutputFormat;
    additionalContext?: string;
  };
  createdAt: string; // ISO 8601 string from server
}

/**
 * Template with metadata
 */
export interface TemplateWithMetadata extends DocumentTemplate {
  creator?: {
    id: UserId;
    name: string | null;
    email: string;
  };
  organization?: {
    id: OrganizationId;
    name: string;
  };
  _count?: {
    generations: number;
  };
}

/**
 * Generation API response
 */
export interface GenerationApiResponse {
  success: boolean;
  data?: GenerationResult;
  error?: string;
}

/**
 * Template list API response
 */
export interface TemplateListApiResponse {
  success: boolean;
  data?: {
    templates: TemplateWithMetadata[];
    total: number;
  };
  error?: string;
}

/**
 * Generation history API response
 */
export interface GenerationHistoryApiResponse {
  success: boolean;
  data?: {
    history: GenerationHistoryEntry[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Template filter options
 */
export interface TemplateFilters {
  category?: TemplateCategory;
  isPublic?: boolean;
  organizationId?: OrganizationId;
  search?: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: "copy" | "markdown" | "text" | "html";
  filename?: string;
}
