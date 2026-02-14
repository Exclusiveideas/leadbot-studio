import { useEffect, useState, useCallback, useRef } from "react";
import { realtimeLogger } from "@/lib/utils/logger";
import ChatbotKnowledgeSSEManager from "@/lib/sse/ChatbotKnowledgeSSEManager";

interface ChatbotKnowledge {
  id: string;
  chatbotId: string;
  type: string;
  title: string;
  content: string;
  s3Key?: string;
  chunkCount: number;
  status: string;
  stage?: string;
  progress?: number;
  processedChunks?: number;
  totalChunks?: number;
  failedChunks?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
}

interface UseChatbotKnowledgeOptions {
  chatbotId: string;
  enabled?: boolean;
  onKnowledgeUpdate?: (knowledge: ChatbotKnowledge) => void;
  onAllCompleted?: () => void;
  includeCompleted?: boolean;
}

interface UseChatbotKnowledgeReturn {
  knowledge: ChatbotKnowledge[];
  isConnected: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  activeCount: number;
  completedCount: number;
  failedCount: number;
}

export function useChatbotKnowledge({
  chatbotId,
  enabled = true,
  onKnowledgeUpdate,
  onAllCompleted,
  includeCompleted = false,
}: UseChatbotKnowledgeOptions): UseChatbotKnowledgeReturn {
  const [knowledge, setKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Store callbacks in refs to avoid effect re-runs
  const onKnowledgeUpdateRef = useRef(onKnowledgeUpdate);
  const onAllCompletedRef = useRef(onAllCompleted);

  // Update refs when props change
  onKnowledgeUpdateRef.current = onKnowledgeUpdate;
  onAllCompletedRef.current = onAllCompleted;

  // Handle data updates from SSE manager
  const handleDataUpdate = useCallback(
    (items: ChatbotKnowledge[], connected: boolean, err: string | null) => {
      setKnowledge(items);
      setIsConnected(connected);
      setError(err);
    },
    [],
  );

  // Handle individual knowledge updates
  const handleKnowledgeUpdate = useCallback((knowledge: ChatbotKnowledge) => {
    if (onKnowledgeUpdateRef.current) {
      onKnowledgeUpdateRef.current(knowledge);
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    realtimeLogger.debug(
      `[ChatbotKnowledge] Manual refresh triggered for chatbot ${chatbotId}`,
    );
    if (chatbotId) {
      ChatbotKnowledgeSSEManager.getInstance().refresh(chatbotId);
    }
  }, [chatbotId]);

  // Main effect for SSE subscription
  useEffect(() => {
    if (!chatbotId || !enabled) {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setKnowledge([]);
      setIsConnected(false);
      setError(null);
      return;
    }

    realtimeLogger.debug(
      `[ChatbotKnowledge] Starting SSE subscription for chatbot ${chatbotId}`,
    );

    // Create unique subscription ID
    subscriptionIdRef.current = `${chatbotId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Subscribe to SSE manager
    const unsubscribe = ChatbotKnowledgeSSEManager.getInstance().subscribe({
      id: subscriptionIdRef.current,
      chatbotId,
      includeCompleted,
      onKnowledgeUpdate: handleKnowledgeUpdate,
      onAllCompleted: onAllCompletedRef.current,
      onDataUpdate: handleDataUpdate,
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      realtimeLogger.debug(
        `[ChatbotKnowledge] Cleaning up SSE subscription for chatbot ${chatbotId}`,
      );
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    chatbotId,
    enabled,
    includeCompleted,
    handleDataUpdate,
    handleKnowledgeUpdate,
  ]);

  // Effect to check for all knowledge items completion
  useEffect(() => {
    const failedStatuses = ["FAILED"];
    const activeKnowledge = knowledge.filter(
      (k) => k.status !== "COMPLETED" && !failedStatuses.includes(k.status),
    );

    if (
      activeKnowledge.length === 0 &&
      knowledge.length > 0 &&
      onAllCompletedRef.current
    ) {
      realtimeLogger.debug(
        "[ChatbotKnowledge] All knowledge items completed or failed",
      );
      onAllCompletedRef.current();
    }
  }, [knowledge]);

  const activeCount = knowledge.filter(
    (k) => !["COMPLETED", "FAILED"].includes(k.status),
  ).length;

  const completedCount = knowledge.filter(
    (k) => k.status === "COMPLETED",
  ).length;

  const failedCount = knowledge.filter((k) => k.status === "FAILED").length;

  return {
    knowledge,
    isConnected,
    error,
    refresh,
    activeCount,
    completedCount,
    failedCount,
  };
}
