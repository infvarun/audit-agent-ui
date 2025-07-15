import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { TrendingUp, CheckCircle, Clock, XCircle, CircleHelp, FileText, Download, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StepFiveProps {
  applicationId: number | null;
  setCanProceed: (canProceed: boolean) => void;
}

export default function StepFive({ applicationId, setCanProceed }: StepFiveProps) {
  const { data: auditResults = [], isLoading } = useQuery({
    queryKey: ["/api/audit-results/application", applicationId],
    enabled: !!applicationId,
  });

  // Step 5 is the final step, no next button needed
  useEffect(() => {
    setCanProceed(false);
  }, [setCanProceed]);

  const completed = auditResults.filter((r: any) => r.status === "completed").length;
  const partial = auditResults.filter((r: any) => r.status === "partial").length;
  const failed = auditResults.filter((r: any) => r.status === "failed").length;
  const total = auditResults.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "partial":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CircleHelp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-slate-600">Loading results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-success" />
            <span>Data Collection Results</span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Review collected data and generated documents
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <CircleHelp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Total Questions
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">{total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  Completed
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">{completed}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-900">
                  Partial
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-2">{partial}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-900">
                  Failed
                </span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">{failed}</p>
            </div>
          </div>

          {/* Data Storage Location */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <FolderOpen className="h-5 w-5 text-slate-600 mr-2" />
              <span className="text-sm font-medium text-slate-900">
                Data Storage Location
              </span>
            </div>
            <div className="bg-white rounded border p-3">
              <code className="text-sm text-slate-700">
                \\nas-01.company.com\audit\results\customer-portal-audit-2024\
              </code>
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-900">
                Audit Questions Status
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditResults.map((result: any) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.questionId}
                      </TableCell>
                      <TableCell>{result.question}</TableCell>
                      <TableCell>{result.category}</TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>
                        {result.documentPath ? (
                          <a
                            href="#"
                            className="text-primary hover:text-blue-800 text-sm"
                          >
                            {result.documentPath}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">
                            No document
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Generated Documents */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-900 mb-4">
              Generated Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">
                    Audit Report Summary
                  </h4>
                  <p className="text-xs text-slate-500">Generated 2 minutes ago</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">
                    Data Collection Log
                  </h4>
                  <p className="text-xs text-slate-500">Generated 2 minutes ago</p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
