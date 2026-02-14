// Types for the new iterative AI-powered search system

// ==================== Core Search Types ====================

export interface AISearchRequest {
  query: string;
  caseId: string;
  userId: string;
  maxIterations?: number;
  streamResponse?: boolean;
  skipDocumentSearch?: boolean; // When true, skip Pinecone search and get direct AI response
  context?: {
    documentIds?: string[];
    timeRange?: {
      start: string;
      end: string;
    };
    additionalContext?: string;
    conversationHistory?: ConversationContext;
  };
}

// ==================== Conversation Context ====================

export interface ConversationContext {
  recentMessages: ConversationMessage[];
  accumulatedFacts: string[];
  referencedDocuments: string[];
}

export interface ConversationMessage {
  question: string;
  answer: string;
  timestamp: string;
}

export interface AISearchResponse {
  answer: string;
  confidence: number; // 0-1
  sources: DocumentSource[];
  iterations: number;
  searchTermsUsed: string[];
  executionTime: number;
  tokensUsed: number;
  complete: boolean;
  iterationDetails?: SearchIteration[];
  queryType?: QueryType;
  cost?: QueryCost;
}

// Simplified response format matching the original Phase 3 specification
export interface SimplifiedAISearchResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    documentId: string;
    documentName: string;
    snippet: string;
    relevance: number;
  }>;
  iterations: number;
  searchTermsUsed: string[];
  executionTime: number;
  tokensUsed: number;
  complete: boolean;
}

export interface DocumentSource {
  documentId: string;
  documentName: string;
  snippet: string;
  relevance: number;
  pageNumber?: number;
  highlightedText?: string;
  documentType?: string;
  url?: string;
}

// ==================== Iteration Management ====================

export interface SearchIteration {
  iterationNumber: number;
  searchTerms: string[];
  documentsFound: number;
  snippetsExtracted: number;
  newInformationFound: boolean;
  confidenceGain: number;
  executionTime: number;
  tokensUsed: number;
  decision: IterationDecision;
}

export interface IterationDecision {
  shouldContinue: boolean;
  reason: string;
  missingInformation?: string[];
  nextSearchStrategy?: SearchStrategy;
}

export type SearchStrategy =
  | "broad"
  | "targeted"
  | "financial"
  | "temporal"
  | "entity"
  | "communication"
  | "legal_document";

// ==================== Context Management ====================

export interface SearchContext {
  originalQuery: string;
  caseId: string;
  userId: string;
  iterations: IterationContext[];
  accumulatedFindings: AccumulatedFindings;
  searchHistory: string[];
  startTime: number;
  totalTokensUsed: number;
  currentConfidence: number;
  conversationHistory?: ConversationContext;
}

export interface IterationContext {
  iterationNumber: number;
  searchTerms: string[];
  documentsSearched: string[];
  snippetsAnalyzed: DocumentSnippet[];
  findingsExtracted: Finding[];
  aiAnalysis: AIAnalysisResult;
  executionTime: number;
  tokensUsed: number;
}

export interface AccumulatedFindings {
  facts: ConfirmedFact[];
  entities: ExtractedEntity[];
  dates: ExtractedDate[];
  amounts: ExtractedAmount[];
  relationships: EntityRelationship[];
  missingInformation: string[];
  contradictions: Contradiction[];
}

export interface ConfirmedFact {
  fact: string;
  confidence: number;
  sources: string[]; // Document IDs
  category: FactCategory;
  timestamp?: string;
}

export type FactCategory =
  | "financial"
  | "custody"
  | "communication"
  | "behavioral"
  | "asset"
  | "legal"
  | "timeline";

// ==================== Snippet Extraction ====================

export interface DocumentSnippet {
  documentId: string;
  documentName: string;
  text: string;
  startPosition: number;
  endPosition: number;
  relevanceScore: number;
  matchedTerms: string[];
  contextBefore?: string;
  contextAfter?: string;
  metadata?: SnippetMetadata;
}

export interface SnippetMetadata {
  pageNumber?: number;
  section?: string;
  documentType?: string;
  createdDate?: string;
  author?: string;
}

export interface SnippetExtractionConfig {
  snippetLength: number; // Target words per snippet (200-300)
  contextWindow: number; // Words before/after match
  maxSnippetsPerDocument: number;
  deduplicationThreshold: number; // Similarity threshold for dedup
  relevanceThreshold: number;
  tokenLimit: number; // Max tokens for AI processing (8000)
}

