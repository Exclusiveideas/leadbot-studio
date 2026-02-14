/**
 * Excel Export Types
 * Type definitions for structured Excel exports
 */

import type { CJD301LSection } from "./cjd301lSections";
import type { SectionBasedCJD301LExport } from "./cjd301lSections";

/**
 * Excel cell value types
 */
export type ExcelCellValue = string | number | boolean | Date | null;

/**
 * Excel cell formatting
 */
export interface ExcelCellFormat {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  numberFormat?: string;
  alignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "middle" | "bottom";
  wrapText?: boolean;
  border?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
    color?: string;
  };
}

/**
 * Excel cell with value and formatting
 */
export interface ExcelCell {
  value: ExcelCellValue;
  format?: ExcelCellFormat;
  comment?: string;
  hyperlink?: string;
}

/**
 * Excel row
 */
export interface ExcelRow {
  cells: ExcelCell[];
  height?: number;
  hidden?: boolean;
}

/**
 * Excel column definition
 */
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: ExcelCellFormat;
}

/**
 * Excel sheet
 */
export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: ExcelRow[];
  frozen?: {
    rows?: number;
    columns?: number;
  };
  autoFilter?: boolean;
  metadata?: {
    sectionId?: CJD301LSection;
    fieldCount?: number;
    documentCount?: number;
  };
}

/**
 * Excel workbook metadata
 */
export interface ExcelWorkbookMetadata {
  title: string;
  subject?: string;
  author?: string;
  company?: string;
  created: string;
  modified?: string;
  caseId: string;
  exportType: "CJD_301_L";
  version: string;
  documentCount: number;
  totalFields: number;
  processingTime?: number;
}

/**
 * Excel workbook structure
 */
export interface ExcelWorkbook {
  sheets: ExcelSheet[];
  metadata: ExcelWorkbookMetadata;
}

/**
 * Complete Excel export structure
 */
export interface ExcelStructuredData {
  workbook: ExcelWorkbook;
  cached: boolean;
  generatedAt: string;
}

/**
 * Cached Excel export
 */
export interface CachedExcelExport {
  caseId: string;
  data: ExcelStructuredData;
  createdAt: string;
  documentCount: number;
  isValid: boolean;
}

/**
 * Cache validity check result
 */
export interface CacheValidityResult {
  isValid: boolean;
  reason?: string;
  lastGenerated?: string;
  documentsChanged?: boolean;
  ageInMinutes?: number;
}

/**
 * Excel export options
 */
export interface ExcelExportOptions {
  caseId: string;
  userId: string;
  forceRefresh?: boolean;
  includeMetadata?: boolean;
  includeComments?: boolean;
  format?: "structured" | "download";
}

/**
 * Excel export result
 */
export interface ExcelExportResult {
  success: boolean;
  data?: ExcelStructuredData;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    cached: boolean;
    processingTime: number;
    documentCount: number;
    totalFields: number;
  };
}

/**
 * Excel export API response
 */
export interface ExcelExportApiResponse {
  success: boolean;
  data?: ExcelStructuredData;
  error?: string;
  cached: boolean;
  processingTime?: number;
}

/**
 * Cache status for UI display
 */
export interface ExcelCacheStatus {
  exists: boolean;
  lastGenerated: string | null;
  documentCount: number;
  isValid: boolean;
  ageInMinutes: number | null;
}
