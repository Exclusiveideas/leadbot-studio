import { useState, useCallback, useEffect, useRef } from "react";
import { validateChatFile } from "@/lib/chat/fileProcessor";

export interface DragAndDropResult {
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string }>;
}

interface UseDragAndDropOptions {
  onFilesDropped: (result: DragAndDropResult) => void;
  disabled?: boolean;
}

export function useDragAndDrop({
  onFilesDropped,
  disabled = false,
}: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      // Only track file drags
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
          setIsDragging(true);
        }
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      // Set dropEffect to indicate this is a valid drop zone
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      // Reset drag state
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Validate each file
      const validFiles: File[] = [];
      const invalidFiles: Array<{ file: File; error: string }> = [];

      Array.from(files).forEach((file) => {
        const validation = validateChatFile({
          name: file.name,
          size: file.size,
          type: file.type,
        });

        if (validation.valid) {
          validFiles.push(file);
        } else {
          invalidFiles.push({
            file,
            error: validation.error || "Unknown error",
          });
        }
      });

      onFilesDropped({ validFiles, invalidFiles });
    },
    [disabled, onFilesDropped],
  );

  useEffect(() => {
    const handleDragEnterBound = handleDragEnter as EventListener;
    const handleDragLeaveBound = handleDragLeave as EventListener;
    const handleDragOverBound = handleDragOver as EventListener;
    const handleDropBound = handleDrop as EventListener;

    window.addEventListener("dragenter", handleDragEnterBound);
    window.addEventListener("dragleave", handleDragLeaveBound);
    window.addEventListener("dragover", handleDragOverBound);
    window.addEventListener("drop", handleDropBound);

    return () => {
      window.removeEventListener("dragenter", handleDragEnterBound);
      window.removeEventListener("dragleave", handleDragLeaveBound);
      window.removeEventListener("dragover", handleDragOverBound);
      window.removeEventListener("drop", handleDropBound);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    isDragging,
  };
}
