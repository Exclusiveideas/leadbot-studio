"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import KnowledgeFileUpload from "@/components/chatbots/KnowledgeFileUpload";
import KnowledgeList from "@/components/chatbots/KnowledgeList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChatbotKnowledge } from "@/hooks/useChatbotKnowledge";
import { toast } from "sonner";

type KnowledgeItem = {
  id: string;
  type: "FAQ" | "DOCUMENT" | "TEXT" | "URL" | "YOUTUBE";
  title: string;
  content: string;
  s3Key?: string;
  chunkCount: number;
  processedAt: string | null;
  createdAt: string;
  status?: string;
  stage?: string;
  progress?: number;
  processedChunks?: number;
  totalChunks?: number;
  failedChunks?: number;
};

export default function KnowledgeBasePage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const knowledgeBaseRef = useRef<KnowledgeItem[]>([]);

  const [formData, setFormData] = useState({
    type: "FAQ" as "FAQ" | "DOCUMENT" | "TEXT" | "URL",
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [faqPairs, setFaqPairs] = useState([{ question: "", answer: "" }]);

  // Initialize real-time knowledge updates via SSE
  const { isConnected, refresh: refreshRealtime } = useChatbotKnowledge({
    chatbotId,
    enabled: true,
    includeCompleted: true, // Show all knowledge items including completed ones
    onKnowledgeUpdate: (updatedKnowledge) => {
      // Auto-merge real-time updates into main knowledge list
      setKnowledge((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.id === updatedKnowledge.id,
        );

        if (existingIndex === -1) {
          // New knowledge item (INSERT) - add it to the beginning of the list
          return [
            {
              id: updatedKnowledge.id,
              type: updatedKnowledge.type as
                | "FAQ"
                | "DOCUMENT"
                | "TEXT"
                | "URL"
                | "YOUTUBE",
              title: updatedKnowledge.title,
              content: updatedKnowledge.content,
              s3Key: updatedKnowledge.s3Key,
              chunkCount: updatedKnowledge.chunkCount,
              processedAt: updatedKnowledge.processedAt ?? null,
              createdAt: updatedKnowledge.createdAt,
              status: updatedKnowledge.status,
              stage: updatedKnowledge.stage,
              progress: updatedKnowledge.progress,
              totalChunks: updatedKnowledge.totalChunks,
              processedChunks: updatedKnowledge.processedChunks,
              failedChunks: updatedKnowledge.failedChunks,
              processingError: updatedKnowledge.processingError,
            },
            ...prev,
          ];
        } else {
          // Existing knowledge item (UPDATE) - update it
          return prev.map((item) =>
            item.id === updatedKnowledge.id
              ? {
                  ...item,
                  status: updatedKnowledge.status,
                  stage: updatedKnowledge.stage,
                  progress: updatedKnowledge.progress,
                  totalChunks: updatedKnowledge.totalChunks,
                  processedChunks: updatedKnowledge.processedChunks,
                  failedChunks: updatedKnowledge.failedChunks,
                  processingError: updatedKnowledge.processingError,
                }
              : item,
          );
        }
      });

      // Show toast notifications on completion/failure
      if (updatedKnowledge.status === "COMPLETED") {
        toast.success("Processing Complete", {
          description: `${updatedKnowledge.title} has been processed successfully`,
        });
      } else if (updatedKnowledge.status === "FAILED") {
        toast.error("Processing Failed", {
          description: `${updatedKnowledge.title} failed to process`,
        });
      }
    },
    onAllCompleted: async () => {
      // Refresh knowledge base when all processing completes
      await refreshKnowledgeBase();
    },
  });

  const fetchKnowledge = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chatbots/${chatbotId}/knowledge`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch knowledge");
      }

      const result = await response.json();
      if (result.success) {
        setKnowledge(result.data);
        knowledgeBaseRef.current = result.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge");
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const refreshKnowledgeBase = useCallback(async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/knowledge`, {
        credentials: "include",
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        setKnowledge(result.data);
        knowledgeBaseRef.current = result.data;
      }
    } catch (error) {
      console.error("Error refreshing knowledge base:", error);
    }
  }, [chatbotId]);

  const handleUploadComplete = useCallback((newSources: any[]) => {
    // Optimistically add new sources to the list
    setKnowledge((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const uniqueNewSources = newSources.filter((s) => !existingIds.has(s.id));
      const updated = [...uniqueNewSources, ...prev];
      knowledgeBaseRef.current = updated;
      return updated;
    });

    // Note: No manual polling needed - SSE will provide real-time updates automatically

    // Close upload section
    setShowUpload(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      let content = formData.content;

      // For FAQ type, convert faqPairs array to JSON string
      if (formData.type === "FAQ") {
        // Validate FAQ pairs
        const validPairs = faqPairs.filter(
          (p) => p.question.trim() && p.answer.trim(),
        );
        if (validPairs.length === 0) {
          toast.error("Validation Error", {
            description: "Please add at least one question and answer pair",
          });
          setIsSubmitting(false);
          return;
        }
        content = JSON.stringify(validPairs);
      }

      const response = await fetch(`/api/chatbots/${chatbotId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: formData.type,
          title: formData.title,
          content,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add knowledge");
      }

      setFormData({ type: "FAQ", title: "", content: "" });
      setFaqPairs([{ question: "", answer: "" }]);
      setShowAddForm(false);
      fetchKnowledge();
      toast.success("Knowledge Added", {
        description: "Knowledge item created successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add knowledge");
      toast.error("Error", {
        description:
          err instanceof Error ? err.message : "Failed to add knowledge",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/knowledge/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete knowledge");
      }

      // Remove from state optimistically
      setKnowledge((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Documents
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Text/FAQ/Website
          </button>

          {/* Real-time Reconnect Button (only shows when disconnected) */}
          {!isConnected && (
            <button
              onClick={async () => {
                await refreshRealtime();
                toast.info("Reconnecting to realtime updates...");
              }}
              className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 hover:border-amber-400 transition-colors font-medium"
            >
              Click to reconnect realtime
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* File Upload Section */}
      {showUpload && (
        <div>
          <KnowledgeFileUpload
            chatbotId={chatbotId}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {/* Add Text/FAQ/URL Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add Knowledge Item
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(
                  newType: "FAQ" | "DOCUMENT" | "TEXT" | "URL",
                ) => {
                  setFormData({
                    ...formData,
                    type: newType,
                    title: "",
                    content: "",
                  });
                  setFaqPairs([{ question: "", answer: "" }]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="URL">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 text-gray-900 py-2 border border-gray-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={
                  formData.type === "FAQ"
                    ? "e.g., Frequently Asked Questions"
                    : formData.type === "TEXT"
                      ? "e.g., Company Overview"
                      : "e.g., Official Documentation"
                }
              />
            </div>

            {/* FAQ Form */}
            {formData.type === "FAQ" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-500">
                  Question & Answer Pairs *
                </label>
                {faqPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="border text-gray-900 border-gray-200 rounded-md p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">
                        Pair {index + 1}
                      </span>
                      {faqPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFaqPairs(faqPairs.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={pair.question}
                        onChange={(e) => {
                          const newPairs = [...faqPairs];
                          newPairs[index].question = e.target.value;
                          setFaqPairs(newPairs);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Question (e.g., What are your fees?)"
                        maxLength={1000}
                      />
                    </div>
                    <div>
                      <textarea
                        required
                        value={pair.answer}
                        onChange={(e) => {
                          const newPairs = [...faqPairs];
                          newPairs[index].answer = e.target.value;
                          setFaqPairs(newPairs);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Answer"
                        maxLength={5000}
                      />
                    </div>
                  </div>
                ))}
                {faqPairs.length < 50 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFaqPairs([...faqPairs, { question: "", answer: "" }]);
                    }}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-200 rounded-md text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Another Q&A Pair
                  </button>
                )}
              </div>
            )}

            {/* TEXT Form */}
            {formData.type === "TEXT" && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={10}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                  placeholder="Enter the text content your chatbot should know..."
                  minLength={10}
                  maxLength={50000}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.content.length} / 50,000 characters (min: 10)
                </p>
              </div>
            )}

            {/* URL Form */}
            {formData.type === "URL" && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Website *
                </label>
                <input
                  type="url"
                  required
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full text-gray-900 px-3 py-2 border border-gray-200 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="https://example.com/page"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Knowledge"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ type: "FAQ", title: "", content: "" });
                  setFaqPairs([{ question: "", answer: "" }]);
                }}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Knowledge List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto"></div>
        </div>
      ) : (
        <KnowledgeList knowledge={knowledge} onDelete={handleDelete} />
      )}
    </div>
  );
}
