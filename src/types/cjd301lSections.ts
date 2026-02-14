/**
 * CJD-301-L Section-Based Type Definitions
 * Massachusetts Probate and Family Court Financial Statement - Section Processing
 *
 * These types support the new section-based aggregation approach where fields
 * are programmatically grouped by their section property and processed separately.
 */

// Raw field structure from document extraction
export interface CJD301LField {
  value: string | null | undefined;
  section: CJD301LSection;
  contexts: string[];
}

// Enhanced field with document tracking for internal processing
export interface CJD301LFieldWithSource extends CJD301LField {
  documentId: string;
  documentName: string;
  confidence: number;
  extractedAt: string;
}

// Valid section identifiers
export type CJD301LSection =
  | "section_I" // Personal Information
  | "section_II" // Gross Weekly Income
  | "section_III" // Weekly Deductions
  | "section_IV" // Net Weekly Income
  | "section_V" // Prior Year Income
  | "section_VI" // Weekly Expenses
  | "section_VII" // Counsel Fees
  | "section_VIII" // Assets
  | "section_IX"; // Liabilities

// Document metadata from extraction
export interface CJD301LDocumentMetadata {
  chunked: boolean;
  success: boolean;
  columnName: string;
  tokensUsed: number;
  processedAt: string;
  processingTime: number;
}

// Raw document structure as stored in database
export interface CJD301LRawDocument {
  _metadata: CJD301LDocumentMetadata;
  [fieldName: string]: CJD301LField | CJD301LDocumentMetadata;
}

// Section-specific field mappings based on CJD-301-L form structure
export const SECTION_FIELD_MAPPINGS = {
  section_I: [
    // Personal Information
    "your_name",
    "address",
    "phone_number",
    "social_security_number",
    "date_of_birth",
    "occupation",
    "employer_name",
    "employer_address",
  ],
  section_II: [
    // Gross Weekly Income
    "line_a_base_pay",
    "line_b_overtime",
    "line_c_part_time",
    "line_d_self_employment",
    "line_e_tips",
    "line_f_commissions_bonuses",
    "line_g_dividends_interest",
    "line_h_trusts_annuities",
    "line_i_pensions_retirement",
    "line_j_social_security",
    "line_k_unemployment_compensation",
    "line_l_workers_compensation",
    "line_m_child_support_alimony",
    "line_n_rental_income",
    "line_o_royalties",
    "line_p_household_contributions",
    "line_q_other_income",
    "line_r_total_gross_weekly",
  ],
  section_III: [
    // Weekly Deductions
    "line_a_federal_tax",
    "line_b_state_tax",
    "line_c_fica",
    "line_d_medicare",
    "line_e_health_insurance",
    "line_f_life_insurance",
    "line_g_dental_vision",
    "line_h_retirement_401k",
    "line_i_union_dues",
    "line_j_parking",
    "line_k_other_deductions",
    "line_l_total_deductions",
    "federal_allowances",
    "state_allowances",
  ],
  section_IV: [
    // Net Weekly Income
    "line_a_gross_from_section_2",
    "line_b_deductions_from_section_3",
    "line_c_net_weekly_income",
  ],
  section_V: [
    // Prior Year Income
    "prior_year_gross_income",
    "prior_year_net_income",
    "years_paid_social_security",
    "w2_1099_attached",
  ],
  section_VI: [
    // Weekly Expenses
    "rent_mortgage",
    "property_taxes",
    "homeowners_insurance",
    "utilities",
    "telephone",
    "food",
    "clothing",
    "laundry_cleaning",
    "medical_dental",
    "transportation",
    "auto_insurance",
    "life_insurance_expenses",
    "child_care",
    "other_expenses",
    "total_weekly_expenses",
  ],
  section_VII: [
    // Counsel Fees
    "retainer_paid",
    "legal_fees_incurred",
    "legal_fees_outstanding",
    "payment_arrangement",
  ],
  section_VIII: [
    // Assets
    "real_estate_value",
    "motor_vehicles",
    "bank_accounts_cash",
    "stocks_bonds",
    "retirement_accounts",
    "business_interests",
    "other_assets",
    "total_assets",
  ],
  section_IX: [
    // Liabilities
    "creditor_name",
    "nature_of_debt",
    "date_incurred",
    "original_amount",
    "current_balance",
    "monthly_payment",
    "total_liabilities",
  ],
} as const;

// Type for field names in each section
export type SectionIFieldNames =
  (typeof SECTION_FIELD_MAPPINGS.section_I)[number];
export type SectionIIFieldNames =
  (typeof SECTION_FIELD_MAPPINGS.section_II)[number];
export type SectionIIIFieldNames =
  (typeof SECTION_FIELD_MAPPINGS.section_III)[number];

