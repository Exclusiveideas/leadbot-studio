/**
 * Export System Types
 * Defines types for various case export options and processing
 */

export enum ExportType {
  CJD_301_L = "cjd_301_l",
  CJD_301_L_EXCEL = "cjd_301_l_excel",
  CASE_SUMMARY = "case_summary",
  DOCUMENT_INDEX = "document_index",
  FINANCIAL_ANALYSIS = "financial_analysis",
}

export interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon?: string;
  estimatedTime?: string;
  fileFormat: string;
  available: boolean;
  requiresDocuments?: boolean;
  minimumDocuments?: number;
}

export enum ExportStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface ExportProgress {
  status: ExportStatus;
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
  processedDocuments?: number;
  totalDocuments?: number;
}

export interface ExportResult {
  success: boolean;
  status?: "processing" | "ready" | "error";
  exportType: ExportType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
  processingTime?: number;
  error?: string;
  message?: string;
  warnings?: string[];
}

export interface ExportRequest {
  caseId: string;
  exportType: ExportType;
  options?: Record<string, any>;
  includeMetadata?: boolean;
  format?: "json" | "pdf" | "csv" | "xlsx";
}

export interface ExportApiResponse {
  success: boolean;
  data?: ExportResult;
  error?: string;
  progress?: ExportProgress;
}

// Export configuration for different types
export const EXPORT_OPTIONS: Record<ExportType, ExportOption> = {
  [ExportType.CJD_301_L]: {
    id: ExportType.CJD_301_L,
    name: "Financial Statement (JSON)",
    description:
      "Generate the official court financial statement for your case",
    icon: "FileText",
    estimatedTime: "2-5 minutes",
    fileFormat: "JSON/PDF",
    available: true,
    requiresDocuments: true,
    minimumDocuments: 1,
  },
  [ExportType.CJD_301_L_EXCEL]: {
    id: ExportType.CJD_301_L_EXCEL,
    name: "Financial Statement (Excel)",
    description:
      "Export the financial statement as a structured Excel workbook with sections",
    icon: "Table",
    estimatedTime: "30 seconds - 2 minutes",
    fileFormat: "Excel (XLSX)",
    available: true,
    requiresDocuments: true,
    minimumDocuments: 1,
  },
  [ExportType.CASE_SUMMARY]: {
    id: ExportType.CASE_SUMMARY,
    name: "Case Summary",
    description:
      "Get a complete overview of your case with key findings and timeline",
    icon: "BarChart3",
    estimatedTime: "3-10 minutes",
    fileFormat: "PDF",
    available: false, // Coming soon
    requiresDocuments: true,
    minimumDocuments: 1,
  },
  [ExportType.DOCUMENT_INDEX]: {
    id: ExportType.DOCUMENT_INDEX,
    name: "Document List",
    description: "Download a complete list of all documents in your case",
    icon: "List",
    estimatedTime: "1-2 minutes",
    fileFormat: "CSV/Excel",
    available: false, // Coming soon
    requiresDocuments: false,
  },
  [ExportType.FINANCIAL_ANALYSIS]: {
    id: ExportType.FINANCIAL_ANALYSIS,
    name: "Financial Analysis",
    description:
      "Get detailed insights and analysis of financial information in your case",
    icon: "DollarSign",
    estimatedTime: "5-15 minutes",
    fileFormat: "PDF",
    available: false, // Coming soon
    requiresDocuments: true,
    minimumDocuments: 3,
  },
};

export const AVAILABLE_EXPORT_OPTIONS = Object.values(EXPORT_OPTIONS).filter(
  (option) => option.available,
);

// Helper functions
export function getExportOption(type: ExportType): ExportOption {
  return EXPORT_OPTIONS[type];
}

export function isExportAvailable(type: ExportType): boolean {
  return EXPORT_OPTIONS[type]?.available || false;
}

export function getEstimatedTime(type: ExportType): string {
  return EXPORT_OPTIONS[type]?.estimatedTime || "Unknown";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
