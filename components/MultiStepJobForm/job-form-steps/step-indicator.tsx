"use client";

import { Button } from "@/components/ui/button";

interface Step {
  number: number;
  title: string;
  active: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex justify-center mb-8 w-full overflow-x-auto">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 flex-nowrap px-2 sm:px-0">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onStepClick(step.number)}
              className={`
                flex items-center justify-center 
                w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 
                rounded-full text-xs sm:text-sm font-medium cursor-pointer
                ${
                  step.active
                    ? "bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }
                ${
                  currentStep === step.number
                    ? "ring-2 ring-[#2B7FD0] ring-offset-2"
                    : ""
                }
              `}
            >
              {step.number}
            </Button>

            {/* Hide text below lg (1024px) */}
            <span
              className={`ml-2 text-xs sm:text-sm font-medium cursor-pointer hidden lg:inline ${
                step.active ? "text-[#2B7FD0]" : "text-gray-500"
              }`}
              onClick={() => onStepClick(step.number)}
            >
              {step.title}
            </span>

            {index < steps.length - 1 && (
              <div
                className={`w-4 sm:w-6 md:w-8 h-0.5 mx-2 sm:mx-3 md:mx-4 ${
                  step.active ? "bg-[#2B7FD0]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
