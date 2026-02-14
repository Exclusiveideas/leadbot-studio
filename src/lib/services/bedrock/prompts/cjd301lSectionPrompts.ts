/**
 * CJD-301-L Section-Specific Claude Prompts
 * Massachusetts Probate and Family Court Financial Statement - Section Processing
 *
 * These prompts are optimized for section-by-section processing with intelligent
 * conflict resolution and complete JSON response generation.
 */

import type {
  CJD301LSection,
  ProcessedCJD301LField,
} from "@/types/cjd301lSections";
import { SECTION_NAMES } from "@/types/cjd301lSections";

export interface SectionPromptContext {
  section: CJD301LSection;
  sectionName: string;
  fieldsData: Record<
    string,
    {
      fieldName: string;
      values: Array<{
        value: string;
        contexts: string[];
        sourceInfo: string;
      }>;
      conflictCount: number;
    }
  >;
  totalConflicts: number;
  totalFields: number;
}

/**
 * Create section-specific prompt for intelligent field aggregation
 */
export function createSectionAggregationPrompt(
  context: SectionPromptContext,
): string {
  const { section, sectionName, fieldsData, totalConflicts } = context;

  const sectionSpecificRules = getSectionSpecificRules(section);
  const fieldsJson = JSON.stringify(fieldsData, null, 2);

  return `You are a Massachusetts family law expert processing CJD-301-L Financial Statement data. Process ONLY the ${sectionName} section with intelligent conflict resolution.

**SECTION TO PROCESS: ${sectionName} (${section})**
**FIELDS DATA:**
${fieldsJson}

**SECTION-SPECIFIC PROCESSING RULES:**
${sectionSpecificRules}

**CONFLICT RESOLUTION PRIORITIES:**
1. **Data Quality**: Prefer values with richer context and detail
2. **Recency**: More recent extractions take precedence for volatile data
3. **Completeness**: Values with more comprehensive information preferred
4. **Source Reliability**: Consider context quality when resolving conflicts
5. **Mathematical Consistency**: Ensure calculations align with components

**REQUIRED OUTPUT FORMAT:**
Return a JSON object with this exact structure (no markdown formatting):

{
  "processedFields": {
    "field_name": {
      "value": "resolved_value",
      "contexts": ["merged context array"]
    },
    "another_field": {
      "value": "another_resolved_value",
      "contexts": ["context info for this field"]
    }
  },
  "sectionSummary": {
    "totalFieldsProcessed": number,
    "processingNotes": ["array of important notes"]
  }
}

**CRITICAL FIELD FORMAT REQUIREMENTS:**
- Each field MUST be an object with "value" and "contexts" properties
- Never return fields as simple strings like "field_name": "simple_value"
- Always use: "field_name": { "value": "resolved_value", "contexts": ["context"] }
- The "contexts" array should contain relevant context from source documents

**CRITICAL REQUIREMENTS:**
- Process ALL fields in the input data
- Apply section-specific resolution rules consistently
- Merge all relevant contexts from conflicting values
- Ensure mathematical accuracy for calculated fields
- Return complete, valid JSON without truncation

Begin processing now and return the complete JSON response:`;
}

/**
 * Get section-specific processing rules
 */
