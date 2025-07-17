import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, RefreshCw, ChevronDown, ChevronUp, Settings, Bot, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
  const queryClient = useQueryClient();
  const [analyzedQuestions, setAnalyzedQuestions] = useState<AnalyzedQuestion[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved analyses
  const { data: savedAnalyses, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['question-analyses', applicationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/questions/analyses/${applicationId}`);
      return response.json();
    },
    enabled: !!applicationId
  });

  // Save analyses mutation
  const saveAnalysesMutation = useMutation({
    mutationFn: async (analyses: AnalyzedQuestion[]) => {
      const response = await apiRequest("POST", "/api/questions/analyses/save", {
        applicationId,
        analyses
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      toast({
        title: "Analyses saved successfully",
        description: "Your AI-generated prompts and tool suggestions have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['question-analyses', applicationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save analyses",
        variant: "destructive",
      });
    },
  });

  // Analyze questions with AI
  const analyzeQuestionsMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      const response = await apiRequest("POST", "/api/questions/analyze", {
        applicationId
      });
      const data = await response.json();
      
      setTotalQuestions(data.totalQuestions);
      
      // Simulate progress as questions are analyzed
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += (100 / data.totalQuestions);
        setAnalysisProgress(Math.min(currentProgress, 100));
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);
        }
      }, 500);
      
      return data;
    },
    onSuccess: (data) => {
      setAnalyzedQuestions(data.questions);
      setCanProceed(true);
      setIsSaved(false);
      toast({
        title: "Questions analyzed successfully",
        description: `Generated prompts and tool suggestions for ${data.totalQuestions} questions.`,
      });
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
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
    // Reset saved state when user makes changes
    setIsSaved(false);
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
    if (savedAnalyses?.analyses?.length > 0) {
      const convertedAnalyses = savedAnalyses.analyses.map((analysis: any) => ({
        id: analysis.questionId,
        originalQuestion: analysis.originalQuestion,
        category: analysis.category,
        subcategory: analysis.subcategory,
        prompt: analysis.aiPrompt,
        toolSuggestion: analysis.toolSuggestion,
        connectorReason: analysis.connectorReason,
        connectorToUse: analysis.connectorToUse
      }));
      setAnalyzedQuestions(convertedAnalyses);
      setIsSaved(true);
    } else if (applicationId && analyzedQuestions.length === 0 && !isLoadingSaved) {
      analyzeQuestionsMutation.mutate();
    }
  }, [savedAnalyses, applicationId, isLoadingSaved]);

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
              {analyzedQuestions.length > 0 && (
                <Button
                  onClick={() => saveAnalysesMutation.mutate(analyzedQuestions)}
                  disabled={saveAnalysesMutation.isPending}
                  variant="outline"
                  size="sm"
                  className={isSaved ? "bg-green-50 border-green-200 text-green-700" : ""}
                >
                  {saveAnalysesMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : isSaved ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saveAnalysesMutation.isPending ? "Saving..." : isSaved ? "Saved" : "Save"}
                </Button>
              )}
              <Button
                onClick={() => analyzeQuestionsMutation.mutate()}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="mb-6">
                  <div className="h-24 w-24 mx-auto flex items-center justify-center">
                    <img 
                      src="/attached_assets/Assistant-Bot_1752721464688.gif" 
                      alt="AI Assistant analyzing"
                      className="h-20 w-20 object-contain"
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  AI is analyzing your questions...
                </h3>
                <p className="text-slate-600 mb-4">
                  Generating prompts and tool suggestions for optimal data collection
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-xs text-slate-500">
                    Analyzing {totalQuestions} questions ({Math.round(analysisProgress * totalQuestions / 100)} of {totalQuestions} complete)
                  </p>
                </div>
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