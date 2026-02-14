"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DynamicLeadFormData } from "@/components/chatbots/DynamicLeadCaptureForm";

export type MessageStatus =
  | "pending"
  | "sending"
  | "sent"
  | "processing"
  | "completed"
  | "failed";

export interface ChatbotConversation {
  id: string;
  title: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface SourceReference {
  id: string;
  name: string;
  type: string;
  pageNumber?: number;
  relevanceScore?: number;
}

export interface FileAttachment {
  fileName: string;
  s3Key: string | null;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ChatbotMessage {
  id: string;
  localId?: string;
  role: "USER" | "ASSISTANT";
  content: string;
  status?: MessageStatus;
  tokensUsed?: number | null;
  processingTime?: number | null;
  createdAt: string;
  sources?: SourceReference[];
  attachments?: FileAttachment[];
}

interface UseChatbotChatOptions {
  chatbotId: string;
  userId: string;
}

export type LeadCaptureState = "not_shown" | "shown" | "captured";

// Lead capture is now AI-driven via tool calling
// The AI decides when to show the form based on conversation context
// Old keyword matching removed in favor of intelligent AI triggers

export function useChatbotChat({ chatbotId, userId }: UseChatbotChatOptions) {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadCaptureState, setLeadCaptureState] =
    useState<LeadCaptureState>("not_shown");

  // Track whether we just created a conversation and have optimistic messages to preserve
  const shouldPreserveOptimisticRef = useRef(false);

  const isLoading = isLoadingConversations || isLoadingMessages;

  // Derive currentConversation from conversations and selectedConversationId
  const currentConversation = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId) || null
    : null;

