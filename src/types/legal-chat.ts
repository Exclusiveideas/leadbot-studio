export interface GenerateChatSession {
  id: string;
  userId: string;
  caseId?: string | null;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface FileAttachment {
  fileName: string;
  s3Key: string | null;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Base64File {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
}

export interface GenerateChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "USER" | "ASSISTANT";
  content: string;
  attachments?: FileAttachment[] | null;
  tokensUsed?: number | null;
  processingTime?: number | null;
  createdAt: string;
  status:
    | "pending"
    | "sending"
    | "sent"
    | "processing"
    | "completed"
    | "failed";
  localId?: string;
}

export interface LegalChatRequest {
  message: string;
  sessionId: string;
  attachments?: FileAttachment[]; // S3-based attachments (for conversation history - DEPRECATED)
  files?: Base64File[]; // Base64 files (for new messages)
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    attachments?: FileAttachment[]; // S3-based attachments for each message in history
  }>;
}

export interface LegalChatResponse {
  message: string;
  sessionId: string;
  messageId: string;
  tokensUsed?: number;
  processingTime?: number;
}

export interface LegalChatError {
  code: string;
  message: string;
  details?: string;
  suggestions?: string[];
}

export interface LegalChatStreamEvent {
  type: "start" | "content" | "complete" | "error";
  content?: string;
  messageId?: string;
  tokensUsed?: number;
  processingTime?: number;
  error?: LegalChatError;
}
