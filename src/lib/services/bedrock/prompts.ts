import type {
  BedrockModelConfig,
  PromptContext,
  PromptTemplate,
} from "@/types/bedrock";
import { BEDROCK_MODELS } from "@/types/bedrock";
import { logger } from "@/lib/utils/logger";

// Streaming Final Answer System Prompt (plain text output for word-by-word streaming)
export const STREAMING_FINAL_ANSWER_SYSTEM_PROMPT = `You are a senior legal analyst providing final comprehensive answers based on iterative document search and analysis. Your answers should be thorough, well-sourced, and legally focused.

CRITICAL: Output your answer as PLAIN TEXT only. Do NOT use JSON format. Just write your response directly.

CRITICAL RULES:
1. GROUNDING REQUIREMENT: You must ONLY answer based on:
   - The document information provided below
   - The conversation history (if any)
   - You must NEVER make up information, fabricate facts, or answer questions that cannot be answered from the available context

2. CONVERSATIONAL HANDLING:
   - For greetings, thanks, or casual messages, respond naturally and briefly
   - For questions about your capabilities, give a BRIEF, friendly response
   - NEVER say "Based on our conversation history" - this sounds robotic
   - Speak naturally as if you're having a real conversation

3. NO DOCUMENTS FOUND: If no relevant documents were found AND the question requires document-based information:
   - Acknowledge that no relevant documents were found
   - Offer to help if the user rephrases or provides more details
   - Do NOT make up an answer

4. MARKDOWN FORMATTING:
   - Use **bold** for key terms and important findings
   - Use bullet points (- item) or numbered lists (1. item) with each on its own line
   - NEVER put ## or ### on the same line as other text
   - ALWAYS put a blank line BEFORE and AFTER any heading
   - Keep responses concise and well-structured`;

// Standard JSON Formatting Rules and Templates
export const JSON_FORMATTING_RULES = `
CRITICAL JSON REQUIREMENTS:
1. Return ONLY valid JSON - no explanatory text before or after
2. No comments (//, /* */) anywhere in the response
3. No trailing commas in objects or arrays
4. All string values must be properly escaped (\" for quotes, \\n for newlines)
5. Numbers should not be quoted unless they are IDs or codes
6. Boolean values must be true/false (not "true"/"false")
7. Must pass JSON.parse() without any preprocessing

IMPORTANT: If you're uncertain about any field value, use null rather than omitting the field.
`;

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  required: ["analysis", "confidence", "findings", "metadata"],
  example: {
    analysis: "Brief summary of the analysis results",
    confidence: 0.85,
    findings: [
      {
        category: "category_name",
        description: "finding description",
        evidence: "supporting evidence",
        confidence: 0.9,
      },
    ],
    metadata: {
      processing_notes: "any relevant processing information",
      flags: ["flag1", "flag2"],
    },
  },
};

export const CLASSIFICATION_JSON_SCHEMA = {
  type: "object",
  required: [
    "document_type",
    "legal_relevance",
    "significance_level",
    "confidence",
  ],
  example: {
    document_type: "email|financial|legal|correspondence|contract|court_filing",
    document_subtype: "specific subtype if applicable",
    legal_relevance: "custody|financial|communication|discovery|procedural",
    significance_level: 3,
    confidence: 0.87,
    key_parties: ["Party Name 1", "Party Name 2"],
    important_dates: [
      {
        date: "2024-01-15",
        description: "what happened on this date",
        confidence: 0.9,
      },
    ],
    sensitive_flags: {
      contains_pii: true,
      contains_threats: false,
      contains_financial_details: true,
      requires_redaction: false,
    },
    summary: "Brief summary of document contents and legal significance",
  },
};

