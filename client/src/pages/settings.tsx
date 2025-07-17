import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Database, Settings as SettingsIcon, FolderOpen, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface ConnectorConfig {
  type: string;
  name: string;
  icon: React.ReactNode;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    placeholder: string;
    required?: boolean;
  }>;
}

const connectorConfigs: ConnectorConfig[] = [
  {
    type: "sql_server",
    name: "SQL Server",
    icon: <Database className="h-5 w-5 text-blue-600" />,
    fields: [
      { key: "serverAddress", label: "Server Address", type: "text", placeholder: "e.g., localhost:1433", required: true },
      { key: "database", label: "Database Name", type: "text", placeholder: "Database Name", required: true },
      { key: "username", label: "Username", type: "text", placeholder: "Username", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Password", required: true },
    ],
  },
  {
    type: "gnosis_path",
    name: "Gnosis Path",
    icon: <SettingsIcon className="h-5 w-5 text-purple-600" />,
    fields: [
      { key: "gnosisUrl", label: "Gnosis URL", type: "url", placeholder: "https://gnosis.company.com", required: true },
      { key: "apiKey", label: "API Key", type: "text", placeholder: "API Key", required: true },
      { key: "path", label: "Path", type: "text", placeholder: "Knowledge Base Path", required: true },
    ],
  },
  {
    type: "servicenow",
    name: "ServiceNow",
    icon: <SettingsIcon className="h-5 w-5 text-red-600" />,
    fields: [
      { key: "instanceUrl", label: "Instance URL", type: "url", placeholder: "https://instance.service-now.com", required: true },
      { key: "apiKey", label: "API Key", type: "text", placeholder: "API Key", required: true },
      { key: "tableName", label: "Table Name", type: "text", placeholder: "incident", required: true },
    ],
  },
  {
    type: "nas_path",
    name: "NAS Path",
    icon: <FolderOpen className="h-5 w-5 text-orange-600" />,
    fields: [
      { key: "nasServer", label: "NAS Server", type: "text", placeholder: "//nas.company.com", required: true },
      { key: "folderPath", label: "Folder Path", type: "text", placeholder: "/shared/audit", required: true },
      { key: "username", label: "Username", type: "text", placeholder: "Username", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Password", required: true },
    ],
  },
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCi, setSelectedCi] = useState("");
  const [editingConnector, setEditingConnector] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedConnectorType, setSelectedConnectorType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Get all unique CI IDs
  const { data: applications } = useQuery({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  // Get connectors for selected CI
  const { data: connectors, refetch: refetchConnectors } = useQuery({
    queryKey: ["/api/connectors/ci", selectedCi],
    queryFn: async () => {
      if (!selectedCi) return [];
      const response = await fetch(`/api/connectors/ci/${selectedCi}`);
      if (!response.ok) throw new Error("Failed to fetch connectors");
      return response.json();
    },
    enabled: !!selectedCi,
  });

  // Create/Update connector mutation
  const saveConnectorMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingConnector ? "PUT" : "POST";
      const url = editingConnector ? `/api/connectors/${editingConnector.id}` : "/api/connectors";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingConnector ? "Connector updated" : "Connector created",
        description: "Configuration saved successfully.",
      });
      setIsCreateDialogOpen(false);
      setEditingConnector(null);
      setFormData({});
      refetchConnectors();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete connector mutation
  const deleteConnectorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/connectors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connector deleted",
        description: "Configuration removed successfully.",
      });
      refetchConnectors();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get unique CI IDs from applications
  const uniqueCiIds = applications?.map((app: any) => app.ciId).filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) || [];
  const filteredCiIds = uniqueCiIds.filter((ciId: string) => ciId.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateConnector = () => {
    setEditingConnector(null);
    setSelectedConnectorType("");
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEditConnector = (connector: any) => {
    setEditingConnector(connector);
    setSelectedConnectorType(connector.connectorType);
    setFormData(connector.configuration || {});
    setIsCreateDialogOpen(true);
  };

  const handleSaveConnector = () => {
    if (!selectedCi || !selectedConnectorType) return;

    const connectorData = {
      ciId: selectedCi,
      connectorType: selectedConnectorType,
      configuration: formData,
    };

    saveConnectorMutation.mutate(connectorData);
  };

  const selectedConnectorConfig = connectorConfigs.find(c => c.type === selectedConnectorType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-slate-600">Manage CI configurations and tool connectors</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CI Selection */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Select CI</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search CI</Label>
                  <Input
                    id="search"
                    placeholder="Search CI ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredCiIds.map((ciId: string) => (
                    <div
                      key={ciId}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCi === ciId
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedCi(ciId)}
                    >
                      <div className="font-medium">{ciId}</div>
                      <div className="text-sm text-slate-500">
                        {applications?.filter((app: any) => app.ciId === ciId).length} applications
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connector Configuration */}
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Tool Connectors</span>
                    {selectedCi && (
                      <Badge variant="outline" className="ml-2">{selectedCi}</Badge>
                    )}
                  </CardTitle>
                  {selectedCi && (
                    <Button onClick={handleCreateConnector} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Connector
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedCi ? (
                  <div className="text-center py-12 text-slate-500">
                    <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Select a CI to view and manage connectors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connectors?.length > 0 ? (
                      connectors.map((connector: any) => {
                        const config = connectorConfigs.find(c => c.type === connector.connectorType);
                        return (
                          <div key={connector.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {config?.icon}
                                <div>
                                  <h3 className="font-medium">{config?.name}</h3>
                                  <p className="text-sm text-slate-500">
                                    Status: <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                                      {connector.status}
                                    </Badge>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditConnector(connector)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteConnectorMutation.mutate(connector.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No connectors configured for this CI</p>
                        <Button onClick={handleCreateConnector} className="mt-4">
                          Add First Connector
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create/Edit Connector Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConnector ? "Edit Connector" : "Create New Connector"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="connectorType">Connector Type</Label>
                <Select value={selectedConnectorType} onValueChange={setSelectedConnectorType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectorConfigs.map((config) => (
                      <SelectItem key={config.type} value={config.type}>
                        <div className="flex items-center space-x-2">
                          {config.icon}
                          <span>{config.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedConnectorConfig && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration</h4>
                  {selectedConnectorConfig.fields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveConnector}
                  disabled={!selectedConnectorType || saveConnectorMutation.isPending}
                >
                  {saveConnectorMutation.isPending ? "Saving..." : "Save Connector"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}