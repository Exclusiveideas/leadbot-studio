import type { KnowledgeType } from "@prisma/client";

// File type mappings
export const VALID_MIME_TYPES: Record<string, KnowledgeType> = {
  "application/pdf": "DOCUMENT",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCUMENT",
  "text/plain": "DOCUMENT",
  "text/markdown": "DOCUMENT",
  "image/png": "DOCUMENT",
  "image/jpeg": "DOCUMENT",
  "image/jpg": "DOCUMENT",
  "image/tiff": "DOCUMENT",
};

// File size limits in bytes
export const FILE_SIZE_LIMITS: Record<string, number> = {
  PDF: 100 * 1024 * 1024, // 100MB
  DOCX: 50 * 1024 * 1024, // 50MB
  TXT: 50 * 1024 * 1024, // 50MB
  IMAGE: 100 * 1024 * 1024, // 100MB
  DEFAULT: 50 * 1024 * 1024, // 50MB default
};

/**
 * Detect source type from MIME type and filename
 */
export function detectSourceType(
  mimeType: string,
  fileName: string,
): KnowledgeType | null {
  // Try MIME type first
  if (VALID_MIME_TYPES[mimeType]) {
    return VALID_MIME_TYPES[mimeType];
  }

  // Fallback to extension (handles browser MIME type issues)
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.endsWith(".pdf")) return "DOCUMENT";
  if (lowerFileName.endsWith(".docx")) return "DOCUMENT";
  if (lowerFileName.endsWith(".txt")) return "DOCUMENT";
  if (lowerFileName.endsWith(".md")) return "DOCUMENT";
  if (
    lowerFileName.endsWith(".png") ||
    lowerFileName.endsWith(".jpg") ||
    lowerFileName.endsWith(".jpeg") ||
    lowerFileName.endsWith(".tiff")
  )
    return "DOCUMENT";

  return null;
}

/**
 * Get max file size for a given MIME type
 */
export function getMaxFileSize(mimeType: string, fileName: string): number {
  // Determine file category from MIME type and filename
  if (mimeType === "application/pdf") return FILE_SIZE_LIMITS.PDF;
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return FILE_SIZE_LIMITS.DOCX;
  if (mimeType === "text/plain") return FILE_SIZE_LIMITS.TXT;
  if (mimeType === "text/markdown") return FILE_SIZE_LIMITS.TXT;

  // Handle images with consistent logic
  const isImage =
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/tiff";

  if (isImage) return FILE_SIZE_LIMITS.IMAGE;

  // Fallback to filename extension
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.endsWith(".pdf")) return FILE_SIZE_LIMITS.PDF;
  if (lowerFileName.endsWith(".docx")) return FILE_SIZE_LIMITS.DOCX;
  if (lowerFileName.endsWith(".txt")) return FILE_SIZE_LIMITS.TXT;
  if (lowerFileName.endsWith(".md")) return FILE_SIZE_LIMITS.TXT;
  if (
    lowerFileName.endsWith(".png") ||
    lowerFileName.endsWith(".jpg") ||
    lowerFileName.endsWith(".jpeg") ||
    lowerFileName.endsWith(".tiff")
  ) {
    return FILE_SIZE_LIMITS.IMAGE;
  }

  return FILE_SIZE_LIMITS.DEFAULT;
}

/**
 * Validate file upload inputs
 */
