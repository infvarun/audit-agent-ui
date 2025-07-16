import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, RefreshCw, ChevronDown, ChevronUp, Settings, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StepThreeProps {
  applicationId: number | null;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

interface AnalyzedQuestion {
  id: string;
  originalQuestion: string;
  category: string;
  subcategory: string;
  prompt: string;
  toolSuggestion: string;
  connectorReason: string;
  connectorToUse: string;
}

const availableTools = [
  { value: "sql_server", label: "SQL Server" },
  { value: "gnosis_path", label: "Gnosis Path" },
  { value: "servicenow", label: "ServiceNow" },
  { value: "nas_path", label: "NAS Path" },
];

export default function StepThree({ applicationId, onNext, setCanProceed }: StepThreeProps) {
  const { toast } = useToast();
  const [analyzedQuestions, setAnalyzedQuestions] = useState<AnalyzedQuestion[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Analyze questions with AI
  const analyzeQuestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/questions/analyze", {
        applicationId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalyzedQuestions(data.questions);
      setCanProceed(true);
      toast({
        title: "Questions analyzed successfully",
        description: `Generated prompts and tool suggestions for ${data.totalQuestions} questions.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze questions",
        variant: "destructive",
      });
    },
  });

  const handleToolChange = (questionId: string, newTool: string) => {
    setAnalyzedQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, toolSuggestion: availableTools.find(t => t.value === newTool)?.label || newTool, connectorToUse: newTool }
          : q
      )
    );
  };

  const toggleRowExpansion = (questionId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (applicationId && analyzedQuestions.length === 0) {
      analyzeQuestionsMutation.mutate();
    }
  }, [applicationId]);

  useEffect(() => {
    setCanProceed(analyzedQuestions.length > 0);
  }, [analyzedQuestions.length, setCanProceed]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="card-modern">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Question Analysis</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-purple-600">
                {analyzedQuestions.length} questions analyzed
              </Badge>
              <Button
                onClick={() => analyzeQuestionsMutation.mutate()}
                disabled={analyzeQuestionsMutation.isPending}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analyzeQuestionsMutation.isPending ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analyzeQuestionsMutation.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bot className="h-12 w-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  AI is analyzing your questions...
                </h3>
                <p className="text-slate-600">
                  Generating prompts and tool suggestions for optimal data collection
                </p>
              </div>
            </div>
          ) : analyzedQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                No questions to analyze
              </h3>
              <p className="text-slate-600 mb-6">
                Please complete Step 2 to upload and process your audit questions first.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Analysis Complete</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  AI has generated efficient prompts and tool suggestions for each question. 
                  You can modify tool suggestions as needed before proceeding to data collection.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-1/4">Original Question</TableHead>
                      <TableHead className="w-1/3">AI Generated Prompt</TableHead>
                      <TableHead className="w-1/6">Tool Suggestion</TableHead>
                      <TableHead className="w-1/6">Connector</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyzedQuestions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(question.id)}
                          >
                            {expandedRows.has(question.id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">
                              {question.originalQuestion}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {question.category}
                              </Badge>
                              {question.subcategory && (
                                <Badge variant="outline" className="text-xs">
                                  {question.subcategory}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-700">
                            {expandedRows.has(question.id) ? 
                              question.prompt : 
                              `${question.prompt.slice(0, 100)}${question.prompt.length > 100 ? '...' : ''}`
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={question.connectorToUse}
                            onValueChange={(value) => handleToolChange(question.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTools.map((tool) => (
                                <SelectItem key={tool.value} value={tool.value}>
                                  {tool.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {question.connectorToUse}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Ready for Data Collection</h4>
                </div>
                <p className="text-green-700 text-sm">
                  All questions have been analyzed and assigned appropriate tools. 
                  You can now proceed to Step 4 to start the automated data collection process.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}