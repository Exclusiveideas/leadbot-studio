import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { logger } from "@/lib/utils/logger";

export interface TextExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Extract text content from various file types
 * Supports: PDF, DOCX, XLSX, CSV, TXT, MD
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<TextExtractionResult> {
  try {
    // 1. Plain text files (.txt)
    if (mimeType === "text/plain") {
      const text = fileBuffer.toString("utf-8");
      return { success: true, text };
    }

    // 2. Markdown files (.md)
    if (mimeType === "text/markdown") {
      const text = fileBuffer.toString("utf-8");
      // Preserve markdown formatting - Claude understands it natively
      return { success: true, text };
    }

    // 3. PDF files
    if (mimeType === "application/pdf") {
      // pdf-parse v2.x uses a class-based API
      // serverExternalPackages in next.config.ts prevents bundling issues
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      return { success: true, text: result.text };
    }

    // 4. DOCX files
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return { success: true, text: result.value };
    }

    // 5. CSV files
    if (mimeType === "text/csv") {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      // Check for empty workbook
      if (workbook.SheetNames.length === 0) {
        return {
          success: false,
          error: "CSV file contains no sheets",
        };
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const text = XLSX.utils.sheet_to_csv(firstSheet);

      // Check for empty sheet
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: "CSV file is empty",
        };
      }

      return { success: true, text };
    }

    // 6. XLSX files
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      // Check for empty workbook
      if (workbook.SheetNames.length === 0) {
        return {
          success: false,
          error: "XLSX file contains no sheets",
        };
      }

      let allText = "";

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        allText += `\n--- Sheet: ${sheetName} ---\n`;
        allText += XLSX.utils.sheet_to_csv(sheet);
      });

      // Check for empty content after processing all sheets
      if (!allText || allText.trim().length === 0) {
        return {
          success: false,
          error: "XLSX file is empty",
        };
      }

      return { success: true, text: allText };
    }

    // Unsupported file type
    logger.warn("Unsupported file type for text extraction", {
      component: "textExtractor",
      fileName,
      mimeType,
    });

    return {
      success: false,
      error: `Unsupported file type: ${mimeType}`,
    };
  } catch (error) {
    logger.error("Text extraction failed", error, {
      component: "textExtractor",
      fileName,
      mimeType,
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown extraction error",
    };
  }
}

/**
 * Truncate extracted text if it exceeds max length
 * Useful for preventing token overflow
 */
export function truncateText(text: string, maxLength: number = 100000): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  return `${truncated}\n\n[Text truncated - original length: ${text.length} characters, showing first ${maxLength} characters]`;
}
