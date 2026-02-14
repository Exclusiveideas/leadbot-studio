/**
 * Search types for PostgreSQL Full-Text Search
 * Supports: basic (OR search) and boolean (AND/OR/NOT operators)
 */

export type SearchType = "basic" | "boolean";

export type SearchFilters = {
  caseId?: string;
  caseIds?: string[];
  documentType?: string[];
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  sizeMin?: number;
  sizeMax?: number;
  piiDetected?: boolean;
  confidenceScoreMin?: number;
  tags?: string[];
};

export type SearchOptions = {
  from?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  highlight?: boolean;
  includeAggregations?: boolean;
};

export type SearchResultDocument = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  documentType?: string;
  createdAt: string;
  extractedText?: string;
  piiDetected?: boolean;
  confidenceScore?: number;
  cases: {
    id: string;
    caseNumber: string;
    title: string;
  };
  relevanceScore?: number;
  highlights?: { [field: string]: string[] };
  searchSnippets?: string[];
};

export type SearchPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
};

export type SearchResult = {
  documents: SearchResultDocument[];
  pagination: SearchPagination;
  searchQuery?: string;
  searchHash?: string;
  executionTime?: number;
  cached?: boolean;
};
