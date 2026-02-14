import {
  JSONExtractionResult,
  JSONExtractionStrategy,
  JSONExtractionStats,
  JSON_EXTRACTION_MARKERS,
} from "@/types/bedrock";
import { logger } from "@/lib/utils/logger";

/**
 * ClaudeJsonExtractor: Robust JSON extraction with 5-strategy fallback system
 *
 * Implements comprehensive fallback strategies for extracting valid JSON from AI responses,
 * handling various formatting inconsistencies, markdown blocks, comments, and structural issues.
 */
export class ClaudeJsonExtractor {
  private stats: JSONExtractionStats;

  constructor() {
    this.stats = {
      totalAttempts: 0,
      successfulExtractions: 0,
      strategySuccessRates: {
        [JSONExtractionStrategy.DIRECT_PARSE]: 0,
        [JSONExtractionStrategy.CODE_BLOCK_EXTRACTION]: 0,
        [JSONExtractionStrategy.JSON_STRUCTURE_DETECTION]: 0,
        [JSONExtractionStrategy.STRING_CLEANING]: 0,
        [JSONExtractionStrategy.MARKER_BASED_EXTRACTION]: 0,
      },
      averageAttemptsPerExtraction: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Main extraction method with 5-strategy fallback
   */
  async extractJSON(content: string): Promise<JSONExtractionResult> {
    this.stats.totalAttempts++;
    let attempts = 0;

    // Strategy 1: Direct Parse
    attempts++;
    const directResult = this.tryDirectParse(content);
    if (directResult.success) {
      this.updateStats(JSONExtractionStrategy.DIRECT_PARSE, true, attempts);
      return {
        ...directResult,
        attempts,
        strategy: JSONExtractionStrategy.DIRECT_PARSE,
      };
    }

    // Strategy 2: Code Block Extraction
    attempts++;
    const codeBlockResult = this.extractFromCodeBlock(content);
    if (codeBlockResult.success) {
      this.updateStats(
        JSONExtractionStrategy.CODE_BLOCK_EXTRACTION,
        true,
        attempts,
      );
      return {
        ...codeBlockResult,
        attempts,
        strategy: JSONExtractionStrategy.CODE_BLOCK_EXTRACTION,
      };
    }

    // Strategy 3: JSON Structure Detection
    attempts++;
    const structureResult = this.extractJsonStructure(content);
    if (structureResult.success) {
      this.updateStats(
        JSONExtractionStrategy.JSON_STRUCTURE_DETECTION,
        true,
        attempts,
      );
      return {
        ...structureResult,
        attempts,
        strategy: JSONExtractionStrategy.JSON_STRUCTURE_DETECTION,
      };
    }

    // Strategy 4: String Cleaning
    attempts++;
    const cleaningResult = this.cleanAndParse(content);
    if (cleaningResult.success) {
      this.updateStats(JSONExtractionStrategy.STRING_CLEANING, true, attempts);
      return {
        ...cleaningResult,
        attempts,
        strategy: JSONExtractionStrategy.STRING_CLEANING,
      };
    }

    // Strategy 5: Marker-Based Extraction
    attempts++;
    const markerResult = this.extractBetweenMarkers(content);
    if (markerResult.success) {
      this.updateStats(
        JSONExtractionStrategy.MARKER_BASED_EXTRACTION,
        true,
        attempts,
      );
      return {
        ...markerResult,
        attempts,
        strategy: JSONExtractionStrategy.MARKER_BASED_EXTRACTION,
      };
    }

    // All strategies failed
    logger.error("JSON extraction strategies all failed", undefined, {
      component: "JSONExtractor",
      action: "extractJSON",
      attempts: attempts.length,
      strategies: attempts.map((a) => a.strategy),
    });
    this.updateStats(null, false, attempts);

    return {
      success: false,
      error: "All JSON extraction strategies failed",
      attempts,
    };
  }

  /**
   * Strategy 1: Direct Parse - Attempts standard JSON.parse()
   */
  private tryDirectParse(content: string): JSONExtractionResult {
    try {
      const trimmed = content.trim();
      if (!trimmed) {
        return { success: false, error: "Empty content" };
      }

      const parsed = JSON.parse(trimmed);

      return {
        success: true,
        content: trimmed,
        parsed,
      };
    } catch (error) {
      return {
        success: false,
        error: `Direct parse failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Strategy 2: Code Block Extraction - Handles markdown code blocks
   */
  private extractFromCodeBlock(content: string): JSONExtractionResult {
    const patterns = [
      // Triple backticks with json language
      /```json\s*([\s\S]*?)\s*```/gi,
      // Triple backticks without language
      /```\s*([\s\S]*?)\s*```/g,
      // Single backtick blocks (shorter content)
      /`([^`]+)`/g,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const extracted = match[1]?.trim();
        if (!extracted) continue;

        try {
          const parsed = JSON.parse(extracted);

          return {
            success: true,
            content: extracted,
            parsed,
          };
        } catch (error) {
          // Try with cleaning for this extracted content
          const cleanResult = this.cleanAndParse(extracted);
          if (cleanResult.success) {
            return cleanResult;
          }
        }
      }
    }

    return {
      success: false,
      error: "No valid JSON found in code blocks",
    };
  }

  /**
   * Strategy 3: JSON Structure Detection - Finds JSON between {} or [] braces
   */
  private extractJsonStructure(content: string): JSONExtractionResult {
    // Look for JSON objects and arrays
    const structures = [
      this.findBalancedBraces(content, "{", "}"),
      this.findBalancedBraces(content, "[", "]"),
    ];

    for (const candidates of structures) {
      for (const candidate of candidates) {
        try {
          const parsed = JSON.parse(candidate);

          return {
            success: true,
            content: candidate,
            parsed,
          };
        } catch (error) {
          // Try cleaning this candidate
          const cleanResult = this.cleanAndParse(candidate);
          if (cleanResult.success) {
            return cleanResult;
          }
        }
      }
    }

    return {
      success: false,
      error: "No valid JSON structure found",
    };
  }

  /**
   * Strategy 4: String Cleaning - Removes common JSON issues
   */
  private cleanAndParse(content: string): JSONExtractionResult {
    try {
      let cleaned = content.trim();

      // Remove BOM (Byte Order Mark)
      cleaned = cleaned.replace(/^\uFEFF/, "");

      // Remove single-line comments (// comment)
      cleaned = cleaned.replace(/\/\/.*$/gm, "");

      // Remove multi-line comments (/* comment */)
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

      // Remove trailing commas in objects and arrays
      cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

      // Fix common escape sequence issues
      cleaned = cleaned.replace(/\\\\n/g, "\\n");
      cleaned = cleaned.replace(/\\\\t/g, "\\t");
      cleaned = cleaned.replace(/\\\\r/g, "\\r");

      // Fix unescaped quotes in strings (basic heuristic)
      cleaned = cleaned.replace(/": "([^"]*)"([^,}\]]*?)"/g, '": "$1\\"$2"');

      // Remove control characters except allowed ones (\n, \t, \r)
      cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

      // Normalize whitespace
      cleaned = cleaned.replace(/\s+/g, " ");
      cleaned = cleaned.trim();

      // Try parsing the cleaned content
      const parsed = JSON.parse(cleaned);

      return {
        success: true,
        content: cleaned,
        parsed,
      };
    } catch (error) {
      return {
        success: false,
        error: `String cleaning failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Strategy 5: Marker-Based Extraction - Looks for specific markers
   */
  private extractBetweenMarkers(content: string): JSONExtractionResult {
    for (const marker of JSON_EXTRACTION_MARKERS) {
      const markerIndex = content.indexOf(marker);
      if (markerIndex === -1) continue;

      // Extract content after the marker
      let afterMarker = content.substring(markerIndex + marker.length).trim();

      // If marker is a code block, handle differently
      if (marker.startsWith("```")) {
        const endMarker = marker === "```json" ? "```" : marker;
        const endIndex = afterMarker.indexOf(endMarker);
        if (endIndex !== -1) {
          afterMarker = afterMarker.substring(0, endIndex).trim();
        }
      }

      // Try to find JSON in the extracted content
      const directResult = this.tryDirectParse(afterMarker);
      if (directResult.success) {
        return directResult;
      }

      // Try structure detection on the marker content
      const structureResult = this.extractJsonStructure(afterMarker);
      if (structureResult.success) {
        return structureResult;
      }

      // Try cleaning the marker content
      const cleanResult = this.cleanAndParse(afterMarker);
      if (cleanResult.success) {
        return cleanResult;
      }
    }

    return {
      success: false,
      error: "No valid JSON found using marker-based extraction",
    };
  }

  /**
   * Find balanced braces/brackets in content
   */
  private findBalancedBraces(
    content: string,
    open: string,
    close: string,
  ): string[] {
    const results: string[] = [];
    let start = -1;
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === open) {
        if (depth === 0) {
          start = i;
        }
        depth++;
      } else if (char === close) {
        depth--;
        if (depth === 0 && start !== -1) {
          const candidate = content.substring(start, i + 1);
          results.push(candidate);
          start = -1;
        }
      }
    }

    return results;
  }

  /**
   * Update extraction statistics
   */
  private updateStats(
    strategy: JSONExtractionStrategy | null,
    success: boolean,
    attempts: number,
  ): void {
    if (success) {
      this.stats.successfulExtractions++;
    }

    if (strategy) {
      const currentRate = this.stats.strategySuccessRates[strategy];
      const totalStrategyAttempts = Math.max(
        1,
        Math.floor(this.stats.totalAttempts / 5),
      ); // Rough estimate
      this.stats.strategySuccessRates[strategy] = success
        ? (currentRate + 1) / totalStrategyAttempts
        : currentRate / totalStrategyAttempts;
    }

    this.stats.averageAttemptsPerExtraction =
      (this.stats.averageAttemptsPerExtraction *
        (this.stats.totalAttempts - 1) +
        attempts) /
      this.stats.totalAttempts;

    this.stats.lastUpdated = new Date();
  }

  /**
   * Get extraction statistics
   */
  getStats(): JSONExtractionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulExtractions: 0,
      strategySuccessRates: {
        [JSONExtractionStrategy.DIRECT_PARSE]: 0,
        [JSONExtractionStrategy.CODE_BLOCK_EXTRACTION]: 0,
        [JSONExtractionStrategy.JSON_STRUCTURE_DETECTION]: 0,
        [JSONExtractionStrategy.STRING_CLEANING]: 0,
        [JSONExtractionStrategy.MARKER_BASED_EXTRACTION]: 0,
      },
      averageAttemptsPerExtraction: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get overall success rate
   */
  getSuccessRate(): number {
    return this.stats.totalAttempts > 0
      ? this.stats.successfulExtractions / this.stats.totalAttempts
      : 0;
  }
}

// Export singleton instance
export const claudeJsonExtractor = new ClaudeJsonExtractor();
