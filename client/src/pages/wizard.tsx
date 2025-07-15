import { useState } from "react";
import { Shield, Settings } from "lucide-react";
import ProgressBar from "@/components/wizard/progress-bar";
import Navigation from "@/components/wizard/navigation";
import StepOne from "@/components/wizard/step-one";
import StepTwo from "@/components/wizard/step-two";
import StepThree from "@/components/wizard/step-three";
import StepFour from "@/components/wizard/step-four";
import StepFive from "@/components/wizard/step-five";

const steps = [
  { id: 1, title: "Application Setup", component: StepOne },
  { id: 2, title: "Data Request", component: StepTwo },
  { id: 3, title: "Tool Connectors", component: StepThree },
  { id: 4, title: "Data Collection", component: StepFour },
  { id: 5, title: "Results", component: StepFive },
];

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<number | null>(null);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Audit Data Collection Wizard
                </h1>
                <p className="text-sm text-slate-600">
                  Automated compliance data gathering system
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">Session:</span>{" "}
                <span>ADC-2024-001</span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {CurrentStepComponent && (
          <CurrentStepComponent
            applicationId={applicationId}
            setApplicationId={setApplicationId}
            onNext={handleNext}
          />
        )}

        {/* Navigation */}
        <Navigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceed={applicationId !== null || currentStep > 1}
        />
      </main>
    </div>
  );
}
