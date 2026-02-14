import { z } from "zod";

/**
 * Message schema for conversation snapshot
 */
const messageSchema = z.object({
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().min(1).max(50000), // Max 50k chars per message
  createdAt: z.string().datetime(), // ISO timestamp
  localId: z.string().optional(),
});

/**
 * Conversation snapshot schema
 */
const conversationSnapshotSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, "At least one message is required")
    .max(500, "Maximum 500 messages allowed"), // Reasonable limit
  capturedAt: z.string().datetime(),
  sessionId: z.string().min(1),
});

/**
 * Type exports
 */
export type ConversationMessage = z.infer<typeof messageSchema>;
export type ConversationSnapshot = z.infer<typeof conversationSnapshotSchema>;

/**
 * Validate and sanitize conversation snapshot
 *
 * @param snapshot - Raw snapshot data from client
 * @returns Validated conversation snapshot object
 * @throws Error if validation fails with details
 */
export function validateConversationSnapshot(
  snapshot: unknown,
): ConversationSnapshot {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Invalid conversation snapshot: must be an object");
  }

  const validation = conversationSnapshotSchema.safeParse(snapshot);

  if (!validation.success) {
    const firstError = validation.error.issues[0];
    throw new Error(
      `Invalid conversation snapshot: ${firstError.path.join(".")} - ${firstError.message}`,
    );
  }

  return validation.data;
}
