"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useChatSessionContext,
  type ChatSession,
} from "@/contexts/ChatSessionContext";
import type {
  AISearchResponse,
  SimplifiedAISearchResponse,
  AISearchError,
  ProgressEvent,
} from "@/types/ai-search";
import {
  getOrFetchSessionMessages,
  updateCacheWithNewMessage,
  updateCachedMessage,
  invalidateSessionCache,
} from "@/lib/services/ai/caseChatCacheService";

export type MessageStatus =
  | "pending"
  | "sent"
  | "processing"
  | "completed"
  | "failed";

export interface ChatMessage {
  id: string;
  question: string;
  response: AISearchResponse | SimplifiedAISearchResponse | null;
  error: AISearchError | null;
  progressEvents: ProgressEvent[];
  metadata: any;
  estimatedTokens?: number; // Pre-computed token count for fast budget calculations
  createdAt: string;
  status?: MessageStatus; // Optional for backward compatibility
  localId?: string; // For optimistic updates before server ID is available
  retryCount?: number; // Track retry attempts
}

export type { ChatSession } from "@/contexts/ChatSessionContext";

interface UseChatDatabaseOptions {
  caseId: string;
  sessionId: string | null;
}

// Constants for message deduplication
const MESSAGE_DEDUP_TIME_WINDOW_MS = 5000; // 5 seconds for race condition handling

/**
 * Pure function to determine if an optimistic message should be kept
 * (i.e., doesn't have a database counterpart)
 */
function shouldKeepOptimisticMessage(
  optimisticMsg: ChatMessage,
  dbMessages: ChatMessage[],
  dbMessageIds: Set<string>,
  dbMessageIdsByLocalId: Map<string, string>,
): boolean {
  if (!optimisticMsg.localId) return false; // Not an optimistic message

  // Skip if this optimistic message has a DB counterpart
  // Check by real ID match
  if (dbMessageIds.has(optimisticMsg.id)) return false;

  // Check by localId match
  if (dbMessageIdsByLocalId.has(optimisticMsg.localId)) return false;

  // Check if any DB message has the same question and was created around the same time
  // (within time window) - this handles race conditions
  const optimisticTime = new Date(optimisticMsg.createdAt).getTime();
  const hasMatchingDbMessage = dbMessages.some((dbMsg) => {
    const dbTime = new Date(dbMsg.createdAt).getTime();
    const timeDiff = Math.abs(optimisticTime - dbTime);
    return (
      dbMsg.question === optimisticMsg.question &&
      timeDiff < MESSAGE_DEDUP_TIME_WINDOW_MS
    );
  });

  return !hasMatchingDbMessage;
}

/**
 * Merge optimistic messages with database messages, removing duplicates
 */
