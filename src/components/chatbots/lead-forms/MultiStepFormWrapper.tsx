"use client";

import { useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import type { FormField } from "@/lib/validation/chatbot-lead-form";

interface Step {
  title: string;
  description?: string;
}

interface MultiStepFormWrapperProps {
  steps: Step[];
  fields: FormField[];
  currentStepFields: FormField[];
  onValidateStep: () => boolean;
  onStepChange?: (step: number) => void;
  appearance?: {
    primaryColor: string;
    accentColor: string;
    buttonText: string;
  };
  isSubmitting: boolean;
  children: ReactNode;
}

export function MultiStepFormWrapper({
  steps,
  fields,
  currentStepFields,
  onValidateStep,
  onStepChange,
  appearance,
  isSubmitting,
  children,
}: MultiStepFormWrapperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleNext = () => {
    // Validate current step before proceeding
    if (!onValidateStep()) {
      return;
    }

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  // Get fields for current step
  const stepFields = fields.filter((f) => (f.step || 1) === currentStep);
  const hasFieldsInStep = stepFields.length > 0;

  return (
    <div>
      {/* Step Indicator */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        accentColor={appearance?.accentColor}
      />

      {/* Form Content */}
      <div className="mb-6">
        {hasFieldsInStep ? (
          children
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No fields configured for this step.</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 pt-2">
        {!isFirstStep && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {!isLastStep ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: appearance?.primaryColor || "#10B981",
            }}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: appearance?.primaryColor || "#10B981",
            }}
          >
            {appearance?.buttonText || "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