// ==================== AI Analysis ====================

export interface AIAnalysisResult {
  isComplete: boolean;
  confidence: number;
  answer: string;
  missingInformation: string[];
  suggestedSearchTerms: string[];
  foundEntities: ExtractedEntity[];
  keyFindings: string[];
  queryInterpretation: string;
  nextSearchStrategy?: SearchStrategy;
  // Context-aware search fields
  answerFromContext?: string; // Direct answer from conversation context
  needsSearch?: boolean; // Whether vector search is needed
  contextSufficient?: boolean; // Whether context alone can answer query
}

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  normalizedValue?: string;
  confidence: number;
  context: string;
  documentId: string;
}

export type EntityType =
  | "person"
  | "organization"
  | "location"
  | "date"
  | "amount"
  | "account"
  | "legal_term"
  | "case_number";

export interface ExtractedDate {
  original: string;
  normalized: string; // ISO format
  type: "exact" | "range" | "approximate";
  context: string;
  documentId: string;
}

export interface ExtractedAmount {
  value: number;
  currency: string;
  type: "payment" | "asset" | "debt" | "income" | "expense";
  context: string;
  date?: string;
  parties?: string[];
  documentId: string;
}

export interface EntityRelationship {
  entity1: ExtractedEntity;
  entity2: ExtractedEntity;
  relationshipType: string;
  confidence: number;
  evidence: string;
}

export interface Contradiction {
  fact1: ConfirmedFact;
  fact2: ConfirmedFact;
  type: "date" | "amount" | "fact" | "entity";
  resolution?: string;
}

// ==================== Search Enhancement ====================

export interface SearchTermGeneration {
  originalQuery: string;
  queryType: QueryType;
  missingInformation: string[];
  previousSearches: string[];
  suggestedTerms: SearchTermSet[];
}

export interface SearchTermSet {
  terms: string[];
  strategy: SearchStrategy;
  rationale: string;
  expectedDocumentTypes?: string[];
  priority: number;
}

// ==================== Query Types & Strategies ====================

export type QueryType =
  | "financial"
  | "custody"
  | "communication"
  | "asset"
  | "timeline"
  | "behavioral"
  | "discovery"
  | "general"
  | "context_followup"; // Fast path: answered from conversation context only

export interface QueryStrategy {
  type: QueryType;
  primaryDocuments: string[];
  searchPatterns: string[];
  maxIterations: number;
  confidenceThreshold: number;
  requiredEntities?: EntityType[];
}

// ==================== Cost Management ====================

export interface QueryCost {
  inputTokens: number;
  outputTokens: number;
  iterations: number;
  estimatedCost: number; // in USD
  costBreakdown: CostBreakdown[];
}

