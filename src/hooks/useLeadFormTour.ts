import { useState, useCallback, useEffect } from "react";

export interface TourStep {
  id: string;
  target: string; // CSS selector or data-tour attribute
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: "click" | "hover" | "none";
}

const STORAGE_KEY = "leadFormTourState";

interface TourState {
  completed: boolean;
  skipped: boolean;
  currentStep: number;
}

export function useLeadFormTour(steps: TourStep[]) {
  // Validate steps array
  if (!Array.isArray(steps)) {
    console.error("useLeadFormTour: steps must be an array");
    steps = [];
  }

  // Validate each step has required fields
  steps.forEach((step, index) => {
    if (!step || typeof step !== "object") {
      console.error(`useLeadFormTour: step at index ${index} is invalid`);
    } else if (!step.id || !step.target || !step.title || !step.description) {
      console.error(
        `useLeadFormTour: step at index ${index} is missing required fields`,
        step,
      );
    }
  });

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourState, setTourState] = useState<TourState>(() => {
    if (typeof window === "undefined") {
      return { completed: false, skipped: false, currentStep: 0 };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load tour state:", error);
    }

    return { completed: false, skipped: false, currentStep: 0 };
  });

  const elementExists = useCallback((target: string): boolean => {
    if (typeof window === "undefined") return false;
    const element = document.querySelector(`[data-tour="${target}"]`);
    return element !== null;
  }, []);

  const findNextAvailableStep = useCallback(
    (fromIndex: number, direction: "forward" | "backward"): number => {
      const increment = direction === "forward" ? 1 : -1;
      let nextIndex = fromIndex + increment;

      while (nextIndex >= 0 && nextIndex < steps.length) {
        if (elementExists(steps[nextIndex].target)) {
          return nextIndex;
        }
        nextIndex += increment;
      }

      return -1; // No available step found
    },
    [steps, elementExists],
  );

  const saveTourState = useCallback((state: TourState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setTourState(state);
    } catch (error) {
      console.error("Failed to save tour state:", error);
    }
  }, []);

  const startTour = useCallback(() => {
    // Find first available step
    const firstAvailableStep = findNextAvailableStep(-1, "forward");

    if (firstAvailableStep === -1) {
      // No available steps, don't start tour
      console.warn("Tour cannot start: no available elements found");
      return;
    }

    setIsActive(true);
    setCurrentStep(firstAvailableStep);
    saveTourState({
      completed: false,
      skipped: false,
      currentStep: firstAvailableStep,
    });
  }, [saveTourState, findNextAvailableStep]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(steps.length);
    saveTourState({
      completed: true,
      skipped: false,
      currentStep: steps.length,
    });
  }, [steps.length, saveTourState]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setTourState((prev) => {
      const newState = { ...prev, skipped: true, currentStep: 0 };
      saveTourState(newState);
      return newState;
    });
  }, [saveTourState]);

  const nextStep = useCallback(() => {
    if (!isActive) return;

    setCurrentStep((prevStep) => {
      const nextStepIndex = findNextAvailableStep(prevStep, "forward");

      if (nextStepIndex === -1) {
        // No more available steps, complete tour
        completeTour();
        return prevStep;
      } else {
        setTourState((prev) => {
          const newState = { ...prev, currentStep: nextStepIndex };
          saveTourState(newState);
          return newState;
        });
        return nextStepIndex;
      }
    });
  }, [isActive, findNextAvailableStep, saveTourState, completeTour]);

  const previousStep = useCallback(() => {
    if (!isActive) return;

    setCurrentStep((prevStep) => {
      const prevStepIndex = findNextAvailableStep(prevStep, "backward");

      if (prevStepIndex !== -1) {
        setTourState((prev) => {
          const newState = { ...prev, currentStep: prevStepIndex };
          saveTourState(newState);
          return newState;
        });
        return prevStepIndex;
      }
      return prevStep;
    });
  }, [isActive, findNextAvailableStep, saveTourState]);

  const resetTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear tour state:", error);
    }
    setTourState({ completed: false, skipped: false, currentStep: 0 });
  }, []);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setTourState((prev) => {
          const newState = { ...prev, currentStep: stepIndex };
          saveTourState(newState);
          return newState;
        });
      }
    },
    [steps.length, saveTourState],
  );

  const currentStepData = steps[currentStep];
  // Check if there are any available steps before/after current step
  const isFirstStep =
    currentStep === 0 || findNextAvailableStep(currentStep, "backward") === -1;
  const isLastStep =
    currentStep === steps.length - 1 ||
    findNextAvailableStep(currentStep, "forward") === -1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return {
    // State
    isActive,
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    tourState,

    // Computed
    isFirstStep,
    isLastStep,
    progress,

    // Actions
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
    goToStep,
  };
}
