"use client";

import { useCallback } from "react";
import { Paperclip } from "lucide-react";

interface ChatFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function ChatFileUpload({
  onFilesSelected,
  disabled,
}: ChatFileUploadProps) {
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      // Convert FileList to array and pass to parent
      const filesArray = Array.from(files);
      onFilesSelected(filesArray);
    },
    [onFilesSelected],
  );

  return (
    <label
      className={`inline-flex items-center justify-center p-2 rounded-full transition-colors flex-shrink-0 ${
        disabled
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-600 hover:bg-gray-100 cursor-pointer"
      }`}
    >
      <Paperclip className="h-5 w-5" />
      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.md,.csv,.docx,.xlsx"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
    </label>
  );
}
