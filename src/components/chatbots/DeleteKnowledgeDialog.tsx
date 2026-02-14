"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";

interface KnowledgeMetadata {
  id: string;
  type: string;
  title: string;
  chunkCount: number;
  processedAt: string | null;
  createdAt: string;
}

interface DeleteKnowledgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  knowledge: KnowledgeMetadata | null;
  isLoading?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DeleteKnowledgeDialog({
  isOpen,
  onClose,
  onConfirm,
  knowledge,
  isLoading = false,
}: DeleteKnowledgeDialogProps) {
  if (!knowledge) return null;

  const isProcessed = knowledge.chunkCount > 0;
  const additionalInfo = isProcessed
    ? ` This will remove ${knowledge.chunkCount} indexed chunk${knowledge.chunkCount !== 1 ? "s" : ""} from the vector database.`
    : "";

  const message = `Are you sure you want to delete "${knowledge.title}"? This action will permanently remove:
• The knowledge item from your chatbot
• All associated files from storage
• All vector embeddings from the database${additionalInfo}

This action cannot be undone.`;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Knowledge"
      message={message}
      confirmText={isLoading ? "Deleting..." : "Delete Knowledge"}
      cancelText="Cancel"
      variant="danger"
      icon={<Trash2 className="w-6 h-6" />}
      isLoading={isLoading}
    />
  );
}
