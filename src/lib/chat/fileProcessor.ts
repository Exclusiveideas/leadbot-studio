import type { FileAttachment, Base64File } from "@/types/legal-chat";
import type { BedrockContentBlock } from "@/types/bedrock";
import { downloadAndEncodeBase64 } from "@/lib/storage/s3Download";
import { logger } from "@/lib/utils/logger";
import { extractTextFromFile, truncateText } from "./textExtractor";
import { attachmentCache } from "@/lib/utils/attachmentCache";
import {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
  validateFileForProcessing,
  formatFileSize,
} from "./fileUtils";
import type { FileProcessingResult } from "./fileUtils";

export type { FileProcessingResult };

const MAX_TEXT_LENGTH = 100_000; // ~100K chars ≈ 25K tokens

async function extractAndFormatDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  size: number,
): Promise<FileProcessingResult> {
  const extraction = await extractTextFromFile(fileBuffer, mimeType, fileName);

  if (extraction.success && extraction.text) {
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

export async function prepareFileForAI(
  attachment: FileAttachment,
  sessionId?: string,
  useCache = true,
): Promise<FileProcessingResult> {
  try {
    const validationError = validateFileForProcessing(
      attachment.mimeType,
      attachment.size,
      attachment.fileName,
    );
    if (validationError) return validationError;

    const isImage = SUPPORTED_IMAGE_TYPES.includes(attachment.mimeType);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(attachment.mimeType);

    let base64Data: string | undefined;

    if (useCache && sessionId && attachment.s3Key) {
      const cached = attachmentCache.getAttachment(sessionId, attachment.s3Key);
      if (cached) {
        base64Data = cached.base64;
      }
    }

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

export async function prepareBase64FileForAI(
  file: Base64File,
): Promise<FileProcessingResult> {
  try {
    const validationError = validateFileForProcessing(
      file.mimeType,
      file.size,
      file.name,
    );
    if (validationError) return validationError;

    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.mimeType);
    const isDocument = SUPPORTED_DOCUMENT_TYPES.includes(file.mimeType);

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

  const results = await Promise.all(
    files.map((file) => prepareBase64FileForAI(file)),
  );

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

  const results = await Promise.all(
    attachments.map((attachment) =>
      prepareFileForAI(attachment, sessionId, useCache),
    ),
  );

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
