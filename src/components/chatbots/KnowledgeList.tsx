"use client";

import {
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DeleteKnowledgeDialog from "./DeleteKnowledgeDialog";
import { formatSafeDate, formatSafeDateTime } from "@/lib/utils/date";

interface KnowledgeItem {
  id: string;
  type: string;
  title: string;
  content: string;
  s3Key?: string;
  chunkCount: number;
  processedAt: string | null;
  createdAt: string;
  status?: string;
  stage?: string;
  progress?: number;
  totalChunks?: number;
  processedChunks?: number;
  failedChunks?: number;
  processingError?: string | null;
}

interface KnowledgeListProps {
  knowledge: KnowledgeItem[];
  onDelete?: (id: string) => void;
}

// Stage display mapping
const STAGE_LABELS: Record<string, string> = {
  QUEUED: "Queued",
  EXTRACTING_TEXT: "Extracting text...",
  TEXT_EXTRACTED: "Text extracted",
  CHUNKING_TEXT: "Chunking text...",
  GENERATING_EMBEDDINGS: "Generating embeddings...",
  STORING_VECTORS: "Storing vectors...",
  COMPLETED: "Completed",
};

// Status color mapping
function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "text-green-700 bg-green-50 border-green-200";
    case "PROCESSING":
      return "text-brand-muted bg-brand-surface border-brand-border";
    case "FAILED":
      return "text-red-700 bg-red-50 border-red-200";
    case "PENDING":
      return "text-brand-muted bg-brand-surface border-brand-border";
    case "QUEUED":
      return "text-brand-muted bg-brand-surface border-brand-border";
    default:
      return "text-brand-muted bg-brand-surface border-brand-border";
  }
}

// Type badge color mapping
function getTypeColor(type: string): string {
  switch (type) {
    case "FAQ":
      return "bg-green-50 text-green-700";
    case "DOCUMENT":
      return "bg-brand-surface text-brand-primary";
    case "TEXT":
      return "bg-green-50 text-green-700";
    case "URL":
      return "bg-brand-surface text-brand-muted";
    case "YOUTUBE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-brand-surface text-brand-muted";
  }
}

export default function KnowledgeList({
  knowledge,
  onDelete,
}: KnowledgeListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [knowledgeToDelete, setKnowledgeToDelete] =
    useState<KnowledgeItem | null>(null);

  const handleDeleteClick = (item: KnowledgeItem) => {
    setKnowledgeToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !knowledgeToDelete) return;

    const id = knowledgeToDelete.id;
    const title = knowledgeToDelete.title;

    setDeletingIds((prev) => new Set(prev).add(id));
    setDeleteDialogOpen(false);

    try {
      await onDelete(id);
      toast.success("Knowledge Deleted", {
        description: `${title} has been removed`,
      });
    } catch (error) {
      console.error("Error deleting knowledge:", error);
      toast.error("Delete Failed", {
        description: "Failed to delete knowledge item",
      });
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setKnowledgeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setKnowledgeToDelete(null);
  };

  if (knowledge.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-brand-border">
        <FileText className="mx-auto h-12 w-12 text-brand-muted" />
        <h3 className="mt-2 text-sm font-medium text-brand-primary">
          No knowledge items
        </h3>
        <p className="mt-1 text-sm text-brand-muted">
          Upload documents to provide context for your chatbot.
        </p>
      </div>
    );
  }

  return (
    <>
      <DeleteKnowledgeDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        knowledge={knowledgeToDelete}
        isLoading={
          knowledgeToDelete ? deletingIds.has(knowledgeToDelete.id) : false
        }
      />

      <div className="space-y-4">
        {knowledge.map((item) => {
          const isProcessing =
            item.status &&
            ["PENDING", "PROCESSING", "QUEUED"].includes(item.status);
          const hasError = item.status === "FAILED";

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl elevation-1 p-6 card-hover-lift border border-brand-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-brand-muted mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {/* Title and badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-brand-primary truncate">
                        {item.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}
                      >
                        {item.type}
                      </span>

                      {/* Processing status badge */}
                      {item.status && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(item.status)}`}
                        >
                          {isProcessing && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {item.status === "COMPLETED" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {hasError && <AlertCircle className="h-3 w-3" />}
                          {item.status}
                        </span>
                      )}
                    </div>

                    {/* Content preview (only for non-document types) */}
                    {item.type !== "DOCUMENT" && item.content && (
                      <p className="text-sm text-brand-muted whitespace-pre-wrap mb-3 line-clamp-3">
                        {item.content}
                      </p>
                    )}

                    {/* Processing progress */}
                    {isProcessing && item.stage && (
                      <div className="mt-3 mb-2">
                        <div className="flex items-center justify-between text-xs text-brand-muted mb-1">
                          <span>{STAGE_LABELS[item.stage] || item.stage}</span>
                          <span>{item.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-brand-border/40 rounded-full h-2">
                          <div
                            className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress || 0}%` }}
                          />
                        </div>
                        {(item.totalChunks || 0) > 0 && (
                          <div className="text-xs text-brand-muted mt-1">
                            {item.processedChunks || 0} / {item.totalChunks}{" "}
                            chunks processed
                            {(item.failedChunks || 0) > 0 &&
                              ` (${item.failedChunks} failed)`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error message */}
                    {hasError && item.processingError && (
                      <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800">
                          <p className="font-medium mb-1">Processing Failed</p>
                          <p>{item.processingError}</p>
                        </div>
                      </div>
                    )}

                    {/* Completed info */}
                    {item.status === "COMPLETED" && item.chunkCount > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-brand-muted">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-brand-blue" />
                          {item.chunkCount} chunks indexed
                        </span>
                        {item.processedAt && (
                          <span>
                            Processed {formatSafeDate(item.processedAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Created date */}
                    <div className="mt-2 text-xs text-brand-muted">
                      Added {formatSafeDateTime(item.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={() => handleDeleteClick(item)}
                    disabled={deletingIds.has(item.id)}
                    className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete knowledge"
                  >
                    {deletingIds.has(item.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
