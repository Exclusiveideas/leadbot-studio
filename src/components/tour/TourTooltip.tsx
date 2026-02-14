"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import type { TourStep } from "@/hooks/useLeadFormTour";

const TOOLTIP_SPACING_PX = 16;

interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function TourTooltip({
  step,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: TourTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipPosition, setTooltipPosition] = useState<
    "top" | "bottom" | "left" | "right"
  >(step.position || "bottom");
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      if (!target || !tooltipRef.current) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;
      let finalPosition = step.position || "bottom";

      // Calculate position based on preference
      switch (step.position || "bottom") {
        case "top":
          top = targetRect.top - tooltipRect.height - TOOLTIP_SPACING_PX;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          // Check if tooltip fits above
          if (top < 0) {
            finalPosition = "bottom";
            top = targetRect.bottom + TOOLTIP_SPACING_PX;
          }
          break;

        case "bottom":
          top = targetRect.bottom + TOOLTIP_SPACING_PX;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          // Check if tooltip fits below
          if (top + tooltipRect.height > window.innerHeight) {
            finalPosition = "top";
            top = targetRect.top - tooltipRect.height - TOOLTIP_SPACING_PX;
          }
          break;

        case "left":
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - TOOLTIP_SPACING_PX;
          // Check if tooltip fits left
          if (left < 0) {
            finalPosition = "right";
            left = targetRect.right + TOOLTIP_SPACING_PX;
          }
          break;

        case "right":
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + TOOLTIP_SPACING_PX;
          // Check if tooltip fits right
          if (left + tooltipRect.width > window.innerWidth) {
            finalPosition = "left";
            left = targetRect.left - tooltipRect.width - TOOLTIP_SPACING_PX;
          }
          break;
      }

      // Ensure tooltip stays within viewport bounds
      top = Math.max(
        TOOLTIP_SPACING_PX,
        Math.min(
          top,
          window.innerHeight - tooltipRect.height - TOOLTIP_SPACING_PX,
        ),
      );
      left = Math.max(
        TOOLTIP_SPACING_PX,
        Math.min(
          left,
          window.innerWidth - tooltipRect.width - TOOLTIP_SPACING_PX,
        ),
      );

      setPosition({ top, left });
      setTooltipPosition(finalPosition);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [step.target, step.position]);

  const handleAction = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div
      ref={tooltipRef}
      data-testid="tour-tooltip"
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
        </div>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {totalSteps}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-blue-600"
                    : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrevious}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleAction}
            className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {isLastStep ? (
              "Done"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
