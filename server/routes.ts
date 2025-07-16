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
import * as XLSX from "xlsx";
import fs from "fs";

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

  // Update application
  app.put("/api/applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertApplicationSchema.parse(req.body);
      const updatedApplication = await storage.updateApplication(id, validatedData);
      if (!updatedApplication) {
        return res.status(404).json({ error: "Application not found" });
      }
      res.json(updatedApplication);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get columns from Excel file
  app.post("/api/excel/get-columns", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Read Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get column names
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      // Get sample data (first 3 rows)
      const sampleData = jsonData.slice(0, 3);
      
      // Clean up file
      fs.unlinkSync(req.file.path);
      
      res.json({
        columns,
        sample_data: sampleData
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Process Excel file with column mappings
  app.post("/api/excel/process", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { applicationId, fileType, columnMappings } = req.body;
      if (!applicationId) {
        return res.status(400).json({ error: "Application ID is required" });
      }

      let mappings;
      try {
        mappings = JSON.parse(columnMappings);
      } catch (error) {
        return res.status(400).json({ error: "Invalid column mappings" });
      }

      // Read Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Extract column mappings
      const questionCol = mappings.questionNumber;
      const categoryCol = mappings.process;
      const subcategoryCol = mappings.subProcess;
      const questionTextCol = mappings.question;

      // Validate required columns exist
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      const missingCols = [];
      
      if (!columns.includes(questionCol)) missingCols.push(`questionNumber -> ${questionCol}`);
      if (!columns.includes(categoryCol)) missingCols.push(`process -> ${categoryCol}`);
      if (!columns.includes(subcategoryCol)) missingCols.push(`subProcess -> ${subcategoryCol}`);
      if (!columns.includes(questionTextCol)) missingCols.push(`question -> ${questionTextCol}`);

      if (missingCols.length > 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: `Missing columns: ${missingCols.join(', ')}`,
          available_columns: columns
        });
      }

      // Process data
      const questions = [];
      const categories = new Set();
      const subcategories = new Set();

      for (const row of jsonData) {
        if (!row[questionCol] || !row[questionTextCol]) continue;

        const questionNumber = String(row[questionCol]).trim();
        const category = row[categoryCol] ? String(row[categoryCol]).trim() : "Uncategorized";
        const subcategory = row[subcategoryCol] ? String(row[subcategoryCol]).trim() : "General";
        const questionText = String(row[questionTextCol]).trim();

        categories.add(category);
        subcategories.add(subcategory);

        questions.push({
          id: questionNumber,
          question: questionText,
          category: category,
          subcategory: subcategory
        });
      }

      // Save to database
      const dataRequest = await storage.createDataRequest({
        applicationId: parseInt(applicationId),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileType || 'primary',
        questions: questions,
        totalQuestions: questions.length,
        categories: Array.from(categories),
        subcategories: Array.from(subcategories),
        columnMappings: mappings
      });

      // Clean up file
      fs.unlinkSync(req.file.path);

      res.json({
        id: dataRequest.id,
        applicationId: dataRequest.applicationId,
        fileName: dataRequest.fileName,
        fileSize: dataRequest.fileSize,
        fileType: dataRequest.fileType,
        questions: dataRequest.questions,
        totalQuestions: dataRequest.totalQuestions,
        categories: dataRequest.categories,
        subcategories: dataRequest.subcategories,
        categoryCount: Array.from(categories).length,
        subcategoryCount: Array.from(subcategories).length,
        columnMappings: dataRequest.columnMappings
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Get data requests by application ID
  app.get("/api/data-requests/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const dataRequests = await storage.getDataRequestsByApplicationId(applicationId);
      res.json(dataRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data requests" });
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
