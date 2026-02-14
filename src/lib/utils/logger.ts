/**
 * Environment-aware logging utility
 * Provides controlled logging that can be disabled in production
 */

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";
  private enableProductionErrors = true; // Always log errors, even in production

  // Enhanced controls for reducing verbosity
  private enableVerboseExportLogs =
    process.env.ENABLE_VERBOSE_EXPORT_LOGS === "true";
  private enableAIProcessingLogs =
    process.env.ENABLE_AI_PROCESSING_LOGS === "true";
  private quietMode = process.env.QUIET_LOGS === "true";

  /**
   * Log debug information - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Log informational messages - only in development
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || "");
    }
  }

  /**
   * Log warnings - always logged
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Log errors - always logged (with optional suppression for AI/export processing)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    // Check if this is an AI processing or export-related error that can be suppressed
    const isAIProcessing =
      context?.component?.includes("Bedrock") ||
      context?.component?.includes("SearchOrchestrator") ||
      context?.component?.includes("JSONExtractor");

    const isExportProcessing =
      context?.component?.includes("Export") ||
      context?.component?.includes("Aggregator") ||
      context?.action?.includes("export");

    // Suppress verbose AI/export logs if environment variables are set
    if (
      this.quietMode ||
      (isAIProcessing && !this.enableAIProcessingLogs && this.isDevelopment) ||
      (isExportProcessing &&
        !this.enableVerboseExportLogs &&
        this.isDevelopment)
    ) {
      return; // Skip logging
    }

    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error.message, context || "");
    } else {
      console.error(`[ERROR] ${message}`, error, context || "");
    }
  }

  /**
   * Log performance metrics - only in development
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(
        `[PERF] ${operation} completed in ${duration.toFixed(2)}ms`,
        context || "",
      );
    }
  }

  /**
   * Log API requests - only in development
   */
  api(method: string, url: string, status?: number, duration?: number): void {
    if (this.isDevelopment) {
      const statusText = status ? ` (${status})` : "";
      const durationText = duration ? ` - ${duration.toFixed(2)}ms` : "";
      console.log(`[API] ${method} ${url}${statusText}${durationText}`);
    }
  }

  /**
   * Log user actions - only in development
   */
  userAction(action: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[USER] ${action}`, context || "");
    }
  }

  /**
   * Create a scoped logger for a specific component
   */
  scope(component: string) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(`[${component}] ${message}`, context),
      info: (message: string, context?: LogContext) =>
        this.info(`[${component}] ${message}`, context),
      warn: (message: string, context?: LogContext) =>
        this.warn(`[${component}] ${message}`, context),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        this.error(`[${component}] ${message}`, error, {
          component,
          ...context,
        }),
      performance: (
        operation: string,
        duration: number,
        context?: LogContext,
      ) => this.performance(`[${component}] ${operation}`, duration, context),
      userAction: (action: string, context?: LogContext) =>
        this.userAction(`[${component}] ${action}`, context),
    };
  }

  /**
   * Create a quiet scoped logger for export/AI processing (reduced verbosity)
   */
  quietScope(component: string) {
    return {
      debug: () => {}, // No debug logs in quiet mode
      info: () => {}, // No info logs in quiet mode
      warn: (message: string, context?: LogContext) =>
        this.warn(`[${component}] ${message}`, context),
      error: (
        message: string,
        error?: Error | unknown,
        context?: LogContext,
      ) => {
        // Only log critical errors in quiet mode
        if (
          error instanceof Error &&
          (error.message.includes("timeout") ||
            error.message.includes("failed"))
        ) {
          this.error(`[${component}] ${message}`, error, {
            component,
            ...context,
          });
        }
      },
      performance: () => {}, // No performance logs in quiet mode
      userAction: () => {}, // No user action logs in quiet mode
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export scoped loggers for common components
export const dashboardLogger = logger.scope("Dashboard");
export const documentsLogger = logger.scope("Documents");
export const authLogger = logger.scope("Auth");
export const apiLogger = logger.scope("API");
export const cacheLogger = logger.scope("Cache");
export const realtimeLogger = logger.scope("Realtime");

// Quiet loggers for verbose operations (can be controlled via environment variables)
export const exportLogger = logger.quietScope("Export");
export const aiLogger = logger.quietScope("AI");
export const bedrockLogger = logger.quietScope("Bedrock");
