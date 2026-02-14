import { claudeJsonExtractor } from "../bedrock/jsonExtractor";
import { JSONExtractionStats, JSONExtractionStrategy } from "@/types/bedrock";

export interface AISystemMetrics {
  jsonExtraction: JSONExtractionStats;
  bedrockRequests: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errorsByType: Record<string, number>;
  };
  promptPerformance: {
    templateUsage: Record<string, number>;
    averageTokenUsage: Record<string, number>;
    successRates: Record<string, number>;
  };
  systemHealth: {
    overallHealthScore: number;
    lastHealthCheck: Date;
    activeIssues: string[];
  };
  lastUpdated: Date;
}

export interface PerformanceAlert {
  type:
    | "error_rate"
    | "response_time"
    | "extraction_failure"
    | "health_degradation";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * AISystemMonitor: Comprehensive monitoring for AI system performance
 *
 * Tracks JSON extraction success, Bedrock performance, prompt effectiveness,
 * and overall system health with alerting capabilities.
 */
export class AISystemMonitor {
  private metrics: AISystemMetrics;
  private alerts: PerformanceAlert[] = [];
  private readonly MAX_ALERTS = 100;
  private readonly HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startHealthCheckInterval();
  }

  private initializeMetrics(): AISystemMetrics {
    return {
      jsonExtraction: claudeJsonExtractor.getStats(),
      bedrockRequests: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errorsByType: {},
      },
      promptPerformance: {
        templateUsage: {},
        averageTokenUsage: {},
        successRates: {},
      },
      systemHealth: {
        overallHealthScore: 100,
        lastHealthCheck: new Date(),
        activeIssues: [],
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Record a Bedrock request completion
   */
  recordBedrockRequest(
    success: boolean,
    responseTime: number,
    errorType?: string,
    templateId?: string,
    tokens?: number,
  ): void {
    this.metrics.bedrockRequests.totalRequests++;

    if (success) {
      this.metrics.bedrockRequests.successfulRequests++;
    } else {
      this.metrics.bedrockRequests.failedRequests++;

      if (errorType) {
        this.metrics.bedrockRequests.errorsByType[errorType] =
          (this.metrics.bedrockRequests.errorsByType[errorType] || 0) + 1;
      }
    }

    // Update average response time
    const totalRequests = this.metrics.bedrockRequests.totalRequests;
    this.metrics.bedrockRequests.averageResponseTime =
      (this.metrics.bedrockRequests.averageResponseTime * (totalRequests - 1) +
        responseTime) /
      totalRequests;

    // Track prompt performance
    if (templateId) {
      this.metrics.promptPerformance.templateUsage[templateId] =
        (this.metrics.promptPerformance.templateUsage[templateId] || 0) + 1;

      if (tokens) {
        const currentAvg =
          this.metrics.promptPerformance.averageTokenUsage[templateId] || 0;
        const usage = this.metrics.promptPerformance.templateUsage[templateId];
        this.metrics.promptPerformance.averageTokenUsage[templateId] =
          (currentAvg * (usage - 1) + tokens) / usage;
      }

      // Track success rate for this template
      const currentSuccessRate =
        this.metrics.promptPerformance.successRates[templateId] || 0;
      const templateUsage =
        this.metrics.promptPerformance.templateUsage[templateId];
      this.metrics.promptPerformance.successRates[templateId] = success
        ? (currentSuccessRate * (templateUsage - 1) + 1) / templateUsage
        : (currentSuccessRate * (templateUsage - 1)) / templateUsage;
    }

    this.metrics.lastUpdated = new Date();
    this.checkForAlerts();
  }

  /**
   * Get current system metrics
   */
  getMetrics(): AISystemMetrics {
    // Refresh JSON extraction stats
    this.metrics.jsonExtraction = claudeJsonExtractor.getStats();
    return { ...this.metrics };
  }

  /**
   * Get system health score (0-100)
   */
  getHealthScore(): number {
    let score = 100;
    const metrics = this.getMetrics();

    // JSON extraction success rate impact (30% weight)
    const extractionSuccessRate = claudeJsonExtractor.getSuccessRate();
    if (extractionSuccessRate < 0.95) {
      score -= (0.95 - extractionSuccessRate) * 300;
    }

    // Bedrock success rate impact (40% weight)
    const bedrockSuccessRate =
      metrics.bedrockRequests.totalRequests > 0
        ? metrics.bedrockRequests.successfulRequests /
          metrics.bedrockRequests.totalRequests
        : 1;
    if (bedrockSuccessRate < 0.95) {
      score -= (0.95 - bedrockSuccessRate) * 400;
    }

    // Response time impact (20% weight)
    const avgResponseTime = metrics.bedrockRequests.averageResponseTime;
    if (avgResponseTime > 30000) {
      // > 30 seconds
      score -= Math.min((avgResponseTime - 30000) / 1000, 200);
    }

    // Active issues impact (10% weight)
    score -= metrics.systemHealth.activeIssues.length * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Get recent alerts (last 24 hours)
   */
  getRecentAlerts(): PerformanceAlert[] {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alerts.filter((alert) => alert.timestamp > dayAgo);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(): void {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((alert) => alert.timestamp > weekAgo);
  }

  /**
   * Get extraction strategy effectiveness report
   */
  getExtractionStrategyReport(): Record<
    JSONExtractionStrategy,
    { rate: number; description: string }
  > {
    const stats = claudeJsonExtractor.getStats();

    return {
      [JSONExtractionStrategy.DIRECT_PARSE]: {
        rate: stats.strategySuccessRates[JSONExtractionStrategy.DIRECT_PARSE],
        description: "Direct JSON parsing without modifications",
      },
      [JSONExtractionStrategy.CODE_BLOCK_EXTRACTION]: {
        rate: stats.strategySuccessRates[
          JSONExtractionStrategy.CODE_BLOCK_EXTRACTION
        ],
        description: "Extraction from markdown code blocks",
      },
      [JSONExtractionStrategy.JSON_STRUCTURE_DETECTION]: {
        rate: stats.strategySuccessRates[
          JSONExtractionStrategy.JSON_STRUCTURE_DETECTION
        ],
        description: "Balanced brace detection and extraction",
      },
      [JSONExtractionStrategy.STRING_CLEANING]: {
        rate: stats.strategySuccessRates[
          JSONExtractionStrategy.STRING_CLEANING
        ],
        description: "Comment removal and string cleanup",
      },
      [JSONExtractionStrategy.MARKER_BASED_EXTRACTION]: {
        rate: stats.strategySuccessRates[
          JSONExtractionStrategy.MARKER_BASED_EXTRACTION
        ],
        description: "Extraction based on response markers",
      },
    };
  }

  /**
   * Get prompt template performance report
   */
  getTemplatePerformanceReport(): Array<{
    templateId: string;
    usage: number;
    successRate: number;
    averageTokens: number;
    performance: "excellent" | "good" | "poor";
  }> {
    const templates = Object.keys(this.metrics.promptPerformance.templateUsage);

    return templates
      .map((templateId) => {
        const usage = this.metrics.promptPerformance.templateUsage[templateId];
        const successRate =
          this.metrics.promptPerformance.successRates[templateId] || 0;
        const averageTokens =
          this.metrics.promptPerformance.averageTokenUsage[templateId] || 0;

        let performance: "excellent" | "good" | "poor";
        if (successRate >= 0.95) performance = "excellent";
        else if (successRate >= 0.85) performance = "good";
        else performance = "poor";

        return {
          templateId,
          usage,
          successRate,
          averageTokens,
          performance,
        };
      })
      .sort((a, b) => b.usage - a.usage);
  }

  /**
   * Check for performance issues and create alerts
   */
  private checkForAlerts(): void {
    const metrics = this.getMetrics();

    // Check JSON extraction success rate
    const extractionRate = claudeJsonExtractor.getSuccessRate();
    if (extractionRate < 0.9) {
      this.addAlert({
        type: "extraction_failure",
        severity: extractionRate < 0.8 ? "high" : "medium",
        message: `JSON extraction success rate is ${(extractionRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { rate: extractionRate },
      });
    }

    // Check Bedrock error rate
    const bedrockErrorRate =
      metrics.bedrockRequests.totalRequests > 0
        ? metrics.bedrockRequests.failedRequests /
          metrics.bedrockRequests.totalRequests
        : 0;
    if (bedrockErrorRate > 0.05) {
      this.addAlert({
        type: "error_rate",
        severity: bedrockErrorRate > 0.1 ? "high" : "medium",
        message: `Bedrock error rate is ${(bedrockErrorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: {
          rate: bedrockErrorRate,
          errors: metrics.bedrockRequests.errorsByType,
        },
      });
    }

    // Check response time
    if (metrics.bedrockRequests.averageResponseTime > 45000) {
      this.addAlert({
        type: "response_time",
        severity:
          metrics.bedrockRequests.averageResponseTime > 60000
            ? "high"
            : "medium",
        message: `Average response time is ${(metrics.bedrockRequests.averageResponseTime / 1000).toFixed(1)}s`,
        timestamp: new Date(),
        metadata: { responseTime: metrics.bedrockRequests.averageResponseTime },
      });
    }

    // Check overall health
    const healthScore = this.getHealthScore();
    if (healthScore < 80) {
      this.addAlert({
        type: "health_degradation",
        severity:
          healthScore < 60 ? "high" : healthScore < 70 ? "medium" : "low",
        message: `System health score is ${healthScore.toFixed(1)}`,
        timestamp: new Date(),
        metadata: { healthScore },
      });
    }
  }

  /**
   * Add alert and maintain alert history limit
   */
  private addAlert(alert: PerformanceAlert): void {
    // Check for duplicate alerts (same type and severity within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isDuplicate = this.alerts.some(
      (existing) =>
        existing.type === alert.type &&
        existing.severity === alert.severity &&
        existing.timestamp > fiveMinutesAgo,
    );

    if (!isDuplicate) {
      this.alerts.push(alert);

      // Maintain max alerts limit
      if (this.alerts.length > this.MAX_ALERTS) {
        this.alerts = this.alerts.slice(-this.MAX_ALERTS);
      }

      console.warn(
        `[AI Monitor] ${alert.severity.toUpperCase()} alert: ${alert.message}`,
      );
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheckInterval(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const issues: string[] = [];

    try {
      // Check JSON extraction health
      const extractionRate = claudeJsonExtractor.getSuccessRate();
      if (extractionRate < 0.9) {
        issues.push(
          `JSON extraction rate below threshold: ${(extractionRate * 100).toFixed(1)}%`,
        );
      }

      // Check if we have recent activity
      const timeSinceLastUpdate =
        Date.now() - this.metrics.lastUpdated.getTime();
      if (timeSinceLastUpdate > 600000) {
        // 10 minutes
        issues.push("No recent AI system activity detected");
      }

      // Check for persistent errors
      const errorTypes = Object.keys(this.metrics.bedrockRequests.errorsByType);
      if (errorTypes.length > 0) {
        const totalErrors = Object.values(
          this.metrics.bedrockRequests.errorsByType,
        ).reduce((sum, count) => sum + count, 0);
        if (totalErrors > 5) {
          issues.push(
            `Multiple error types detected: ${errorTypes.join(", ")}`,
          );
        }
      }

      this.metrics.systemHealth.activeIssues = issues;
      this.metrics.systemHealth.overallHealthScore = this.getHealthScore();
      this.metrics.systemHealth.lastHealthCheck = new Date();

      // Clear old alerts periodically
      this.clearOldAlerts();
    } catch (error) {
      console.error("[AI Monitor] Health check failed:", error);
      issues.push("Health check system failure");
    }
  }

  /**
   * Reset all metrics (for testing or maintenance)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    claudeJsonExtractor.resetStats();
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}

// Export singleton instance
export const aiSystemMonitor = new AISystemMonitor();
