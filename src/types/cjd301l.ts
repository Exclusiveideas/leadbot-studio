/**
 * CJ-D 301 L Form Types
 * Massachusetts Probate and Family Court - Financial Statement (Short Form)
 */

export interface DocumentSource {
  documentId: string;
  documentName: string;
  documentType: string;
  confidence: number;
  extractedAt: string;
}

export interface FieldMetadata {
  value: string | number | boolean | null;
  source: DocumentSource;
  lastUpdated: string;
  conflictResolution?: {
    alternativeValues: Array<{
      value: string | number | boolean | null;
      source: DocumentSource;
      reason: string;
    }>;
    selectedReason: string;
  };
}

// Personal Information Section
export interface PersonalInformation {
  fullName: FieldMetadata;
  address: {
    street: FieldMetadata;
    city: FieldMetadata;
    state: FieldMetadata;
    zipCode: FieldMetadata;
  };
  phoneNumber: FieldMetadata;
  socialSecurityNumber: FieldMetadata;
  dateOfBirth: FieldMetadata;
  occupation: FieldMetadata;
  employer: FieldMetadata;
  employerAddress: {
    street: FieldMetadata;
    city: FieldMetadata;
    state: FieldMetadata;
    zipCode: FieldMetadata;
  };
}

// Income Section
export interface IncomeInformation {
  weeklyGrossIncome: {
    wages: FieldMetadata;
    overtime: FieldMetadata;
    tips: FieldMetadata;
    bonuses: FieldMetadata;
    commissions: FieldMetadata;
    selfEmployment: FieldMetadata;
    socialSecurity: FieldMetadata;
    unemployment: FieldMetadata;
    workersComp: FieldMetadata;
    disability: FieldMetadata;
    publicAssistance: FieldMetadata;
    pension: FieldMetadata;
    investments: FieldMetadata;
    rentalIncome: FieldMetadata;
    other: FieldMetadata;
    otherDescription: FieldMetadata;
    totalWeeklyGrossIncome: FieldMetadata;
  };
  weeklyDeductions: {
    federalTax: FieldMetadata;
    stateTax: FieldMetadata;
    fica: FieldMetadata;
    medicare: FieldMetadata;
    healthInsurance: FieldMetadata;
    otherInsurance: FieldMetadata;
    retirement: FieldMetadata;
    unionDues: FieldMetadata;
    other: FieldMetadata;
    otherDescription: FieldMetadata;
    totalWeeklyDeductions: FieldMetadata;
  };
  weeklyNetIncome: FieldMetadata;
}

// Assets Section
export interface Assets {
  cash: {
    checking: FieldMetadata;
    savings: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  investments: {
    stocks: FieldMetadata;
    bonds: FieldMetadata;
    mutualFunds: FieldMetadata;
    retirementAccounts: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  realEstate: {
    homeValue: FieldMetadata;
    otherRealEstate: FieldMetadata;
    total: FieldMetadata;
  };
  personalProperty: {
    vehicles: FieldMetadata;
    furniture: FieldMetadata;
    jewelry: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  totalAssets: FieldMetadata;
}

// Liabilities Section
export interface Liabilities {
  mortgage: {
    firstMortgage: FieldMetadata;
    secondMortgage: FieldMetadata;
    homeEquityLoan: FieldMetadata;
    total: FieldMetadata;
  };
  creditCards: {
    card1: FieldMetadata;
    card2: FieldMetadata;
    card3: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  loans: {
    carLoan: FieldMetadata;
    studentLoan: FieldMetadata;
    personalLoan: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  taxes: {
    federalTaxes: FieldMetadata;
    stateTaxes: FieldMetadata;
    propertyTaxes: FieldMetadata;
    other: FieldMetadata;
    total: FieldMetadata;
  };
  totalLiabilities: FieldMetadata;
}

// Weekly Expenses Section
export interface WeeklyExpenses {
  housing: {
    mortgageRent: FieldMetadata;
    propertyTaxes: FieldMetadata;
    homeInsurance: FieldMetadata;
    utilities: FieldMetadata;
    maintenance: FieldMetadata;
    total: FieldMetadata;
  };
  food: FieldMetadata;
  clothing: FieldMetadata;
  transportation: {
    carPayment: FieldMetadata;
    carInsurance: FieldMetadata;
    gasoline: FieldMetadata;
    maintenance: FieldMetadata;
    publicTransportation: FieldMetadata;
    total: FieldMetadata;
  };
  medical: {
    insurance: FieldMetadata;
    unreimbursed: FieldMetadata;
    total: FieldMetadata;
  };
  childcare: FieldMetadata;
  other: {
    description: FieldMetadata;
    amount: FieldMetadata;
  };
  totalWeeklyExpenses: FieldMetadata;
}

// Main CJ-D 301 L Form Structure
export interface CJD301LForm {
  personalInformation: PersonalInformation;
  income: IncomeInformation;
  assets: Assets;
  liabilities: Liabilities;
  weeklyExpenses: WeeklyExpenses;
  netWorth: FieldMetadata; // Total Assets - Total Liabilities
  disposableIncome: FieldMetadata; // Weekly Net Income - Weekly Expenses
}

// Aggregation Metadata
export interface AggregationMetadata {
  processedAt: string;
  documentsProcessed: DocumentSource[];
  totalDocuments: number;
  aggregationType: "full" | "incremental" | "multi-section";
  previousAggregationDate?: string;
  conflictsResolved: number;
  confidenceScore: number;
  version: string;
  // Optional fields for multi-section aggregation
  sectionStatus?: {
    set1?: "success" | "failed" | "partial";
    set2?: "success" | "failed" | "partial";
    set3?: "success" | "failed" | "partial";
    set4?: "success" | "failed" | "partial";
    set5?: "success" | "failed" | "partial";
  };
  extractionNotes?: string[];
}

// Complete Export Structure
export interface CJD301LExport {
  form: CJD301LForm;
  metadata: AggregationMetadata;
}

// Document Authority Levels (for conflict resolution)
export enum DocumentAuthority {
  TAX_RETURN = "tax_return", // Highest authority
  BANK_STATEMENT = "bank_statement",
  FINANCIAL_RECORD = "financial_record",
  INVOICE = "invoice",
  OTHER = "other", // Lowest authority
}

export const DOCUMENT_AUTHORITY_HIERARCHY: Record<string, number> = {
  [DocumentAuthority.TAX_RETURN]: 5,
  [DocumentAuthority.BANK_STATEMENT]: 4,
  [DocumentAuthority.FINANCIAL_RECORD]: 3,
  [DocumentAuthority.INVOICE]: 2,
  [DocumentAuthority.OTHER]: 1,
};

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// API Response Types
export interface CJD301LApiResponse {
  success: boolean;
  data?: CJD301LExport;
  error?: string;
  cached: boolean;
  processingTime?: number;
}

export interface CJD301LApiError {
  success: false;
  error: string;
  details?: string;
}
