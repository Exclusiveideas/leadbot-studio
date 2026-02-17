import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const TABLES = {
  KNOWLEDGE: process.env.SUPABASE_TABLE_KNOWLEDGE || "chatbot_knowledge",
} as const;

export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "QUEUED"
  | "RETRYING";

export type KnowledgeProcessingStage =
  | "QUEUED"
  | "EXTRACTING_TEXT"
  | "TEXT_EXTRACTED"
  | "CHUNKING_TEXT"
  | "GENERATING_EMBEDDINGS"
  | "STORING_VECTORS"
  | "COMPLETED";

export interface KnowledgeUpdate {
  status?: ProcessingStatus;
  stage?: KnowledgeProcessingStage;
  progress?: number;
  totalChunks?: number;
  processedChunks?: number;
  failedChunks?: number;
  processingError?: string | null;
  retryCount?: number;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  extractedText?: string | null;
  processedAt?: string;
  chunkCount?: number;
  metadata?: Record<string, any>;
}

export async function getKnowledge(
  knowledgeId: string,
): Promise<{ id: string; chatbotId: string; retryCount: number; maxRetries: number } | null> {
  const { data, error } = await supabase
    .from(TABLES.KNOWLEDGE)
    .select("id, chatbotId, retryCount, maxRetries")
    .eq("id", knowledgeId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateKnowledge(
  knowledgeId: string,
  data: KnowledgeUpdate,
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.KNOWLEDGE)
    .update(data)
    .eq("id", knowledgeId);

  if (error) {
    throw new Error(`Failed to update knowledge: ${error.message}`);
  }
}
