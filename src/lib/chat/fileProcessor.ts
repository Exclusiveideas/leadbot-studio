import type { FileAttachment, Base64File } from "@/types/legal-chat";
import type { BedrockContentBlock } from "@/types/bedrock";
import { downloadAndEncodeBase64 } from "@/lib/storage/s3Download";
import { logger } from "@/lib/utils/logger";
import { extractTextFromFile, truncateText } from "./textExtractor";
import { attachmentCache } from "@/lib/utils/attachmentCache";

// File size limits for Bedrock Claude models
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 32 * 1024 * 1024; // 32MB
const MAX_CHAT_FILE_SIZE = 50 * 1024 * 1024; // 50MB for chat uploads
const MAX_TEXT_LENGTH = 100_000; // ~100K chars ≈ 25K tokens

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
  // Check file size
  if (file.size > MAX_CHAT_FILE_SIZE) {
    return {
      valid: false,
      error: `File ${file.name} exceeds the 50MB limit for chat attachments`,
    };
  }

  // Check if supported type
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
 * Shared helper to avoid duplication between prepareFileForAI and prepareBase64FileForAI
 * Returns validation error or null if valid
 */
function validateFileForProcessing(
  mimeType: string,
  size: number,
  fileName: string,
): FileProcessingResult | null {
  const isImage = SUPPORTED_IMAGE_TYPES.includes(mimeType);
  const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(mimeType);

  // Check if file type is supported
  if (!isImage && !isDocument) {
    return {
      success: false,
      error: `Unsupported file type: ${mimeType}`,
      fallbackText: `[Attachment: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  // Check size limits for images
  if (isImage && size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      error: `Image ${fileName} exceeds 5MB limit`,
      fallbackText: `[Image too large: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  // Check size limits for documents
  if (isDocument && size > MAX_DOCUMENT_SIZE) {
    return {
      success: false,
      error: `Document ${fileName} exceeds 32MB limit`,
      fallbackText: `[Document too large: ${fileName} (${formatFileSize(size)})]`,
    };
  }

  // Valid - no error
  return null;
}

/**
 * Extract and format document text for AI processing
 * Shared helper to avoid duplication between prepareFileForAI and prepareBase64FileForAI
 */
async function extractAndFormatDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  size: number,
): Promise<FileProcessingResult> {
  const extraction = await extractTextFromFile(fileBuffer, mimeType, fileName);

  if (extraction.success && extraction.text) {
    // Truncate text if too long (prevent token overflow)
    const truncatedText = truncateText(extraction.text, MAX_TEXT_LENGTH);

    return {
      success: true,
      contentBlock: {
        type: "text",
        text: `--- Content from ${fileName} (${mimeType}) ---\n\n${truncatedText}`,
      },
    };
  } else {
    logger.warn("Failed to extract text from document, using fallback", {
      component: "fileProcessor",
      fileName,
      error: extraction.error,
    });

    return {
      success: false,
      error: extraction.error || "Failed to extract text",
      fallbackText: `[Unable to extract text from: ${fileName} (${formatFileSize(size)})]`,
    };
  }
}

/**
 * Process a file attachment for AI analysis
 * Downloads from S3, converts to base64, and formats for Bedrock API
 * Supports optional caching to avoid re-downloading from S3
 */
export async function prepareFileForAI(
  attachment: FileAttachment,
  sessionId?: string,
  useCache = true,
): Promise<FileProcessingResult> {
  try {
    // Validate file type and size constraints
    const validationError = validateFileForProcessing(
      attachment.mimeType,
      attachment.size,
      attachment.fileName,
    );
    if (validationError) return validationError;

    const isImage = SUPPORTED_IMAGE_TYPES.includes(attachment.mimeType);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(attachment.mimeType);

    // Check cache first if enabled and sessionId provided
    let base64Data: string | undefined;

    if (useCache && sessionId && attachment.s3Key) {
      const cached = attachmentCache.getAttachment(sessionId, attachment.s3Key);
      if (cached) {
        base64Data = cached.base64;
      }
    }

    // Download from S3 if not in cache
    if (!base64Data) {
      const downloadResult = await downloadAndEncodeBase64(attachment.s3Key);

      if (!downloadResult.success || !downloadResult.base64) {
        logger.error("Failed to download file for AI processing", undefined, {
          component: "fileProcessor",
          s3Key: attachment.s3Key,
          error: downloadResult.error,
        });

        return {
          success: false,
          error: downloadResult.error || "Failed to download file",
          fallbackText: `[Attachment: ${attachment.fileName} (${formatFileSize(attachment.size)})]`,
        };
      }

      base64Data = downloadResult.base64;

      // Add to cache if enabled
      if (useCache && sessionId && attachment.s3Key) {
        attachmentCache.addAttachment(
          sessionId,
          attachment.s3Key,
          attachment.fileName,
          attachment.mimeType,
          attachment.size,
          base64Data,
        );
      }
    }

    // Create content block for images
    if (isImage) {
      return {
        success: true,
        contentBlock: {
          type: "image",
          source: {
            type: "base64",
            media_type: attachment.mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: base64Data,
          },
        },
      };
    }

    // Extract text from documents and send as text block
    if (isDocument) {
      const fileBuffer = Buffer.from(base64Data, "base64");
      return extractAndFormatDocument(
        fileBuffer,
        attachment.mimeType,
        attachment.fileName,
        attachment.size,
      );
    }

    return {
      success: false,
      error: "File type not handled",
      fallbackText: `[Attachment: ${attachment.fileName} (${formatFileSize(attachment.size)})]`,
    };
  } catch (error) {
    logger.error("Error preparing file for AI", error, {
      component: "fileProcessor",
      fileName: attachment.fileName,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      fallbackText: `[Attachment: ${attachment.fileName} (${formatFileSize(attachment.size)})]`,
    };
  }
}

/**
 * Process a base64 file for AI analysis (no S3 download needed)
 */
export async function prepareBase64FileForAI(
  file: Base64File,
): Promise<FileProcessingResult> {
  try {
    // Validate file type and size constraints
    const validationError = validateFileForProcessing(
      file.mimeType,
      file.size,
      file.name,
    );
    if (validationError) return validationError;

    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.mimeType);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(file.mimeType);

    // Create content block for images
    if (isImage) {
      return {
        success: true,
        contentBlock: {
          type: "image",
          source: {
            type: "base64",
            media_type: file.mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: file.base64,
          },
        },
      };
    }

    // Extract text from documents and send as text block
    if (isDocument) {
      const fileBuffer = Buffer.from(file.base64, "base64");
      return extractAndFormatDocument(
        fileBuffer,
        file.mimeType,
        file.name,
        file.size,
      );
    }

    return {
      success: false,
      error: "File type not handled",
      fallbackText: `[Attachment: ${file.name} (${formatFileSize(file.size)})]`,
    };
  } catch (error) {
    logger.error("Error preparing base64 file for AI", error, {
      component: "fileProcessor",
      fileName: file.name,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      fallbackText: `[Attachment: ${file.name} (${formatFileSize(file.size)})]`,
    };
  }
}

/**
 * Process multiple base64 files for AI analysis
 * Uses parallel processing for better performance
 */
export async function prepareBase64FilesForAI(files: Base64File[]): Promise<{
  contentBlocks: BedrockContentBlock[];
  fallbackText: string;
  successCount: number;
  failureCount: number;
}> {
  const contentBlocks: BedrockContentBlock[] = [];
  const fallbackTexts: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process all files in parallel for better performance
  const results = await Promise.all(
    files.map((file) => prepareBase64FileForAI(file)),
  );

  // Process results
  results.forEach((result, index) => {
    if (result.success && result.contentBlock) {
      contentBlocks.push(result.contentBlock);
      successCount++;
    } else {
      if (result.fallbackText) {
        fallbackTexts.push(result.fallbackText);
      }
      failureCount++;

      logger.warn("Base64 file processing failed, using fallback", {
        component: "fileProcessor",
        fileName: files[index].name,
        error: result.error,
      });
    }
  });

  return {
    contentBlocks,
    fallbackText: fallbackTexts.join("\n"),
    successCount,
    failureCount,
  };
}

/**
 * Process multiple attachments for AI analysis
 * Returns content blocks and fallback text for failed files
 * Uses parallel processing for better performance
 * Supports optional caching to avoid re-downloading from S3
 */
export async function prepareAttachmentsForAI(
  attachments: FileAttachment[],
  sessionId?: string,
  useCache = true,
): Promise<{
  contentBlocks: BedrockContentBlock[];
  fallbackText: string;
  successCount: number;
  failureCount: number;
}> {
  const contentBlocks: BedrockContentBlock[] = [];
  const fallbackTexts: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process all attachments in parallel for better performance
  const results = await Promise.all(
    attachments.map((attachment) =>
      prepareFileForAI(attachment, sessionId, useCache),
    ),
  );

  // Process results
  results.forEach((result, index) => {
    if (result.success && result.contentBlock) {
      contentBlocks.push(result.contentBlock);
      successCount++;
    } else {
      if (result.fallbackText) {
        fallbackTexts.push(result.fallbackText);
      }
      failureCount++;

      logger.warn("File processing failed, using fallback", {
        component: "fileProcessor",
        fileName: attachments[index].fileName,
        error: result.error,
      });
    }
  });

  return {
    contentBlocks,
    fallbackText: fallbackTexts.join("\n"),
    successCount,
    failureCount,
  };
}
