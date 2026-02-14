import type { UpdateChatbotInput } from "@/lib/validation/chatbot";
import { updateChatbotSchema } from "@/lib/validation/chatbot";
import { uploadFile, deleteFile } from "@/lib/storage/aws-server";

interface ParsedUpdateChatbotData {
  data: UpdateChatbotInput;
  thumbnailFile: File | null;
}

/**
 * Parse and validate chatbot form data for updates
 */
export async function parseUpdateChatbotFormData(
  formData: FormData,
): Promise<
  | { success: true; data: ParsedUpdateChatbotData }
  | { success: false; error: string; details?: unknown }
> {
  const name = formData.get("name") as string | null;
  const description = formData.get("description") as string | null;
  const persona = formData.get("persona") as string | null;
  const customInstructions = formData.get("customInstructions") as
    | string
    | null;
  const welcomeMessage = formData.get("welcomeMessage") as string | null;
  const chatGreeting = formData.get("chatGreeting") as string | null;
  const aiModel = formData.get("aiModel") as string | null;
  const allowedDomainsStr = formData.get("allowedDomains") as string | null;
  const appearanceStr = formData.get("appearance") as string | null;
  const suggestedQuestionsStr = formData.get("suggestedQuestions") as
    | string
    | null;
  const statusStr = formData.get("status") as string | null;
  const calendlyLink = formData.get("calendlyLink") as string | null;
  const bookingConfigStr = formData.get("bookingConfig") as string | null;
  const textConfigStr = formData.get("textConfig") as string | null;
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

  // Parse optional allowed domains
  let allowedDomains: string[] | undefined;
  if (allowedDomainsStr) {
    try {
      allowedDomains = JSON.parse(allowedDomainsStr);
    } catch {
      return {
        success: false,
        error: "Invalid allowedDomains format",
      };
    }
  }

  // Parse optional appearance
  let appearance: { primaryColor: string; accentColor: string } | undefined;
  if (appearanceStr) {
    try {
      appearance = JSON.parse(appearanceStr);
    } catch {
      return {
        success: false,
        error: "Invalid appearance format",
      };
    }
  }

  // Parse optional suggested questions
  let suggestedQuestions: string[] | undefined;
  if (suggestedQuestionsStr) {
    try {
      suggestedQuestions = JSON.parse(suggestedQuestionsStr);
    } catch {
      return {
        success: false,
        error: "Invalid suggestedQuestions format",
      };
    }
  }

  // Parse optional status
  let status: "DRAFT" | "PUBLISHED" | undefined;
  if (statusStr && (statusStr === "DRAFT" || statusStr === "PUBLISHED")) {
    status = statusStr;
  }

  // Parse optional booking config
  let bookingConfig: Record<string, unknown> | undefined;
  if (bookingConfigStr) {
    try {
      bookingConfig = JSON.parse(bookingConfigStr);
    } catch {
      return {
        success: false,
        error: "Invalid bookingConfig format",
      };
    }
  }

  // Parse optional text config
  let textConfig: Record<string, unknown> | undefined;
  if (textConfigStr) {
    try {
      textConfig = JSON.parse(textConfigStr);
    } catch {
      return {
        success: false,
        error: "Invalid textConfig format",
      };
    }
  }

  // Build update data object with only provided fields
  // Use !== null to allow empty strings (users should be able to clear fields)
  const updateData: UpdateChatbotInput = {};
  if (name !== null) updateData.name = name;
  if (description !== null) updateData.description = description;
  if (persona !== null) updateData.persona = persona;
  if (customInstructions !== null)
    updateData.customInstructions = customInstructions;
  if (welcomeMessage !== null) updateData.welcomeMessage = welcomeMessage;
  if (chatGreeting !== null) updateData.chatGreeting = chatGreeting;
  if (aiModel !== null) updateData.aiModel = aiModel;
  if (allowedDomains) updateData.allowedDomains = allowedDomains;
  if (appearance) updateData.appearance = appearance;
  if (suggestedQuestions) updateData.suggestedQuestions = suggestedQuestions;
  if (status) updateData.status = status;
  if (calendlyLink !== null) updateData.calendlyLink = calendlyLink;
  if (bookingConfig)
    updateData.bookingConfig =
      bookingConfig as UpdateChatbotInput["bookingConfig"];
  if (textConfig)
    updateData.textConfig = textConfig as UpdateChatbotInput["textConfig"];

  // Validate data with Zod
  const validation = updateChatbotSchema.safeParse(updateData);

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
