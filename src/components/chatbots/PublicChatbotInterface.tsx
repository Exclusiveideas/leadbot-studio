"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Send,
  Upload,
  X,
  Mic,
  MoreVertical,
} from "lucide-react";
import { nanoid } from "nanoid";
import MarkdownContent from "@/components/chat/MarkdownContent";
import {
  DynamicLeadCaptureForm,
  type DynamicLeadFormData,
} from "@/components/chatbots/DynamicLeadCaptureForm";
import type { FormField } from "@/lib/validation/chatbot-lead-form";
import { CONTACT_CAPTURE_FORM } from "@/lib/constants/lead-form-templates";
import {
  getRandomThinkingText,
  isThinkingMessage,
} from "@/lib/utils/thinkingMessages";
import "@/app/(dashboard)/generate/components/chat/chat-markdown.css";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { validateChatFile, fileToBase64 } from "@/lib/chat/fileProcessor";
import ChatFileUpload from "@/components/chat/ChatFileUpload";
import {
  getFileIconFromMimeType,
  formatFileSize,
} from "@/app/(dashboard)/generate/components/chat/fileHelpers";

const MAX_VISIBLE_LINES = 4;
const LINE_HEIGHT = 24;
const MIN_HEIGHT = LINE_HEIGHT + 16;
const MAX_HEIGHT = LINE_HEIGHT * MAX_VISIBLE_LINES + 16;

const MAX_FILES = 5;

// Session expiry: 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface PublicChatbotInterfaceProps {
  chatbot: {
    id: string;
    name: string;
    welcomeMessage?: string | null;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?:
    | "pending"
    | "sending"
    | "sent"
    | "processing"
    | "streaming"
    | "completed"
    | "failed";
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
}

interface ChatStreamEvent {
  type: "start" | "content" | "complete" | "error" | "tool_call";
  content?: string;
  messageId?: string;
  tokensUsed?: number;
  processingTime?: number;
  sessionId?: string;
  error?: {
    code: string;
    message: string;
  };
  toolCall?: {
    name: "show_lead_form" | "show_booking_trigger";
    parameters: {
      reason: string;
      extractedData?: {
        name?: string;
        email?: string;
        phone?: string;
        caseType?: string;
        urgency?: "IMMEDIATE" | "THIS_WEEK" | "THIS_MONTH" | "EXPLORING";
      };
      urgency?: "high" | "medium" | "low";
    };
    calendlyLink?: string;
    isContactCapture?: boolean;
  };
}

type LeadCaptureState = "not_shown" | "shown" | "captured";

interface StoredSession {
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Get or create session from localStorage with 24h expiry.
 * Returns session data including messages for restoration.
 */
function getOrCreateSession(chatbotId: string): {
  sessionId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  isNew: boolean;
} {
  if (typeof window === "undefined") {
    return { sessionId: nanoid(), messages: [], isNew: true };
  }

  const key = `lbs_chat_${chatbotId}`;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const session: StoredSession = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() < session.expiresAt) {
        return {
          sessionId: session.sessionId,
          messages: session.messages || [],
          isNew: false,
        };
      }

      // Session expired, clear it
      localStorage.removeItem(key);
    }
  } catch {
    // Invalid stored data, clear it
    localStorage.removeItem(key);
  }

  // Create new session
  const newSession: StoredSession = {
    sessionId: nanoid(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    messages: [],
  };

  localStorage.setItem(key, JSON.stringify(newSession));

  return {
    sessionId: newSession.sessionId,
    messages: [],
    isNew: true,
  };
}

/**
 * Save session state to localStorage, extending expiry on activity.
 */
function saveSession(
  chatbotId: string,
  sessionId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): void {
  if (typeof window === "undefined") return;

  const key = `lbs_chat_${chatbotId}`;
  const session: StoredSession = {
    sessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    messages,
  };
  localStorage.setItem(key, JSON.stringify(session));
}