export function validateFileUploadInputs(
  fileName: string,
  fileSize: number,
  fileType: string,
): { valid: boolean; error?: string } {
  // Validate fileName
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: "File name cannot be empty" };
  }

  if (fileName.length > 255) {
    return {
      valid: false,
      error: "File name is too long (max 255 characters)",
    };
  }

  // Validate fileSize
  if (typeof fileSize !== "number" || fileSize <= 0) {
    return { valid: false, error: "Invalid file size" };
  }

  if (fileSize > 200 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds maximum of 200MB" };
  }

  // Validate fileType
  if (!fileType || fileType.trim().length === 0) {
    return { valid: false, error: "File type cannot be empty" };
  }

  return { valid: true };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  fileName: string,
  fileSize: number,
  fileType: string,
): { valid: boolean; error?: string; sourceType?: KnowledgeType } {
  // Validate inputs first
  const inputValidation = validateFileUploadInputs(
    fileName,
    fileSize,
    fileType,
  );
  if (!inputValidation.valid) {
    return inputValidation;
  }

  // Detect source type
  const sourceType = detectSourceType(fileType, fileName);
  if (!sourceType) {
    return {
      valid: false,
      error:
        "Unsupported file type. Please upload PDF, DOCX, TXT, MD, or image files (PNG, JPG, TIFF).",
    };
  }

  // Check file size
  const maxSize = getMaxFileSize(fileType, fileName);
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit.`,
    };
  }

  return { valid: true, sourceType };
}

/**
 * Generate S3 key for chatbot knowledge file
 * Prevents path traversal attacks by sanitizing filename
 */
export function generateChatbotKnowledgeS3Key(
  chatbotId: string,
  sourceId: string,
  fileName: string,
): string {
  const timestamp = Date.now();

  // Prevent path traversal attacks
  const cleanFileName = fileName
    .replace(/\.\./g, "__") // Replace .. with __ to prevent parent directory access
    .replace(/\//g, "_") // Replace / with _ to prevent directory traversal
    .replace(/\\/g, "_") // Replace \ with _ to prevent Windows path traversal
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // Replace other special characters

  return `chatbots/knowledge/${chatbotId}/${sourceId}/${timestamp}-${cleanFileName}`;
}

/**
 * MIME type to expected extensions mapping for consistency validation
 * This prevents attacks where files are uploaded with mismatched MIME types
 */
const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/jpg": [".jpg", ".jpeg"],
  "image/tiff": [".tiff", ".tif"],
  "text/plain": [".txt", ".csv", ".md", ".markdown"], // text/plain is a generic type
  "text/markdown": [".md", ".markdown"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/csv": [".csv"],
  "application/zip": [".zip"],
};

/**
 * Extension to expected MIME types mapping (reverse lookup)
 */
const EXTENSION_TO_MIMES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/jpg"],
  ".jpeg": ["image/jpeg", "image/jpg"],
  ".tiff": ["image/tiff"],
  ".tif": ["image/tiff"],
  ".txt": ["text/plain"],
  ".md": ["text/markdown", "text/plain"],
  ".markdown": ["text/markdown", "text/plain"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ".csv": ["text/csv", "text/plain"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
};

type MimeExtensionValidationResult = {
  valid: boolean;
  warning?: string;
  error?: string;
  suggestedMime?: string;
};

/**
 * Validate that MIME type and file extension are consistent
 * This catches obvious mismatches without needing magic bytes
 *
 * @param mimeType - Claimed MIME type from upload
 * @param fileName - Filename with extension
 * @returns Validation result with potential warnings or errors
 */
export function validateMimeExtensionConsistency(
  mimeType: string,
  fileName: string,
): MimeExtensionValidationResult {
  const lowerMime = mimeType.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  // Extract extension
  const lastDotIndex = lowerFileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return {
      valid: true,
      warning: "File has no extension. MIME type cannot be verified.",
    };
  }

  const extension = lowerFileName.slice(lastDotIndex);

  // Check if MIME type allows this extension
  const allowedExtensions = MIME_TO_EXTENSIONS[lowerMime];
  if (allowedExtensions && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} does not match MIME type ${mimeType}. Expected: ${allowedExtensions.join(", ")}`,
    };
  }

  // Check if extension expects this MIME type
  const expectedMimes = EXTENSION_TO_MIMES[extension];
  if (expectedMimes && !expectedMimes.includes(lowerMime)) {
    // Some browsers send generic MIME types, allow with warning
    if (
      lowerMime === "application/octet-stream" ||
      lowerMime === "application/binary"
    ) {
      return {
        valid: true,
        warning: `Browser sent generic MIME type. Expected: ${expectedMimes[0]}`,
        suggestedMime: expectedMimes[0],
      };
    }

    return {
      valid: false,
      error: `MIME type ${mimeType} does not match file extension ${extension}. Expected MIME: ${expectedMimes.join(" or ")}`,
    };
  }

  return { valid: true };
}
