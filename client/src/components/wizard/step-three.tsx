import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface StepThreeProps {
  applicationId: number | null;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

export default function StepThree({ applicationId, onNext, setCanProceed }: StepThreeProps) {
  // Set can proceed to true by default since step is blank
  setCanProceed(true);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Tool Connectors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto mb-6 text-slate-400" />
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Configure Tool Connectors
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Use the Settings page to configure your tool connectors based on your application's CI. 
              All configurations are linked to your CI from Step 1.
            </p>
            <Link href="/settings">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Settings className="h-5 w-5 mr-2" />
                Go to Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}