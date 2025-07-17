import { 
  Application, 
  InsertApplication, 
  DataRequest, 
  InsertDataRequest, 
  QuestionAnalysis, 
  InsertQuestionAnalysis, 
  ToolConnector, 
  InsertToolConnector, 
  DataCollectionSession, 
  InsertDataCollectionSession, 
  AuditResult, 
  InsertAuditResult 
} from "@shared/schema";

export interface IStorage {
  // Application methods
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationById(id: number): Promise<Application | null>;
  getAllApplications(): Promise<Application[]>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | null>;
  deleteApplication(id: number): Promise<boolean>;

  // Data request methods
  createDataRequest(dataRequest: InsertDataRequest): Promise<DataRequest>;
  getDataRequestById(id: number): Promise<DataRequest | null>;
  getDataRequestsByApplicationId(applicationId: number): Promise<DataRequest[]>;
  updateDataRequest(id: number, dataRequest: Partial<InsertDataRequest>): Promise<DataRequest | null>;
  deleteDataRequest(id: number): Promise<boolean>;

  // Question analysis methods
  createQuestionAnalysis(analysis: InsertQuestionAnalysis): Promise<QuestionAnalysis>;
  getQuestionAnalysisById(id: number): Promise<QuestionAnalysis | null>;
  getQuestionAnalysesByApplicationId(applicationId: number): Promise<QuestionAnalysis[]>;
  updateQuestionAnalysis(id: number, analysis: Partial<InsertQuestionAnalysis>): Promise<QuestionAnalysis | null>;
  deleteQuestionAnalysis(id: number): Promise<boolean>;

  // Tool connector methods
  createToolConnector(connector: InsertToolConnector): Promise<ToolConnector>;
  getToolConnectorById(id: number): Promise<ToolConnector | null>;
  getToolConnectorsByApplicationId(applicationId: number): Promise<ToolConnector[]>;
  updateToolConnector(id: number, connector: Partial<InsertToolConnector>): Promise<ToolConnector | null>;
  deleteToolConnector(id: number): Promise<boolean>;

  // Data collection session methods
  createDataCollectionSession(session: InsertDataCollectionSession): Promise<DataCollectionSession>;
  getDataCollectionSessionById(id: number): Promise<DataCollectionSession | null>;
  getDataCollectionSessionsByApplicationId(applicationId: number): Promise<DataCollectionSession[]>;
  updateDataCollectionSession(id: number, session: Partial<InsertDataCollectionSession>): Promise<DataCollectionSession | null>;
  deleteDataCollectionSession(id: number): Promise<boolean>;

  // Audit result methods
  createAuditResult(result: InsertAuditResult): Promise<AuditResult>;
  getAuditResultById(id: number): Promise<AuditResult | null>;
  getAuditResultsByApplicationId(applicationId: number): Promise<AuditResult[]>;
  updateAuditResult(id: number, result: Partial<InsertAuditResult>): Promise<AuditResult | null>;
  deleteAuditResult(id: number): Promise<boolean>;
}

// Memory storage implementation
class MemStorage implements IStorage {
  private applications: Map<number, Application> = new Map();
  private dataRequests: Map<number, DataRequest> = new Map();
  private questionAnalyses: Map<number, QuestionAnalysis> = new Map();
  private toolConnectors: Map<number, ToolConnector> = new Map();
  private dataCollectionSessions: Map<number, DataCollectionSession> = new Map();
  private auditResults: Map<number, AuditResult> = new Map();
  
  private nextId = 1;

  // Application methods
  async createApplication(application: InsertApplication): Promise<Application> {
    const newApp: Application = {
      id: this.nextId++,
      ...application,
      createdAt: new Date(),
    };
    this.applications.set(newApp.id, newApp);
    return newApp;
  }

