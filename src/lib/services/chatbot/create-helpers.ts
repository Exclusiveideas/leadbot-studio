import type { CreateChatbotInput } from "@/lib/validation/chatbot";
import { createChatbotSchema } from "@/lib/validation/chatbot";
import { uploadFile, deleteFile } from "@/lib/storage/aws-server";

interface ParsedChatbotData {
  data: CreateChatbotInput;
  thumbnailFile: File | null;
}

/**
 * Parse and validate chatbot form data
 */
export async function parseChatbotFormData(
  formData: FormData,
): Promise<
  | { success: true; data: ParsedChatbotData }
  | { success: false; error: string; details?: unknown }
> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const persona = formData.get("persona") as string;
  const customInstructions = formData.get("customInstructions") as string;
  const welcomeMessage = formData.get("welcomeMessage") as string | null;
  const aiModel = formData.get("aiModel") as string;
  const allowedDomainsStr = formData.get("allowedDomains") as string;
  const thumbnail = formData.get("thumbnail");

  // Validate thumbnail is File or null
  let thumbnailFile: File | null = null;
  if (thumbnail) {
    if (!(thumbnail instanceof File)) {
      return {
        success: false,
        error: "Invalid thumbnail: must be a File",
      };
    }
    thumbnailFile = thumbnail;
  }

  // Parse allowed domains
  let allowedDomains: string[];
  try {
    allowedDomains = JSON.parse(allowedDomainsStr);
  } catch {
    return {
      success: false,
      error: "Invalid allowedDomains format",
    };
  }

  // Validate data with Zod
  const validation = createChatbotSchema.safeParse({
    name,
    description,
    persona,
    customInstructions,
    welcomeMessage: welcomeMessage || undefined,
    aiModel,
    allowedDomains,
  });

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid chatbot data",
      details: validation.error.issues,
    };
  }

  return {
    success: true,
    data: {
      data: validation.data,
      thumbnailFile,
    },
  };
}

/**
 * Upload thumbnail to S3
 * Returns S3 key on success, null if no file
 */
export async function uploadThumbnailToS3(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const s3Key = `chatbots/${Date.now()}-${file.name}`;
  await uploadFile(buffer, s3Key, file.type);
  return s3Key;
}

/**
 * Rollback thumbnail upload from S3
 * Safe to call with null (no-op)
 */
export async function rollbackThumbnail(s3Key: string | null): Promise<void> {
  if (!s3Key) return;

  try {
    await deleteFile(s3Key);
  } catch (error) {
    console.error("Failed to rollback S3 file:", s3Key, error);
    // Don't throw - this is best-effort cleanup
  }
}
