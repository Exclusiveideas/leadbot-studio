import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for server-side usage in Next.js
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Validate required environment variables
if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !BUCKET_NAME
) {
  console.warn(
    "Missing AWS environment variables. Document download functionality will be limited.",
  );
}

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Delete a file from AWS S3
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (!BUCKET_NAME) {
      console.error("AWS S3 bucket name not configured");
      return false;
    }

    // Sanitize the file path to remove any s3:// URI prefix
    const cleanPath = sanitizeS3Path(filePath);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanPath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("S3 delete error:", error);
    return false;
  }
}

/**
 * Sanitize S3 path by removing s3://bucket-name/ prefix if present
 */
function sanitizeS3Path(filePath: string): string {
  // Remove s3://bucket-name/ prefix if present
  // This handles cases where Lambda or other processes incorrectly store the full S3 URI
  const s3UriPattern = /^s3:\/\/[^\/]+\//;
  const cleanPath = filePath.replace(s3UriPattern, "");

  // Log if we had to clean the path (for debugging)
  if (cleanPath !== filePath) {
    console.log(`[S3] Sanitized path from "${filePath}" to "${cleanPath}"`);
  }

  return cleanPath;
}

/**
 * Generate a signed URL for downloading a file
 */
export async function getSignedDownloadUrl(
  filePath: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  try {
    if (!BUCKET_NAME) {
      console.error("AWS S3 bucket name not configured");
      return null;
    }

    // Sanitize the file path to remove any s3:// URI prefix
    const cleanPath = sanitizeS3Path(filePath);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanPath,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    if (!BUCKET_NAME) {
      return false;
    }

    // Sanitize the file path to remove any s3:// URI prefix
    const cleanPath = sanitizeS3Path(filePath);

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanPath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * List all files for a specific case
 */
export async function listCaseFiles(caseId: string): Promise<any[] | null> {
  try {
    if (!BUCKET_NAME) {
      return null;
    }

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `cases/${caseId}/`,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error("Error listing case files:", error);
    return null;
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(filePath: string) {
  try {
    if (!BUCKET_NAME) {
      return null;
    }

    // Sanitize the file path to remove any s3:// URI prefix
    const cleanPath = sanitizeS3Path(filePath);

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanPath,
    });

    const response = await s3Client.send(command);
    return {
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error("Error getting file metadata:", error);
    return null;
  }
}

/**
 * Check if the S3 bucket is accessible
 */
export async function getBucketStatus(): Promise<{
  accessible: boolean;
  error?: string;
}> {
  try {
    if (!BUCKET_NAME) {
      return {
        accessible: false,
        error: "S3 bucket name not configured",
      };
    }

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });

    await s3Client.send(command);
    return { accessible: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("S3 bucket accessibility check failed:", errorMessage);
    return {
      accessible: false,
      error: errorMessage,
    };
  }
}

/**
 * Get public URL for a file (for public buckets only)
 */
export function getPublicUrl(filePath: string): string {
  if (!BUCKET_NAME || !process.env.AWS_REGION) {
    throw new Error("Missing AWS configuration for public URL generation");
  }
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
}

/**
 * Upload a file to S3
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<void> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
}

/**
 * Create presigned POST URL for direct client-side uploads
 */
export async function createPresignedPostUrl(
  key: string,
  contentType: string,
  maxSizeBytes: number,
  expiresIn: number = 300,
): Promise<{ url: string; fields: Record<string, string> }> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: BUCKET_NAME,
      Key: key,
      Conditions: [
        ["content-length-range", 0, maxSizeBytes],
        ["eq", "$Content-Type", contentType],
        ["eq", "$x-amz-server-side-encryption", "AES256"], // Required by bucket policy
      ],
      Fields: {
        "Content-Type": contentType,
        "x-amz-server-side-encryption": "AES256", // Required by bucket policy
      },
      Expires: expiresIn,
    });

    return { url, fields };
  } catch (error) {
    console.error("Error creating presigned POST URL:", error);
    throw error;
  }
}
