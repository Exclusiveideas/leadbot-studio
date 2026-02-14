"use client";

import { Download, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatFileSize } from "@/app/(dashboard)/generate/components/chat/fileHelpers";
import { useToast } from "@/components/ui/toast";

// Dynamically import UniversalDocumentViewer to avoid SSR issues
const UniversalDocumentViewer = dynamic(
  () =>
    import("@/components/documents/enhanced-viewer/UniversalDocumentViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document viewer...</p>
        </div>
      </div>
    ),
  },
);

interface AttachmentViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  s3Key: string | null;
  fileName: string;
  mimeType: string;
  size: number;
}

export default function AttachmentViewerModal({
  open,
  onOpenChange,
  s3Key,
  fileName,
  mimeType,
  size,
}: AttachmentViewerModalProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // PDF viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale] = useState(1.0);

  // AbortController ref for cancelling fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const downloadAbortControllerRef = useRef<AbortController | null>(null);

  const { addToast } = useToast();

  // Wrap setCurrentPage in useCallback to prevent infinite loops
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTotalPagesChange = useCallback((total: number) => {
    setTotalPages(total);
  }, []);

  // Fetch presigned URL with proper cleanup and race condition handling
  const fetchDocumentUrl = useCallback(async () => {
    if (!s3Key) {
      setError("No file available to display");
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      const encodedS3Key = encodeURIComponent(s3Key);
      const response = await fetch(`/api/chat/files/${encodedS3Key}/download`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        // Provide specific error messages based on status
        if (response.status === 404) {
          throw new Error("File not found");
        } else if (response.status === 403) {
          throw new Error("Access denied to this file");
        } else if (response.status >= 500) {
          throw new Error("Server error - please try again later");
        } else {
          throw new Error(`Failed to load file (${response.status})`);
        }
      }

      // Get the presigned URL from redirect or response
      const url = response.url;
      setDocumentUrl(url);
    } catch (err) {
      // Don't show error if request was aborted (race condition handling)
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Failed to fetch document:", err);
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [s3Key]);

  // Fetch presigned URL when modal opens
  useEffect(() => {
    if (open && s3Key) {
      fetchDocumentUrl();
    } else if (!open) {
      // Clean up state when viewer closes
      setDocumentUrl(null);
      setCurrentPage(1);
      setTotalPages(0);
      setError(null);
    }

    // Cleanup function to abort fetch on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, s3Key, fetchDocumentUrl]);

  const handleDownload = useCallback(async () => {
    // Guard against concurrent downloads
    if (downloading || !s3Key) return;

    // Cancel any previous download
    if (downloadAbortControllerRef.current) {
      downloadAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    downloadAbortControllerRef.current = abortController;

    setDownloading(true);

    try {
      const encodedS3Key = encodeURIComponent(s3Key);
      const response = await fetch(`/api/chat/files/${encodedS3Key}/download`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorMsg =
          response.status === 404
            ? "File not found"
            : response.status === 403
              ? "Access denied"
              : "Failed to download file";
        addToast(errorMsg, "error");
        return;
      }

      // Get the presigned URL from the redirect
      const presignedUrl = response.url;

      // Fetch the file as a blob
      const fileResponse = await fetch(presignedUrl, {
        signal: abortController.signal,
      });

      if (!fileResponse.ok) {
        addToast("Failed to download file from storage", "error");
        return;
      }

      const blob = await fileResponse.blob();

      // Sanitize filename to remove invalid characters
      const sanitizedFileName = fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

      // Create a download link and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = sanitizedFileName;

      try {
        document.body.appendChild(link);
        link.click();
      } finally {
        document.body.removeChild(link);
      }

      // Clean up the blob URL with timeout based on file size (5s minimum, +1s per MB)
      const timeoutMs = Math.max(5000, blob.size / 1024);
      setTimeout(() => URL.revokeObjectURL(blobUrl), timeoutMs);

      addToast("File downloaded successfully", "success");
    } catch (error) {
      // Don't show error if request was aborted (user cancelled)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Download failed:", error);
      addToast("Download failed. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  }, [downloading, s3Key, fileName, addToast]);

  // Mock analysis object for UniversalDocumentViewer
  const analysis = {
    id: s3Key || "",
    originalName: fileName,
    mimeType,
    size,
    status: "completed",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl lg:max-w-5xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <SheetTitle className="text-base font-medium text-gray-900 truncate">
                {fileName}
              </SheetTitle>
              <p className="text-sm text-gray-500 mt-1">
                {formatFileSize(size)} • {mimeType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`inline-flex items-center px-3 py-1.5 text-sm rounded transition-colors ${
                  downloading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                title={downloading ? "Downloading..." : "Download file"}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1.5" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-4">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchDocumentUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && documentUrl && (
            <UniversalDocumentViewer
              documentUrl={documentUrl}
              currentPage={currentPage}
              scale={scale}
              searchTerm=""
              onPageChange={handlePageChange}
              onTotalPagesChange={handleTotalPagesChange}
              analysis={analysis}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
