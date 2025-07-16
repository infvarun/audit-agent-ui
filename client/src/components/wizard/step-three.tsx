import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plug, Database, Mail, Settings, FolderOpen, Archive, LifeBuoy, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StepThreeProps {
  applicationId: number | null;
  onNext: () => void;
  setCanProceed: (canProceed: boolean) => void;
}

interface ConnectorConfig {
  type: string;
  name: string;
  icon: React.ReactNode;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    placeholder: string;
    defaultValue?: string;
  }>;
}

const connectorConfigs: ConnectorConfig[] = [
  {
    type: "sql_server",
    name: "SQL Server",
    icon: <Database className="h-5 w-5 text-blue-600" />,
    fields: [
      { key: "serverAddress", label: "Server Address", type: "text", placeholder: "Server Address" },
      { key: "database", label: "Database Name", type: "text", placeholder: "Database Name" },
      { key: "username", label: "Username", type: "text", placeholder: "Username" },
      { key: "password", label: "Password", type: "password", placeholder: "Password" },
    ],
  },
  {
    type: "outlook_exchange",
    name: "Outlook Exchange",
    icon: <Mail className="h-5 w-5 text-blue-600" />,
    fields: [
      { key: "exchangeServer", label: "Exchange Server", type: "text", placeholder: "Exchange Server" },
      { key: "serviceAccount", label: "Service Account", type: "email", placeholder: "Service Account" },
      { key: "password", label: "Password", type: "password", placeholder: "Password" },
      { key: "mailboxPath", label: "Mailbox Path", type: "text", placeholder: "Mailbox Path" },
    ],
  },
  {
    type: "servicenow",
    name: "ServiceNow API",
    icon: <Settings className="h-5 w-5 text-red-600" />,
    fields: [
      { key: "instanceUrl", label: "Instance URL", type: "url", placeholder: "Instance URL" },
      { key: "apiKey", label: "API Key", type: "text", placeholder: "API Key" },
      { key: "tableName", label: "Table Name", type: "text", placeholder: "Table Name" },
    ],
  },
  {
    type: "nas_folder",
    name: "NAS Folder",
    icon: <FolderOpen className="h-5 w-5 text-orange-600" />,
    fields: [
      { key: "nasServer", label: "NAS Server", type: "text", placeholder: "NAS Server" },
      { key: "folderPath", label: "Folder Path", type: "text", placeholder: "Folder Path" },
      { key: "username", label: "Username", type: "text", placeholder: "Username" },
      { key: "password", label: "Password", type: "password", placeholder: "Password" },
    ],
  },
  {
    type: "gnosis_repository",
    name: "Gnosis Repository",
    icon: <Archive className="h-5 w-5 text-purple-600" />,
    fields: [
      { key: "repositoryPath", label: "Repository Path", type: "text", placeholder: "Repository Path" },
      { key: "accessToken", label: "Access Token", type: "text", placeholder: "Access Token" },
      { key: "projectId", label: "Project ID", type: "text", placeholder: "Project ID" },
    ],
  },
  {
    type: "support_plan",
    name: "Support Plan",
    icon: <LifeBuoy className="h-5 w-5 text-green-600" />,
    fields: [
      { key: "supportPortalUrl", label: "Support Portal URL", type: "url", placeholder: "Support Portal URL" },
      { key: "planId", label: "Plan ID", type: "text", placeholder: "Plan ID" },
      { key: "contactId", label: "Contact ID", type: "text", placeholder: "Contact ID" },
    ],
  },
  {
    type: "adc_path",
    name: "ADC Path",
    icon: <Route className="h-5 w-5 text-indigo-600" />,
    fields: [
      { key: "adcServer", label: "ADC Server", type: "text", placeholder: "ADC Server" },
      { key: "configPath", label: "Configuration Path", type: "text", placeholder: "Configuration Path" },
      { key: "logPath", label: "Log Path", type: "text", placeholder: "Log Path" },
    ],
  },
];

export default function StepThree({ applicationId, onNext, setCanProceed }: StepThreeProps) {
  const [connectorData, setConnectorData] = useState<Record<string, Record<string, string>>>({});
  const { toast } = useToast();

  const { data: existingConnectors = [] } = useQuery({
    queryKey: ["/api/tool-connectors/application", applicationId],
    enabled: !!applicationId,
  });

  const saveConnectorMutation = useMutation({
    mutationFn: async (data: { connectorType: string; configuration: Record<string, string> }) => {
      const response = await apiRequest("POST", "/api/tool-connectors", {
        applicationId,
        connectorType: data.connectorType,
        configuration: data.configuration,
        status: "connected",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connector saved",
        description: "Tool connector configuration has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = (connectorType: string, fieldKey: string, value: string) => {
    setConnectorData(prev => ({
      ...prev,
      [connectorType]: {
        ...prev[connectorType],
        [fieldKey]: value,
      },
    }));
  };

  const handleSaveConnector = (connectorType: string) => {
    const configuration = connectorData[connectorType] || {};
    saveConnectorMutation.mutate({ connectorType, configuration });
  };

  const getConnectorStatus = (connectorType: string) => {
    const existing = existingConnectors.find((c: any) => c.connectorType === connectorType);
    return existing?.status || "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Always allow proceeding to next step (validation removed)
  useEffect(() => {
    setCanProceed(true);
  }, [setCanProceed]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Plug className="h-5 w-5 text-warning" />
            <span>Tool Connector Setup</span>
          </CardTitle>
          <p className="text-sm text-slate-600">
            Configure connections to data sources and tools
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {connectorConfigs.map((config) => {
              const status = getConnectorStatus(config.type);
              
              return (
                <div key={config.type} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {config.icon}
                      <h3 className="text-sm font-medium text-slate-900">
                        {config.name}
                      </h3>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {config.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`${config.type}-${field.key}`} className="text-xs">
                          {field.label}
                        </Label>
                        <Input
                          id={`${config.type}-${field.key}`}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={connectorData[config.type]?.[field.key] || ""}
                          onChange={(e) => handleFieldChange(config.type, field.key, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      onClick={() => handleSaveConnector(config.type)}
                      disabled={saveConnectorMutation.isPending}
                      className="w-full"
                    >
                      {saveConnectorMutation.isPending ? "Saving..." : "Save & Test"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {allConnectorsConfigured && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                All connectors have been configured successfully! You can now proceed to data collection.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
