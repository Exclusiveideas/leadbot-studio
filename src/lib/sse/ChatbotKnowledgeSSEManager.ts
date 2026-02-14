import { realtimeLogger } from "@/lib/utils/logger";

interface ChatbotKnowledge {
  id: string;
  chatbotId: string;
  type: string;
  title: string;
  content: string;
  s3Key?: string;
  chunkCount: number;
  status: string; // PENDING, PROCESSING, QUEUED, COMPLETED, FAILED
  stage?: string; // UPLOAD, EXTRACTION, EMBEDDING, INDEXING
  progress?: number; // 0-100
  processedChunks?: number;
  totalChunks?: number;
  failedChunks?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
}

interface SSEEvent {
  eventType: string;
  knowledge?: ChatbotKnowledge;
  knowledgeItems?: ChatbotKnowledge[];
  count?: number;
  status?: string;
  channelName?: string;
  error?: string;
  timestamp?: string;
}

interface HookSubscription {
  id: string;
  chatbotId: string;
  includeCompleted: boolean;
  onKnowledgeUpdate?: (knowledge: ChatbotKnowledge) => void;
  onAllCompleted?: () => void;
  onDataUpdate: (
    knowledge: ChatbotKnowledge[],
    isConnected: boolean,
    error: string | null,
  ) => void;
}

class ChatbotKnowledgeSSEManager {
  private static instance: ChatbotKnowledgeSSEManager | null = null;
  private connections: Map<string, EventSource> = new Map();
  private subscriptions: Map<string, HookSubscription> = new Map();
  private chatbotData: Map<
    string,
    {
      knowledge: ChatbotKnowledge[];
      isConnected: boolean;
      error: string | null;
    }
  > = new Map();
  private connectionRefCount: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ChatbotKnowledgeSSEManager {
    if (!this.instance) {
      this.instance = new ChatbotKnowledgeSSEManager();
    }
    return this.instance;
  }

  subscribe(subscription: HookSubscription): () => void {
    realtimeLogger.debug(
      `[ChatbotKnowledge SSEManager] Subscribing hook ${subscription.id} for chatbot ${subscription.chatbotId}`,
    );

    this.subscriptions.set(subscription.id, subscription);

    // Increment ref count for this chatbot
    const currentRefCount =
      this.connectionRefCount.get(subscription.chatbotId) || 0;
    this.connectionRefCount.set(subscription.chatbotId, currentRefCount + 1);

    // Start SSE connection if this is the first subscription for this chatbot
    if (currentRefCount === 0) {
      this.startSSEConnection(
        subscription.chatbotId,
        subscription.includeCompleted,
      );
    } else {
      // Send current data immediately if we already have it
      const chatbotData = this.chatbotData.get(subscription.chatbotId);
      if (chatbotData) {
        subscription.onDataUpdate(
          chatbotData.knowledge,
          chatbotData.isConnected,
          chatbotData.error,
        );
      }
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(subscription.id, subscription.chatbotId);
    };
  }

  private unsubscribe(subscriptionId: string, chatbotId: string) {
    realtimeLogger.debug(
      `[ChatbotKnowledge SSEManager] Unsubscribing hook ${subscriptionId} for chatbot ${chatbotId}`,
    );

    this.subscriptions.delete(subscriptionId);

    // Decrement ref count
    const currentRefCount = this.connectionRefCount.get(chatbotId) || 0;
    const newRefCount = Math.max(0, currentRefCount - 1);
    this.connectionRefCount.set(chatbotId, newRefCount);

    // Close SSE connection if no more subscriptions for this chatbot
    if (newRefCount === 0) {
      this.stopSSEConnection(chatbotId);
    }
  }

  private startSSEConnection(chatbotId: string, includeCompleted: boolean) {
    realtimeLogger.debug(
      `[ChatbotKnowledge SSEManager] Starting SSE connection for chatbot ${chatbotId}`,
    );

    // Initialize chatbot data
    this.chatbotData.set(chatbotId, {
      knowledge: [],
      isConnected: false,
      error: null,
    });

    const params = new URLSearchParams({
      includeCompleted: includeCompleted.toString(),
    });

    const eventSource = new EventSource(
      `/api/chatbots/${chatbotId}/knowledge/stream?${params.toString()}`,
    );
    this.connections.set(chatbotId, eventSource);

    eventSource.onopen = () => {
      realtimeLogger.debug(
        `[ChatbotKnowledge SSEManager] SSE connection opened for chatbot ${chatbotId}`,
      );
      this.updateChatbotData(chatbotId, { isConnected: true, error: null });
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        this.handleSSEEvent(chatbotId, data);
      } catch (error) {
        realtimeLogger.error(
          `[ChatbotKnowledge SSEManager] Error parsing SSE event for chatbot ${chatbotId}:`,
          error,
        );
        this.updateChatbotData(chatbotId, {
          error: "Failed to parse real-time event",
        });
      }
    };

