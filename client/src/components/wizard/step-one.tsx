import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Rocket } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const applicationSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  ciId: z.string().min(1, "CI ID is required"),
  settings: z.object({
    enableMonitoring: z.boolean(),
    generateLogs: z.boolean(),
    emailNotifications: z.boolean(),
  }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface StepOneProps {
  applicationId: number | null;
  setApplicationId: (id: number) => void;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

export default function StepOne({ applicationId, setApplicationId, onNext, setCanProceed }: StepOneProps) {
  const { toast } = useToast();
  
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      ciId: "",
      settings: {
        enableMonitoring: true,
        generateLogs: false,
        emailNotifications: true,
      },
    },
  });

  // Always allow proceeding to next step (validation removed)
  useEffect(() => {
    setCanProceed(true);
  }, [setCanProceed]);

  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      try {
        console.log("Making API request with data:", data);
        const response = await apiRequest("POST", "/api/applications", data);
        console.log("Response received:", response.status, response.ok);
        const result = await response.json();
        console.log("Response JSON:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation success, application created:", data);
      setApplicationId(data.id);
      toast({
        title: "Application created successfully",
        description: "Your audit application has been configured.",
      });
      console.log("Calling onNext() to advance to step 2");
      onNext();
    },
    onError: (error) => {
      console.log("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    console.log("Form submission triggered with data:", data);
    createApplicationMutation.mutate(data);
  };

  // Handle Next button click from navigation
  useEffect(() => {
    const handleNextClick = () => {
      // Prevent multiple submissions
      if (createApplicationMutation.isPending) {
        console.log("Mutation already pending, skipping");
        return;
      }
      
      // Always trigger form submission, let validation handle invalid forms
      form.handleSubmit(onSubmit)();
    };
    
    // Store the handler for the parent component to call
    (window as any).stepOneSubmit = handleNextClick;
    
    return () => {
      delete (window as any).stepOneSubmit;
    };
  }, [form, onSubmit, createApplicationMutation.isPending]);

  return (
    <div className="space-y-8">
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Rocket className="h-5 w-5 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Application Onboarding
            </span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Configure your audit application settings and parameters
          </p>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Application Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter application name (e.g., Customer Portal Audit)"
                        className="input-modern"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used to identify your audit session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Audit Start Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="input-modern" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Audit End Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="input-modern" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ciId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Configuration Item (CI) ID <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter CI ID (e.g., CI-12345)"
                        className="input-modern"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Configuration Management Database identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  Additional Settings
                </h3>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="settings.enableMonitoring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Enable real-time monitoring
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.generateLogs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Generate detailed logs
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Email notifications on completion
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="hidden"
                disabled={createApplicationMutation.isPending}
              >
                Submit
              </button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
