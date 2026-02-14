// Pinecone Vector Search Types for E-Discovery Platform

// ==================== Core Vector Types ====================

export interface VectorEmbedding {
  values: number[];
  metadata?: VectorMetadata;
  id?: string;
}

export interface VectorMetadata {
  // Document identification
  documentId: string;
  caseId: string;
  chunkIndex: number;

  // Document properties
  documentName: string;
  documentType?: string;
  originalName?: string;

  // Chunk properties
  text: string;
  chunkSize: number;
  startPosition: number;
  endPosition: number;

  // Document metadata
  createdAt?: string;
  pageNumbers?: number[];
  section?: string;

  // Legal categorization
  containsFinancialData?: boolean;
  containsPII?: boolean;
  documentCategory?: string;
  legalSubtype?: string;

  // Extracted entities (for filtering)
  extractedEntities?: {
    people?: string[];
    organizations?: string[];
    locations?: string[];
    dates?: string[];
    monetaryAmounts?: number[];
  };

  // Context reconstruction
  hasBeforeContext?: boolean;
  hasAfterContext?: boolean;

  // Processing metadata
  indexedAt?: string;
  embeddingModel?: string;
  confidence?: number;
}

// ==================== Search Request Types ====================

export interface VectorSearchRequest {
  queryEmbedding: number[];
  caseId: string;
  topK?: number;
  filter?: VectorFilter;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
}

export interface VectorFilter {
  // Document filters
  documentTypes?: string[];
  documentIds?: string[];

  // Date filters
  createdAfter?: string;
  createdBefore?: string;

  // Content filters
  containsFinancialData?: boolean;
  containsPII?: boolean;

  // Entity filters
  containsPerson?: string;
  containsOrganization?: string;

  // Legal filters
  legalSubtype?: string[];
  documentCategory?: string[];

  // Size filters
  minChunkSize?: number;
  maxChunkSize?: number;

  // Advanced filters (Pinecone metadata filtering)
  [key: string]: any;
}

// ==================== Search Response Types ====================

export interface VectorSearchResponse {
  matches: VectorMatch[];
  namespace?: string;
  executionTime?: number;
  totalResults?: number;
}

export interface VectorMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: VectorMetadata;
}

// ==================== Semantic Search Results ====================

export interface SemanticSearchResult {
  chunks: SemanticChunk[];
  totalFound: number;
  searchTime: number;
  queryEmbedding?: number[];
  searchParameters: {
    topK: number;
    filter?: VectorFilter;
  };
}

export interface SemanticChunk {
  // Core content
  id: string;
  text: string;
  relevanceScore: number;

  // Document context
  documentId: string;
  documentName: string;
  documentType?: string;

  // Position context
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  pageNumbers?: number[];
  section?: string;

  // Surrounding context for reconstruction
  beforeContext?: string;
  afterContext?: string;

  // Metadata
  metadata?: VectorMetadata;

  // Highlighted entities
  extractedEntities?: {
    people?: string[];
    organizations?: string[];
    monetaryAmounts?: number[];
    dates?: string[];
  };
}

// ==================== Document Indexing Types ====================

export interface DocumentChunk {
  id: string;
  documentId: string;
  caseId: string;
  text: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  metadata: VectorMetadata;
}

export interface IndexingRequest {
  documents: DocumentForIndexing[];
  caseId: string;
  batchSize?: number;
  overwrite?: boolean;
}

export interface DocumentForIndexing {
  id: string;
  caseId: string;
  text: string;
  metadata: {
    documentName: string;
    documentType?: string;
    originalName?: string;
    createdAt?: string;
    containsFinancialData?: boolean;
    containsPII?: boolean;
    extractedEntities?: any;
    [key: string]: any;
  };
}

export interface IndexingResult {
  success: boolean;
  documentsProcessed: number;
  chunksCreated: number;
  vectorsIndexed: number;
  errors?: IndexingError[];
  executionTime: number;
}

export interface IndexingError {
  documentId: string;
  chunkIndex?: number;
  error: string;
  retryable: boolean;
}

// ==================== Embedding Service Types ====================

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
  dimensions?: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  tokensUsed: number;
  executionTime: number;
}

export interface EmbeddingError {
  message: string;
  code: string;
  retryable: boolean;
  details?: any;
}

// ==================== Namespace Management ====================

export interface NamespaceInfo {
  name: string;
  caseId: string;
  vectorCount: number;
  createdAt: string;
  lastUpdated: string;
  indexStats?: {
    documentCount: number;
    averageChunksPerDocument: number;
    totalTextSize: number;
  };
}

export interface NamespaceStats {
  totalVectors: number;
  documentCount: number;
  averageRetrievalTime: number;
  indexQuality: number; // 0-1 score
  lastOptimized?: string;
}

// ==================== Configuration Types ====================

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
  environment: string;
  defaultTopK: number;
  defaultNamespacePrefix: string;
  embeddingModel: string;
  embeddingDimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators: string[];
  preserveFormatting: boolean;
  minChunkSize: number;
  maxChunkSize: number;
}

// ==================== Error Types ====================

export interface PineconeError {
  message: string;
  code:
    | "CONNECTION_ERROR"
    | "RATE_LIMIT"
    | "INVALID_REQUEST"
    | "EMBEDDING_ERROR"
    | "INDEX_ERROR"
    | "NOT_FOUND";
  retryable: boolean;
  details?: any;
  timestamp: string;
}

// ==================== Query Enhancement Types ====================

export interface QueryExpansion {
  originalQuery: string;
  expandedTerms: string[];
  synonyms: string[];
  legalConcepts: string[];
  entityTypes: string[];
}

export interface SemanticQueryContext {
  queryType:
    | "financial"
    | "communication"
    | "legal_document"
    | "temporal"
    | "entity"
    | "general";
  confidence: number;
  suggestedFilters: VectorFilter;
  expectedResultTypes: string[];
}

// ==================== Performance Monitoring ====================

export interface VectorSearchMetrics {
  queryTime: number;
  embeddingTime: number;
  searchTime: number;
  postProcessingTime: number;
  totalTime: number;
  resultsCount: number;
  averageRelevanceScore: number;
  cacheHit: boolean;
}

export interface PineconeHealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  indexStats: {
    vectorCount: number;
    dimensionality: number;
  };
  lastError?: string;
  timestamp: string;
}
