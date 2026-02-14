import type { FormField } from "@/lib/validation/chatbot-lead-form";

type ConditionalOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "greaterThan"
  | "lessThan";

/**
 * Evaluates whether a field should be displayed based on its conditional logic
 * @param field - The field to evaluate
 * @param formData - Current form data
 * @param allFields - All fields in the form (to look up referenced fields)
 * @returns true if field should be displayed, false if hidden
 */
export function evaluateFieldVisibility(
  field: FormField,
  formData: Record<string, string | string[] | boolean | undefined>,
  allFields: FormField[],
): boolean {
  // If no conditional display is configured, always show the field
  if (!field.conditionalDisplay) {
    return true;
  }

  const {
    field: dependentFieldId,
    operator,
    value: expectedValue,
  } = field.conditionalDisplay;

  // Find the field that this field depends on
  const dependentField = allFields.find((f) => f.id === dependentFieldId);
  if (!dependentField) {
    // If dependent field doesn't exist, show the field by default
    return true;
  }

  // Get the current value of the dependent field
  const actualValue = formData[dependentFieldId];

  // Evaluate the condition
  return evaluateCondition(actualValue, operator, expectedValue);
}

/**
 * Evaluates a single condition
 * @param actualValue - The actual value from form data
 * @param operator - The comparison operator
 * @param expectedValue - The expected value to compare against
 * @returns true if condition is met, false otherwise
 */
export function evaluateCondition(
  actualValue: string | string[] | boolean | undefined,
  operator: ConditionalOperator,
  expectedValue: string | number | boolean,
): boolean {
  // Handle undefined/null values
  if (actualValue === undefined || actualValue === null) {
    return operator === "notEquals";
  }

  switch (operator) {
    case "equals":
      if (Array.isArray(actualValue)) {
        // For arrays (multiselect), check if it contains the expected value
        return actualValue.includes(String(expectedValue));
      }
      return String(actualValue) === String(expectedValue);

    case "notEquals":
      if (Array.isArray(actualValue)) {
        return !actualValue.includes(String(expectedValue));
      }
      return String(actualValue) !== String(expectedValue);

    case "contains":
      if (Array.isArray(actualValue)) {
        return actualValue.some((v) =>
          String(v).includes(String(expectedValue)),
        );
      }
      return String(actualValue).includes(String(expectedValue));

    case "greaterThan":
      const numActual = Number(actualValue);
      const numExpected = Number(expectedValue);
      return (
        !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected
      );

    case "lessThan":
      const numActualLt = Number(actualValue);
      const numExpectedLt = Number(expectedValue);
      return (
        !isNaN(numActualLt) &&
        !isNaN(numExpectedLt) &&
        numActualLt < numExpectedLt
      );

    default:
      return true;
  }
}
