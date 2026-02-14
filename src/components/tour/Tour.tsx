"use client";

import { useEffect } from "react";
import type { TourStep } from "@/hooks/useLeadFormTour";
import { useLeadFormTour } from "@/hooks/useLeadFormTour";
import { TourHighlight } from "./TourHighlight";
import { TourTooltip } from "./TourTooltip";

interface TourProps {
  steps: TourStep[];
  autoStart?: boolean;
}

export function Tour({ steps, autoStart = false }: TourProps) {
  const tour = useLeadFormTour(steps);

  useEffect(() => {
    if (autoStart && !tour.tourState.completed && !tour.tourState.skipped) {
      // Delay to allow DOM to render
      const timer = setTimeout(() => {
        tour.startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    autoStart,
    tour.tourState.completed,
    tour.tourState.skipped,
    tour.startTour,
  ]);

  if (!tour.isActive || !tour.currentStepData) {
    return null;
  }

  return (
    <>
      <TourHighlight target={tour.currentStepData.target} />
      <TourTooltip
        step={tour.currentStepData}
        currentStep={tour.currentStep}
        totalSteps={tour.totalSteps}
        isFirstStep={tour.isFirstStep}
        isLastStep={tour.isLastStep}
        onNext={tour.nextStep}
        onPrevious={tour.previousStep}
        onSkip={tour.skipTour}
        onComplete={tour.completeTour}
      />
    </>
  );
}
