"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  File,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import {
  validateKnowledgeFile,
  ALLOWED_KNOWLEDGE_EXTENSIONS,
} from "@/lib/validation/knowledge";
import {
  getPresignedUploadUrl,
  uploadToS3,
  confirmUpload,
} from "@/lib/upload/knowledgeUploadHelpers";
import { toast } from "sonner";
import { useChatbotKnowledge } from "@/hooks/useChatbotKnowledge";

interface KnowledgeFileUploadProps {
  chatbotId: string;
  onUploadComplete: (newSources: any[]) => void;
  // Optional: Accept external connection status
  externalIsConnected?: boolean;
  externalActiveCount?: number;
}

interface SelectedFile {
  file: File;
  id: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  knowledgeSourceId?: string;
}

/**
 * Process a single file upload through the two-phase flow
 * 1. Get presigned URL and create DB record
 * 2. Upload to S3 (Lambda processes automatically via S3 event)
 */
async function processSingleFileUpload(
  file: File,
  chatbotId: string,
  fileIndex: number,
  setProgress: (index: number, progress: number) => void,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Step 1: Get presigned URL (10% progress)
    setProgress(fileIndex, 10);
    const presignedData = await getPresignedUploadUrl(chatbotId, file);
    const { knowledgeSource, upload } = presignedData;

    // Step 2: Upload to S3 (20-100% progress)
    setProgress(fileIndex, 30);
    const uploadResult = await uploadToS3(file, upload.url, upload.fields);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "S3 upload failed");
    }

    setProgress(fileIndex, 90);

    // Step 3: Confirm upload to trigger document processing Lambda
    await confirmUpload(chatbotId, knowledgeSource.id, upload.s3Key);

    setProgress(fileIndex, 100);

    return {
      success: true,
      data: knowledgeSource,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export default function KnowledgeFileUpload({
  chatbotId,
  onUploadComplete,
  externalIsConnected,
  externalActiveCount,
}: KnowledgeFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(
    null,
  );

  // Simplified chatbot-based knowledge tracking (only when external status not provided)
  const internalConnection = useChatbotKnowledge({
    chatbotId,
    enabled: !externalIsConnected, // Disable if external connection provided
    includeCompleted: false,
    onKnowledgeUpdate: (knowledge) => {
      if (knowledge.status === "COMPLETED") {
        setProcessingMessage(`✅ ${knowledge.title} processed successfully!`);
        setTimeout(() => setProcessingMessage(null), 3000);
      } else if (knowledge.status === "FAILED") {
        setProcessingMessage(`❌ ${knowledge.title} processing failed`);
      }
    },
    onAllCompleted: () => {
      // Only trigger completion callback if we actually have uploaded files
      if (
        onUploadComplete &&
        uploadingFiles.some((f) => f.status === "completed")
      ) {
        onUploadComplete(internalConnection.knowledge);
      }
    },
  });

  // Use external connection status if provided, otherwise use internal
  const isConnected =
    externalIsConnected !== undefined
      ? externalIsConnected
      : internalConnection.isConnected;
  const activeCount =
    externalActiveCount !== undefined
      ? externalActiveCount
      : internalConnection.activeCount;

  // Handle file selection (without uploading)
  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const fileArray = Array.from(files);

    // Validate all files
    const validFiles: SelectedFile[] = [];
    for (const file of fileArray) {
      const validation = validateKnowledgeFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        toast.error("Validation Error", {
          description: validation.error,
        });
        continue;
      }

      validFiles.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      });
    }

    if (validFiles.length === 0) return;

    // Add to selected files
    setSelectedFiles((prev) => [...prev, ...validFiles]);

    toast.success("Files Selected", {
      description: `${validFiles.length} file(s) ready to upload`,
    });
  }, []);

  // Remove a selected file
  const removeSelectedFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Clear all selected files
  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Start the upload process
  const startUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    const filesToUpload = selectedFiles.map((sf) => sf.file);

    // Initialize uploading state
    const initialUploadingFiles: UploadingFile[] = filesToUpload.map(
      (file) => ({
        file,
        progress: 0,
        status: "uploading",
      }),
    );
    setUploadingFiles(initialUploadingFiles);

    // Clear selected files as we're uploading them now
    setSelectedFiles([]);

    // Helper to update progress
    const updateProgress = (index: number, progress: number) => {
      setUploadingFiles((prev) =>
        prev.map((f, idx) => (idx === index ? { ...f, progress } : f)),
      );
    };

    // Upload files sequentially
    const completedSources: any[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      const result = await processSingleFileUpload(
        file,
        chatbotId,
        i,
        updateProgress,
      );

      if (result.success && result.data) {
        // Mark as completed
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "completed", progress: 100 } : f,
          ),
        );

        completedSources.push(result.data);

        toast.success("Upload Complete", {
          description: `${file.name} uploaded successfully`,
        });
      } else {
        // Mark as error
        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: result.error || "Upload failed",
                }
              : f,
          ),
        );

        toast.error("Upload Failed", {
          description: `${file.name}: ${result.error || "Unknown error"}`,
        });
      }
    }

    // Notify parent of completed uploads
    if (completedSources.length > 0) {
      onUploadComplete(completedSources);
    }

    setIsUploading(false);

    // Clear uploading files after 3 seconds
    setTimeout(() => {
      setUploadingFiles([]);
    }, 3000);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelection(e.dataTransfer.files);
    },
    [handleFileSelection],
  );

  const isDisabled =
    isUploading || uploadingFiles.some((f) => f.status === "uploading");

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Processing Status Message */}
      {processingMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!isConnected ? (
                <Loader2 className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              )}
              <p className="text-sm text-blue-700">{processingMessage}</p>
            </div>
            {/* Connection Status Indicator */}
            <div className="flex items-center text-xs text-gray-500">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              {isConnected ? "Real-time" : "Disconnected"}
            </div>
          </div>
        </div>
      )}

      {/* Upload Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-700">
              <strong>Real-time</strong> updates will show processing progress.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-colors cursor-pointer
          ${
            isDragging
              ? "border-brand-blue bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          }
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          type="file"
          multiple
          accept={ALLOWED_KNOWLEDGE_EXTENSIONS.join(",")}
          onChange={(e) => handleFileSelection(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isDisabled}
        />
        <Upload
          className={`mx-auto h-12 w-12 mb-4 ${
            isDragging ? "text-brand-blue" : "text-gray-400"
          }`}
        />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-600">
          Supported formats: PDF, DOCX, TXT, MD, PNG, JPG, TIFF
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum size: 100MB for PDF/images, 50MB for documents
        </p>
      </div>

      {/* Selected Files (before upload) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            <button
              onClick={clearSelectedFiles}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All
            </button>
          </div>

          {selectedFiles.map((selectedFile) => (
            <div
              key={selectedFile.id}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => removeSelectedFile(selectedFile.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          <button
            onClick={startUpload}
            disabled={isDisabled}
            className="w-full btn-primary py-3 px-4 rounded-lg font-medium
              focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload {selectedFiles.length}{" "}
            {selectedFiles.length === 1 ? "File" : "Files"}
          </button>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Uploading (
            {uploadingFiles.filter((f) => f.status === "uploading").length}/
            {uploadingFiles.length})
          </h3>

          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadingFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  {/* Progress bar */}
                  {uploadingFile.status === "uploading" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadingFile.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Success */}
                  {uploadingFile.status === "completed" && (
                    <div className="mt-2 flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Upload completed
                      </span>
                    </div>
                  )}

                  {/* Error */}
                  {uploadingFile.status === "error" && (
                    <div className="mt-2 flex items-start gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-xs">{uploadingFile.error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
