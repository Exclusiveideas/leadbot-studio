"use client";

import { useEffect, useRef, useState } from "react";
import { useChatbotChat } from "@/hooks/useChatbotChat";
import { Loader2, Send, MessageSquare, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/components/ui/toast";
import { SourceCitations } from "@/components/chatbots/SourceCitations";
import MarkdownContent from "@/components/chat/MarkdownContent";
import {
  DynamicLeadCaptureForm,
  type DynamicLeadFormData,
} from "@/components/chatbots/DynamicLeadCaptureForm";
import type { FormField } from "@/lib/validation/chatbot-lead-form";
import "@/app/(dashboard)/generate/components/chat/chat-markdown.css";

const MAX_VISIBLE_LINES = 4;
const LINE_HEIGHT = 24;
const MIN_HEIGHT = LINE_HEIGHT + 16;
const MAX_HEIGHT = LINE_HEIGHT * MAX_VISIBLE_LINES + 16;

interface ChatbotChatInterfaceProps {
  chatbot: {
    id: string;
    name: string;
    welcomeMessage?: string | null;
  };
  userId: string;
}

export function ChatbotChatInterface({
  chatbot,
  userId,
}: ChatbotChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [leadFormFields, setLeadFormFields] = useState<FormField[]>([]);
  const [isLoadingLeadForm, setIsLoadingLeadForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  const {
    conversations,
    messages,
    selectedConversationId,
    setSelectedConversationId,
    createConversation,
    addOptimisticMessage,
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

  // Show welcome when no conversation selected
  useEffect(() => {
    setShowWelcome(!selectedConversationId);
  }, [selectedConversationId]);

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

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const userMessage = input.trim();
    setInput("");

    const userLocalId = nanoid();
    const assistantLocalId = nanoid();

    try {
      let conversationId = selectedConversationId;
      if (!conversationId) {
        const newConversationId = await createConversation("New Chat");
        if (!newConversationId) {
          throw new Error("Failed to create conversation");
        }
        conversationId = newConversationId;
      }

      // Add optimistic messages
      addOptimisticMessage("USER", userMessage, userLocalId);
      addOptimisticMessage("ASSISTANT", "Thinking...", assistantLocalId);
      updateMessageStatus(userLocalId, "sent");

      // Send message to API
      const response = await fetch(`/api/chatbots/${chatbot.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          localId: userLocalId,
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
                  id: event.messageId,
                });

                // Generate title for first message
                if (messages.length === 0) {
                  await generateConversationTitle(conversationId!, userMessage);
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
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(conversationId);
      addToast("Conversation deleted", "success", 2000);
    }
  };

  const handleLeadCapture = async (formData: DynamicLeadFormData) => {
    if (!selectedConversationId) {
      addToast("No active conversation", "error", 3000);
      return;
    }

    const success = await captureLead(selectedConversationId, formData);
    if (success) {
      hideLeadCaptureForm();
      addToast("Thank you! We'll be in touch soon.", "success", 3000);
    } else {
      addToast(
        "Failed to submit your information. Please try again.",
        "error",
        3000,
      );
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{chatbot.name}</h2>
        </div>

        <button
          onClick={handleNewChat}
          className="m-4 px-4 py-2 btn-primary rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-4">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedConversationId === conv.id
                      ? "bg-gray-100 text-gray-900"
                      : "hover:bg-gray-50 text-gray-500"
                  }`}
                >
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.messageCount} messages
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {showWelcome ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <MessageSquare className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {chatbot.welcomeMessage || `Chat with ${chatbot.name}`}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
              Ask me anything. I'm here to help!
            </p>

            <div className="w-full max-w-2xl">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-900 placeholder:text-gray-500"
                  style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  className="px-6 py-3 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-3xl rounded-lg ${
                          msg.role === "USER"
                            ? "bg-gray-100 text-gray-900 px-4 py-3"
                            : "text-gray-900 py-2"
                        }`}
                      >
                        {msg.role === "ASSISTANT" ? (
                          <div className="chat-markdown assistant-message">
                            <MarkdownContent content={msg.content} />
                            {msg.sources && msg.sources.length > 0 && (
                              <SourceCitations sources={msg.sources} />
                            )}
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Lead Capture Form */}
                  {leadCaptureState === "shown" && (
                    <>
                      {isLoadingLeadForm ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                      ) : leadFormFields.length > 0 ? (
                        <DynamicLeadCaptureForm
                          fields={leadFormFields}
                          chatbotName={chatbot.name}
                          onSubmit={handleLeadCapture}
                          onCancel={hideLeadCaptureForm}
                        />
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                          <p className="text-sm text-red-800">
                            Failed to load lead form. Please try again later.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {leadCaptureState === "captured" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ Thank you! We've received your information and will be
                        in touch soon.
                      </p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="max-w-4xl mx-auto flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-900 placeholder:text-gray-500"
                  style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending}
                  className="px-6 py-3 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