function getSectionSpecificRules(section: CJD301LSection): string {
  switch (section) {
    case "section_I": // Personal Information
      return `**PERSONAL INFORMATION RULES:**
- Name fields: Prefer most complete version (full legal name over abbreviated)
- Address: Use most recent address if different locations provided
- Phone: Most recent phone number takes precedence
- SSN/DOB: Use highest confidence match, flag major discrepancies
- Employment: Most recent employer information preferred
- Validation: Ensure consistency between related fields`;

    case "section_II": // Gross Weekly Income
      return `**INCOME PROCESSING RULES:**
- Base Pay (line_a): Use most recent if single employer, flag if multiple employers
- Overtime (line_b): SUM if from different time periods, average if overlapping periods
- Part-time/Consulting (line_c): SUM if different sources/employers
- Self-employment (line_d): SUM all self-employment income streams
- Tips (line_e): SUM if from different sources or time periods
- Commissions/Bonuses (line_f): Use most recent if recurring, SUM if one-time payments
- Investment Income (line_g): SUM all dividend and interest income
- Rental Income (line_n): SUM if multiple properties, most recent if same property
- Other Income: SUM miscellaneous income sources
- CALCULATE totals: Always recalculate line_r_total_gross_weekly from components`;

    case "section_III": // Weekly Deductions
      return `**DEDUCTION PROCESSING RULES:**
- Tax Withholdings: Use most recent calculations (federal, state, FICA, Medicare)
- Insurance Premiums: Most recent amounts for ongoing coverage
- Retirement Contributions: Use current contribution rates
- Other Deductions: SUM if multiple sources, most recent if single source
- Allowances: Use most recent tax form information
- CALCULATE totals: Always recalculate total deductions from components
- Validate: Ensure tax calculations are reasonable for income level`;

    case "section_IV": // Net Weekly Income
      return `**NET INCOME PROCESSING RULES:**
- Gross Income: Should match total from Section II
- Total Deductions: Should match total from Section III
- Net Income: CALCULATE as Gross minus Deductions
- Cross-validate: Ensure mathematical consistency across sections
- Flag: Any major discrepancies for manual review`;

    case "section_V": // Prior Year Income
      return `**PRIOR YEAR INCOME RULES:**
- Tax Return Data: Use highest confidence source (W-2, 1099, tax return)
- Years of SS Contributions: Use most recent information
- Document Attachments: Note if tax documents are referenced
- Validation: Ensure prior year data is reasonable compared to current income`;

    case "section_VI": // Weekly Expenses
      return `**EXPENSE PROCESSING RULES:**
- Housing: Most recent mortgage/rent payments
- Utilities: Use most recent monthly amounts, convert to weekly
- Food/Clothing: Use most recent reasonable estimates
- Transportation: Most recent car payments, insurance, fuel costs
- Medical: Sum ongoing medical expenses
- Childcare: Use most recent arrangements
- CALCULATE totals: Sum all expense categories for total weekly expenses`;

    case "section_VII": // Counsel Fees
      return `**LEGAL FEES RULES:**
- Retainer Paid: SUM all retainer payments made
- Fees Incurred: SUM total legal fees accrued
- Outstanding Balance: Use most recent balance owed
- Payment Arrangements: Most recent payment plan details`;

    case "section_VIII": // Assets
      return `**ASSET PROCESSING RULES:**
- Real Estate: Most recent market values or appraisals
- Vehicles: Most recent estimated values
- Bank Accounts: Most recent balances (as of statement date)
- Investments: Most recent portfolio values
- Retirement Accounts: Most recent statement balances
- Business Interests: Most recent valuations
- CALCULATE totals: Sum all asset categories for total assets`;

    case "section_IX": // Liabilities
      return `**LIABILITY PROCESSING RULES:**
- Debt Balances: Most recent outstanding balances
- Monthly Payments: Current payment amounts
- Creditor Information: Most complete creditor details
- Date Incurred: Earliest date if multiple sources
- CALCULATE totals: Sum all current balances for total liabilities
- Validate: Ensure payment amounts are consistent with balances`;

    default:
      return `**GENERAL PROCESSING RULES:**
- Apply data quality and recency preferences
- Resolve conflicts using best available information
- Maintain mathematical consistency
- Provide detailed reasoning for all resolutions`;
  }
}

/**
 * Create validation prompt for processed section
 */
export function createSectionValidationPrompt(
  section: CJD301LSection,
  processedFields: Record<string, ProcessedCJD301LField>,
): string {
  const sectionName = SECTION_NAMES[section];
  const fieldsJson = JSON.stringify(processedFields, null, 2);

  return `You are a financial data validation expert for Massachusetts Probate Court forms. Validate the processed ${sectionName} section data for accuracy and consistency.

**SECTION TO VALIDATE: ${sectionName}**
**PROCESSED FIELDS:**
${fieldsJson}

**VALIDATION CRITERIA:**
1. **Mathematical Accuracy**: Verify all calculations and totals
2. **Internal Consistency**: Check for logical relationships between fields
3. **Range Validation**: Ensure values are within reasonable ranges
4. **Format Compliance**: Verify proper formatting and data types
5. **Completeness**: Check for missing required fields
6. **Cross-field Validation**: Ensure related fields are consistent

**SECTION-SPECIFIC VALIDATIONS:**
${getSectionValidationRules(section)}

**REQUIRED OUTPUT FORMAT:**
Return a JSON object with this structure:

{
  "isValid": boolean,
  "overallScore": number (0-1),
  "fieldValidations": {
    "field_name": {
      "isValid": boolean,
      "score": number (0-1),
      "errors": [{"message": "error description", "severity": "error|warning"}],
      "warnings": [{"message": "warning description"}]
    }
  },
  "sectionValidation": {
    "mathematicalAccuracy": number (0-1),
    "internalConsistency": number (0-1),
    "completeness": number (0-1),
    "dataQuality": number (0-1)
  },
  "recommendations": ["array of improvement suggestions"],
  "criticalIssues": ["array of issues requiring immediate attention"]
}

Begin validation and return the complete JSON response:`;
}

