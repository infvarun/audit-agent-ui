import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertApplicationSchema, 
  insertDataRequestSchema, 
  insertToolConnectorSchema,
  insertDataCollectionSessionSchema,
  insertAuditResultSchema 
} from "@shared/schema";
import { z } from "zod";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all applications
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Create application
  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.json(application);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get application
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  // Upload data request file
  app.post("/api/data-requests", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { applicationId } = req.body;
      if (!applicationId) {
        return res.status(400).json({ error: "Application ID is required" });
      }

      // Mock XLSX parsing - in real implementation, use xlsx library
      const mockQuestions = [
        { id: "Q001", question: "What user access controls are in place?", category: "Access Control" },
        { id: "Q002", question: "How is data encryption implemented?", category: "Data Security" },
        { id: "Q003", question: "What backup procedures are followed?", category: "Backup & Recovery" },
        { id: "Q004", question: "How are system logs monitored?", category: "Monitoring" },
        { id: "Q005", question: "What incident response procedures exist?", category: "Incident Response" }
      ];

      const dataRequest = await storage.createDataRequest({
        applicationId: parseInt(applicationId),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        questions: mockQuestions,
        totalQuestions: mockQuestions.length,
        categories: [...new Set(mockQuestions.map(q => q.category))].length
      });

      res.json(dataRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to process file upload" });
    }
  });

  // Get data request by application ID
  app.get("/api/data-requests/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const dataRequest = await storage.getDataRequestByApplicationId(applicationId);
      if (!dataRequest) {
        return res.status(404).json({ error: "Data request not found" });
      }
      res.json(dataRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data request" });
    }
  });

  // Create tool connector
  app.post("/api/tool-connectors", async (req, res) => {
    try {
      const validatedData = insertToolConnectorSchema.parse(req.body);
      const connector = await storage.createToolConnector(validatedData);
      res.json(connector);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get tool connectors by application ID
  app.get("/api/tool-connectors/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const connectors = await storage.getToolConnectorsByApplicationId(applicationId);
      res.json(connectors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tool connectors" });
    }
  });

  // Update tool connector status
  app.patch("/api/tool-connectors/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateToolConnectorStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update connector status" });
    }
  });

  // Start data collection
  app.post("/api/data-collection/start", async (req, res) => {
    try {
      const { applicationId } = req.body;
      
      const session = await storage.createDataCollectionSession({
        applicationId: parseInt(applicationId),
        status: "running",
        progress: 0,
        logs: []
      });

      // Simulate data collection process
      simulateDataCollection(session.id, parseInt(applicationId));

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to start data collection" });
    }
  });

  // Get data collection session
  app.get("/api/data-collection/session/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const session = await storage.getDataCollectionSessionByApplicationId(applicationId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Get audit results
  app.get("/api/audit-results/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const results = await storage.getAuditResultsByApplicationId(applicationId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit results" });
    }
  });

  // Simulate data collection process
  async function simulateDataCollection(sessionId: number, applicationId: number) {
    const steps = [
      { progress: 10, message: "Connected to SQL Server: sql-prod-01.company.com" },
      { progress: 20, message: "Reading user access logs..." },
      { progress: 30, message: "Retrieved 1,247 user records" },
      { progress: 40, message: "Connecting to Exchange Server..." },
      { progress: 50, message: "Reading mailbox: audit@company.com" },
      { progress: 60, message: "Found 156 relevant emails" },
      { progress: 70, message: "Accessing NAS folder: \\nas-01.company.com\\audit" },
      { progress: 80, message: "Processing documents..." },
      { progress: 90, message: "Generating audit results..." },
      { progress: 100, message: "Data collection completed successfully" }
    ];

    // Create audit results
    const questions = [
      { id: "Q001", question: "What user access controls are in place?", category: "Access Control", status: "completed" },
      { id: "Q002", question: "How is data encryption implemented?", category: "Data Security", status: "completed" },
      { id: "Q003", question: "What backup procedures are followed?", category: "Backup & Recovery", status: "partial" },
      { id: "Q004", question: "How are system logs monitored?", category: "Monitoring", status: "failed" },
      { id: "Q005", question: "What incident response procedures exist?", category: "Incident Response", status: "completed" }
    ];

    for (const question of questions) {
      await storage.createAuditResult({
        applicationId,
        sessionId,
        questionId: question.id,
        question: question.question,
        category: question.category,
        status: question.status,
        documentPath: question.status === "completed" ? `${question.category.toLowerCase().replace(/\s+/g, '_')}_${question.id}.docx` : null
      });
    }

    let currentStep = 0;
    const logs: any[] = [];

    const interval = setInterval(async () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        logs.push({
          timestamp: new Date().toISOString(),
          message: step.message,
          progress: step.progress
        });

        await storage.updateSessionProgress(sessionId, step.progress, logs);
        
        if (step.progress === 100) {
          await storage.updateSessionStatus(sessionId, "completed");
          clearInterval(interval);
        }
        
        currentStep++;
      }
    }, 1000);
  }

  const httpServer = createServer(app);
  return httpServer;
}
