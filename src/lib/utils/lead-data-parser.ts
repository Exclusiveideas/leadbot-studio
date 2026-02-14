import { captureLeadSchema } from "@/lib/validation/chatbot";
import { extractRequiredLeadFields } from "./lead-extraction";

export type ParsedLeadData = {
  email: string;
  name: string;
  phone?: string;
  caseType?: string;
  urgency?: string;
  budget?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  formData?: object;
};

/**
 * Parse lead submission data from either dynamic form or legacy format
 *
 * @param body - Request body containing either formData or legacy fields
 * @returns Parsed lead data with all fields
 * @throws Error if validation fails
 */
export function parseLeadData(body: unknown): ParsedLeadData {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { formData, ...legacyLeadData } = body as {
    formData?: Record<string, unknown>;
    [key: string]: unknown;
  };

  const isDynamicForm = Boolean(formData);

  if (isDynamicForm) {
    // Dynamic form submission
    const { email, name } = extractRequiredLeadFields(
      formData as Record<string, unknown>,
    );

    return {
      email,
      name,
      phone: undefined,
      caseType: undefined,
      urgency: undefined,
      budget: undefined,
      notes: undefined,
      metadata: formData as Record<string, unknown>,
      formData: formData as object,
    };
  } else {
    // Legacy format validation
    const validation = captureLeadSchema.safeParse(legacyLeadData);

    if (!validation.success) {
      const error = new Error("Invalid lead data");
      (error as any).details = validation.error.issues;
      throw error;
    }

    return {
      email: validation.data.email,
      name: validation.data.name,
      phone: validation.data.phone,
      caseType: validation.data.caseType,
      urgency: validation.data.urgency,
      budget: validation.data.budget,
      notes: validation.data.notes,
      metadata: validation.data.metadata,
      formData: undefined,
    };
  }
}