/**
 * Get section-specific validation rules
 */
function getSectionValidationRules(section: CJD301LSection): string {
  switch (section) {
    case "section_I":
      return `- Verify name consistency across all fields
- Validate address format and completeness
- Check phone number format (XXX-XXX-XXXX)
- Ensure SSN format (XXX-XX-XXXX) if present
- Validate date of birth format
- Check employer information consistency`;

    case "section_II":
      return `- Validate income amounts are positive numbers
- Check that total gross weekly equals sum of components
- Ensure income values are reasonable for reported occupation
- Validate percentage-based income calculations
- Check for missing income sources that should be included`;

    case "section_III":
      return `- Validate deduction amounts are positive
- Check tax calculations against income levels
- Ensure total deductions equals sum of components
- Validate tax allowances are reasonable numbers
- Check deduction percentages are within normal ranges`;

    case "section_IV":
      return `- Validate net income = gross income - total deductions
- Check that all values reference correct section totals
- Ensure mathematical consistency with sections II and III`;

    case "section_V":
      return `- Validate prior year income is reasonable
- Check years of Social Security contributions (should be ≤ working years)
- Ensure prior year data consistency`;

    case "section_VI":
      return `- Validate expense amounts are reasonable
- Check total weekly expenses equals sum of components
- Ensure expense categories don't overlap
- Validate monthly expenses converted to weekly correctly`;

    case "section_VII":
      return `- Validate legal fee calculations
- Check that outstanding balance ≤ total fees incurred
- Ensure payment arrangements are consistent with balances`;

    case "section_VIII":
      return `- Validate asset values are positive
- Check total assets equals sum of components
- Ensure asset values are reasonable and current
- Validate that asset types don't overlap`;

    case "section_IX":
      return `- Validate liability amounts are positive
- Check total liabilities equals sum of balances
- Ensure payment amounts are consistent with balances
- Validate debt information completeness`;

    default:
      return "- Apply standard field validation rules\n- Check for mathematical consistency\n- Validate data completeness";
  }
}

/**
 * Create incremental update prompt for section
 */
export function createSectionIncrementalPrompt(
  section: CJD301LSection,
  existingFields: Record<string, ProcessedCJD301LField>,
  newFieldsData: SectionPromptContext["fieldsData"],
): string {
  const sectionName = SECTION_NAMES[section];
  const existingJson = JSON.stringify(existingFields, null, 2);
  const newFieldsJson = JSON.stringify(newFieldsData, null, 2);

  return `You are processing an INCREMENTAL UPDATE to ${sectionName} section of a CJD-301-L form. Update existing processed fields with new document data.

**SECTION: ${sectionName}**

**EXISTING PROCESSED FIELDS:**
${existingJson}

**NEW FIELD DATA TO INTEGRATE:**
${newFieldsJson}

**INCREMENTAL UPDATE RULES:**
- Only update fields where new data provides better quality or more recent information
- Preserve existing field values unless new data is clearly superior
- Merge contexts from new documents with existing contexts
- Update confidence scores based on additional data quality
- Add new conflict resolutions only if new conflicts arise
- Maintain historical processing decisions unless overridden by better data

**SECTION-SPECIFIC UPDATE RULES:**
${getSectionSpecificRules(section)}

**REQUIRED OUTPUT FORMAT:**
Return updated fields JSON with same structure as existing, but with:
- Enhanced contexts including new document information
- Updated confidence scores reflecting additional data
- New conflict resolutions if conflicts arise
- Preserved timestamps for unchanged fields
- Updated timestamps only for modified fields

{
  "updatedFields": {
    // Same structure as existing but with incremental updates
  },
  "updateSummary": {
    "fieldsUpdated": number,
    "fieldsAdded": number,
    "conflictsAdded": number,
    "averageConfidenceChange": number,
    "updateNotes": ["array of significant changes made"]
  }
}

Begin incremental processing and return complete JSON:`;
}

// Export the prompt creation functions
export const CJD301L_SECTION_PROMPTS = {
  sectionAggregation: createSectionAggregationPrompt,
  sectionValidation: createSectionValidationPrompt,
  sectionIncremental: createSectionIncrementalPrompt,
} as const;