// Helper type to get all valid field names for a section
export type ValidFieldNamesForSection<T extends CJD301LSection> =
  T extends "section_I"
    ? SectionIFieldNames
    : T extends "section_II"
      ? SectionIIFieldNames
      : T extends "section_III"
        ? SectionIIIFieldNames
        : string;

// Processed field after aggregation
export interface ProcessedCJD301LField {
  value: string | number | null;
  sources: DocumentSource[];
  lastUpdated: string;
  conflictResolution?: ConflictResolution;
  confidence: number;
  contexts: string[];
}

// Source document information
export interface DocumentSource {
  documentId: string;
  documentName: string;
  extractedAt: string;
  confidence: number;
}

// Conflict resolution metadata
export interface ConflictResolution {
  hadConflicts: boolean;
  conflictingValues: Array<{
    value: string;
    source: DocumentSource;
    contexts: string[];
  }>;
  resolutionStrategy:
    | "most_recent"
    | "highest_confidence"
    | "sum"
    | "merge"
    | "manual_review";
  resolutionReason: string;
}

// Section processing result
export interface ProcessedSection {
  sectionId: CJD301LSection;
  sectionName: string;
  fields: Record<string, ProcessedCJD301LField>;
  processingStatus: "success" | "partial" | "failed";
  processingTime: number;
  documentsProcessed: number;
  conflictsResolved: number;
  errors?: string[];
}

// Complete section-based aggregation result
export interface SectionBasedCJD301LExport {
  sections: Record<CJD301LSection, ProcessedSection>;
  summary: {
    totalSections: number;
    successfulSections: number;
    partialSections: number;
    failedSections: number;
    totalFields: number;
    totalConflicts: number;
    overallConfidence: number;
  };
  metadata: SectionAggregationMetadata;
}

// Aggregation metadata for section-based processing
export interface SectionAggregationMetadata {
  processedAt: string;
  aggregationType: "section-based";
  documentsProcessed: DocumentSource[];
  totalDocuments: number;
  processingTime: number;
  version: string;
  sectionProcessingOrder: CJD301LSection[];
  claudeApiCalls: number;
  totalTokensUsed: number;
}

// Section grouping utility types
export type SectionFieldMap = Record<
  CJD301LSection,
  Record<string, CJD301LFieldWithSource[]>
>;
export type ValidatedSectionMap = Record<
  CJD301LSection,
  Record<string, CJD301LFieldWithSource[]>
>;

// Section processing options
export interface SectionProcessingOptions {
  filterNotFound: boolean;
  filterNull: boolean;
  allowPartialSections: boolean;
  maxRetriesPerSection: number;
  parallelProcessing: boolean;
  timeoutPerSection: number;
}

// Section-specific conflict resolution rules
export interface SectionConflictRules {
  section: CJD301LSection;
  rules: Record<
    string,
    {
      strategy: ConflictResolution["resolutionStrategy"];
      priority: "value" | "confidence" | "recency" | "completeness";
      customLogic?: string;
    }
  >;
}

// Default conflict resolution rules for each section
export const DEFAULT_SECTION_CONFLICT_RULES: Record<
  CJD301LSection,
  SectionConflictRules
