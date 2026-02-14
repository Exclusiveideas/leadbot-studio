/**
 * Knowledge Base Content Scanner
 *
 * Scans knowledge base content for potentially malicious patterns that could
 * be used to manipulate the chatbot's behavior. This is different from prompt
 * injection detection (which checks user inputs) - this scans the training data
 * that shapes chatbot responses.
 *
 * Threats addressed:
 * 1. Embedded system prompt overrides in knowledge content
 * 2. Instruction injection that changes chatbot behavior
 * 3. Data exfiltration instructions hidden in KB content
 * 4. Malicious URL patterns
 * 5. Harmful content that could be reflected to users
 */

type ContentScanResult = {
  safe: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  threats: ContentThreat[];
  requiresReview: boolean;
  scanDuration: number;
};

type ContentThreat = {
  category: KnowledgeThreatCategory;
  pattern: string;
  location: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
};

type KnowledgeThreatCategory =
  | "INSTRUCTION_INJECTION"
  | "SYSTEM_OVERRIDE"
  | "DATA_EXFILTRATION"
  | "MALICIOUS_URL"
  | "SENSITIVE_DATA"
  | "HARMFUL_CONTENT"
  | "CODE_INJECTION"
  | "PROMPT_LEAK_SETUP";

// Pattern definitions with severity levels
type PatternDefinition = {
  pattern: RegExp;
  category: KnowledgeThreatCategory;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
};

