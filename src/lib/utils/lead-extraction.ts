/**
 * Accepted email field names (case-insensitive, with normalization)
 * Normalization removes spaces, hyphens, and underscores
 */
const EMAIL_FIELD_NAMES = [
  "email",
  "emailaddress",
  "contactemail",
  "useremail",
  "clientemail",
  "youremail",
];

/**
 * Normalize field name by removing spaces, hyphens, underscores and converting to lowercase
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName.toLowerCase().replace(/[\s_-]/g, "");
}

/**
 * Extract email field from form data
 * Searches for fields matching known email field patterns
 *
 * @param formData - The form data object to search
 * @returns Email string if found
 * @throws Error if email field not found or invalid
 */
export function extractEmailFromFormData(
  formData: Record<string, unknown>,
): string {
  const emailField = Object.entries(formData).find(([key, value]) => {
    const normalizedKey = normalizeFieldName(key);
    return (
      EMAIL_FIELD_NAMES.includes(normalizedKey) && typeof value === "string"
    );
  });

  if (!emailField) {
    throw new Error("Email field not found in form data");
  }

  return emailField[1] as string;
}

/**
 * Accepted name field names (case-insensitive, with normalization)
 * Normalization removes spaces, hyphens, and underscores
 */
const NAME_FIELD_NAMES = [
  "name",
  "fullname",
  "yourname",
  "username",
  "clientname",
  "contactname",
  "firstname", // Accept first name as fallback
  "lastname", // Accept last name as fallback
];

/**
 * Extract name field from form data
 * Searches for fields matching known name field patterns
 *
 * @param formData - The form data object to search
 * @returns Name string if found
 * @throws Error if name field not found or invalid
 */
export function extractNameFromFormData(
  formData: Record<string, unknown>,
): string {
  const nameField = Object.entries(formData).find(([key, value]) => {
    const normalizedKey = normalizeFieldName(key);
    return (
      NAME_FIELD_NAMES.includes(normalizedKey) && typeof value === "string"
    );
  });

  if (!nameField) {
    throw new Error("Name field not found in form data");
  }

  return nameField[1] as string;
}

/**
 * Extract required fields (email and name) from form data
 * Convenience function that extracts both fields at once
 *
 * @param formData - The form data object to search
 * @returns Object containing email and name
 * @throws Error if either field not found or invalid
 */
export function extractRequiredLeadFields(formData: Record<string, unknown>): {
  email: string;
  name: string;
} {
  return {
    email: extractEmailFromFormData(formData),
    name: extractNameFromFormData(formData),
  };
}
