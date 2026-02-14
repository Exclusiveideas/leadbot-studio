/**
 * Count words in a string
 * Splits by whitespace and filters empty strings
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
}

/**
 * Validate file upload for thumbnails
 */
export function validateThumbnailUpload(
  file: File,
  maxSizeBytes: number,
  allowedTypes: readonly string[],
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPG, PNG, or GIF images.",
    };
  }

  return { valid: true };
}
