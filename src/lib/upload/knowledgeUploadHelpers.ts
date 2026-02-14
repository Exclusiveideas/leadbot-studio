/**
 * Helper functions for knowledge base file uploads
 * Simplified flow: presigned URL → S3 upload → Lambda processes automatically
 */

/**
 * Upload file to S3 using presigned POST
 */
export async function uploadToS3(
  file: File,
  presignedUrl: string,
  fields: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();

    // Add presigned fields first
    Object.keys(fields).forEach((key) => {
      formData.append(key, fields[key]);
    });

    // Add file last
    formData.append("file", file);

    // Upload to S3
    const response = await fetch(presignedUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `S3 upload failed: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get MIME type from file, with fallback based on extension
 * Browsers may return empty string for some file types like .md
 */
function getFileType(file: File): string {
  if (file.type) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    md: "text/markdown",
    txt: "text/plain",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    tiff: "image/tiff",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}

/**
 * Get presigned upload URL from API
 */
export async function getPresignedUploadUrl(
  chatbotId: string,
  file: File,
): Promise<{
  knowledgeSource: any;
  upload: { url: string; fields: Record<string, string>; s3Key: string };
}> {
  const response = await fetch(
    `/api/chatbots/${chatbotId}/knowledge/presigned-upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: getFileType(file),
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  return await response.json();
}
