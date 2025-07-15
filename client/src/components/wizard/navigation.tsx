import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
}

export default function Navigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canProceed,
}: NavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center space-x-2 btn-gradient-outline"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </Button>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">Step</span>
        <span className="text-sm font-medium text-slate-900">{currentStep}</span>
        <span className="text-sm text-slate-600">of {totalSteps}</span>
      </div>
      
      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="flex items-center space-x-2 btn-gradient"
      >
        <span>{currentStep === totalSteps ? "Finish" : "Next"}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