export const SEARCH_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  required: [
    "relevance_score",
    "completeness_score",
    "key_information",
    "gaps_identified",
  ],
  example: {
    relevance_score: 8,
    completeness_score: 7,
    confidence_in_completeness: 0.75,
    context_sufficient: false,
    answer_from_context: null,
    needs_search: true,
    key_information: [
      {
        category: "financial|custody|communication|legal",
        description: "description of key finding",
        source_documents: ["doc1.pdf", "doc2.docx"],
        confidence: 0.9,
      },
    ],
    gaps_identified: [
      {
        missing_info: "description of what's missing",
        importance: "high|medium|low",
        suggested_search_terms: ["term1", "term2"],
      },
    ],
    recommended_next_searches: ["search term 1", "search term 2"],
    summary: "Overall assessment of search results and findings",
  },
};

export const DECISION_JSON_SCHEMA = {
  type: "object",
  required: ["decision", "reasoning", "confidence"],
  example: {
    decision: "CONTINUE|STOP",
    reasoning: "Detailed explanation for the decision",
    confidence: 0.85,
    specific_next_actions: ["action 1 to take", "action 2 to take"],
    estimated_completion: 0.7,
  },
};

export const COMMUNICATION_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  required: [
    "sentiment_analysis",
    "threat_assessment",
    "key_topics",
    "confidence",
  ],
  example: {
    sentiment_analysis: {
      overall_tone: "hostile|neutral|cooperative|concerned",
      emotional_intensity: 7,
      confidence: 0.9,
    },
    threat_assessment: {
      contains_threats: true,
      threat_level: "low|medium|high",
      specific_threats: [
        {
          type: "physical|legal|emotional|financial",
          description: "description of the threat",
          quote: "exact quote from communication",
        },
      ],
    },
    key_topics: [
      {
        topic: "custody|financial|legal|personal",
        description: "topic description",
        quotes: ["relevant quote 1", "relevant quote 2"],
      },
    ],
    legal_concerns: [
      {
        concern_type: "compliance|violation|harassment",
        description: "description of concern",
        evidence: "supporting evidence",
      },
    ],
    child_welfare_mentions: [
      {
        concern: "description of child welfare concern",
        quote: "exact quote",
        severity: "low|medium|high",
      },
    ],
    confidence: 0.88,
    summary: "Brief summary of communication analysis",
  },
};

export const FINANCIAL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  required: ["document_type", "financial_data", "analysis", "confidence"],
  example: {
    document_type: "bank_statement|tax_return|pay_stub|invoice|receipt",
    time_period: {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    },
    financial_data: {
      income_sources: [
        {
          source: "employment|investment|business|other",
          amount: 5000.0,
          frequency: "monthly|weekly|annual",
          confidence: 0.95,
        },
      ],
      assets: [
        {
          type: "cash|property|investment|vehicle",
          description: "asset description",
          value: 250000.0,
          confidence: 0.9,
        },
      ],
      expenses: [
        {
          category: "housing|childcare|utilities|other",
          amount: 2000.0,
          description: "expense description",
        },
      ],
      transactions: [
        {
          date: "2024-01-15",
          amount: 1500.0,
          description: "transaction description",
          type: "credit|debit",
        },
      ],
    },
    analysis: {
      hidden_asset_indicators: [
        {
          indicator: "description of potential hidden asset",
          confidence: 0.7,
          evidence: "supporting evidence",
        },
      ],
      support_calculation_relevant: true,
      compliance_issues: [
        {
          issue: "description of compliance issue",
          severity: "low|medium|high",
        },
      ],
      irregularities: [
        {
          type: "unusual_deposit|missing_income|expense_discrepancy",
          description: "description of irregularity",
          amount: 5000.0,
        },
      ],
    },
    confidence: 0.85,
    summary: "Overall financial analysis summary",
    recommendations: ["recommendation 1", "recommendation 2"],
  },
};

export const FINAL_ANSWER_JSON_SCHEMA = {
  type: "object",
  required: ["answer", "confidence"],
  properties: {
    answer: { type: "string" },
    confidence: { type: "number" },
    used_document_numbers: {
      type: "array",
      items: { type: "number" },
      description:
        "Array of document numbers (1-indexed) that were actually used to formulate the answer",
    },
    key_sources: { type: "array" },
    limitations: { type: "string" },
  },
  example: {
    answer:
      "Comprehensive answer to the original question based on document analysis",
    confidence: 0.85,
    used_document_numbers: [1, 3, 5], // Document numbers from prompt (1-indexed)
    key_sources: [
      {
        document: "document_name.pdf",
        relevance: "why this document is relevant",
      },
    ],
    limitations: "Any limitations or gaps in the available information",
  },
};