export function PublicChatbotInterface({
  chatbot,
}: PublicChatbotInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isNewSession, setIsNewSession] = useState(true);
  const [leadCaptureState, setLeadCaptureState] =
    useState<LeadCaptureState>("not_shown");
  const [leadFormData, setLeadFormData] = useState<
    Partial<DynamicLeadFormData>
  >({});
  const [leadFormConfig, setLeadFormConfig] = useState<{
    fields: FormField[];
    appearance?: {
      primaryColor: string;
      accentColor: string;
      buttonText: string;
    };
    successMessage?: string;
  } | null>(null);
  const [isContactCaptureMode, setIsContactCaptureMode] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch default lead form on mount
  useEffect(() => {
    const fetchDefaultForm = async () => {
      try {
        const response = await fetch(
          `/api/public/chatbots/${chatbot.id}/lead-form`,
        );
        if (response.ok) {
          const { data } = await response.json();
          if (data) {
            setLeadFormConfig({
              fields: data.fields as FormField[],
              appearance: data.appearance as
                | {
                    primaryColor: string;
                    accentColor: string;
                    buttonText: string;
                  }
                | undefined,
              successMessage:
                (
                  data.behavior as {
                    showSuccessMessage?: boolean;
                    successMessage?: string;
                  }
                )?.successMessage || undefined,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch default lead form:", error);
      }
    };

    fetchDefaultForm();
  }, [chatbot.id]);

  // Process and add files (used by both drag-and-drop and file picker)
  const handleFilesAdded = useCallback(
    async (files: File[]) => {
      setFileError(null);

      // Check max files limit
      if (pendingFiles.length + files.length > MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const newAttachments: FileAttachment[] = [];

      for (const file of files) {
        // Validate using shared utility
        const validation = validateChatFile({
          name: file.name,
          size: file.size,
          type: file.type,
        });

        if (!validation.valid) {
          setFileError(validation.error || `Invalid file: ${file.name}`);
          continue;
        }

        // Convert to base64
        try {
          const base64 = await fileToBase64(file);
          newAttachments.push({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64,
          });
        } catch {
          setFileError(`Failed to read file: ${file.name}`);
        }
      }

      if (newAttachments.length > 0) {
        setPendingFiles((prev) => [...prev, ...newAttachments]);
      }
    },
    [pendingFiles.length],
  );

  // Drag and drop handler
  const { isDragging } = useDragAndDrop({
    onFilesDropped: ({ validFiles, invalidFiles }) => {
      if (validFiles.length > 0) {
        handleFilesAdded(validFiles);
      }
      if (invalidFiles.length > 0) {
        setFileError(
          invalidFiles.length === 1
            ? `${invalidFiles[0].file.name}: ${invalidFiles[0].error}`
            : `${invalidFiles.length} files were rejected (unsupported type or size)`,
        );
      }
    },
    disabled: isSending,
  });

  // Initialize session and restore messages from localStorage
  useEffect(() => {
    const sessionData = getOrCreateSession(chatbot.id);
    setSessionId(sessionData.sessionId);
    setIsNewSession(sessionData.isNew);

    // Restore messages from localStorage
    if (sessionData.messages.length > 0) {
      const restoredMessages: Message[] = sessionData.messages.map((msg) => ({
        id: nanoid(),
        role: msg.role,
        content: msg.content,
        status: "completed" as const,
      }));
      setMessages(restoredMessages);
    }
  }, [chatbot.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = `${MIN_HEIGHT}px`;
    const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }, []);

  /**
   * Build conversation history for API from current messages (excludes UI-specific fields)
   */
  const buildConversationHistory = useCallback(() => {
    return messages
      .filter(
        (m) =>
          (m.status === "completed" || m.status === "sent") &&
          m.content.trim() !== "",
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));
  }, [messages]);

  /**
   * Start a new conversation (clear messages and session)
   */
  const startNewConversation = useCallback(() => {
    const key = `lbs_chat_${chatbot.id}`;
    localStorage.removeItem(key);

    // Create new session
    const newSessionId = nanoid();
    setSessionId(newSessionId);
    setMessages([]);
    setIsNewSession(true);
    setLeadCaptureState("not_shown");
    setLeadFormData({});
    setIsContactCaptureMode(false);

    // Save empty session
    saveSession(chatbot.id, newSessionId, []);
  }, [chatbot.id]);

  const handleSendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || isSending) return;

    setIsSending(true);
    const userMessage = input.trim();
    const filesToSend = [...pendingFiles];
    setInput("");
    setPendingFiles([]);
    setFileError(null);

    const userLocalId = nanoid();
    const assistantLocalId = nanoid();

    // Build conversation history BEFORE adding new messages
    const conversationHistory = buildConversationHistory();

    // Determine if this is a new session (first message in this session)
    const shouldMarkNewSession = isNewSession && messages.length === 0;

    // Add optimistic user message
    setMessages((prev) => [
      ...prev,
      {
        id: userLocalId,
        role: "user" as const,
        content: userMessage || "(sent files)",
        status: "sent",
        attachments: filesToSend.length > 0 ? filesToSend : undefined,
      },
    ]);

    // Add streaming message placeholder with random thinking text
    const thinkingText = getRandomThinkingText();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantLocalId,
        role: "assistant" as const,
        content: thinkingText,
        status: "streaming",
      },
    ]);

    try {
      const response = await fetch(`/api/public/chat/${chatbot.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage || "Please analyze the attached files.",
          sessionId,
          isNewSession: shouldMarkNewSession,
          conversationHistory,
          files:
            filesToSend.length > 0
              ? filesToSend.map((f) => ({
                  name: f.name,
                  mimeType: f.mimeType,
                  size: f.size,
                  base64: f.base64,
                }))
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Mark session as no longer new after first successful send
      if (shouldMarkNewSession) {
        setIsNewSession(false);
      }

      // Check if response is SSE stream
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: ChatStreamEvent = JSON.parse(line.slice(6));

                switch (event.type) {
                  case "start":
                    // No longer updating sessionId from server
                    break;

                  case "content":
                    // Accumulate content and update message
                    if (event.content) {
                      accumulatedContent += event.content;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantLocalId
                            ? {
                                ...msg,
                                content: accumulatedContent,
                                status: "streaming" as const,
                              }
                            : msg,
                        ),
                      );
                    }
                    break;

                  case "tool_call":
                    // Handle booking trigger - open Calendly in new tab
                    if (event.toolCall?.name === "show_booking_trigger") {
                      if (event.toolCall.calendlyLink) {
                        window.open(
                          event.toolCall.calendlyLink,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                      // Note: If no calendlyLink, backend already converted to show_lead_form with isContactCapture
                    }

                    // Handle lead form trigger (regular or contact capture fallback)
                    if (
                      event.toolCall?.name === "show_lead_form" &&
                      leadCaptureState !== "captured"
                    ) {
                      // Explicitly set contact capture mode based on the flag
                      // This ensures correct source tracking (BOOKING_FALLBACK vs LEAD_FORM)
                      setIsContactCaptureMode(
                        event.toolCall.isContactCapture === true,
                      );

                      // Map AI extractedData to form field IDs based on aiExtractionKey
                      const extractedData =
                        event.toolCall.parameters.extractedData || {};
                      const mappedData: Partial<DynamicLeadFormData> = {};

                      // Use contact capture form fields or regular lead form fields
                      const fieldsToUse = event.toolCall.isContactCapture
                        ? CONTACT_CAPTURE_FORM.fields
                        : leadFormConfig?.fields || [];

                      fieldsToUse.forEach((field) => {
                        if (
                          field.aiExtractable &&
                          field.aiExtractionKey &&
                          extractedData[
                            field.aiExtractionKey as keyof typeof extractedData
                          ]
                        ) {
                          mappedData[field.id] =
                            extractedData[
                              field.aiExtractionKey as keyof typeof extractedData
                            ];
                        }
                      });

                      setLeadFormData(mappedData);
                      setLeadCaptureState("shown");
                    }
                    break;

                  case "complete": {
                    // Finalize message and save to localStorage
                    const finalContent = event.content || accumulatedContent;
                    setMessages((prev) => {
                      const updated = prev.map((msg) =>
                        msg.id === assistantLocalId
                          ? {
                              ...msg,
                              content: finalContent,
                              status: "completed" as const,
                            }
                          : msg,
                      );

                      // Save updated messages to localStorage (filter out empty content)
                      const historyToSave = updated
                        .filter(
                          (m) =>
                            (m.status === "completed" || m.status === "sent") &&
                            m.content.trim() !== "",
                        )
                        .map((m) => ({ role: m.role, content: m.content }));
                      saveSession(chatbot.id, sessionId, historyToSave);

                      return updated;
                    });
                    break;
                  }

                  case "error":
                    // Handle error
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantLocalId
                          ? {
                              ...msg,
                              content:
                                event.error?.message ||
                                "An error occurred. Please try again.",
                              status: "failed" as const,
                            }
                          : msg,
                      ),
                    );
                    break;
                }
              } catch {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      } else {
        // Fallback: Handle JSON response (legacy)
        const result = await response.json();
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantLocalId
              ? {
                  ...msg,
                  content:
                    result.data?.message || "Sorry, I couldn't process that.",
                  status: "completed" as const,
                }
              : msg,
          );

          // Save to localStorage
          const historyToSave = updated
            .filter((m) => m.status === "completed" || m.status === "sent")
            .map((m) => ({ role: m.role, content: m.content }));
          saveSession(chatbot.id, sessionId, historyToSave);

          return updated;
        });
      }
    } catch (error) {
      console.error("Send message error:", error);

      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantLocalId
            ? {
                ...msg,
                content:
                  "I apologize, but I encountered an error. Please try again.",
                status: "failed" as const,
              }
            : msg,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeadSubmit = async (data: DynamicLeadFormData) => {
    try {
      const response = await fetch(`/api/public/chat/${chatbot.id}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          formData: data,
          source: isContactCaptureMode ? "BOOKING_FALLBACK" : "LEAD_FORM",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      setLeadCaptureState("captured");

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant" as const,
          content:
            "Thank you for providing your information! An attorney will be in touch with you shortly.",
          status: "completed",
        },
      ]);
    } catch (error) {
      throw error; // Re-throw to let form handle error display
    }
  };

  const handleLeadCancel = () => {
    setLeadCaptureState("not_shown");
    setIsContactCaptureMode(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/95 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-white rounded-lg">
          <div className="flex flex-col items-center gap-4 text-white">
            <Upload className="h-16 w-16" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-xl font-semibold mb-1">Drop files here</p>
              <p className="text-sm opacity-90">
                PDF, images, text files, DOCX, XLSX
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-semibold">{chatbot.name}</h1>
        {messages.length > 0 && (
          <button
            onClick={startNewConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-400 rounded-md transition-colors"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {chatbot.welcomeMessage || `Chat with ${chatbot.name}`}
            </h3>
            <p className="text-gray-500 max-w-md">
              Ask me anything. I'm here to help!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white px-4 py-3"
                    : "text-gray-900 py-2"
                }`}
              >
                {/* File attachments for user messages */}
                {msg.role === "user" && msg.attachments && (
                  <div className="mb-2 space-y-1">
                    {msg.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm bg-blue-500/30 rounded px-2 py-1"
                      >
                        <span className="text-sm">
                          {getFileIconFromMimeType(file.mimeType)}
                        </span>
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-blue-200 text-xs">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.status === "streaming" &&
                isThinkingMessage(msg.content) ? (
                  <span className="text-gray-500 italic animate-pulse">
                    {msg.content}
                  </span>
                ) : msg.status === "streaming" && msg.role === "assistant" ? (
                  <div className="chat-markdown assistant-message">
                    <MarkdownContent content={msg.content} />
                    <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                  </div>
                ) : msg.role === "assistant" ? (
                  <div className="chat-markdown assistant-message">
                    <MarkdownContent content={msg.content} />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                )}
              </div>
            </div>

            {/* Lead capture form - show after relevant assistant message */}
            {msg.role === "assistant" &&
              msg.id === messages[messages.length - 1]?.id &&
              leadCaptureState === "shown" &&
              (leadFormConfig || isContactCaptureMode) && (
                <div className="mt-4 max-w-md mx-auto">
                  <DynamicLeadCaptureForm
                    fields={
                      isContactCaptureMode
                        ? CONTACT_CAPTURE_FORM.fields
                        : leadFormConfig!.fields
                    }
                    appearance={
                      isContactCaptureMode
                        ? CONTACT_CAPTURE_FORM.appearance
                        : leadFormConfig?.appearance
                    }
                    successMessage={
                      isContactCaptureMode
                        ? CONTACT_CAPTURE_FORM.behavior?.successMessage
                        : leadFormConfig?.successMessage
                    }
                    chatbotName={chatbot.name}
                    initialData={leadFormData}
                    onSubmit={handleLeadSubmit}
                    onCancel={handleLeadCancel}
                  />
                </div>
              )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="border-t border-gray-200 px-4 pt-2 pb-3 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              >
                <span className="text-base">
                  {getFileIconFromMimeType(file.mimeType)}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="truncate max-w-[150px] text-gray-700 font-medium">
                    {file.name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isSending}
                  aria-label="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File error message */}
      {fileError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {fileError}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {/* Unified Input Bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow">
          {/* File upload button */}
          <ChatFileUpload
            onFilesSelected={handleFilesAdded}
            disabled={isSending || pendingFiles.length >= MAX_FILES}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type..."
            className="flex-1 py-2 resize-none focus:outline-none bg-transparent placeholder:text-gray-400"
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
            disabled={isSending}
          />

          {/* Show either Send button (when message ready) or Microphone (when empty) */}
          {input.trim() || pendingFiles.length > 0 ? (
            <button
              onClick={handleSendMessage}
              disabled={isSending}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              disabled={isSending}
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Menu button */}
          <button
            type="button"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            disabled={isSending}
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