  // Load all conversations for the chatbot
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/conversations`);
      const data = await response.json();

      if (response.ok) {
        setConversations(data);
      } else {
        throw new Error(data.error || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load conversations",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, [chatbotId]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(
    async (conversationId: string, mergeWithOptimistic = false) => {
      setIsLoadingMessages(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations/${conversationId}/messages`,
        );
        const data = await response.json();

        if (response.ok) {
          if (mergeWithOptimistic) {
            // Merge DB messages with optimistic messages
            setMessages((prev) => {
              const optimisticMessages = prev.filter(
                (msg) => msg.id.startsWith("temp-") || msg.localId,
              );
              const dbMessages: ChatbotMessage[] = data;

              const dbMessageIds = new Set(dbMessages.map((msg) => msg.id));
              const uniqueOptimistic = optimisticMessages.filter(
                (msg) => !dbMessageIds.has(msg.id),
              );

              return [...dbMessages, ...uniqueOptimistic];
            });
          } else {
            setMessages(data);
          }
        } else {
          throw new Error(data.error || "Failed to load messages");
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load messages",
        );
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [chatbotId],
  );

  // Create a new conversation
  const createConversation = useCallback(
    async (title?: string): Promise<string | null> => {
      setError(null);

      try {
        // Mark that we should preserve optimistic messages on next load
        shouldPreserveOptimisticRef.current = true;

        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: title || "New Chat",
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setConversations((prev) => [
            {
              id: data.id,
              title: data.title,
              startedAt: data.startedAt,
              lastMessageAt: data.lastMessageAt,
              messageCount: 0,
            },
            ...prev,
          ]);
          setSelectedConversationId(data.id);
          return data.id;
        } else {
          shouldPreserveOptimisticRef.current = false;
          throw new Error(data.error || "Failed to create conversation");
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
        shouldPreserveOptimisticRef.current = false;
        setError(
          error instanceof Error
            ? error.message
            : "Failed to create conversation",
        );
        return null;
      }
    },
    [chatbotId],
  );

  // Add optimistic message (appears immediately)
  const addOptimisticMessage = useCallback(
    (
      role: "USER" | "ASSISTANT",
      content: string,
      localId: string,
      attachments?: FileAttachment[],
    ) => {
      const optimisticMessage: ChatbotMessage = {
        id: `temp-${localId}`,
        localId,
        role,
        content,
        status: "pending",
        tokensUsed: null,
        processingTime: null,
        createdAt: new Date().toISOString(),
        attachments,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      return optimisticMessage;
    },
    [],
  );

  // Update message status
  const updateMessageStatus = useCallback(
    (messageId: string, status: MessageStatus, realId?: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId || msg.localId === messageId) {
            return {
              ...msg,
              status,
              ...(realId && { id: realId }),
            };
          }
          return msg;
        }),
      );
    },
    [],
  );

  // Update message
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatbotMessage>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId || msg.localId === messageId
            ? { ...msg, ...updates }
            : msg,
        ),
      );
    },
    [],
  );

  // Save optimistic message to database and return real ID
  const saveOptimisticMessage = useCallback(
    async (
      conversationId: string,
      role: "USER" | "ASSISTANT",
      content: string,
      localId: string,
      tokensUsed?: number | null,
      processingTime?: number | null,
    ): Promise<string | null> => {
      setError(null);

      try {
        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role,
              content,
              localId,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          // Update optimistic message with real ID and status from API
          setMessages((prev) =>
            prev.map((msg) =>
              msg.localId === localId
                ? {
                    ...msg,
                    id: data.id,
                    status: data.status as MessageStatus,
                    tokensUsed: tokensUsed ?? msg.tokensUsed,
                    processingTime: processingTime ?? msg.processingTime,
                  }
                : msg,
            ),
          );

          return data.id;
        } else {
          throw new Error(data.error || "Failed to save message");
        }
      } catch (error) {
        console.error("Failed to save message:", error);
        setError(
          error instanceof Error ? error.message : "Failed to save message",
        );

        // Mark message as failed
        updateMessageStatus(localId, "failed");
        return null;
      }
    },
    [chatbotId, updateMessageStatus],
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations/${conversationId}`,
          {
            method: "DELETE",
          },
        );

        const data = await response.json();

        if (response.ok) {
          setConversations((prev) =>
            prev.filter((c) => c.id !== conversationId),
          );
          if (conversationId === selectedConversationId) {
            setMessages([]);
            setSelectedConversationId(null);
          }
          return true;
        } else {
          throw new Error(data.error || "Failed to delete conversation");
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete conversation",
        );
        return false;
      }
    },
    [chatbotId, selectedConversationId],
  );

  // Rename a conversation
  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations/${conversationId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: newTitle,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, title: data.title } : c,
            ),
          );
          return true;
        } else {
          throw new Error(data.error || "Failed to rename conversation");
        }
      } catch (error) {
        console.error("Failed to rename conversation:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to rename conversation",
        );
        return false;
      }
    },
    [chatbotId],
  );

  // Generate conversation title based on first message exchange
  const generateConversationTitle = useCallback(
    async (conversationId: string, userMessage: string): Promise<void> => {
      try {
        // Use simple title generation based on first user message
        const title = userMessage.substring(0, 50).trim();
        if (title && title !== "New Chat") {
          await renameConversation(conversationId, title);
        }
      } catch (error) {
        // Silent failure - default title remains
        console.error("Failed to generate conversation title:", error);
      }
    },
    [renameConversation],
  );

  // Capture a lead
  const captureLead = useCallback(
    async (
      conversationId: string,
      formData: DynamicLeadFormData,
    ): Promise<boolean> => {
      setError(null);

      try {
        const response = await fetch(
          `/api/chatbots/${chatbotId}/conversations/${conversationId}/capture-lead`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ formData }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setLeadCaptureState("captured");
          return true;
        } else {
          throw new Error(data.error || "Failed to capture lead");
        }
      } catch (error) {
        console.error("Failed to capture lead:", error);
        setError(
          error instanceof Error ? error.message : "Failed to capture lead",
        );
        return false;
      }
    },
    [chatbotId],
  );

  // Show lead capture form
  const showLeadCaptureForm = useCallback(() => {
    setLeadCaptureState("shown");
  }, []);

  // Hide lead capture form
  const hideLeadCaptureForm = useCallback(() => {
    setLeadCaptureState("not_shown");
  }, []);

  // Reset lead capture state when conversation changes
  useEffect(() => {
    setLeadCaptureState("not_shown");
  }, [selectedConversationId]);

  // Load conversations on mount
  useEffect(() => {
    if (chatbotId && userId) {
      loadConversations();
    }
  }, [chatbotId, userId, loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      // Use ref to determine if we should merge with optimistic messages
      const shouldMerge = shouldPreserveOptimisticRef.current;

      // Reset the ref after reading it
      shouldPreserveOptimisticRef.current = false;

      loadMessages(selectedConversationId, shouldMerge);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, loadMessages]);

  // Lead capture is now triggered by AI via tool calling
  // The frontend listens for "tool_call" events in SSE stream (see ChatbotChatInterface.tsx)
  // Old rule-based triggers removed - AI makes intelligent decisions based on conversation context

  return {
    // Data
    conversations,
    messages,
    currentConversation,
    selectedConversationId,
    isLoading,
    isLoadingConversations,
    isLoadingMessages,
    error,
    leadCaptureState,

    // Actions
    loadConversations,
    loadMessages,
    createConversation,
    addOptimisticMessage,
    saveOptimisticMessage,
    updateMessage,
    updateMessageStatus,
    deleteConversation,
    renameConversation,
    generateConversationTitle,
    setSelectedConversationId,
    captureLead,
    showLeadCaptureForm,
    hideLeadCaptureForm,
  };
}
