"use client";

import { useEffect, useRef, useState } from "react";
import { useChatbotChat } from "@/hooks/useChatbotChat";
import {
  Loader2,
  Send,
  MessageSquare,
  Plus,
  ChevronDown,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/components/ui/toast";
import { SourceCitations } from "@/components/chatbots/SourceCitations";
import MarkdownContent from "@/components/chat/MarkdownContent";
import "@/app/(dashboard)/generate/components/chat/chat-markdown.css";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import ChatFileUpload from "@/components/chat/ChatFileUpload";
import AttachmentViewerModal from "@/components/chat/AttachmentViewerModal";
import type { FileAttachment } from "@/hooks/useChatbotChat";
import {
  getFileIconFromMimeType,
  formatFileSize,
} from "@/app/(dashboard)/generate/components/chat/fileHelpers";
import {
  getRandomThinkingText,
  isThinkingMessage,
} from "@/lib/utils/thinkingMessages";
import { fileToBase64 } from "@/lib/chat/fileUtils";
import {
  DynamicLeadCaptureForm,
  type DynamicLeadFormData,
} from "@/components/chatbots/DynamicLeadCaptureForm";
import type { FormField } from "@/lib/validation/chatbot-lead-form";

const MAX_VISIBLE_LINES = 4;
const LINE_HEIGHT = 24;
const MIN_HEIGHT = LINE_HEIGHT + 16;
const MAX_HEIGHT = LINE_HEIGHT * MAX_VISIBLE_LINES + 16;

// Helper function to upload file to S3
async function uploadFileToS3(
  chatbotId: string,
  conversationId: string,
  messageId: string,
  file: File,
): Promise<{
  fileName: string;
  s3Key: string | null;
  size: number;
  mimeType: string;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `/api/chatbots/${chatbotId}/conversations/${conversationId}/messages/${messageId}/attachments`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      fileName: file.name,
      s3Key: data.s3Key,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error(`Failed to upload ${file.name}:`, error);
    return {
      fileName: file.name,
      s3Key: null,
      size: file.size,
      mimeType: file.type,
    };
  }
}

interface ChatbotChatTabbedProps {
  chatbot: {
    id: string;
    name: string;
    welcomeMessage?: string | null;
  };
  userId: string;
}