function mergeOptimisticAndDbMessages(
  optimisticMessages: ChatMessage[],
  dbMessages: ChatMessage[],
): ChatMessage[] {
  const dbMessageIds = new Set(dbMessages.map((msg) => msg.id));
  const dbMessageIdsByLocalId = new Map<string, string>();

  // Build map of localId -> real ID from DB messages
  dbMessages.forEach((msg) => {
    if (msg.metadata?.localId) {
      dbMessageIdsByLocalId.set(msg.metadata.localId, msg.id);
    }
  });

  // Filter optimistic messages that don't have database counterparts
  const remainingOptimistic = optimisticMessages.filter((msg) =>
    shouldKeepOptimisticMessage(
      msg,
      dbMessages,
      dbMessageIds,
      dbMessageIdsByLocalId,
    ),
  );

  // Combine database messages with remaining optimistic messages
  // Sort by creation time to maintain chronological order
  const allMessages = [...dbMessages, ...remainingOptimistic];
  return allMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/**
 * Find the real (server) message ID from a list of messages.
 * Handles lookup by either message ID or localId.
 * Returns null if the message has a temp ID or isn't found.
 *
 * @param messages - List of messages to search
 * @param lookupId - The ID to look up (can be message ID or localId)
 * @param idMap - Optional synchronous map of localId -> realId for race condition handling
 */
export function findRealMessageId(
  messages: ChatMessage[],
  lookupId: string,
  idMap?: Map<string, string>,
): string | null {
  // First check the synchronous map (handles race condition where React state
  // hasn't updated yet but addMessage has already returned the real ID)
  if (idMap?.has(lookupId)) {
    return idMap.get(lookupId)!;
  }

  const msg = messages.find((m) => m.id === lookupId || m.localId === lookupId);
  if (!msg) return null;
  return msg.id.startsWith("temp-") ? null : msg.id;
}

/**
 * Check if a message matches the active message ID.
 * Handles the ID transition from temp-* to real server ID.
 */
export function isMessageActive(
  message: ChatMessage,
  activeMessageId: string | null,
): boolean {
  if (!activeMessageId) return false;
  // Direct ID match (before DB save updates the ID)
  if (activeMessageId === message.id) return true;
  // Match via localId (after DB save updates the ID, activeMessageId still has temp-*)
  if (message.localId && activeMessageId === `temp-${message.localId}`)
    return true;
  return false;
}

/**
 * Hook for managing chat persistence with database backend
 */
export function useChatDatabase({ caseId, sessionId }: UseChatDatabaseOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );

  // Ref to access current messages synchronously (avoids setState side-effects)
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Synchronous map of localId -> realId for race condition handling
  // Updated immediately when addMessage returns, before React state batches
  const localIdToRealIdMapRef = useRef<Map<string, string>>(new Map());

  // Use session context for caching
  const sessionContext = useChatSessionContext();

  // Get sessions and loading state from context
  const sessions = sessionContext.getSessions(caseId);
  const isLoadingSessions = sessionContext.isLoading(caseId);
  const isLoading = isLoadingSessions || isLoadingMessages;

  // Load sessions using context (with caching)
  const loadSessions = useCallback(async () => {
    if (!caseId) return [];

    try {
      const sessions = await sessionContext.refreshSessions(caseId);
      return sessions;
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load sessions",
      );
      return [];
    }
  }, [caseId, sessionContext]);

  // Track previous session to detect session switches
  const prevSessionIdRef = useRef<string | null>(null);

  // Load messages for current session
  const loadMessages = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      localIdToRealIdMapRef.current.clear();
      prevSessionIdRef.current = null;
      return;
    }

    // Clear old messages when switching to a different session
    // This ensures the loading skeleton shows correctly
    if (
      prevSessionIdRef.current !== null &&
      prevSessionIdRef.current !== sessionId
    ) {
      setMessages([]);
      localIdToRealIdMapRef.current.clear();
    }
    prevSessionIdRef.current = sessionId;

    setIsLoadingMessages(true);
    setError(null);

    try {
      // Use cache service with automatic fallback to database
      const {
        messages: fetchedMessages,
        fromCache,
        loadTimeMs,
      } = await getOrFetchSessionMessages(sessionId, async () => {
        // Fetch function called only on cache miss
        const response = await fetch(
          `/api/chat-sessions/${sessionId}/messages`,
        );
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load messages");
        }

        // Transform database messages to match expected format
        return data.messages.map((msg: any) => ({
          id: msg.id,
          question: msg.question,
          response: msg.response,
          error: msg.error,
          progressEvents: msg.progressEvents || [],
          metadata: msg.metadata,
          createdAt: msg.createdAt,
          status: msg.response ? "completed" : msg.error ? "failed" : "sent",
        }));
      });

      // Log performance
      console.log(
        `[useChatDatabase] Loaded ${fetchedMessages.length} messages in ${loadTimeMs}ms (${fromCache ? "CACHE" : "DB"})`,
      );

      // Intelligently merge with existing optimistic messages
      setMessages((prev) => {
        return mergeOptimisticAndDbMessages(prev, fetchedMessages);
      });
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load messages",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }, [sessionId, caseId]);

  // Create a new session
  const createSession = useCallback(
    async (title?: string): Promise<string | null> => {
      try {
        const response = await fetch(`/api/cases/${caseId}/chat-sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title || "New Chat",
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Add to context cache
          sessionContext.addSession(caseId, data.chatSession);
          setCurrentSession(data.chatSession);
          return data.chatSession.id;
        } else {
          throw new Error(data.error || "Failed to create session");
        }
      } catch (error) {
        console.error("Failed to create session:", error);
        setError(
          error instanceof Error ? error.message : "Failed to create session",
        );
        return null;
      }
    },
    [caseId, loadSessions],
  );

  // Add a new message to the current session
  const addMessage = useCallback(
    async (
      question: string,
      response?: AISearchResponse | SimplifiedAISearchResponse | null,
      error?: AISearchError | null,
      progressEvents?: ProgressEvent[],
      metadata?: any,
      localId?: string, // For replacing optimistic messages
      overrideSessionId?: string, // Override sessionId for new sessions
    ): Promise<string | null> => {
      const targetSessionId = overrideSessionId || sessionId;
      if (!targetSessionId) {
        setError("No active chat session");
        return null;
      }

      try {
        const apiResponse = await fetch(
          `/api/chat-sessions/${targetSessionId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question,
              response,
              error,
              progressEvents: progressEvents || [],
              metadata: {
                ...metadata,
                ...(localId && { localId }), // Store localId in metadata for deduplication
              },
            }),
          },
        );

        const data = await apiResponse.json();

        if (data.success) {
          // Immediately update the localId -> realId map BEFORE async state update
          // This ensures updateMessageResponse can find the real ID even if React
          // hasn't batched the state update yet (race condition fix)
          if (localId) {
            localIdToRealIdMapRef.current.set(localId, data.message.id);
          }

          if (localId) {
            // Replace optimistic message with server response
            // Keep localId for tracking during AI processing - it will be used
            // by addProgressEvent and updateMessageResponse to find the message
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.localId === localId || msg.id === `temp-${localId}`) {
                  return {
                    ...msg,
                    id: data.message.id, // Update with real server ID
                    createdAt: data.message.createdAt,
                    status: "sent", // Mark as sent
                    // Keep localId for tracking - cleared after AI processing completes
                  };
                }
                return msg;
              }),
            );
          } else {
            // No optimistic message to replace, add new message (for loading existing messages)
            const newMessage: ChatMessage = {
              id: data.message.id,
              question: data.message.question,
              response: data.message.response,
              error: data.message.error,
              progressEvents: data.message.progressEvents || [],
              metadata: data.message.metadata,
              createdAt: data.message.createdAt,
              status: "completed", // Mark existing messages as completed
            };

            setMessages((prev) => [...prev, newMessage]);
          }

          // Invalidate cache so next load fetches fresh data
          invalidateSessionCache(targetSessionId);

          return data.message.id;
        } else {
          throw new Error(data.error || "Failed to add message");
        }
      } catch (error) {
        console.error("Failed to add message:", error);
        setError(
          error instanceof Error ? error.message : "Failed to add message",
        );
        return null;
      }
    },
    [sessionId],
  );

  // Update an existing message (for streaming updates)
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      );
    },
    [],
  );

  // Add optimistic message (appears immediately)
  const addOptimisticMessage = useCallback(
    (question: string, localId: string): ChatMessage => {
      const optimisticMessage: ChatMessage = {
        id: `temp-${localId}`, // Temporary ID
        localId,
        question: question.trim(),
        response: null,
        error: null,
        progressEvents: [],
        metadata: null,
        createdAt: new Date().toISOString(),
        status: "pending",
        retryCount: 0,
      };

      // Update ref synchronously BEFORE state update to avoid race conditions
      // This ensures getFailedMessage and findRealMessageId can find the message
      // even before React batches the state update
      messagesRef.current = [...messagesRef.current, optimisticMessage];

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
              ...(realId && { id: realId }), // Update with real server ID
            };
          }
          return msg;
        }),
      );
    },
    [],
  );

  // Add progress event to a message
  const addProgressEvent = useCallback(
    (messageId: string, event: ProgressEvent) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId || msg.localId === messageId) {
            return {
              ...msg,
              progressEvents: [...msg.progressEvents, event],
              status: "processing", // Update status when AI processing starts
            };
          }
          return msg;
        }),
      );
    },
    [],
  );

  // Update message response
  const updateMessageResponse = useCallback(
    async (
      messageId: string,
      response: AISearchResponse | SimplifiedAISearchResponse,
      overrideSessionId?: string,
    ) => {
      // Find the real message ID for DB persist (using ref to avoid setState side-effects)
      // This handles the case where messageId is a localId (for parallel execution)
      // Pass the synchronous map to handle race condition where React state hasn't updated yet
      const realMessageId = findRealMessageId(
        messagesRef.current,
        messageId,
        localIdToRealIdMapRef.current,
      );

      // Update UI immediately for responsiveness
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId || msg.localId === messageId) {
            return {
              ...msg,
              response,
              status: "completed" as const,
            };
          }
          return msg;
        }),
      );

      // Persist to database with proper error handling
      // Use the real message ID we found, not the passed messageId (which might be localId)
      const targetSessionId = overrideSessionId || sessionId;
      const idForPersist = realMessageId || messageId;

      if (targetSessionId && !idForPersist.startsWith("temp-")) {
        try {
          const apiResponse = await fetch(
            `/api/chat-sessions/${targetSessionId}/messages`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messageId: idForPersist,
                response,
              }),
            },
          );

          if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error("Failed to save AI response to database:", errorData);

            // Retry once after a short delay
            setTimeout(async () => {
              try {
                const retryResponse = await fetch(
                  `/api/chat-sessions/${targetSessionId}/messages`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      messageId: idForPersist,
                      response,
                    }),
                  },
                );

                if (!retryResponse.ok) {
                  console.error("Retry failed to save AI response");
                }
              } catch (retryError) {
                console.error("Retry error saving AI response:", retryError);
              }
            }, 1000);
          }
        } catch (error) {
          console.error("Error saving AI response to database:", error);
        }
      }
    },
    [sessionId],
  );

  // Remove message from UI
  const removeMessage = useCallback((messageId: string) => {
    // Update ref synchronously to avoid race conditions
    messagesRef.current = messagesRef.current.filter(
      (msg) => msg.id !== messageId && msg.localId !== messageId,
    );

    setMessages((prev) =>
      prev.filter((msg) => msg.id !== messageId && msg.localId !== messageId),
    );
  }, []);

  // Update message error
  const updateMessageError = useCallback(
    async (
      messageId: string,
      error: AISearchError,
      overrideSessionId?: string,
    ) => {
      // First update UI immediately for responsiveness
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId || msg.localId === messageId) {
            return {
              ...msg,
              error,
              status: "failed", // Mark as failed when error occurs
              retryCount: (msg.retryCount || 0) + 1,
            };
          }
          return msg;
        }),
      );

      // Then persist to database with proper error handling
      const targetSessionId = overrideSessionId || sessionId;
      if (targetSessionId && !messageId.startsWith("temp-")) {
        try {
          const apiResponse = await fetch(
            `/api/chat-sessions/${targetSessionId}/messages`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messageId,
                error,
              }),
            },
          );

          if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error("Failed to save error to database:", errorData);

            // Retry once after a short delay
            setTimeout(async () => {
              try {
                const retryResponse = await fetch(
                  `/api/chat-sessions/${targetSessionId}/messages`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      messageId,
                      error,
                    }),
                  },
                );

                if (!retryResponse.ok) {
                  console.error("Retry failed to save error");
                }
              } catch (retryError) {
                console.error("Retry error saving error message:", retryError);
              }
            }, 1000);
          }
        } catch (error) {
          console.error("Error saving error message to database:", error);
        }
      }
    },
    [sessionId],
  );

  // Delete a session
  const deleteSession = useCallback(
    async (sessionIdToDelete: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/chat-sessions/${sessionIdToDelete}`,
          {
            method: "DELETE",
          },
        );

        const data = await response.json();

        if (data.success) {
          // Remove from context cache
          sessionContext.removeSession(caseId, sessionIdToDelete);
          if (sessionIdToDelete === sessionId) {
            setMessages([]); // Clear messages if current session was deleted
            localIdToRealIdMapRef.current.clear();
            setCurrentSession(null);
          }
          return true;
        } else {
          throw new Error(data.error || "Failed to delete session");
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
        setError(
          error instanceof Error ? error.message : "Failed to delete session",
        );
        return false;
      }
    },
    [sessionId, caseId, sessionContext],
  );

  // Rename a session
  const renameSession = useCallback(
    async (sessionIdToRename: string, newTitle: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/chat-sessions/${sessionIdToRename}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: newTitle,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          // Update session in context cache
          sessionContext.updateSession(caseId, data.chatSession);
          if (sessionIdToRename === sessionId) {
            setCurrentSession(data.chatSession);
          }
          return true;
        } else {
          throw new Error(data.error || "Failed to rename session");
        }
      } catch (error) {
        console.error("Failed to rename session:", error);
        setError(
          error instanceof Error ? error.message : "Failed to rename session",
        );
        return false;
      }
    },
    [sessionId, caseId, sessionContext],
  );

  // Load sessions on mount (context handles caching)
  useEffect(() => {
    if (
      caseId &&
      !sessionContext.isLoading(caseId) &&
      sessionContext.getSessions(caseId).length === 0
    ) {
      loadSessions();
    }
  }, [caseId, loadSessions, sessionContext]);

  // Load messages when session changes
  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  // Find and set current session when sessionId changes
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find((s) => s.id === sessionId);
      setCurrentSession(session || null);
    } else {
      setCurrentSession(null);
    }
  }, [sessionId, sessions]);

  // Refresh sessions periodically to pick up background title updates
  useEffect(() => {
    if (!caseId || !sessionId) return;

    const refreshInterval = setInterval(() => {
      // Silent refresh - don't show loading state
      loadSessions().catch(() => {
        // Silent fail - not critical
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [caseId, sessionId, loadSessions]);

  return {
    // Data
    messages,
    sessions,
    currentSession,
    isLoading,
    isLoadingSessions,
    isLoadingMessages,
    error,

    // Actions
    loadSessions,
    loadMessages,
    createSession,
    addMessage,
    updateMessage,
    addProgressEvent,
    updateMessageResponse,
    updateMessageError,
    removeMessage,
    deleteSession,
    renameSession,

    // Optimistic Updates
    addOptimisticMessage,
    updateMessageStatus,
  };
}
