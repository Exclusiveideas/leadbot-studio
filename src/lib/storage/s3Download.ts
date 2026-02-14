import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/utils/logger";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Validate required environment variables
const missingVars = [];
if (!process.env.AWS_REGION) missingVars.push("AWS_REGION");
if (!process.env.AWS_ACCESS_KEY_ID) missingVars.push("AWS_ACCESS_KEY_ID");
if (!process.env.AWS_SECRET_ACCESS_KEY)
  missingVars.push("AWS_SECRET_ACCESS_KEY");
if (!BUCKET_NAME) missingVars.push("AWS_S3_BUCKET_NAME");

if (missingVars.length > 0) {
  logger.error("Missing AWS environment variables", undefined, {
    component: "s3Download",
    missingVars,
  });
}

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}

/**
 * Download a file from S3 and return it as a Buffer
 */
export async function downloadFromS3(s3Key: string): Promise<DownloadResult> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return {
        success: false,
        error: "No file content received from S3",
      };
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      success: true,
      buffer,
      contentType: response.ContentType,
    };
  } catch (error) {
    logger.error("Failed to download file from S3", error, {
      component: "s3Download",
      s3Key,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Download file and convert to base64
 */
export async function downloadAndEncodeBase64(
  s3Key: string,
): Promise<{
  success: boolean;
  base64?: string;
  contentType?: string;
  error?: string;
}> {
  const downloadResult = await downloadFromS3(s3Key);

  if (!downloadResult.success || !downloadResult.buffer) {
    return {
      success: false,
      error: downloadResult.error,
    };
  }

  try {
    const base64 = downloadResult.buffer.toString("base64");

    return {
      success: true,
      base64,
      contentType: downloadResult.contentType,
    };
  } catch (error) {
    logger.error("Failed to encode file to base64", error, {
      component: "s3Download",
      s3Key,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Base64 encoding failed",
    };
  }
}
