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
  const [canProceed, setCanProceed] = useState(false);

  const handleNext = () => {
    console.log("Next button clicked, current step:", currentStep);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setCanProceed(true); // Always allow proceeding
    }
  };

  const advanceStep = () => {
    console.log("Advancing step from", currentStep, "to", currentStep + 1);
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setCanProceed(false); // Reset for next step
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setCanProceed(true); // Allow going back
    }
  };

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
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
                <span className="font-mono text-purple-600">ADC-2024-001</span>
              </div>
              <button className="text-purple-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50">
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
            onNext={currentStep === 1 ? advanceStep : handleNext}
            setCanProceed={setCanProceed}
          />
        )}

        {/* Navigation */}
        <Navigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          canProceed={canProceed}
        />
      </main>
    </div>
  );
}
