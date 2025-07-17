import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { 
  insertApplicationSchema, 
  insertDataRequestSchema, 
  insertToolConnectorSchema,
  insertDataCollectionSessionSchema,
  insertAuditResultSchema,
  insertQuestionAnalysisSchema 
} from "@shared/schema";
import { z } from "zod";
import * as XLSX from "xlsx";
import fs from "fs";
import OpenAI from "openai";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

      console.log('Processing Excel file:', req.file.originalname, 'at path:', req.file.path);

      // Read Excel file
      const fileBuffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get column names
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      // Get sample data (first 3 rows)
      const sampleData = jsonData.slice(0, 3);
      
      console.log('Found columns:', columns);
      console.log('Sample data rows:', sampleData.length);
      
      // Clean up file
      fs.unlinkSync(req.file.path);
      
      res.json({
        columns,
        sample_data: sampleData
      });
    } catch (error) {
      console.error('Excel processing error:', error);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      res.status(500).json({ error: "Failed to process Excel file: " + (error instanceof Error ? error.message : 'Unknown error') });
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
      const fileBuffer = fs.readFileSync(req.file.path);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
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

  // Get tool connectors by CI ID
  app.get("/api/connectors/ci/:ciId", async (req, res) => {
    try {
      const ciId = req.params.ciId;
      const connectors = await storage.getToolConnectorsByCiId(ciId);
      res.json(connectors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch connectors" });
    }
  });

  // Create connector (for Settings page)
  app.post("/api/connectors", async (req, res) => {
    try {
      const validatedData = insertToolConnectorSchema.parse(req.body);
      const connector = await storage.createToolConnector(validatedData);
      res.json(connector);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Update connector (for Settings page)
  app.put("/api/connectors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertToolConnectorSchema.parse(req.body);
      const connector = await storage.updateToolConnector(id, validatedData);
      if (!connector) {
        return res.status(404).json({ error: "Connector not found" });
      }
      res.json(connector);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Delete connector (for Settings page)
  app.delete("/api/connectors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteToolConnector(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete connector" });
    }
  });

  // Get saved question analyses
  app.get("/api/questions/analyses/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const analyses = await storage.getQuestionAnalysesByApplicationId(applicationId);
      res.json({ analyses });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch question analyses" });
    }
  });

  // Save question analyses
  app.post("/api/questions/analyses/save", async (req, res) => {
    try {
      const { applicationId, analyses } = req.body;
      
      // Clear existing analyses for this application
      await storage.deleteQuestionAnalysesByApplicationId(applicationId);
      
      // Save new analyses
      const savedAnalyses = [];
      for (const analysis of analyses) {
        const saved = await storage.createQuestionAnalysis({
          applicationId,
          questionId: analysis.id,
          originalQuestion: analysis.originalQuestion,
          category: analysis.category,
          subcategory: analysis.subcategory,
          aiPrompt: analysis.prompt,
          toolSuggestion: analysis.toolSuggestion,
          connectorReason: analysis.connectorReason,
          connectorToUse: analysis.connectorToUse
        });
        savedAnalyses.push(saved);
      }
      
      res.json({ 
        success: true, 
        analyses: savedAnalyses,
        message: "Question analyses saved successfully" 
      });
    } catch (error) {
      console.error("Save analyses error:", error);
      res.status(500).json({ error: "Failed to save question analyses" });
    }
  });

  // Analyze questions with AI to generate prompts and tool suggestions
  app.post("/api/questions/analyze", async (req, res) => {
    try {
      const { applicationId } = req.body;
      const dataRequests = await storage.getDataRequestsByApplicationId(applicationId);
      
      if (dataRequests.length === 0) {
        return res.status(404).json({ error: "No data requests found for this application" });
      }

      const allQuestions = dataRequests.flatMap(dr => dr.questions);
      const analyzedQuestions = [];
      let completedQuestions = 0;

      for (const question of allQuestions) {
        try {
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert audit assistant. Your task is to analyze audit questions and generate:
1. An efficient prompt for an AI agent to collect the required data
2. A tool suggestion for data collection
3. A connector recommendation

Available tools: SQL Server, Gnosis Path, ServiceNow, NAS Path

For each question, provide a JSON response with:
- "prompt": A clear, actionable prompt for an AI agent
- "toolSuggestion": The best tool from the available options
- "connectorReason": Brief explanation why this tool is recommended

Focus on practical data collection methods and be specific about what data to gather.`
              },
              {
                role: "user",
                content: `Analyze this audit question: "${question.question}"
Category: ${question.category}
Subcategory: ${question.subcategory || "General"}`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          });

          const analysis = JSON.parse(response.choices[0].message.content);
          
          analyzedQuestions.push({
            id: question.id,
            originalQuestion: question.question,
            category: question.category,
            subcategory: question.subcategory,
            prompt: analysis.prompt,
            toolSuggestion: analysis.toolSuggestion,
            connectorReason: analysis.connectorReason,
            connectorToUse: analysis.toolSuggestion.toLowerCase().replace(/\s+/g, "_")
          });
        } catch (error) {
          console.error(`Error analyzing question ${question.id}:`, error);
          // Fallback for failed analysis
          analyzedQuestions.push({
            id: question.id,
            originalQuestion: question.question,
            category: question.category,
            subcategory: question.subcategory,
            prompt: `Collect data to answer: ${question.question}`,
            toolSuggestion: "SQL Server", // Default fallback
            connectorReason: "Default suggestion due to analysis error",
            connectorToUse: "sql_server"
          });
        }
        
        completedQuestions++;
      }

      res.json({ 
        questions: analyzedQuestions,
        totalQuestions: analyzedQuestions.length,
        analysisComplete: true 
      });
    } catch (error) {
      console.error("Question analysis error:", error);
      res.status(500).json({ error: "Failed to analyze questions" });
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
