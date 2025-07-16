import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RotateCcw, Database, Mail, Settings, FolderOpen, Archive, LifeBuoy, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StepFourProps {
  applicationId: number | null;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

interface ConnectionNode {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  position: { x: number; y: number };
  status: "idle" | "connecting" | "connected" | "failed";
}

const connectionNodes: ConnectionNode[] = [
  { id: "sql", name: "SQL", icon: <Database className="h-4 w-4" />, color: "bg-blue-500", position: { x: 25, y: 20 }, status: "idle" },
  { id: "mail", name: "Mail", icon: <Mail className="h-4 w-4" />, color: "bg-green-500", position: { x: 75, y: 20 }, status: "idle" },
  { id: "snow", name: "SNow", icon: <Settings className="h-4 w-4" />, color: "bg-red-500", position: { x: 25, y: 80 }, status: "idle" },
  { id: "nas", name: "NAS", icon: <FolderOpen className="h-4 w-4" />, color: "bg-purple-500", position: { x: 75, y: 80 }, status: "idle" },
  { id: "gnosis", name: "Gnosis", icon: <Archive className="h-4 w-4" />, color: "bg-orange-500", position: { x: 10, y: 50 }, status: "idle" },
  { id: "adc", name: "ADC", icon: <Route className="h-4 w-4" />, color: "bg-indigo-500", position: { x: 90, y: 50 }, status: "idle" },
];

export default function StepFour({ applicationId, onNext, setCanProceed }: StepFourProps) {
  const [nodes, setNodes] = useState<ConnectionNode[]>(connectionNodes);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { toast } = useToast();

  const startDataCollectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/data-collection/start", {
        applicationId,
      });
      return response.json();
    },
    onSuccess: () => {
      setSessionStarted(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/data-collection/session", applicationId],
    enabled: !!applicationId && sessionStarted,
    refetchInterval: sessionStarted ? 1000 : false,
  });

  useEffect(() => {
    if (!sessionStarted) {
      startDataCollectionMutation.mutate();
    }
  }, []);

  // Always allow proceeding to next step (validation removed)
  useEffect(() => {
    setCanProceed(true);
  }, [setCanProceed]);

  // Animate nodes based on progress
  useEffect(() => {
    if (session?.progress) {
      const progress = session.progress;
      setNodes(prev => prev.map((node, index) => {
        const nodeProgress = (index + 1) * (100 / prev.length);
        if (progress >= nodeProgress) {
          return { ...node, status: "connected" };
        } else if (progress >= nodeProgress - 10) {
          return { ...node, status: "connecting" };
        }
        return { ...node, status: "idle" };
      }));
    }
  }, [session?.progress]);

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getNodeAnimation = (status: string) => {
    switch (status) {
      case "connecting":
        return { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 1 } };
      case "connected":
        return { scale: 1.1 };
      default:
        return { scale: 1 };
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <RotateCcw className="h-5 w-5 text-primary animate-spin" />
            <span>Data Collection in Progress</span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Agent is collecting data from configured sources
          </p>
        </CardHeader>
        
        <CardContent>
          {/* Overall Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <span className="text-sm text-slate-500">
                {session?.progress || 0}% Complete
              </span>
            </div>
            <Progress value={session?.progress || 0} className="h-2" />
          </div>

          {/* Connection Graph Animation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4 text-center">
              Data Collection Network
            </h3>
            <div className="relative h-64 flex items-center justify-center">
              {/* Central Node */}
              <motion.div
                className="absolute w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ADC
              </motion.div>
              
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#1d4ed8", stopOpacity: 0.3 }} />
                  </linearGradient>
                </defs>
                {nodes.map((node, index) => (
                  <line
                    key={`line-${node.id}`}
                    x1="50%"
                    y1="50%"
                    x2={`${node.position.x}%`}
                    y2={`${node.position.y}%`}
                    stroke="url(#grad1)"
                    strokeWidth="2"
                    opacity={node.status === "connected" ? 1 : 0.3}
                  />
                ))}
              </svg>

              {/* Connection Nodes */}
              {nodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-white text-xs ${getNodeStatusColor(node.status)}`}
                  style={{
                    left: `${node.position.x}%`,
                    top: `${node.position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={getNodeAnimation(node.status)}
                >
                  {node.icon}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Live Feed */}
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm mb-6">
            <div className="flex items-center mb-2">
              <span className="text-green-400">Live Feed</span>
            </div>
            <div className="space-y-1 text-slate-300 max-h-40 overflow-y-auto">
              {session?.logs && session.logs.length > 0 ? (
                session.logs.map((log: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-400 mr-2">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Initializing data collection...</div>
              )}
            </div>
          </div>

          {/* Data Source Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div key={node.id} className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {node.icon}
                    <span className="text-sm font-medium text-slate-900">
                      {node.name}
                    </span>
                  </div>
                  <Badge
                    className={
                      node.status === "connected"
                        ? "bg-green-100 text-green-800"
                        : node.status === "connecting"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {node.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
