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

  // Watch form values to enable/disable next button
  const watchedValues = form.watch();
  useEffect(() => {
    const { name, startDate, endDate, ciId } = watchedValues;
    const isValid = Boolean(name && startDate && endDate && ciId) && !form.formState.isSubmitting;
    setCanProceed(isValid);
  }, [watchedValues, form.formState.isSubmitting, setCanProceed]);

  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: (data) => {
      setApplicationId(data.id);
      toast({
        title: "Application created successfully",
        description: "Your audit application has been configured.",
      });
      onNext();
    },
    onError: (error) => {
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
      // Always trigger form submission, let validation handle invalid forms
      form.handleSubmit(onSubmit)();
    };
    
    // Store the handler for the parent component to call
    (window as any).stepOneSubmit = handleNextClick;
    
    return () => {
      delete (window as any).stepOneSubmit;
    };
  }, [form, onSubmit]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Rocket className="h-5 w-5 text-primary" />
            <span>Application Onboarding</span>
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
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

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-900 mb-3">
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
