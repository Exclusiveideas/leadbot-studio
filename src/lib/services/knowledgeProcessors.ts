import type { Prisma } from "@prisma/client";
import {
  validateFAQContent,
  validateTextContent,
  validateURLContent,
  type FAQPair,
} from "@/lib/validation/knowledge";

/**
 * Validation result for knowledge content
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: any;
}

/**
 * Knowledge processor interface - defines how each knowledge type is processed
 */
interface KnowledgeProcessor {
  validate: (content: string) => ValidationResult;
  prepareKnowledgeData: (params: {
    chatbotId: string;
    title: string;
    content: string;
    validationData?: any;
  }) => Prisma.ChatbotKnowledgeCreateInput;
  getLambdaEnvVar: () => string;
  getAuditAction: () => string;
  getSuccessMessage: () => string;
}

/**
 * FAQ processor - handles FAQ question/answer pairs
 */
const faqProcessor: KnowledgeProcessor = {
  validate: (content: string) => {
    const result = validateFAQContent(content);
    return {
      valid: result.valid,
      error: result.error,
      data: result.pairs,
    };
  },

  prepareKnowledgeData: ({ chatbotId, title, content, validationData }) => {
    const pairs = validationData as FAQPair[];
    const formattedText = pairs
      .map((p) => `Q: ${p.question}\nA: ${p.answer}`)
      .join("\n\n");

    return {
      chatbot: { connect: { id: chatbotId } },
      type: "FAQ",
      title,
      content,
      extractedText: formattedText,
      vectorNamespace: chatbotId,
      status: "QUEUED",
      stage: "QUEUED",
      progress: 0,
    };
  },

  getLambdaEnvVar: () => "EMBEDDING_GENERATOR_LAMBDA_ARN",

  getAuditAction: () => "chatbot.knowledge.faq_added",

  getSuccessMessage: () => "FAQ added successfully. Processing embeddings...",
};

/**
 * TEXT processor - handles plain text content
 */
const textProcessor: KnowledgeProcessor = {
  validate: (content: string) => {
    const result = validateTextContent(content);
    return {
      valid: result.valid,
      error: result.error,
    };
  },

  prepareKnowledgeData: ({ chatbotId, title, content }) => {
    return {
      chatbot: { connect: { id: chatbotId } },
      type: "TEXT",
      title,
      content,
      extractedText: content,
      vectorNamespace: chatbotId,
      status: "QUEUED",
      stage: "QUEUED",
      progress: 0,
    };
  },

  getLambdaEnvVar: () => "EMBEDDING_GENERATOR_LAMBDA_ARN",

  getAuditAction: () => "chatbot.knowledge.text_added",

  getSuccessMessage: () => "Text added successfully. Processing embeddings...",
};

/**
 * URL processor - handles URL scraping
 */
const urlProcessor: KnowledgeProcessor = {
  validate: (content: string) => {
    const result = validateURLContent(content);
    return {
      valid: result.valid,
      error: result.error,
    };
  },

  prepareKnowledgeData: ({ chatbotId, title, content }) => {
    return {
      chatbot: { connect: { id: chatbotId } },
      type: "URL",
      title,
      content,
      vectorNamespace: chatbotId,
      status: "QUEUED",
      stage: "QUEUED",
      progress: 0,
      metadata: { url: content } as Prisma.InputJsonValue,
    };
  },

  getLambdaEnvVar: () => "URL_SCRAPER_LAMBDA_ARN",

  getAuditAction: () => "chatbot.knowledge.url_added",

  getSuccessMessage: () => "URL added successfully. Scraping and processing...",
};

/**
 * Registry of knowledge processors by type
 */
export const knowledgeProcessors: Record<string, KnowledgeProcessor> = {
  FAQ: faqProcessor,
  TEXT: textProcessor,
  URL: urlProcessor,
};

/**
 * Get processor for a given knowledge type
 */
export function getKnowledgeProcessor(type: string): KnowledgeProcessor | null {
  return knowledgeProcessors[type] || null;
}