export interface CostBreakdown {
  operation: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface CostLimits {
  maxTokensPerQuery: number;
  maxCostPerQuery: number;
  dailyUserLimit: number;
  dailyCaseLimit: number;
}

// ==================== Performance Metrics ====================

export interface SearchMetrics {
  queryId: string;
  userId: string;
  caseId: string;
  queryType: QueryType;
  startTime: number;
  endTime: number;
  totalDuration: number;
  iterations: number;
  documentsSearched: number;
  snippetsAnalyzed: number;
  tokensUsed: number;
  cost: number;
  confidence: number;
  complete: boolean;
  userSatisfaction?: number;
  sourcesClicked?: string[];
}

// ==================== Error Handling ====================

export interface AISearchError {
  code: AISearchErrorCode;
  message: string;
  details?: string;
  suggestions?: string[];
  partialAnswer?: string;
  sourcesFound?: DocumentSource[];
}

export type AISearchErrorCode =
  | "QUERY_TOO_VAGUE"
  | "NO_RESULTS"
  | "INCOMPLETE_ANSWER"
  | "TOKEN_LIMIT_EXCEEDED"
  | "COST_LIMIT_EXCEEDED"
  | "TIMEOUT"
  | "AI_SERVICE_ERROR"
  | "SEARCH_SERVICE_ERROR"
  | "INVALID_QUERY"
  | "ACCESS_DENIED"
  | "RATE_LIMITED";

// ==================== Streaming Support ====================

export interface StreamingUpdate {
  type: StreamUpdateType;
  data: any;
  timestamp: number;
}

export type StreamUpdateType =
  | "iteration_started"
  | "search_completed"
  | "snippets_extracted"
  | "analysis_completed"
  | "partial_answer"
  | "final_answer"
  | "error";

// ==================== Legal Domain Types ====================

export interface LegalQueryContext {
  jurisdiction: string;
  caseType: "family_law" | "civil" | "criminal";
  documentTypes: LegalDocumentType[];
  keyEntities: LegalEntity[];
  timeframe?: TimeRange;
}

export type LegalDocumentType =
  | "custody_agreement"
  | "parenting_plan"
  | "financial_statement"
  | "bank_statement"
  | "tax_return"
  | "pay_stub"
  | "court_order"
  | "motion"
  | "pleading"
  | "correspondence"
  | "evaluation"
  | "police_report";

export interface LegalEntity {
  role:
    | "petitioner"
    | "respondent"
    | "child"
    | "attorney"
    | "judge"
    | "witness"
    | "expert";
  name: string;
  aliases?: string[];
}

export interface TimeRange {
  start: string;
  end: string;
  description?: string;
}

// ==================== Finding Types ====================

export interface Finding {
  type: FindingType;
  content: string;
  confidence: number;
  source: DocumentSource;
  entities?: ExtractedEntity[];
  dates?: ExtractedDate[];
  amounts?: ExtractedAmount[];
}

export type FindingType =
  | "fact"
  | "event"
  | "transaction"
  | "communication"
  | "violation"
  | "agreement"
  | "dispute";

// ==================== Configuration ====================

export interface AISearchConfig {
  maxIterations: number;
  timeoutMs: number;
  snippetConfig: SnippetExtractionConfig;
  costLimits: CostLimits;
  confidenceThreshold: number;
  enableStreaming: boolean;
  enableCaching: boolean;
  debugMode: boolean;
}

// ==================== Backward Compatibility ====================

export interface LegacyCompatibilityResponse {
  // Matches old NLP query response format
  answer: string;
  sources: DocumentSource[];
  data?: any[];
  confidence: number;
  queryType: QueryType;
  sql?: string; // Will be null in new system
  timestamp: string;
  executionTime?: number;
}

// ==================== Progress Streaming Types ====================

export type ProgressEventType =
  | "context_check"
  | "iteration_start"
  | "documents_found"
  | "analysis_complete"
  | "iteration_complete"
  | "answer_chunk"
  | "final_answer"
  | "complete"
  | "error";

export interface BaseProgressEvent {
  type: ProgressEventType;
  timestamp: number;
}

export interface ContextCheckEvent extends BaseProgressEvent {
  type: "context_check";
  hasContext: boolean;
  messageCount?: number;
  contextSufficient?: boolean;
}

export interface IterationStartEvent extends BaseProgressEvent {
  type: "iteration_start";
  iteration: number;
  searchTerms: string[];
  strategy: "broad" | "targeted";
}

export interface DocumentsFoundEvent extends BaseProgressEvent {
  type: "documents_found";
  iteration: number;
  count: number;
  searchTerms: string[];
}

export interface AnalysisCompleteEvent extends BaseProgressEvent {
  type: "analysis_complete";
  iteration: number;
  confidence: number;
  keyFindings: string[];
}

export interface IterationCompleteEvent extends BaseProgressEvent {
  type: "iteration_complete";
  iteration: number;
  shouldContinue: boolean;
  reason: string;
  confidenceGained: number;
}

export interface AnswerChunkEvent extends BaseProgressEvent {
  type: "answer_chunk";
  chunk: string;
}

export interface FinalAnswerEvent extends BaseProgressEvent {
  type: "final_answer";
  answer: string;
  confidence: number;
  totalIterations: number;
}

export interface CompleteEvent extends BaseProgressEvent {
  type: "complete";
  finalResponse: AISearchResponse | SimplifiedAISearchResponse;
}

export interface ErrorEvent extends BaseProgressEvent {
  type: "error";
  error: AISearchError;
}

export type ProgressEvent =
  | ContextCheckEvent
  | IterationStartEvent
  | DocumentsFoundEvent
  | AnalysisCompleteEvent
  | IterationCompleteEvent
  | AnswerChunkEvent
  | FinalAnswerEvent
  | CompleteEvent
  | ErrorEvent;

export type ProgressCallback = (event: ProgressEvent) => void;