const THREAT_PATTERNS: PatternDefinition[] = [
  // Instruction injection patterns (attempts to inject instructions into KB)
  {
    pattern:
      /\[INST\]|\[\/INST\]|\[\s*system\s*\]|<\|im_start\|>|<\|system\|>|<<SYS>>|<\/SYS>/gi,
    category: "INSTRUCTION_INJECTION",
    severity: "CRITICAL",
    description: "LLM instruction markers detected in content",
  },
  {
    pattern:
      /\b(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above|your|system)\s+(instructions?|rules?|guidelines?)/gi,
    category: "SYSTEM_OVERRIDE",
    severity: "CRITICAL",
    description:
      "Attempt to override system instructions embedded in knowledge",
  },
  {
    pattern:
      /\byou\s+(must|should|will|need\s+to)\s+(always|never)\s+(respond|answer|say|tell)/gi,
    category: "INSTRUCTION_INJECTION",
    severity: "HIGH",
    description: "Directive instruction attempting to control chatbot behavior",
  },
  {
    pattern:
      /\b(when\s+asked|if\s+(the\s+)?user\s+asks?)\s+.{0,50}\s+(always|never|must|should)\s+(say|respond|answer|tell)/gi,
    category: "INSTRUCTION_INJECTION",
    severity: "HIGH",
    description: "Conditional response manipulation embedded in content",
  },

  // Data exfiltration setup patterns
  {
    pattern:
      /\b(send|transmit|forward|email|post|upload)\s+(all\s+)?(data|information|messages?|conversations?|user\s+data)\s+to/gi,
    category: "DATA_EXFILTRATION",
    severity: "CRITICAL",
    description: "Data exfiltration instruction in knowledge base",
  },
  {
    pattern:
      /\b(collect|gather|store|log|record)\s+(all\s+)?user\s+(data|information|details|input)/gi,
    category: "DATA_EXFILTRATION",
    severity: "HIGH",
    description: "Unauthorized data collection instruction",
  },

  // Prompt leak setup (content designed to reveal system prompts)
  {
    pattern:
      /\b(reveal|show|display|output|print)\s+(the\s+)?(system|initial|hidden)\s+(prompt|instructions?)/gi,
    category: "PROMPT_LEAK_SETUP",
    severity: "HIGH",
    description: "Content designed to trigger system prompt disclosure",
  },

  // Malicious URL patterns
  {
    pattern: /https?:\/\/[^\s]*\.(ru|cn|tk|ml|ga|cf)\//gi,
    category: "MALICIOUS_URL",
    severity: "MEDIUM",
    description: "URL with suspicious top-level domain",
  },
  {
    pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g,
    category: "MALICIOUS_URL",
    severity: "MEDIUM",
    description: "Direct IP address URL (potential C2 or phishing)",
  },
  {
    pattern: /javascript:|data:text\/html|vbscript:/gi,
    category: "CODE_INJECTION",
    severity: "CRITICAL",
    description: "Script protocol in content",
  },

  // Harmful content patterns
  {
    pattern:
      /\b(kill|murder|harm|attack|exploit|hack)\s+(yourself|users?|people|the\s+system)/gi,
    category: "HARMFUL_CONTENT",
    severity: "CRITICAL",
    description: "Potentially harmful instruction",
  },

  // Sensitive data patterns (shouldn't be in KB)
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b.*password/gi,
    category: "SENSITIVE_DATA",
    severity: "HIGH",
    description: "Email and password combination detected",
  },
  {
    pattern:
      /\b(api[_\s]?key|secret[_\s]?key|private[_\s]?key)\s*[=:]\s*['""]?[A-Za-z0-9]{20,}/gi,
    category: "SENSITIVE_DATA",
    severity: "HIGH",
    description: "API key or secret detected in content",
  },
  {
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b|\b\d{9}\b/g,
    category: "SENSITIVE_DATA",
    severity: "MEDIUM",
    description: "Potential SSN pattern detected",
  },
  {
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    category: "SENSITIVE_DATA",
    severity: "MEDIUM",
    description: "Potential credit card number detected",
  },

  // Code injection patterns
  {
    pattern:
      /<script[\s>]|<\/script>|eval\(|Function\(|setTimeout\(.*,\s*["']|setInterval\(/gi,
    category: "CODE_INJECTION",
    severity: "CRITICAL",
    description: "JavaScript injection attempt",
  },
  {
    pattern: /\bon\w+\s*=\s*["'][^"']*["']/gi,
    category: "CODE_INJECTION",
    severity: "HIGH",
    description: "HTML event handler injection",
  },
];

/**
 * Scan knowledge base content for security threats
 *
 * @param content - The content to scan
 * @param contentType - Type of content (FAQ, TEXT, URL)
 * @returns Scan result with threat assessment
 */
export function scanKnowledgeContent(
  content: string,
  contentType: "FAQ" | "TEXT" | "URL" | "DOCUMENT",
): ContentScanResult {
  const startTime = Date.now();
  const threats: ContentThreat[] = [];

  // Scan for each threat pattern
  for (const patternDef of THREAT_PATTERNS) {
    const matches = content.match(patternDef.pattern);
    if (matches) {
      for (const match of matches) {
        // Find location in content
        const index = content.indexOf(match);
        const lineNumber = content.substring(0, index).split("\n").length;

        threats.push({
          category: patternDef.category,
          pattern: match.substring(0, 100), // Truncate long matches
          location: `Line ${lineNumber}`,
          severity: patternDef.severity,
          description: patternDef.description,
        });
      }
    }
  }

  // For FAQ content, also check individual Q&A pairs
  if (contentType === "FAQ") {
    try {
      const pairs = JSON.parse(content);
      if (Array.isArray(pairs)) {
        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i];
          if (pair.question) {
            const qThreats = scanTextForThreats(
              pair.question,
              `FAQ[${i}].question`,
            );
            threats.push(...qThreats);
          }
          if (pair.answer) {
            const aThreats = scanTextForThreats(
              pair.answer,
              `FAQ[${i}].answer`,
            );
            threats.push(...aThreats);
          }
        }
      }
    } catch {
      // If not valid JSON, continue with raw content scan
    }
  }

  // Determine overall risk level
  const risk = calculateRiskLevel(threats);
  const scanDuration = Date.now() - startTime;

  return {
    safe: threats.length === 0,
    risk,
    threats,
    requiresReview:
      risk === "HIGH" || risk === "CRITICAL" || threats.length > 3,
    scanDuration,
  };
}

/**
 * Scan text for threats (helper for nested content)
 */
function scanTextForThreats(text: string, location: string): ContentThreat[] {
  const threats: ContentThreat[] = [];

  for (const patternDef of THREAT_PATTERNS) {
    if (patternDef.pattern.test(text)) {
      threats.push({
        category: patternDef.category,
        pattern: text.substring(0, 100),
        location,
        severity: patternDef.severity,
        description: patternDef.description,
      });
    }
    // Reset regex state
    patternDef.pattern.lastIndex = 0;
  }

  return threats;
}

/**
 * Calculate overall risk level from detected threats
 */
function calculateRiskLevel(
  threats: ContentThreat[],
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (threats.length === 0) return "LOW";

  const hasCritical = threats.some((t) => t.severity === "CRITICAL");
  const hasHigh = threats.some((t) => t.severity === "HIGH");
  const hasMedium = threats.some((t) => t.severity === "MEDIUM");

  if (hasCritical) return "CRITICAL";
  if (hasHigh || threats.length >= 3) return "HIGH";
  if (hasMedium || threats.length >= 2) return "MEDIUM";
  return "LOW";
}

/**
 * Check if content is safe to add to knowledge base
 * This is a convenience function that returns a simple pass/fail
 *
 * @param content - Content to check
 * @param contentType - Type of content
 * @param allowMediumRisk - Whether to allow medium-risk content (default: true)
 */
export function isKnowledgeContentSafe(
  content: string,
  contentType: "FAQ" | "TEXT" | "URL" | "DOCUMENT",
  allowMediumRisk: boolean = true,
): { safe: boolean; reason?: string } {
  const result = scanKnowledgeContent(content, contentType);

  if (result.risk === "CRITICAL") {
    const criticalThreats = result.threats.filter(
      (t) => t.severity === "CRITICAL",
    );
    return {
      safe: false,
      reason: `Critical security threat detected: ${criticalThreats[0]?.description}`,
    };
  }

  if (result.risk === "HIGH") {
    const highThreats = result.threats.filter(
      (t) => t.severity === "HIGH" || t.severity === "CRITICAL",
    );
    return {
      safe: false,
      reason: `High-risk content detected: ${highThreats[0]?.description}`,
    };
  }

  if (result.risk === "MEDIUM" && !allowMediumRisk) {
    const mediumThreats = result.threats.filter((t) => t.severity === "MEDIUM");
    return {
      safe: false,
      reason: `Medium-risk content detected: ${mediumThreats[0]?.description}`,
    };
  }

  return { safe: true };
}
