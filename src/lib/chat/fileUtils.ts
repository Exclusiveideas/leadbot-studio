import type { FileAttachment, Base64File } from "@/types/legal-chat";
import type { BedrockContentBlock } from "@/types/bedrock";

// File size limits for Bedrock Claude models
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 32 * 1024 * 1024; // 32MB
const MAX_CHAT_FILE_SIZE = 50 * 1024 * 1024; // 50MB for chat uploads

// Supported MIME types
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

export type { FileAttachment, Base64File, BedrockContentBlock };

export {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_CHAT_FILE_SIZE,
};

export interface FileProcessingResult {
  success: boolean;
  contentBlock?: BedrockContentBlock;
  error?: string;
  fallbackText?: string;
}

/**
 * Validate if file type is supported for AI processing
 */
export function isSupportedFileType(mimeType: string): boolean {
  return (
    SUPPORTED_IMAGE_TYPES.includes(mimeType) ||
    SUPPORTED_DOCUMENT_TYPES.includes(mimeType)
  );
}

/**
 * Validate chat file upload constraints
 */
export function validateChatFile(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  if (file.size > MAX_CHAT_FILE_SIZE) {
    return {
      valid: false,
      error: `File ${file.name} exceeds the 50MB limit for chat attachments`,
    };
  }

  if (!isSupportedFileType(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Supported types: PDF, images (JPEG, PNG, GIF, WebP), text files, DOCX, XLSX`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
}

/**
 * Convert a File object to base64 string (without data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate file type and size constraints for AI processing
 * Returns validation error or null if valid
 */
export function validateFileForProcessing(
  mimeType: string,
  size: number,
  fileName: string,
): FileProcessingResult | null {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(mimeType);
  const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(mimeType);

  if (!isImage && !isDocument) {
    return {
      success: false,
      error: `Unsupported file type: ${mimeType}`,
      fallbackText: `[Attachment: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  if (isImage && size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `Image ${fileName} exceeds 5MB limit`,
      fallbackText: `[Image too large: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  if (isDocument && size > MAX_DOCUMENT_SIZE) {
    return {
      success: false,
      error: `Document ${fileName} exceeds 32MB limit`,
      fallbackText: `[Document too large: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  return null;
}