  async getApplicationById(id: number): Promise<Application | null> {
    return this.applications.get(id) || null;
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | null> {
    const existing = this.applications.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...application };
    this.applications.set(id, updated);
    return updated;
  }

  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }

  // Data request methods
  async createDataRequest(dataRequest: InsertDataRequest): Promise<DataRequest> {
    const newRequest: DataRequest = {
      id: this.nextId++,
      ...dataRequest,
      uploadedAt: new Date(),
    };
    this.dataRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getDataRequestById(id: number): Promise<DataRequest | null> {
    return this.dataRequests.get(id) || null;
  }

  async getDataRequestsByApplicationId(applicationId: number): Promise<DataRequest[]> {
    return Array.from(this.dataRequests.values()).filter(dr => dr.applicationId === applicationId);
  }

  async updateDataRequest(id: number, dataRequest: Partial<InsertDataRequest>): Promise<DataRequest | null> {
    const existing = this.dataRequests.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...dataRequest };
    this.dataRequests.set(id, updated);
    return updated;
  }

  async deleteDataRequest(id: number): Promise<boolean> {
    return this.dataRequests.delete(id);
  }

  // Question analysis methods
  async createQuestionAnalysis(analysis: InsertQuestionAnalysis): Promise<QuestionAnalysis> {
    const newAnalysis: QuestionAnalysis = {
      id: this.nextId++,
      ...analysis,
      createdAt: new Date(),
    };
    this.questionAnalyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }

  async getQuestionAnalysisById(id: number): Promise<QuestionAnalysis | null> {
    return this.questionAnalyses.get(id) || null;
  }

  async getQuestionAnalysesByApplicationId(applicationId: number): Promise<QuestionAnalysis[]> {
    return Array.from(this.questionAnalyses.values()).filter(qa => qa.applicationId === applicationId);
  }

  async updateQuestionAnalysis(id: number, analysis: Partial<InsertQuestionAnalysis>): Promise<QuestionAnalysis | null> {
    const existing = this.questionAnalyses.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...analysis };
    this.questionAnalyses.set(id, updated);
    return updated;
  }

  async deleteQuestionAnalysis(id: number): Promise<boolean> {
    return this.questionAnalyses.delete(id);
  }

  // Tool connector methods
  async createToolConnector(connector: InsertToolConnector): Promise<ToolConnector> {
    const newConnector: ToolConnector = {
      id: this.nextId++,
      ...connector,
      createdAt: new Date(),
    };
    this.toolConnectors.set(newConnector.id, newConnector);
    return newConnector;
  }

  async getToolConnectorById(id: number): Promise<ToolConnector | null> {
    return this.toolConnectors.get(id) || null;
  }

  async getToolConnectorsByApplicationId(applicationId: number): Promise<ToolConnector[]> {
    return Array.from(this.toolConnectors.values()).filter(tc => tc.applicationId === applicationId);
  }

  async updateToolConnector(id: number, connector: Partial<InsertToolConnector>): Promise<ToolConnector | null> {
    const existing = this.toolConnectors.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...connector };
    this.toolConnectors.set(id, updated);
    return updated;
  }

  async deleteToolConnector(id: number): Promise<boolean> {
    return this.toolConnectors.delete(id);
  }

  // Data collection session methods
  async createDataCollectionSession(session: InsertDataCollectionSession): Promise<DataCollectionSession> {
    const newSession: DataCollectionSession = {
      id: this.nextId++,
      ...session,
      startedAt: null,
      completedAt: null,
    };
    this.dataCollectionSessions.set(newSession.id, newSession);
    return newSession;
  }

  async getDataCollectionSessionById(id: number): Promise<DataCollectionSession | null> {
    return this.dataCollectionSessions.get(id) || null;
  }

  async getDataCollectionSessionsByApplicationId(applicationId: number): Promise<DataCollectionSession[]> {
    return Array.from(this.dataCollectionSessions.values()).filter(dcs => dcs.applicationId === applicationId);
  }

  async updateDataCollectionSession(id: number, session: Partial<InsertDataCollectionSession>): Promise<DataCollectionSession | null> {
    const existing = this.dataCollectionSessions.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...session };
    this.dataCollectionSessions.set(id, updated);
    return updated;
  }

  async deleteDataCollectionSession(id: number): Promise<boolean> {
    return this.dataCollectionSessions.delete(id);
  }

  // Audit result methods
  async createAuditResult(result: InsertAuditResult): Promise<AuditResult> {
    const newResult: AuditResult = {
      id: this.nextId++,
      ...result,
      createdAt: new Date(),
    };
    this.auditResults.set(newResult.id, newResult);
    return newResult;
  }

  async getAuditResultById(id: number): Promise<AuditResult | null> {
    return this.auditResults.get(id) || null;
  }

  async getAuditResultsByApplicationId(applicationId: number): Promise<AuditResult[]> {
    return Array.from(this.auditResults.values()).filter(ar => ar.applicationId === applicationId);
  }

  async updateAuditResult(id: number, result: Partial<InsertAuditResult>): Promise<AuditResult | null> {
    const existing = this.auditResults.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...result };
    this.auditResults.set(id, updated);
    return updated;
  }

  async deleteAuditResult(id: number): Promise<boolean> {
    return this.auditResults.delete(id);
  }
}

export const storage = new MemStorage();