/**
 * Validation utilities for knowledge base file uploads
 */

// File size limits in bytes
export const KNOWLEDGE_FILE_SIZE_LIMITS = {
  PDF: 100 * 1024 * 1024, // 100MB
  DOCX: 50 * 1024 * 1024, // 50MB
  TXT: 50 * 1024 * 1024, // 50MB
  IMAGE: 100 * 1024 * 1024, // 100MB
  DEFAULT: 50 * 1024 * 1024, // 50MB
};

export const ALLOWED_KNOWLEDGE_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
];

export const ALLOWED_KNOWLEDGE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".tiff",
];

export interface FileValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate a knowledge base file
 */
export function validateKnowledgeFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidation {
  // Check file type
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isValidType =
    ALLOWED_KNOWLEDGE_FILE_TYPES.includes(file.type) ||
    ALLOWED_KNOWLEDGE_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

  if (!isValidType) {
    return {
      valid: false,
      error: `${file.name}: Unsupported file type. Please upload PDF, DOCX, TXT, MD, or image files.`,
    };
  }

  // Check file size
  let maxSize = KNOWLEDGE_FILE_SIZE_LIMITS.DEFAULT;

  if (extension === "pdf") maxSize = KNOWLEDGE_FILE_SIZE_LIMITS.PDF;
  else if (extension === "docx") maxSize = KNOWLEDGE_FILE_SIZE_LIMITS.DOCX;
  else if (extension === "txt" || extension === "md")
    maxSize = KNOWLEDGE_FILE_SIZE_LIMITS.TXT;
  else if (["png", "jpg", "jpeg", "tiff"].includes(extension || ""))
    maxSize = KNOWLEDGE_FILE_SIZE_LIMITS.IMAGE;

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `${file.name}: File size exceeds the ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * FAQ pair interface
 */
export interface FAQPair {
  question: string;
  answer: string;
}

/**
 * Validate FAQ content (JSON array of question/answer pairs)
 */
export function validateFAQContent(content: string): {
  valid: boolean;
  error?: string;
  pairs?: FAQPair[];
} {
  try {
    const pairs = JSON.parse(content);

    if (!Array.isArray(pairs)) {
      return { valid: false, error: "FAQ content must be a JSON array" };
    }

    if (pairs.length < 1) {
      return {
        valid: false,
        error: "FAQ must have at least 1 question/answer pair",
      };
    }

    if (pairs.length > 50) {
      return {
        valid: false,
        error: "FAQ cannot have more than 50 question/answer pairs",
      };
    }

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];

      if (!pair || typeof pair !== "object") {
        return { valid: false, error: `FAQ pair ${i + 1} must be an object` };
      }

      if (!pair.question || typeof pair.question !== "string") {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} must have a question string`,
        };
      }

      if (!pair.answer || typeof pair.answer !== "string") {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} must have an answer string`,
        };
      }

      if (pair.question.trim().length === 0) {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} question cannot be empty`,
        };
      }

      if (pair.answer.trim().length === 0) {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} answer cannot be empty`,
        };
      }

      if (pair.question.length > 1000) {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} question exceeds 1000 characters`,
        };
      }

      if (pair.answer.length > 5000) {
        return {
          valid: false,
          error: `FAQ pair ${i + 1} answer exceeds 5000 characters`,
        };
      }
    }

    return { valid: true, pairs };
  } catch (error) {
    return { valid: false, error: "Invalid FAQ JSON format" };
  }
}

/**
 * Validate plain text content
 */
export function validateTextContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Text content is required" };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length < 10) {
    return { valid: false, error: "Text must be at least 10 characters" };
  }

  if (content.length > 50000) {
    return { valid: false, error: "Text cannot exceed 50,000 characters" };
  }

  return { valid: true };
}

/**
 * Validate URL content
 */
export function validateURLContent(content: string): {
  valid: boolean;
  error?: string;
  url?: URL;
} {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "URL is required" };
  }

  try {
    const url = new URL(content.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { valid: false, error: "URL must use http or https protocol" };
    }

    if (!url.hostname || url.hostname.length < 3) {
      return { valid: false, error: "Invalid URL hostname" };
    }

    return { valid: true, url };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}
