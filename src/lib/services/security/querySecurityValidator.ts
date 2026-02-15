/**
 * Query Security Validator for AI Search System
 *
 * Migrated and enhanced security validation logic from the legacy NLP system.
 * Provides comprehensive input validation, security checks, and query complexity analysis.
 */

import { cache } from "@/lib/config/valkey";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedQuery?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface SecurityContext {
  userId: string;
  caseId: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
}

export interface QueryLimits {
  maxQueryLength: number;
  maxIterations: number;
  maxTokensPerQuery: number;
  rateLimitPerMinute: number;
  hasCaseAccess?: boolean; // Pre-validated case access flag
}

export class QuerySecurityValidator {
  private static readonly DEFAULT_LIMITS: QueryLimits = {
    maxQueryLength: 1000,
    maxIterations: 10,
    maxTokensPerQuery: 10000,
    rateLimitPerMinute: 50,
  };

  private static readonly SUSPICIOUS_PATTERNS = [
    // SQL injection patterns (even though we don't use SQL, users might try)
    /\b(drop|delete|update|insert|create|alter|truncate)\s+\w+/i,
    /--\s*|\/\*|\*\/|;\s*\w+\s*=/,

    // Script injection patterns
    /<script|javascript:|onclick=|onerror=|onload=/i,

    // Path traversal
    /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/i,

    // Command injection
    /\b(exec|eval|system|shell_exec|passthru|proc_open)\s*\(/i,

    // Excessive special characters (potential obfuscation)
    /[^\w\s\-.,!?'"():;]{10,}/,

    // Potential prompt injection for AI systems
    /ignore\s+previous|forget\s+instructions|system\s*:|assistant\s*:|user\s*:/i,
    /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
  ];

  private static readonly HIGH_RISK_KEYWORDS = [
    "admin",
    "root",
    "password",
    "secret",
    "token",
    "key",
    "credential",
    "bypass",
    "override",
    "elevate",
    "privilege",
    "sudo",
    "su",
  ];

  /**
   * Comprehensive validation of AI search queries
   */
  async validateAIQuery(
    query: string,
    context: SecurityContext,
    customLimits?: Partial<QueryLimits>,
  ): Promise<ValidationResult> {
    const limits = {
      ...QuerySecurityValidator.DEFAULT_LIMITS,
      ...customLimits,
    };
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    try {
      // Basic input validation
      const basicValidation = this.validateBasicInput(query, limits);
      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);

      // Security pattern detection
      const securityValidation = this.detectSecurityThreats(query);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);
      riskLevel = this.calculateRiskLevel(
        riskLevel,
        securityValidation.riskLevel,
      );

      // Context validation (case access, user permissions)
      const contextValidation = await this.validateSecurityContext(
        context,
        limits.hasCaseAccess,
      );
      errors.push(...contextValidation.errors);
      warnings.push(...contextValidation.warnings);
      riskLevel = this.calculateRiskLevel(
        riskLevel,
        contextValidation.riskLevel,
      );

      // Rate limiting check
      const rateLimitValidation = await this.checkRateLimit(context, limits);
      errors.push(...rateLimitValidation.errors);
      warnings.push(...rateLimitValidation.warnings);

      // Log security events if needed (async, non-blocking)
      if (riskLevel !== "LOW" || errors.length > 0) {
        this.logSecurityEvent(context, query, riskLevel, errors, warnings);
      }

      const sanitizedQuery = this.sanitizeQuery(query);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedQuery,
        riskLevel,
      };
    } catch (error) {
      console.error("[QuerySecurityValidator] Validation failed:", error);

      // Log critical security validation failure (async, non-blocking)
      this.logSecurityEvent(
        context,
        query,
        "HIGH",
        ["Security validation system failure"],
        ["Manual review required"],
      );

      return {
        isValid: false,
        errors: [
          "Security validation failed. Please try again or contact support.",
        ],
        warnings: [],
        riskLevel: "HIGH",
      };
    }
  }

  /**
   * Validate basic input constraints
   */
  private validateBasicInput(
    query: string,
    limits: QueryLimits,
  ): Partial<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Empty or whitespace-only query
    if (!query || query.trim().length === 0) {
      errors.push("Query cannot be empty");
      return { errors, warnings };
    }

    // Query length validation
    if (query.length > limits.maxQueryLength) {
      errors.push(
        `Query is too long (maximum ${limits.maxQueryLength} characters)`,
      );
    } else if (query.length > limits.maxQueryLength * 0.8) {
      warnings.push("Query is quite long and may impact performance");
    }

    // Character encoding validation
    if (
      !/^[\x20-\x7E\s]*$/.test(query) &&
      !/^[\p{L}\p{N}\p{P}\p{S}\p{Z}]*$/u.test(query)
    ) {
      warnings.push("Query contains unusual characters");
    }

    // Excessive repetition detection
    if (/(.{3,})\1{5,}/.test(query)) {
      warnings.push("Query contains excessive repetition");
    }

    return { errors, warnings };
  }

  /**
   * Detect potential security threats in query content
   */
  private detectSecurityThreats(
    query: string,
  ): Partial<ValidationResult> & { riskLevel: "LOW" | "MEDIUM" | "HIGH" } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    const queryLower = query.toLowerCase();

    // Check for suspicious patterns
    for (const pattern of QuerySecurityValidator.SUSPICIOUS_PATTERNS) {
      if (pattern.test(query)) {
        errors.push("Query contains potentially malicious content");
        riskLevel = "HIGH";
        break;
      }
    }

    // Check for high-risk keywords
    const highRiskMatches = QuerySecurityValidator.HIGH_RISK_KEYWORDS.filter(
      (keyword) => queryLower.includes(keyword),
    );

    if (highRiskMatches.length > 0) {
      warnings.push(
        `Query contains sensitive keywords: ${highRiskMatches.join(", ")}`,
      );
      riskLevel = this.calculateRiskLevel(riskLevel, "MEDIUM");
    }

    // Check for excessive special characters ratio
    const specialCharCount = (query.match(/[^\w\s]/g) || []).length;
    const specialCharRatio = specialCharCount / query.length;

    if (specialCharRatio > 0.3) {
      warnings.push("Query contains high ratio of special characters");
      riskLevel = this.calculateRiskLevel(riskLevel, "MEDIUM");
    }

    // Check for potential prompt injection attempts
    const promptInjectionPatterns = [
      /ignore\s+(all\s+)?previous\s+(instructions?|prompts?)/i,
      /you\s+are\s+now\s+a?\s*\w+/i,
      /pretend\s+(to\s+be|you\s+are)/i,
      /role\s*play\s*(as|being)/i,
    ];

    for (const pattern of promptInjectionPatterns) {
      if (pattern.test(query)) {
        errors.push("Query appears to contain prompt injection attempt");
        riskLevel = "HIGH";
        break;
      }
    }

    return { errors, warnings, riskLevel };
  }

  /**
   * Validate security context (user permissions, case access)
   * @param context - Security context with user and case information
   * @param hasCaseAccess - Pre-validated case access flag (from route-level validation)
   */
  private async validateSecurityContext(
    context: SecurityContext,
    hasCaseAccess?: boolean,
  ): Promise<
    Partial<ValidationResult> & { riskLevel: "LOW" | "MEDIUM" | "HIGH" }
  > {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    try {
      // Use pre-validated case access flag if provided (avoids redundant DB query)
      if (hasCaseAccess === false) {
        errors.push("Case not found or access denied");
        riskLevel = "HIGH";
        return { errors, warnings, riskLevel };
      }

      // If flag not provided, fall back to DB check (backward compatibility)
      if (hasCaseAccess === undefined) {
        const { prisma } = await import("@/lib/db");
        const caseRecord = await prisma.case.findFirst({
          where: {
            id: context.caseId,
            userId: context.userId,
          },
          select: {
            id: true,
            status: true,
            userId: true,
          },
        });

        if (!caseRecord) {
          errors.push("Case not found or access denied");
          riskLevel = "HIGH";
          return { errors, warnings, riskLevel };
        }

        // Check case status
        if (caseRecord.status === "ARCHIVED") {
          warnings.push("Querying archived case");
          riskLevel = "MEDIUM";
        }
      }

      // Additional context validation could go here
      // e.g., IP geolocation, session validation, user role checks
    } catch (error) {
      console.error(
        "[QuerySecurityValidator] Context validation failed:",
        error,
      );
      errors.push("Unable to verify access permissions");
      riskLevel = "HIGH";
    }

    return { errors, warnings, riskLevel };
  }

  /**
   * Check rate limiting for user queries
   */
  private async checkRateLimit(
    context: SecurityContext,
    limits: QueryLimits,
  ): Promise<Partial<ValidationResult>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // This would integrate with your caching/rate limiting system
      // For now, implementing a basic in-memory check would work
      // In production, you'd want Redis or similar

      const rateLimitKey = `rate_limit:${context.userId}:${Date.now() - (Date.now() % 60000)}`;

      const currentCount = await cache.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;

      if (count >= limits.rateLimitPerMinute) {
        errors.push(
          `Rate limit exceeded. Maximum ${limits.rateLimitPerMinute} queries per minute.`,
        );
      } else if (count >= limits.rateLimitPerMinute * 0.8) {
        warnings.push("Approaching rate limit");
      }

      // Increment counter
      await cache.set(rateLimitKey, (count + 1).toString(), 60);
    } catch (error) {
      console.error("[QuerySecurityValidator] Rate limit check failed:", error);
      // Don't fail validation if rate limiting service is down
      warnings.push("Rate limiting service unavailable");
    }

    return { errors, warnings };
  }

  /**
   * Sanitize query content
   */
  private sanitizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .substring(0, 1000); // Ensure length limit
  }

  /**
   * Calculate combined risk level
   */
  private calculateRiskLevel(
    current: "LOW" | "MEDIUM" | "HIGH",
    new_level: "LOW" | "MEDIUM" | "HIGH",
  ): "LOW" | "MEDIUM" | "HIGH" {
    const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    return riskOrder[new_level] > riskOrder[current] ? new_level : current;
  }

  /**
   * Log security events for monitoring and analysis (async, non-blocking)
   */
  private logSecurityEvent(
    context: SecurityContext,
    query: string,
    riskLevel: string,
    errors: string[],
    warnings: string[],
  ): void {
    console.warn("[QuerySecurity] Elevated risk detected:", {
      userId: context.userId,
      riskLevel,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  /**
   * Validate query complexity for resource management
   */
  validateQueryComplexity(
    query: string,
    maxIterations?: number,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Detect potentially expensive query patterns
    const expensivePatterns = [
      /\b(all|every|complete|total|comprehensive)\b.*\b(document|file|record|case)\b/i,
      /\b(find|show|list|get).*\b(everything|all)\b/i,
      /\b(analyze|compare|correlate|cross-reference)\b.*\b(all|every)\b/i,
    ];

    let complexityScore = 0;

    // Base complexity from query length
    complexityScore += Math.floor(query.length / 100);

    // Pattern-based complexity
    for (const pattern of expensivePatterns) {
      if (pattern.test(query)) {
        complexityScore += 3;
        warnings.push("Query may require extensive processing");
      }
    }

    // Word count complexity
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 50) {
      complexityScore += 2;
      warnings.push("Complex multi-part query detected");
    }

    // Question complexity
    const questionCount = (query.match(/\?/g) || []).length;
    if (questionCount > 3) {
      complexityScore += questionCount;
      warnings.push("Multiple questions in single query");
    }

    // Validate against limits
    if (complexityScore > 10) {
      errors.push(
        "Query is too complex. Please break it into smaller, more specific questions.",
      );
    } else if (complexityScore > 7) {
      warnings.push("Complex query may take longer to process");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel:
        complexityScore > 10 ? "HIGH" : complexityScore > 7 ? "MEDIUM" : "LOW",
    };
  }
}

// Export singleton instance
export const querySecurityValidator = new QuerySecurityValidator();
