"use client";

interface Step {
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  accentColor?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  accentColor = "#10B981",
}: StepIndicatorProps) {
  if (steps.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white"
                      : isCompleted
                        ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 text-gray-400"
                  }`}
                  style={
                    isActive ? { backgroundColor: accentColor } : undefined
                  }
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                {/* Step Label - Only show on active step for space */}
                {isActive && (
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-900">
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isCompleted ? "bg-gray-300" : "bg-gray-200"
                  }`}
                  style={
                    isCompleted ? { backgroundColor: accentColor } : undefined
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Counter */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
}
