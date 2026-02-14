/**
 * Document Aggregation Types
 * Types for tracking and managing async document data aggregation
 */

import { AggregationStatus } from "@prisma/client";

export { AggregationStatus };

// Document aggregation tracking
export interface DocumentAggregationInfo {
  documentId: string;
  aggregationStatus: AggregationStatus;
  aggregationStartedAt?: Date;
  aggregationCompletedAt?: Date;
  aggregationError?: string;
  aggregationRetryCount: number;
  lastAttemptAt?: Date;
}

// Case-level aggregation progress
export interface CaseAggregationProgress {
  caseId: string;
  totalDocuments: number;
  documentCounts: {
    pending: number;
    aggregating: number;
    aggregated: number;
    failed: number;
  };
  isReady: boolean; // All documents aggregated
  progress: number; // 0-100 percentage
  estimatedCompletion?: Date;
  failedDocuments: DocumentAggregationInfo[];
}

// Aggregation processing result
export interface AggregationResult {
  success: boolean;
  documentId: string;
  status: AggregationStatus;
  error?: string;
  processingTime?: number;
  retryable?: boolean;
}

// Aggregation retry options
export interface AggregationRetryOptions {
  documentId: string;
  resetRetryCount?: boolean;
  forceRetry?: boolean;
  maxRetries?: number;
}

// Batch aggregation operations
export interface BatchAggregationRequest {
  documentIds: string[];
  operation: "retry" | "reset" | "cancel";
  options?: AggregationRetryOptions;
}

export interface BatchAggregationResult {
  success: boolean;
  processed: number;
  failed: number;
  results: AggregationResult[];
  errors?: string[];
}

// Export readiness checking
export interface ExportReadinessCheck {
  caseId: string;
  isReady: boolean;
  reason?: string;
  pendingDocuments: number;
  failedDocuments: number;
  aggregatedDocuments: number;
  recommendation:
    | "proceed"
    | "wait"
    | "retry_failed"
    | "partial_export"
    | "manual_review";
}

// Aggregation status tracking for UI
export interface AggregationStatusSummary {
  status: "ready" | "processing" | "partially_ready" | "failed";
  message: string;
  actionRequired?: "retry" | "wait" | "manual_review";
  details: CaseAggregationProgress;
}

// API response types
export interface AggregationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocumentAggregationApiResponse
  extends AggregationApiResponse<DocumentAggregationInfo> {}
export interface CaseAggregationApiResponse
  extends AggregationApiResponse<CaseAggregationProgress> {}
export interface ExportReadinessApiResponse
  extends AggregationApiResponse<ExportReadinessCheck> {}

// Constants
export const AGGREGATION_RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Progressive delays in ms
export const MAX_AGGREGATION_RETRIES = 5;
export const AGGREGATION_TIMEOUT = 120000; // 2 minutes

// Helper functions
export function getAggregationStatusLabel(status: AggregationStatus): string {
  switch (status) {
    case AggregationStatus.PENDING:
      return "Pending";
    case AggregationStatus.AGGREGATING:
      return "Processing";
    case AggregationStatus.AGGREGATED:
      return "Completed";
    case AggregationStatus.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
}

export function getAggregationStatusColor(status: AggregationStatus): string {
  switch (status) {
    case AggregationStatus.PENDING:
      return "gray";
    case AggregationStatus.AGGREGATING:
      return "blue";
    case AggregationStatus.AGGREGATED:
      return "green";
    case AggregationStatus.FAILED:
      return "red";
    default:
      return "gray";
  }
}

export function canRetryAggregation(doc: DocumentAggregationInfo): boolean {
  return (
    doc.aggregationStatus === AggregationStatus.FAILED &&
    doc.aggregationRetryCount < MAX_AGGREGATION_RETRIES
  );
}

export function shouldRetryAggregation(doc: DocumentAggregationInfo): boolean {
  if (!canRetryAggregation(doc)) return false;

  if (!doc.lastAttemptAt) return true;

  const timeSinceLastAttempt = Date.now() - doc.lastAttemptAt.getTime();
  const retryDelay =
    AGGREGATION_RETRY_DELAYS[
      Math.min(doc.aggregationRetryCount, AGGREGATION_RETRY_DELAYS.length - 1)
    ];

  return timeSinceLastAttempt >= retryDelay;
}

export function calculateAggregationProgress(
  progress: CaseAggregationProgress,
): number {
  const { totalDocuments, documentCounts } = progress;
  if (totalDocuments === 0) return 100;

  const completed = documentCounts.aggregated;
  return Math.round((completed / totalDocuments) * 100);
}

export function getExportRecommendation(check: ExportReadinessCheck): string {
  switch (check.recommendation) {
    case "proceed":
      return "All documents are ready. You can proceed with the export.";
    case "wait":
      return `${check.pendingDocuments} documents are still processing. Please wait for completion.`;
    case "retry_failed":
      return `${check.failedDocuments} documents failed processing. Retry recommended before export.`;
    case "partial_export":
      return "Some documents are not ready. You can proceed with a partial export or wait for completion.";
    default:
      return "Unknown status. Please check document processing status.";
  }
}
