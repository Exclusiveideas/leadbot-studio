"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { FormField } from "@/lib/validation/chatbot-lead-form";
import { evaluateFieldVisibility } from "@/lib/utils/evaluateCondition";
import { MultiStepFormWrapper } from "./lead-forms/MultiStepFormWrapper";

export interface DynamicLeadFormData {
  [key: string]: string | string[] | boolean | undefined;
}

interface DynamicLeadCaptureFormProps {
  fields: FormField[];
  appearance?: {
    primaryColor: string;
    accentColor: string;
    buttonText: string;
  };
  behavior?: {
    showSuccessMessage?: boolean;
    successMessage?: string;
    redirectUrl?: string;
    multiStep?: {
      enabled: boolean;
      steps: Array<{
        title: string;
        description?: string;
      }>;
    };
  };
  successMessage?: string;
  chatbotName: string;
  onSubmit: (data: DynamicLeadFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<DynamicLeadFormData>;
  previewMode?: boolean;
}

export function DynamicLeadCaptureForm({
  fields,
  appearance,
  behavior,
  successMessage,
  chatbotName,
  onSubmit,
  onCancel,
  initialData = {},
  previewMode = false,
}: DynamicLeadCaptureFormProps) {
  const [formData, setFormData] = useState<DynamicLeadFormData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const isMultiStep =
    behavior?.multiStep?.enabled && behavior.multiStep.steps.length > 0;

  // Filter fields based on step and conditional logic
  const visibleFields = useMemo(() => {
    let fieldsToShow = sortedFields;

    // Filter by step if multi-step is enabled
    if (isMultiStep) {
      fieldsToShow = fieldsToShow.filter((f) => (f.step || 1) === currentStep);
    }

    // Apply conditional logic
    return fieldsToShow.filter((field) =>
      evaluateFieldVisibility(field, formData, sortedFields),
    );
  }, [sortedFields, formData, isMultiStep, currentStep]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only validate visible fields
    visibleFields.forEach((field) => {
      const value = formData[field.id];

      if (field.required && !value) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      if (value && typeof value === "string") {
        // Email validation
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.id] = "Please enter a valid email address";
          }
        }

        // Min/max length validation
        if (field.validation?.min && value.length < field.validation.min) {
          newErrors[field.id] =
            field.validation.customError ||
            `Must be at least ${field.validation.min} characters`;
        }
        if (field.validation?.max && value.length > field.validation.max) {
          newErrors[field.id] =
            field.validation.customError ||
            `Must be at most ${field.validation.max} characters`;
        }

        // Pattern validation
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            newErrors[field.id] =
              field.validation.customError || "Invalid format";
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to submit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    fieldId: string,
    value: string | string[] | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];
    const hasError = !!errors[field.id];

    const inputClasses = `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
      hasError
        ? "border-red-500 focus:ring-red-500"
        : "border-gray-200 focus:ring-brand-blue"
    }`;

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <input
            type={field.type}
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputClasses}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isSubmitting}
          />
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputClasses}
            placeholder={field.placeholder}
            required={field.required}
            disabled={isSubmitting}
            rows={4}
          />
        );

      case "select":
        return (
          <select
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputClasses}
            required={field.required}
            disabled={isSubmitting}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-brand-blue border-gray-300 focus:ring-brand-blue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id={field.id}
              checked={(value as boolean) || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              required={field.required}
              disabled={isSubmitting}
              className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );

      case "date":
        return (
          <input
            type="date"
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={inputClasses}
            required={field.required}
            disabled={isSubmitting}
          />
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    handleChange(field.id, newValues);
                  }}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Render form fields
  const formFields = (
    <>
      {visibleFields.map((field) => {
        // Skip checkbox fields that include label inline
        if (field.type === "checkbox") {
          return (
            <div key={field.id}>
              {renderField(field)}
              {errors[field.id] && (
                <p className="text-xs text-red-600 mt-1" role="alert">
                  {errors[field.id]}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {errors[field.id] && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {errors[field.id]}
              </p>
            )}
          </div>
        );
      })}

      {errors.submit && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3"
          role="alert"
        >
          <p className="text-xs text-red-800">{errors.submit}</p>
        </div>
      )}

      {previewMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">
          <p className="text-xs text-yellow-800">
            Preview mode: Form submission is disabled
          </p>
        </div>
      )}
    </>
  );

  return (
    <div
      className="border rounded-lg p-4 my-4"
      style={{
        backgroundColor: `${appearance?.accentColor || "#10B981"}10`,
        borderColor: appearance?.accentColor || "#10B981",
      }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Connect with an Attorney
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {chatbotName} can help connect you with an attorney. Please provide
          your information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isMultiStep && behavior.multiStep ? (
          <MultiStepFormWrapper
            steps={behavior.multiStep.steps}
            fields={sortedFields}
            currentStepFields={visibleFields}
            onValidateStep={validateForm}
            onStepChange={setCurrentStep}
            appearance={appearance}
            isSubmitting={isSubmitting || previewMode}
          >
            {formFields}
          </MultiStepFormWrapper>
        ) : (
          <>
            {formFields}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || previewMode}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: appearance?.primaryColor || "#10B981",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  appearance?.buttonText || "Submit"
                )}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
