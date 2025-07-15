interface Step {
  id: number;
  title: string;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
}

export default function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep
                      ? "bg-primary text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`text-sm ${
                    step.id <= currentStep
                      ? "font-medium text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  {step.title}
                </span>
                
                {/* Progress Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 ${
                      step.id < currentStep ? "bg-primary" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-slate-600">
            <span className="font-medium">Step {currentStep} of {totalSteps}</span> - {steps[currentStep - 1]?.title}
          </div>
        </div>
      </div>
    </div>
  );
}
