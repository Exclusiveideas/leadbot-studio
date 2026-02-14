export interface BedrockModelConfig {
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export type BedrockContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    };

export interface BedrockMessage {
  role: "user" | "assistant";
  content: string | BedrockContentBlock[];
}

export interface BedrockTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface BedrockRequest {
  prompt?: string;
  messages?: BedrockMessage[];
  modelConfig?: BedrockModelConfig;
  systemPrompt?: string;
  responseFormat?: "text" | "json";
  tools?: BedrockTool[];
  onToolUse?: (toolCall: any) => void;
}

export interface BedrockResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason?: string;
}

export class BedrockError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, message: string, retryable: boolean = false) {
    super(message);
    this.name = "BedrockError";
    this.code = code;
    this.retryable = retryable;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BedrockError);
    }
  }
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  systemPrompt?: string;
  modelConfig?: BedrockModelConfig;
}

export interface PromptContext {
  [key: string]: any;
}

export const BEDROCK_MODELS = {
  CLAUDE_3_SONNET: "anthropic.claude-3-sonnet-20240229-v1:0",
  CLAUDE_3_5_SONNET: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  CLAUDE_3_HAIKU: "anthropic.claude-3-haiku-20240307-v1:0",
  CLAUDE_3_5_HAIKU: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  CLAUDE_4_5_HAIKU: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
} as const;

export type BedrockModelId =
  (typeof BEDROCK_MODELS)[keyof typeof BEDROCK_MODELS];

export const DEFAULT_MODEL_CONFIG: BedrockModelConfig = {
  modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
  maxTokens: 4096,
  temperature: 0.1,
  stopSequences: [],
};

// JSON Extraction Types
export interface JSONExtractionResult {
  success: boolean;
  content?: string;
  parsed?: any;
  strategy?: JSONExtractionStrategy;
  error?: string;
  attempts?: number;
}

export enum JSONExtractionStrategy {
  DIRECT_PARSE = "direct_parse",
  CODE_BLOCK_EXTRACTION = "code_block_extraction",
  JSON_STRUCTURE_DETECTION = "json_structure_detection",
  STRING_CLEANING = "string_cleaning",
  MARKER_BASED_EXTRACTION = "marker_based_extraction",
}

export interface JSONExtractionStats {
  totalAttempts: number;
  successfulExtractions: number;
  strategySuccessRates: Record<JSONExtractionStrategy, number>;
  averageAttemptsPerExtraction: number;
  lastUpdated: Date;
}

// JSON Extraction Markers
export const JSON_EXTRACTION_MARKERS = [
  "RESPONSE FORMAT - Return ONLY valid JSON:",
  "Response:",
  "Output:",
  "Result:",
  "JSON Response:",
  "Final Answer:",
  "```json",
  "```",
  "`",
] as const;