    eventSource.onerror = (error) => {
      realtimeLogger.error(
        `[ChatbotKnowledge SSEManager] SSE error for chatbot ${chatbotId}:`,
        error,
      );
      this.updateChatbotData(chatbotId, {
        isConnected: false,
        error: "Real-time connection error",
      });

      // Auto-reconnect after 5 seconds if we still have subscriptions
      setTimeout(() => {
        const refCount = this.connectionRefCount.get(chatbotId) || 0;
        if (refCount > 0 && eventSource.readyState === EventSource.CLOSED) {
          realtimeLogger.debug(
            `[ChatbotKnowledge SSEManager] Attempting to reconnect SSE for chatbot ${chatbotId}`,
          );
          this.stopSSEConnection(chatbotId);
          this.startSSEConnection(chatbotId, includeCompleted);
        }
      }, 5000);
    };
  }

  private stopSSEConnection(chatbotId: string) {
    realtimeLogger.debug(
      `[ChatbotKnowledge SSEManager] Stopping SSE connection for chatbot ${chatbotId}`,
    );

    const eventSource = this.connections.get(chatbotId);
    if (eventSource) {
      eventSource.close();
      this.connections.delete(chatbotId);
    }

    this.chatbotData.delete(chatbotId);
  }

  private handleSSEEvent(chatbotId: string, data: SSEEvent) {
    realtimeLogger.debug(
      `[ChatbotKnowledge SSEManager] Handling ${data.eventType} event for chatbot ${chatbotId}`,
    );

    const chatbotData = this.chatbotData.get(chatbotId);
    if (!chatbotData) return;

    switch (data.eventType) {
      case "CONNECTED":
        this.updateChatbotData(chatbotId, { isConnected: true, error: null });
        break;

      case "INITIAL_DATA":
        if (data.knowledgeItems) {
          this.updateChatbotData(chatbotId, {
            knowledge: data.knowledgeItems,
            isConnected: true,
            error: null,
          });
        }
        break;

      case "SUBSCRIBED":
        realtimeLogger.debug(
          `[ChatbotKnowledge SSEManager] WebSocket subscribed for chatbot ${chatbotId}: ${data.status}`,
        );
        this.updateChatbotData(chatbotId, { isConnected: true, error: null });
        break;

      case "INSERT":
      case "UPDATE":
        if (data.knowledge) {
          this.handleKnowledgeUpdate(chatbotId, data.knowledge, data.eventType);
        }
        break;

      case "DELETE":
        if (data.knowledge) {
          this.handleKnowledgeDelete(chatbotId, data.knowledge.id);
        }
        break;

      case "ERROR":
        this.updateChatbotData(chatbotId, {
          error: data.error || "Unknown real-time error",
          isConnected: false,
        });
        break;

      default:
        realtimeLogger.debug(
          `[ChatbotKnowledge SSEManager] Unknown event type: ${data.eventType}`,
        );
    }
  }

  private handleKnowledgeUpdate(
    chatbotId: string,
    knowledge: ChatbotKnowledge,
    eventType: string,
  ) {
    const chatbotData = this.chatbotData.get(chatbotId);
    if (!chatbotData) return;

    let updatedKnowledge = [...chatbotData.knowledge];
    const existingIndex = updatedKnowledge.findIndex(
      (k) => k.id === knowledge.id,
    );

    if (eventType === "INSERT" && existingIndex === -1) {
      // Add new knowledge item
      updatedKnowledge.unshift(knowledge);
    } else if (eventType === "UPDATE" && existingIndex !== -1) {
      // Update existing knowledge item
      updatedKnowledge[existingIndex] = knowledge;
    } else if (eventType === "INSERT" && existingIndex !== -1) {
      // Knowledge item already exists, update it instead
      updatedKnowledge[existingIndex] = knowledge;
    }

    this.updateChatbotData(chatbotId, { knowledge: updatedKnowledge });

    // Notify individual knowledge update callbacks
    this.notifyKnowledgeUpdate(chatbotId, knowledge);
  }

  private handleKnowledgeDelete(chatbotId: string, knowledgeId: string) {
    const chatbotData = this.chatbotData.get(chatbotId);
    if (!chatbotData) return;

    const updatedKnowledge = chatbotData.knowledge.filter(
      (k) => k.id !== knowledgeId,
    );
    this.updateChatbotData(chatbotId, { knowledge: updatedKnowledge });
  }

  private updateChatbotData(
    chatbotId: string,
    updates: Partial<{
      knowledge: ChatbotKnowledge[];
      isConnected: boolean;
      error: string | null;
    }>,
  ) {
    const chatbotData = this.chatbotData.get(chatbotId);
    if (!chatbotData) return;

    const newChatbotData = { ...chatbotData, ...updates };
    this.chatbotData.set(chatbotId, newChatbotData);

    // Notify all subscriptions for this chatbot
    this.subscriptions.forEach((subscription) => {
      if (subscription.chatbotId === chatbotId) {
        subscription.onDataUpdate(
          newChatbotData.knowledge,
          newChatbotData.isConnected,
          newChatbotData.error,
        );
      }
    });
  }

  private notifyKnowledgeUpdate(
    chatbotId: string,
    knowledge: ChatbotKnowledge,
  ) {
    this.subscriptions.forEach((subscription) => {
      if (
        subscription.chatbotId === chatbotId &&
        subscription.onKnowledgeUpdate
      ) {
        subscription.onKnowledgeUpdate(knowledge);
      }
    });
  }

  // Public method to manually refresh data
  refresh(chatbotId: string): void {
    const eventSource = this.connections.get(chatbotId);
    if (eventSource) {
      // Close and reconnect
      this.stopSSEConnection(chatbotId);
      const refCount = this.connectionRefCount.get(chatbotId) || 0;
      if (refCount > 0) {
        this.startSSEConnection(chatbotId, true); // Default to including completed
      }
    }
  }

  // Get current data for a chatbot
  getCurrentData(chatbotId: string) {
    return (
      this.chatbotData.get(chatbotId) || {
        knowledge: [],
        isConnected: false,
        error: null,
      }
    );
  }
}

export default ChatbotKnowledgeSSEManager;