export const SEARCH_TERMS_JSON_SCHEMA = {
  type: "object",
  required: ["searchTerms", "confidence"],
  example: {
    searchTerms: [
      {
        term: "search term",
        category: "financial|custody|communication|legal",
        rationale: "why this search term is relevant",
        expected_results: "what this term might find",
      },
    ],
    alternative_terms: [
      {
        term: "alternative search term",
        relationship: "synonym|related_concept|broader_term",
      },
    ],
    confidence: 0.9,
    notes: "Additional notes about search strategy",
  },
};

export class PromptTemplateEngine {
  /**
   * Generate standardized JSON formatting instructions with schema
   */
  private generateJsonInstructions(schema: any, schemaName: string): string {
    return `${JSON_FORMATTING_RULES}
Required JSON Schema (${schemaName}):
${JSON.stringify(schema.example, null, 2)}

Your response must match this exact structure.`;
  }
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    // Document Classification Template
    this.registerTemplate({
      id: "document-classification",
      name: "Legal Document Classification",
      systemPrompt: `You are an expert legal document classifier specializing in family law and e-discovery. Analyze documents and classify them based on content, legal significance, and family law context.

${this.generateJsonInstructions(CLASSIFICATION_JSON_SCHEMA, "Document Classification")}`,
      template: `Document Content:
{content}

Document Metadata:
- Filename: {filename}
- File Type: {fileType}
- Case Context: {caseContext}

Classify this document analyzing:
1. Primary document type and subtype
2. Family law relevance category
3. Legal significance level (1-5 scale)
4. Key parties mentioned in the document
5. Important dates and their significance
6. Sensitive information flags (PII, threats, financial details, redaction needs)
7. Brief summary of contents and legal significance

Provide confidence scores for all classifications and assessments.`,
      variables: ["content", "filename", "fileType", "caseContext"],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 2048,
        temperature: 0.1,
      },
    });

    // Communication Analysis Template
    this.registerTemplate({
      id: "communication-analysis",
      name: "Communication Content Analysis",
      systemPrompt: `You are an expert in analyzing interpersonal communications for family law cases. Focus on sentiment, threats, custody-related content, and communication patterns.

${this.generateJsonInstructions(COMMUNICATION_ANALYSIS_JSON_SCHEMA, "Communication Analysis")}`,
      template: `Communication Content:
{content}

Communication Metadata:
- Participants: {participants}
- Date: {date}
- Case Context: {caseContext}

Analyze this communication providing:
1. Sentiment analysis with overall tone and emotional intensity (1-10 scale)
2. Threat assessment including threat level and specific threat identification
3. Key topic identification with supporting quotes
4. Legal compliance concerns (harassment, violations, etc.)
5. Child welfare mentions and severity assessment
6. Overall confidence score and summary

For each finding, provide specific quotes as evidence and assign confidence scores.`,
      variables: ["content", "participants", "date", "caseContext"],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 2048,
        temperature: 0.1,
      },
    });

    // Financial Analysis Template
    this.registerTemplate({
      id: "financial-analysis",
      name: "Financial Document Analysis",
      systemPrompt: `You are a financial analyst specializing in family law and divorce proceedings. Analyze financial documents for asset discovery, support calculations, and compliance.

${this.generateJsonInstructions(FINANCIAL_ANALYSIS_JSON_SCHEMA, "Financial Analysis")}`,
      template: `Financial Document Content:
{content}

Document Metadata:
- Document Type: {documentType}
- Date Range: {dateRange}

Analyze this financial document extracting:
1. Document classification and time period covered
2. Income sources with amounts, frequency, and confidence scores
3. Asset identification with types, descriptions, values, and confidence
4. Expense categorization with amounts and descriptions
5. Transaction details with dates, amounts, and classifications
6. Hidden asset indicators with confidence levels and evidence
7. Support calculation relevance and compliance issues
8. Financial irregularities and discrepancies
9. Summary analysis and recommendations

Provide specific figures, confidence scores, and detailed evidence for all findings.`,
      variables: ["content", "documentType", "dateRange"],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 3072,
        temperature: 0.05,
      },
    });

    // Case Summary Template
    this.registerTemplate({
      id: "case-summary",
      name: "Comprehensive Case Summary",
      systemPrompt: `You are a legal case analyst specializing in family law. Create comprehensive case summaries based on document analysis and key findings.`,
      template: `Case Information:
- Case Number: {caseNumber}
- Parties: {parties}
- Case Type: {caseType}
- Date Range: {dateRange}

Documents Context and Key Findings:
{documentsContext}

Generate a comprehensive case summary including:
1. Case overview and timeline
2. Key parties and their roles
3. Major legal issues identified
4. Financial summary and concerns
5. Custody and child welfare matters
6. Communication patterns and concerns
7. Recommendations for legal strategy

Provide a professional, detailed summary suitable for legal review.`,
      variables: [
        "caseNumber",
        "parties",
        "caseType",
        "dateRange",
        "documentsContext",
      ],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 4096,
        temperature: 0.2,
      },
    });

    // Search Analysis Template
    this.registerTemplate({
      id: "search-analysis",
      name: "AI Search Results Analysis",
      systemPrompt: `You are an expert legal document analyst specializing in e-discovery and family law. Analyze search results to extract relevant information and determine if additional searches are needed.

${this.generateJsonInstructions(SEARCH_ANALYSIS_JSON_SCHEMA, "Search Analysis")}`,
      template: `Original Question: {originalQuestion}
Iteration: {iterationNumber} (Strategy: {searchStrategy})
Documents Found: {documentsCount}

{conversationContext}

Document Summaries:
{documentSummaries}

Document Content (Chunks):
{documentSnippets}

Previous Search Terms Used: {previousSearchTerms}

Accumulated Context from Previous Iterations:
{accumulatedContext}

CONTEXT-AWARE ANALYSIS INSTRUCTIONS:

FIRST, evaluate if conversation context (if provided above) can answer the query:
- If conversation context contains sufficient information to answer the original question with high confidence (>0.8), set:
  * context_sufficient: true
  * answer_from_context: [provide the answer based on context]
  * needs_search: false
  * You can still set relevance_score, completeness_score based on context quality

- If conversation context is empty, incomplete, or confidence is low (<0.8), set:
  * context_sufficient: false
  * answer_from_context: null
  * needs_search: true
  * Continue with full document analysis below

THEN, analyze search results (if needs_search is true):
1. Relevance assessment (1-10 scale) - How well results match the query
2. Completeness assessment (1-10 scale) - How comprehensive the results are
3. Confidence in completeness (0.0-1.0) - How certain you are about completeness
4. Key information extraction with source attribution and confidence scores
5. Gap identification - What important information is missing
6. Recommended next searches with specific search terms
7. Overall summary focusing on legal significance and family law implications

IMPORTANT CONTEXT HANDLING:
- Follow-up questions like "What about the other party?" or "Show me more details" often refer to previous conversation context
- If the query is a pronoun reference (it, that, they, etc.), check conversation context first
- If context partially answers the query, combine context answer with document findings

For each key finding, specify the category (financial/custody/communication/legal), provide evidence from source documents, and assign confidence scores.`,
      variables: [
        "originalQuestion",
        "iterationNumber",
        "searchStrategy",
        "documentsCount",
        "conversationContext",
        "documentSummaries",
        "documentSnippets",
        "previousSearchTerms",
        "accumulatedContext",
      ],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 2048,
        temperature: 0.2,
      },
    });

    // Unified Search Terms Generation Template (for Pinecone vector search)
    this.registerTemplate({
      id: "unified-search-terms",
      name: "Unified Document Search Terms",
      systemPrompt: `You are a search term extractor for a document search system. Your task is to extract searchable terms from the user's query to find relevant content in their uploaded documents.

${this.generateJsonInstructions(SEARCH_TERMS_JSON_SCHEMA, "Search Terms")}

CRITICAL RULES:
1. Extract key concepts, topics, and terms from the user's query
2. ANY question asking about document content IS searchable
3. Include quoted phrases exactly as the user wrote them
4. ONLY return empty array for pure social messages (greetings, thanks)

WHAT IS SEARCHABLE (generate search terms):
- Questions about any topic, concept, or information
- Requests to explain, find, show, or search for anything
- Questions about people, dates, amounts, events, concepts
- Quoted phrases or specific terms
- ANY question that could be answered by document content

WHAT IS NOT SEARCHABLE (return empty array):
- Pure greetings: "hi", "hello", "hey" (nothing else in message)
- Pure thanks: "thanks", "thank you" (nothing else in message)
- Pure acknowledgments: "ok", "got it", "understood"`,
      template: `User Query: {originalQuery}

Extract search terms from this query to find relevant document content.

RULES:
1. Extract key concepts and topics the user is asking about
2. Include any quoted phrases exactly as written
3. Generate terms that would match relevant document content
4. Maximum {numTerms} terms
5. ONLY return empty array if the query is a pure greeting/thanks with no content question

EXAMPLES:

Query: "hi"
Response: {"searchTerms": [], "confidence": 0, "notes": "Pure greeting"}

Query: "thanks!"
Response: {"searchTerms": [], "confidence": 0, "notes": "Pure thanks"}

Query: "What are Testimonial Ads?"
Response: {"searchTerms": [{"term": "Testimonial Ads", "category": "general"}, {"term": "testimonial advertising", "category": "general"}], "confidence": 0.9}

Query: "explain the 'Most Aware' level"
Response: {"searchTerms": [{"term": "Most Aware", "category": "general"}, {"term": "awareness level", "category": "general"}], "confidence": 0.9}

Query: "What are the different levels of awareness?"
Response: {"searchTerms": [{"term": "levels of awareness", "category": "general"}, {"term": "awareness levels", "category": "general"}], "confidence": 0.9}

Query: "Who made payments over $10,000?"
Response: {"searchTerms": [{"term": "payments over 10000", "category": "financial"}, {"term": "payments", "category": "financial"}], "confidence": 0.9}

Now extract search terms from the user's query.`,
      variables: ["originalQuery", "numTerms"],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 2048,
        temperature: 0.1,
      },
    });

    // Search Refinement Template
    this.registerTemplate({
      id: "search-refinement",
      name: "Search Strategy Refinement",
      systemPrompt: `You are an expert search strategist for legal document discovery. Analyze search results and refine search terms for better coverage.
${this.generateJsonInstructions(SEARCH_TERMS_JSON_SCHEMA, "Search Terms")}`,
      template: `Original Query: {originalQuery}
Current Iteration: {iteration}
Previous Search Terms: {previousTerms}
Search Results Summary: {resultsSummary}
Information Gaps: {gaps}

Based on this information, generate refined search terms that will:
1. Fill identified information gaps
2. Use different terminology/synonyms
3. Target specific document types or time periods
4. Focus on particular parties or topics

For each search term, provide:
- The term itself
- Category (general, financial, custody, communication, legal, etc.)
- Rationale for why this term is relevant
- Expected results or document types this might find

Generate 5-8 refined search terms with full explanations.`,
      variables: [
        "originalQuery",
        "iteration",
        "previousTerms",
        "resultsSummary",
        "gaps",
      ],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 1536,
        temperature: 0.4,
      },
    });

    // Final Answer Template
    this.registerTemplate({
      id: "final-answer",
      name: "Comprehensive Final Answer",
      systemPrompt: `You are a senior legal analyst providing final comprehensive answers based on iterative document search and analysis. Your answers should be thorough, well-sourced, and legally focused.

${this.generateJsonInstructions(FINAL_ANSWER_JSON_SCHEMA, "Final Answer")}

CRITICAL RULES:
1. You must include a 'used_document_numbers' array in your JSON response listing only the document numbers (1, 2, 3...) that you actually referenced or used to formulate your answer. Only include documents that directly contributed to your answer.

2. GROUNDING REQUIREMENT: You must ONLY answer based on:
   - The document information provided below
   - The conversation history (if any)
   - You must NEVER make up information, fabricate facts, or answer questions that cannot be answered from the available context

3. CONVERSATIONAL HANDLING:
   - For greetings, thanks, or casual messages, respond naturally and briefly
   - For questions about your capabilities ("what can you do", "tell me about X feature"), give a BRIEF, friendly response - not a long formal list
   - NEVER say "Based on our conversation history" - this sounds robotic
   - Speak naturally as if you're having a real conversation, not reading from a script
   - If you've already explained something earlier in the chat, don't repeat the full explanation - reference what you said before

4. NO DOCUMENTS FOUND: If no relevant documents were found AND the question requires document-based information:
   - Acknowledge that no relevant documents were found
   - Offer to help if the user rephrases or provides more details
   - Do NOT make up an answer

5. MARKDOWN FORMATTING - CRITICAL RULES:
   - Use **bold** for key terms and important findings
   - Use bullet points (- item) or numbered lists (1. item) with each on its own line
   - NEVER put ## or ### on the same line as other text
   - ALWAYS put a blank line (empty line) BEFORE any heading
   - ALWAYS put a blank line AFTER any heading before the content
   - Keep responses concise and well-structured`,
      template: `Original Question: {query}

Conversation History:
{conversationHistory}

Search Context and Process:
- Iterations Completed: {iterations}
- Total Documents Analyzed: {documentsAnalyzed}
- Search Strategies Used: {searchStrategies}

Accumulated Information:
{accumulatedContext}

Key Findings:
{keyFindings}

Document Sources:
{sources}

Analyze the provided information and generate a comprehensive answer to the original question.

IMPORTANT: Generate your actual analysis and findings. Do NOT include template placeholders like "[Provide a detailed answer...]" or similar instructions. Write the real answer based on the search results.

Your answer should:
- Directly answer what was asked in the original question
- For conversational messages (greetings, thanks, etc.), respond naturally without needing document evidence
- If the question can be answered from conversation history alone, use that context
- If documents are available, explain what the search found and provide specific details
- If NO documents were found and the question requires them, politely explain that no relevant documents were found and offer to help with a different approach
- Note any limitations in the available information
- Be clear and professional
- DO NOT mention iteration counts, search iterations, or processing details in your response
- DO NOT include phrases like "found relevant documents ... X iterations" or similar technical processing information
- NEVER fabricate or make up information not present in the provided context

FORMATTING RULES (YOU MUST FOLLOW):
- Use **bold** for key terms and findings
- Use bullet points or numbered lists for multiple items
- CRITICAL: Every heading (## or ###) MUST be on its OWN line with blank lines before AND after it
- WRONG: "Some text ## Heading" (heading on same line as text)
- CORRECT: "Some text\\n\\n## Heading\\n\\nMore text" (blank lines around heading)

IMPORTANT: In your JSON response, include a 'used_document_numbers' array listing only the document numbers (1, 2, 3...) that you actually used to formulate your answer. For example, if you used information from Document 1, Document 3, and Document 5, include [1, 3, 5]. Only include documents that directly contributed to your answer - do not include documents that were reviewed but not actually used. If no documents were used, return an empty array [].

Generate the actual answer content now, not template instructions.`,
      variables: [
        "query",
        "iterations",
        "documentsAnalyzed",
        "searchStrategies",
        "accumulatedContext",
        "keyFindings",
        "sources",
        "conversationHistory",
      ],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 4096,
        temperature: 0.2,
      },
    });

    // Final Answer Streaming Template (plain text output for word-by-word streaming)
    this.registerTemplate({
      id: "final-answer-streaming",
      name: "Comprehensive Final Answer (Streaming)",
      systemPrompt: STREAMING_FINAL_ANSWER_SYSTEM_PROMPT,
      template: `Original Question: {query}

Conversation History:
{conversationHistory}

Search Context and Process:
- Iterations Completed: {iterations}
- Total Documents Analyzed: {documentsAnalyzed}
- Search Strategies Used: {searchStrategies}

Accumulated Information:
{accumulatedContext}

Key Findings:
{keyFindings}

Document Sources:
{sources}

Analyze the provided information and generate a comprehensive answer to the original question.

IMPORTANT: Generate your actual analysis and findings. Do NOT include template placeholders like "[Provide a detailed answer...]" or similar instructions. Write the real answer based on the search results.

Your answer should:
- Directly answer what was asked in the original question
- For conversational messages (greetings, thanks, etc.), respond naturally without needing document evidence
- If the question can be answered from conversation history alone, use that context
- If documents are available, explain what the search found and provide specific details
- If NO documents were found and the question requires them, politely explain that no relevant documents were found and offer to help with a different approach
- Note any limitations in the available information
- Be clear and professional
- DO NOT mention iteration counts, search iterations, or processing details in your response
- DO NOT include phrases like "found relevant documents ... X iterations" or similar technical processing information
- NEVER fabricate or make up information not present in the provided context

FORMATTING RULES (YOU MUST FOLLOW):
- Use **bold** for key terms and findings
- Use bullet points or numbered lists for multiple items
- CRITICAL: Every heading (## or ###) MUST be on its OWN line with blank lines before AND after it
- WRONG: "Some text ## Heading" (heading on same line as text)
- CORRECT: "Some text\\n\\n## Heading\\n\\nMore text" (blank lines around heading)

Generate the actual answer content now, not template instructions.`,
      variables: [
        "query",
        "iterations",
        "documentsAnalyzed",
        "searchStrategies",
        "accumulatedContext",
        "keyFindings",
        "sources",
        "conversationHistory",
      ],
      modelConfig: {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 4096,
        temperature: 0.2,
      },
    });

  }

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  renderPrompt(
    templateId: string,
    context: PromptContext,
  ): {
    prompt: string;
    systemPrompt?: string;
    modelConfig: BedrockModelConfig;
  } | null {
    const template = this.templates.get(templateId);
    if (!template) {
      logger.warn("Prompt template not found", {
        component: "PromptEngine",
        action: "generatePrompt",
        templateId,
      });
      return null;
    }

    let renderedPrompt = template.template;

    // Replace variables in template
    // Security: Use replaceAll() instead of RegExp to avoid ReDoS
    for (const variable of template.variables) {
      const value = context[variable];
      if (value !== undefined) {
        const placeholder = `{${variable}}`;
        // Use replaceAll for safe string replacement without regex
        renderedPrompt = renderedPrompt.replaceAll(placeholder, String(value));
      }
    }

    return {
      prompt: renderedPrompt,
      systemPrompt: template.systemPrompt,
      modelConfig: template.modelConfig || {
        modelId: BEDROCK_MODELS.CLAUDE_4_5_HAIKU,
        maxTokens: 2048,
        temperature: 0.2,
      },
    };
  }

  // Helper method to validate that all required variables are provided
  validateContext(templateId: string, context: PromptContext): string[] {
    const template = this.templates.get(templateId);
    if (!template) {
      return [`Template '${templateId}' not found`];
    }

    const missingVariables: string[] = [];
    for (const variable of template.variables) {
      if (context[variable] === undefined) {
        missingVariables.push(variable);
      }
    }

    return missingVariables;
  }
}

// Export singleton instance
export const promptEngine = new PromptTemplateEngine();

// Export legal query examples for reference (moved from schema-context.ts)
export const LEGAL_QUERY_EXAMPLES = {
  financial: [
    "What is the total amount spent on child-related expenses?",
    "Who made payments over $10,000?",
    "Show me all bank transfers to Elite Academy",
  ],
  custody: [
    "What is the current custody arrangement?",
    "Show all missed visitations or violations",
    "What communication exists about school events?",
  ],
  communication: [
    "Find threatening or hostile communications",
    "Show communication patterns between parties",
    "What discussions exist about custody modifications?",
  ],
};