> = {
  section_I: {
    section: "section_I",
    rules: {
      your_name: { strategy: "most_recent", priority: "completeness" },
      address: { strategy: "most_recent", priority: "completeness" },
      phone_number: { strategy: "most_recent", priority: "recency" },
      social_security_number: {
        strategy: "highest_confidence",
        priority: "confidence",
      },
      date_of_birth: { strategy: "highest_confidence", priority: "confidence" },
      occupation: { strategy: "most_recent", priority: "completeness" },
      employer_name: { strategy: "most_recent", priority: "recency" },
      employer_address: { strategy: "most_recent", priority: "recency" },
    },
  },
  section_II: {
    section: "section_II",
    rules: {
      line_a_base_pay: { strategy: "most_recent", priority: "recency" },
      line_b_overtime: {
        strategy: "sum",
        priority: "value",
        customLogic: "sum_if_different_periods",
      },
      line_c_part_time: {
        strategy: "sum",
        priority: "value",
        customLogic: "sum_if_different_sources",
      },
      line_d_self_employment: { strategy: "sum", priority: "value" },
      line_e_tips: { strategy: "sum", priority: "value" },
      line_f_commissions_bonuses: {
        strategy: "most_recent",
        priority: "recency",
      },
      line_g_dividends_interest: { strategy: "sum", priority: "value" },
      line_h_trusts_annuities: { strategy: "sum", priority: "value" },
      line_i_pensions_retirement: { strategy: "sum", priority: "value" },
      line_m_child_support_alimony: {
        strategy: "most_recent",
        priority: "recency",
      },
      line_n_rental_income: { strategy: "sum", priority: "value" },
      line_o_royalties: { strategy: "sum", priority: "value" },
      line_p_household_contributions: { strategy: "sum", priority: "value" },
      line_q_other_income: { strategy: "sum", priority: "value" },
    },
  },
  section_III: {
    section: "section_III",
    rules: {
      line_a_federal_tax: { strategy: "most_recent", priority: "recency" },
      line_b_state_tax: { strategy: "most_recent", priority: "recency" },
      line_c_fica: { strategy: "most_recent", priority: "recency" },
      line_d_medicare: { strategy: "most_recent", priority: "recency" },
      federal_allowances: { strategy: "most_recent", priority: "recency" },
      state_allowances: { strategy: "most_recent", priority: "recency" },
    },
  },
  section_IV: {
    section: "section_IV",
    rules: {
      line_c_net_weekly_income: {
        strategy: "manual_review",
        priority: "value",
        customLogic: "calculate_from_components",
      },
    },
  },
  section_V: {
    section: "section_V",
    rules: {
      prior_year_gross_income: {
        strategy: "highest_confidence",
        priority: "confidence",
      },
      years_paid_social_security: {
        strategy: "most_recent",
        priority: "recency",
      },
    },
  },
  section_VI: {
    section: "section_VI",
    rules: {
      rent_mortgage: { strategy: "most_recent", priority: "recency" },
      utilities: { strategy: "most_recent", priority: "recency" },
      food: { strategy: "most_recent", priority: "recency" },
      transportation: { strategy: "most_recent", priority: "recency" },
    },
  },
  section_VII: {
    section: "section_VII",
    rules: {
      retainer_paid: { strategy: "sum", priority: "value" },
      legal_fees_incurred: { strategy: "sum", priority: "value" },
      legal_fees_outstanding: { strategy: "most_recent", priority: "recency" },
    },
  },
  section_VIII: {
    section: "section_VIII",
    rules: {
      real_estate_value: { strategy: "most_recent", priority: "recency" },
      motor_vehicles: { strategy: "most_recent", priority: "recency" },
      bank_accounts_cash: { strategy: "most_recent", priority: "recency" },
      stocks_bonds: { strategy: "most_recent", priority: "recency" },
      retirement_accounts: { strategy: "most_recent", priority: "recency" },
      total_assets: {
        strategy: "manual_review",
        priority: "value",
        customLogic: "calculate_from_components",
      },
    },
  },
  section_IX: {
    section: "section_IX",
    rules: {
      current_balance: { strategy: "most_recent", priority: "recency" },
      monthly_payment: { strategy: "most_recent", priority: "recency" },
      total_liabilities: {
        strategy: "manual_review",
        priority: "value",
        customLogic: "calculate_from_components",
      },
    },
  },
} as const;

// Utility type for section names
export const SECTION_NAMES: Record<CJD301LSection, string> = {
  section_I: "Personal Information",
  section_II: "Gross Weekly Income",
  section_III: "Weekly Deductions",
  section_IV: "Net Weekly Income",
  section_V: "Prior Year Income",
  section_VI: "Weekly Expenses",
  section_VII: "Counsel Fees",
  section_VIII: "Assets",
  section_IX: "Liabilities",
} as const;

// Field validation utility functions
export const CJD301LFieldValidators = {
  /**
   * Check if a field value is valid for processing
   */
  isValidValue(value: string | null | undefined): value is string {
    return (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== "not_found"
    );
  },

  /**
   * Check if a section identifier is valid
   */
  isValidSection(section: string): section is CJD301LSection {
    const validSections: CJD301LSection[] = [
      "section_I",
      "section_II",
      "section_III",
      "section_IV",
      "section_V",
      "section_VI",
      "section_VII",
      "section_VIII",
      "section_IX",
    ];
    return validSections.includes(section as CJD301LSection);
  },

  /**
   * Validate field structure
   */
  isValidField(field: any): field is CJD301LField {
    return (
      field &&
      typeof field === "object" &&
      "value" in field &&
      "section" in field &&
      "contexts" in field &&
      Array.isArray(field.contexts) &&
      this.isValidSection(field.section)
    );
  },

  /**
   * Check if a field name is valid for a given section
   */
  isValidFieldForSection(fieldName: string, section: CJD301LSection): boolean {
    const sectionFields = SECTION_FIELD_MAPPINGS[section];
    return sectionFields.includes(fieldName as any);
  },
} as const;

// Export validation
export interface SectionValidationResult {
  section: CJD301LSection;
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning";
  }>;
  completeness: number; // 0-1 scale
  consistency: number; // 0-1 scale
}