export function ChatbotChatTabbed({ chatbot, userId }: ChatbotChatTabbedProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConversationDropdown, setShowConversationDropdown] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<FileAttachment | null>(null);
  const [leadFormFields, setLeadFormFields] = useState<FormField[]>([]);
  const [isLoadingLeadForm, setIsLoadingLeadForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    createConversation,
    addOptimisticMessage,
    saveOptimisticMessage,
    updateMessageStatus,
    updateMessage,
    deleteConversation,
    generateConversationTitle,
    isLoadingConversations,
    isLoadingMessages,
    leadCaptureState,
    captureLead,
    showLeadCaptureForm,
    hideLeadCaptureForm,
  } = useChatbotChat({ chatbotId: chatbot.id, userId });

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowConversationDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch lead form configuration when form is shown
  useEffect(() => {
    if (leadCaptureState === "shown" && leadFormFields.length === 0) {
      setIsLoadingLeadForm(true);
      fetch(`/api/public/chatbots/${chatbot.id}/lead-form`)
        .then((res) => res.json())
        .then((data) => {
          if (data.fields) {
            setLeadFormFields(data.fields);
          }
        })
        .catch((error) => {
          console.error("Failed to load lead form:", error);
          addToast("Failed to load lead form", "error", 3000);
        })
        .finally(() => {
          setIsLoadingLeadForm(false);
        });
    }
  }, [leadCaptureState, leadFormFields.length, chatbot.id, addToast]);

  // Drag and drop handler
  const { isDragging } = useDragAndDrop({
    onFilesDropped: ({ validFiles, invalidFiles }) => {
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
        addToast(
          `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} added`,
          "success",
          2000,
        );
      }
      if (invalidFiles.length > 0) {
        const errorMessage =
          invalidFiles.length === 1
            ? `${invalidFiles[0].file.name}: ${invalidFiles[0].error}`
            : `${invalidFiles.length} files were rejected (unsupported type or size)`;
        addToast(errorMessage, "error", 4000);
      }
    },
    disabled: isSending,
  });

  const handleFileClick = (attachment: FileAttachment) => {
    setSelectedAttachment(attachment);
    setViewerOpen(true);
  };

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const userMessage = input.trim();
    const messageFiles = [...selectedFiles];
    setInput("");
    setSelectedFiles([]);

    const userLocalId = nanoid();
    const assistantLocalId = nanoid();

    try {
      // Create conversation if needed
      let conversationId = selectedConversationId;
      if (!conversationId) {
        const newConversationId = await createConversation("New Chat");
        if (!newConversationId) {
          throw new Error("Failed to create conversation");
        }
        conversationId = newConversationId;
      }

      // Create placeholder attachments for immediate display
      const placeholderAttachments: FileAttachment[] = messageFiles.map(
        (file) => ({
          fileName: file.name,
          s3Key: null,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        }),
      );

      // Add optimistic messages
      addOptimisticMessage(
        "USER",
        userMessage,
        userLocalId,
        messageFiles.length > 0 ? placeholderAttachments : undefined,
      );
      addOptimisticMessage(
        "ASSISTANT",
        getRandomThinkingText(),
        assistantLocalId,
      );

      // Convert files to base64 for AI processing
      const base64Files = await Promise.all(
        messageFiles.map(async (file) => ({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          base64: await fileToBase64(file),
        })),
      );

      // CRITICAL: AI streaming and user message save run in parallel for speed
      const [_, userMessageId] = await Promise.all([
        // Stream AI response
        (async () => {
          const response = await fetch(`/api/chatbots/${chatbot.id}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMessage,
              conversationId,
              files: base64Files.length > 0 ? base64Files : undefined,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to send message");
          }

          // Parse SSE stream
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let accumulatedContent = "";
          let sources: any[] = [];

          updateMessageStatus(assistantLocalId, "processing");

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const event = JSON.parse(line.slice(6));

                  if (event.type === "content") {
                    accumulatedContent += event.content || "";
                    updateMessage(assistantLocalId, {
                      content: accumulatedContent,
                      status: "processing",
                    });
                  } else if (event.type === "tool_call") {
                    // Handle AI-triggered lead form display
                    if (event.toolCall?.name === "show_lead_form") {
                      console.log(
                        "[LeadCapture] AI triggered form:",
                        event.toolCall,
                      );

                      // Generate contextual message based on urgency
                      const urgency = event.toolCall.parameters.urgency;
                      const caseType =
                        event.toolCall.parameters.extractedData?.caseType ||
                        "your case";

                      let syntheticMessage = "";
                      if (urgency === "high") {
                        syntheticMessage = `I understand the urgency of your situation. Let me connect you directly with an attorney who specializes in ${caseType}. They can provide immediate assistance. Please fill out the form below so they can reach you as soon as possible.`;
                      } else if (urgency === "medium") {
                        syntheticMessage = `Based on what you've shared, I'd like to connect you with an attorney who can help with ${caseType}. Please provide your contact information below, and they'll reach out to discuss your situation.`;
                      } else {
                        syntheticMessage = `I can help you connect with an attorney to discuss ${caseType}. Please fill out the form below with your contact information.`;
                      }

                      // Add synthetic message to accumulated content
                      accumulatedContent += syntheticMessage;
                      updateMessage(assistantLocalId, {
                        content: accumulatedContent,
                        status: "processing",
                      });

                      // Show lead capture form
                      showLeadCaptureForm();

                      // Log extracted data for future pre-fill implementation
                      if (event.toolCall.parameters.extractedData) {
                        console.log(
                          "[LeadCapture] Extracted data:",
                          event.toolCall.parameters.extractedData,
                        );
                      }
                    }
                  } else if (event.type === "complete") {
                    sources = event.sources || [];
                    updateMessage(assistantLocalId, {
                      content: accumulatedContent,
                      status: "completed",
                      tokensUsed: event.tokensUsed,
                      processingTime: event.processingTime,
                      sources,
                    });

                    // Backend already saved the assistant message, just update with real ID
                    if (event.messageId) {
                      updateMessageStatus(
                        assistantLocalId,
                        "completed",
                        event.messageId,
                      );
                    }

                    // Generate title for first message
                    if (messages.length === 0) {
                      await generateConversationTitle(
                        conversationId!,
                        userMessage,
                      );
                    }
                  } else if (event.type === "error") {
                    throw new Error(event.error?.message || "Unknown error");
                  }
                } catch (parseError) {
                  console.error("Parse error:", parseError);
                }
              }
            }
          }
        })(),

        // Save user message to database (runs in parallel!)
        saveOptimisticMessage(conversationId, "USER", userMessage, userLocalId),
      ]);

      if (userMessageId) {
        // Upload files to S3 and update message with actual S3 keys
        if (messageFiles.length > 0) {
          Promise.all(
            messageFiles.map((file) =>
              uploadFileToS3(chatbot.id, conversationId, userMessageId, file),
            ),
          )
            .then((uploadResults) => {
              // Update message with actual S3 keys
              const updatedAttachments: FileAttachment[] = uploadResults.map(
                (result) => ({
                  fileName: result.fileName,
                  s3Key: result.s3Key || null,
                  size: result.size,
                  mimeType: result.mimeType,
                  uploadedAt: new Date().toISOString(),
                }),
              );

              updateMessage(userLocalId, {
                attachments: updatedAttachments,
              });
            })
            .catch((error) => {
              console.error("File upload failed:", error);
              addToast("Some files failed to upload", "error", 3000);
            });
        }
      }
    } catch (error) {
      console.error("Send message error:", error);
      updateMessage(assistantLocalId, {
        content:
          "I apologize, but I encountered an error processing your message. Please try again.",
        status: "failed",
      });
      addToast("Failed to send message. Please try again.", "error", 3000);
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

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setShowConversationDropdown(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      setIsDeleting(true);
      try {
        await deleteConversation(conversationToDelete);
        addToast("Conversation deleted", "success", 2000);
        setIsDeleteDialogOpen(false);
        setConversationToDelete(null);
      } catch (error) {
        console.error("Delete conversation error:", error);
        addToast("Failed to delete conversation", "error", 3000);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowConversationDropdown(false);
  };

  const showWelcome = !selectedConversationId && messages.length === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm relative">
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-gray-100/95 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-gray-400 rounded-lg">
          <div className="flex flex-col items-center gap-4 text-gray-900">
            <Upload className="h-16 w-16" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-xl font-semibold mb-1">Drop files here</p>
              <p className="text-sm text-gray-500">
                Supports PDF, images, text files, DOCX, XLSX
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Conversation Selector */}
      <div className="border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <MessageSquare className="w-5 h-5 text-gray-500 hidden sm:block" />
          <div className="relative flex-1 min-w-0" ref={dropdownRef}>
            <button
              onClick={() =>
                setShowConversationDropdown(!showConversationDropdown)
              }
              className="flex items-center justify-between w-full max-w-xs px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
            >
              <span className="truncate">
                {currentConversation?.title || "Select or start a conversation"}
              </span>
              <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
            </button>

            {showConversationDropdown && (
              <div className="absolute left-0 top-full mt-2 w-full sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={handleNewChat}
                    className="w-full px-3 py-2 text-sm text-left text-gray-900 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Conversation
                  </button>
                </div>

                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No conversations yet. Start a new one!
                  </div>
                ) : (
                  <div className="border-t border-gray-200">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors ${
                          selectedConversationId === conv.id
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        <button
                          onClick={() => handleSelectConversation(conv.id)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {conv.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {conv.messageCount} messages
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="px-3 sm:px-4 py-2 btn-primary text-sm font-medium rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="h-[400px] sm:h-[500px] md:h-[600px] overflow-y-auto">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {chatbot.welcomeMessage || `Test ${chatbot.name}`}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Start a conversation to test your chatbot. Ask questions to see
              how it responds using your knowledge base.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-md md:max-w-2xl lg:max-w-3xl items-end">
                      {/* Attachments above user message */}
                      {msg.role === "USER" &&
                        msg.attachments &&
                        msg.attachments.length > 0 && (
                          <div className="flex flex-row-reverse gap-2 overflow-x-auto pb-1">
                            {msg.attachments.map((attachment, index) => {
                              const isUploading =
                                !attachment.s3Key && msg.status !== "completed";
                              const isMissing =
                                !attachment.s3Key && msg.status === "completed";
                              return (
                                <button
                                  key={attachment.s3Key || `uploading-${index}`}
                                  onClick={() => {
                                    if (isUploading) return;
                                    if (!attachment.s3Key) {
                                      addToast(
                                        "File was not properly uploaded",
                                        "error",
                                        2000,
                                      );
                                      return;
                                    }
                                    handleFileClick(attachment);
                                  }}
                                  disabled={isUploading}
                                  className={`flex items-center gap-1.5 px-2 py-1 bg-white border rounded text-xs shadow-sm transition-colors flex-shrink-0 ${
                                    isUploading
                                      ? "opacity-60 cursor-wait border-gray-300"
                                      : isMissing
                                        ? "opacity-50 border-red-300 cursor-not-allowed"
                                        : "hover:bg-gray-50 cursor-pointer border-gray-300"
                                  }`}
                                >
                                  <span className="text-base">
                                    {getFileIconFromMimeType(
                                      attachment.mimeType,
                                    )}
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span
                                      className={`font-medium whitespace-nowrap ${isMissing ? "text-gray-500 line-through" : "text-gray-900"}`}
                                    >
                                      {attachment.fileName}
                                    </span>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatFileSize(attachment.size)}
                                      {isUploading && " • Uploading..."}
                                      {isMissing && " • File not available"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                      <div
                        className={`rounded-lg w-fit ${
                          msg.role === "USER"
                            ? "bg-gray-100 text-gray-900 px-4 py-3"
                            : "text-gray-900 py-2"
                        }`}
                      >
                        {msg.role === "ASSISTANT" ? (
                          isThinkingMessage(msg.content) ? (
                            <span className="text-gray-500 italic animate-pulse">
                              {msg.content}
                            </span>
                          ) : (
                            <div className="chat-markdown assistant-message">
                              <MarkdownContent content={msg.content} />
                              {msg.sources && msg.sources.length > 0 && (
                                <SourceCitations sources={msg.sources} />
                              )}
                            </div>
                          )
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
        <div className="flex flex-col gap-3">
          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2 px-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs shadow-sm flex-shrink-0"
                >
                  <span className="text-base">
                    {getFileIconFromMimeType(file.type)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-gray-900 whitespace-nowrap">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="ml-auto text-gray-400 hover:text-gray-900 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input controls with file upload button */}
          <div className="flex gap-2 items-end">
            <ChatFileUpload
              onFilesSelected={(newFiles) => {
                setSelectedFiles((prev) => [...prev, ...newFiles]);
                addToast(
                  `${newFiles.length} file${newFiles.length > 1 ? "s" : ""} selected`,
                  "success",
                  2000,
                );
              }}
              disabled={isSending}
            />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 text-gray-900 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white placeholder:text-gray-500"
              style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isSending}
              className="px-4 sm:px-6 py-3 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? All messages will be permanently removed. This action cannot be undone."
        confirmText="Delete Conversation"
        variant="danger"
        icon={<Trash2 className="w-6 h-6" />}
        isLoading={isDeleting}
      />

      {/* Attachment Viewer Modal */}
      {selectedAttachment && (
        <AttachmentViewerModal
          open={viewerOpen}
          onOpenChange={(open) => {
            setViewerOpen(open);
            if (!open) {
              setSelectedAttachment(null);
            }
          }}
          s3Key={selectedAttachment.s3Key}
          fileName={selectedAttachment.fileName}
          mimeType={selectedAttachment.mimeType}
          size={selectedAttachment.size}
        />
      )}

      {/* Lead Capture Form Modal */}
      {leadCaptureState === "shown" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {isLoadingLeadForm ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            ) : leadFormFields.length > 0 ? (
              <DynamicLeadCaptureForm
                fields={leadFormFields}
                chatbotName={chatbot.name}
                onSubmit={async (formData: DynamicLeadFormData) => {
                  if (!selectedConversationId) {
                    addToast("No active conversation", "error", 3000);
                    return;
                  }
                  const success = await captureLead(
                    selectedConversationId,
                    formData,
                  );
                  if (success) {
                    hideLeadCaptureForm();

                    // Extract name and email from formData for confirmation message
                    const nameEntry = Object.entries(formData).find(([key]) =>
                      key.toLowerCase().includes("name"),
                    );
                    const emailEntry = Object.entries(formData).find(([key]) =>
                      key.toLowerCase().includes("email"),
                    );
                    const name = nameEntry ? String(nameEntry[1]) : "there";
                    const email = emailEntry ? String(emailEntry[1]) : "";

                    // Add personalized confirmation message to chat
                    const confirmationMessage = `Thank you, ${name}! I've received your information and will connect you with an attorney. They'll reach out to you shortly to discuss your situation and next steps.${email ? ` You should expect to hear from them at ${email}.` : ""}`;

                    const assistantLocalId = `assistant-${nanoid()}`;

                    // Add to UI immediately
                    addOptimisticMessage(
                      "ASSISTANT",
                      confirmationMessage,
                      assistantLocalId,
                    );

                    // Save to backend
                    saveOptimisticMessage(
                      selectedConversationId,
                      "ASSISTANT",
                      confirmationMessage,
                      assistantLocalId,
                    );
                  } else {
                    throw new Error("Failed to submit");
                  }
                }}
                onCancel={hideLeadCaptureForm}
              />
            ) : (
              <div className="p-8">
                <p className="text-sm text-red-800 text-center">
                  Failed to load lead form. Please try again later.
                </p>
                <button
                  onClick={hideLeadCaptureForm}
                  className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
