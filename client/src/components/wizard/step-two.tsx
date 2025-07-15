import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, Upload, X, CheckCircle, List, Tags, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StepTwoProps {
  applicationId: number | null;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

export default function StepTwo({ applicationId, onNext, setCanProceed }: StepTwoProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: dataRequest, isLoading } = useQuery({
    queryKey: ["/api/data-requests/application", applicationId],
    enabled: !!applicationId,
  });

  // Enable next button if data request exists or file is selected
  useEffect(() => {
    setCanProceed(!!dataRequest || !!selectedFile);
  }, [dataRequest, selectedFile, setCanProceed]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicationId!.toString());
      
      const response = await fetch("/api/data-requests", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File uploaded successfully",
        description: "Your data request file has been processed.",
      });
      onNext();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  if (dataRequest) {
    return (
      <div className="space-y-8">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Data Request File Upload
              </span>
            </CardTitle>
            <p className="text-sm text-slate-600">
              Upload the Excel file containing audit questions and requirements
            </p>
          </CardHeader>
          
          <CardContent>
            {/* File Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileSpreadsheet className="h-8 w-8 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">
                    {dataRequest.fileName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {(dataRequest.fileSize / 1024 / 1024).toFixed(1)} MB • {dataRequest.totalQuestions} questions • {dataRequest.categories} categories
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-success text-white text-xs rounded">
                    Valid
                  </span>
                </div>
              </div>
            </div>

            {/* File Analysis */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <List className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    Total Questions
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {dataRequest.totalQuestions}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Tags className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-900">
                    Categories
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {dataRequest.categories}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-900">
                    Est. Time
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-2">45m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Data Request File Upload
            </span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Upload the Excel file containing audit questions and requirements
          </p>
        </CardHeader>
        
        <CardContent>
          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300">
            <Upload className="mx-auto h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Drop your Excel file here
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              or click to browse files
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="btn-gradient-outline">Select File</Button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Supported formats: .xlsx, .xls (Max size: 10MB)
            </p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileSpreadsheet className="h-8 w-8 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    size="sm"
                    className="btn-gradient"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
