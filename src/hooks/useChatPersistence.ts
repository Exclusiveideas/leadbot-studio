"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AISearchResponse,
  SimplifiedAISearchResponse,
  AISearchError,
  ProgressEvent,
} from "@/types/ai-search";

export interface QueryHistory {
  id: string;
  question: string;
  response: AISearchResponse | SimplifiedAISearchResponse | null;
  error: AISearchError | null;
  timestamp: string;
  progressEvents: ProgressEvent[];
  isStreaming?: boolean;
  isComplete?: boolean;
}

interface UseChatPersistenceOptions {
  caseId: string;
  maxHistoryItems?: number;
  saveDebounceMs?: number;
}

/**
 * Custom hook for persisting AI chat history across tab switches and navigation
 * using sessionStorage. Automatically clears on page reload/browser close.
 */
export function useChatPersistence({
  caseId,
  maxHistoryItems = 50,
  saveDebounceMs = 500,
}: UseChatPersistenceOptions) {
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `ai-chat-${caseId}`;

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsedHistory: QueryHistory[] = JSON.parse(saved);
        // Validate the data structure
        if (Array.isArray(parsedHistory)) {
          // Filter out any malformed entries and limit to max items
          const validHistory = parsedHistory
            .filter(
              (item) =>
                item &&
                typeof item === "object" &&
                "id" in item &&
                "question" in item &&
                "timestamp" in item,
            )
            .slice(-maxHistoryItems);
          setQueryHistory(validHistory);
        }
      }
    } catch (error) {
      console.warn("Failed to load chat history from sessionStorage:", error);
      // Clear corrupted data
      sessionStorage.removeItem(storageKey);
    } finally {
      setIsLoaded(true);
    }
  }, [caseId, storageKey, maxHistoryItems]);

  // Debounced save to sessionStorage
  const saveToStorage = useCallback(
    (history: QueryHistory[]) => {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        try {
          // Limit stored items to prevent storage quota issues
          const trimmedHistory = history.slice(-maxHistoryItems);
          sessionStorage.setItem(storageKey, JSON.stringify(trimmedHistory));
        } catch (error) {
          console.warn("Failed to save chat history to sessionStorage:", error);

          // If quota exceeded, try to save with fewer items
          if (
            error instanceof DOMException &&
            error.name === "QuotaExceededError"
          ) {
            try {
              const reducedHistory = history.slice(
                -Math.floor(maxHistoryItems / 2),
              );
              sessionStorage.setItem(
                storageKey,
                JSON.stringify(reducedHistory),
              );
            } catch (retryError) {
              console.error(
                "Failed to save even reduced chat history:",
                retryError,
              );
            }
          }
        }
      }, saveDebounceMs);
    },
    [storageKey, maxHistoryItems, saveDebounceMs],
  );

  // Auto-save when queryHistory changes (after initial load)
  useEffect(() => {
    if (isLoaded && queryHistory.length > 0) {
      saveToStorage(queryHistory);
    }
  }, [queryHistory, isLoaded, saveToStorage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Add a new query to history
  const addQuery = useCallback((query: Omit<QueryHistory, "id">) => {
    const newQuery: QueryHistory = {
      id: Date.now().toString(),
      ...query,
    };

    setQueryHistory((prev) => [...prev, newQuery]);
    return newQuery.id;
  }, []);

  // Update a specific query in history
  const updateQuery = useCallback(
    (queryId: string, updates: Partial<QueryHistory>) => {
      setQueryHistory((prev) =>
        prev.map((q) => (q.id === queryId ? { ...q, ...updates } : q)),
      );
    },
    [],
  );

  // Update query progress events
  const updateQueryProgress = useCallback(
    (queryId: string, event: ProgressEvent) => {
      setQueryHistory((prev) =>
        prev.map((q) =>
          q.id === queryId
            ? { ...q, progressEvents: [...q.progressEvents, event] }
            : q,
        ),
      );
    },
    [],
  );

  // Update query response
  const updateQueryResponse = useCallback(
    (
      queryId: string,
      response: AISearchResponse | SimplifiedAISearchResponse,
    ) => {
      setQueryHistory((prev) =>
        prev.map((q) =>
          q.id === queryId ? { ...q, response, isComplete: true } : q,
        ),
      );
    },
    [],
  );

  // Update query error
  const updateQueryError = useCallback(
    (queryId: string, error: AISearchError) => {
      setQueryHistory((prev) =>
        prev.map((q) =>
          q.id === queryId ? { ...q, error, isComplete: true } : q,
        ),
      );
    },
    [],
  );

  // Clear all chat history for current case
  const clearHistory = useCallback(() => {
    setQueryHistory([]);
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  // Clear chat history for all cases (cleanup utility)
  const clearAllChatHistory = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("ai-chat-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }, []);

  return {
    queryHistory,
    isLoaded,
    addQuery,
    updateQuery,
    updateQueryProgress,
    updateQueryResponse,
    updateQueryError,
    clearHistory,
    clearAllChatHistory,
  };
}
