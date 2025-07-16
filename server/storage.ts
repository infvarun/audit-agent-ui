import { 
  applications, 
  dataRequests, 
  toolConnectors, 
  dataCollectionSessions, 
  auditResults,
  type Application,
  type InsertApplication,
  type DataRequest,
  type InsertDataRequest,
  type ToolConnector,
  type InsertToolConnector,
  type DataCollectionSession,
  type InsertDataCollectionSession,
  type AuditResult,
  type InsertAuditResult
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplication(id: number): Promise<Application | undefined>;
  getAllApplications(): Promise<Application[]>;
  updateApplication(id: number, application: InsertApplication): Promise<Application | undefined>;
  
  // Data Requests
  createDataRequest(dataRequest: InsertDataRequest): Promise<DataRequest>;
  getDataRequestByApplicationId(applicationId: number): Promise<DataRequest | undefined>;
  
  // Tool Connectors
  createToolConnector(connector: InsertToolConnector): Promise<ToolConnector>;
  getToolConnectorsByApplicationId(applicationId: number): Promise<ToolConnector[]>;
  updateToolConnectorStatus(id: number, status: string): Promise<void>;
  
  // Data Collection Sessions
  createDataCollectionSession(session: InsertDataCollectionSession): Promise<DataCollectionSession>;
  getDataCollectionSessionByApplicationId(applicationId: number): Promise<DataCollectionSession | undefined>;
  updateSessionProgress(id: number, progress: number, logs: any[]): Promise<void>;
  updateSessionStatus(id: number, status: string): Promise<void>;
  
  // Audit Results
  createAuditResult(result: InsertAuditResult): Promise<AuditResult>;
  getAuditResultsByApplicationId(applicationId: number): Promise<AuditResult[]>;
  updateAuditResultStatus(id: number, status: string, documentPath?: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private applications: Map<number, Application>;
  private dataRequests: Map<number, DataRequest>;
  private toolConnectors: Map<number, ToolConnector>;
  private dataCollectionSessions: Map<number, DataCollectionSession>;
  private auditResults: Map<number, AuditResult>;
  private currentId: number;

  constructor() {
    this.applications = new Map();
    this.dataRequests = new Map();
    this.toolConnectors = new Map();
    this.dataCollectionSessions = new Map();
    this.auditResults = new Map();
    this.currentId = 1;
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentId++;
    const application: Application = {
      ...insertApplication,
      id,
      createdAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async updateApplication(id: number, insertApplication: InsertApplication): Promise<Application | undefined> {
    const existing = this.applications.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updatedApplication: Application = {
      ...existing,
      ...insertApplication,
      id,
      createdAt: existing.createdAt, // Keep original creation date
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async createDataRequest(insertDataRequest: InsertDataRequest): Promise<DataRequest> {
    const id = this.currentId++;
    const dataRequest: DataRequest = {
      ...insertDataRequest,
      id,
      uploadedAt: new Date(),
    };
    this.dataRequests.set(id, dataRequest);
    return dataRequest;
  }

  async getDataRequestByApplicationId(applicationId: number): Promise<DataRequest | undefined> {
    return Array.from(this.dataRequests.values()).find(
      (dr) => dr.applicationId === applicationId
    );
  }

  async createToolConnector(insertConnector: InsertToolConnector): Promise<ToolConnector> {
    const id = this.currentId++;
    const connector: ToolConnector = {
      ...insertConnector,
      id,
      createdAt: new Date(),
    };
    this.toolConnectors.set(id, connector);
    return connector;
  }

  async getToolConnectorsByApplicationId(applicationId: number): Promise<ToolConnector[]> {
    return Array.from(this.toolConnectors.values()).filter(
      (tc) => tc.applicationId === applicationId
    );
  }

  async updateToolConnectorStatus(id: number, status: string): Promise<void> {
    const connector = this.toolConnectors.get(id);
    if (connector) {
      connector.status = status;
      this.toolConnectors.set(id, connector);
    }
  }

  async createDataCollectionSession(insertSession: InsertDataCollectionSession): Promise<DataCollectionSession> {
    const id = this.currentId++;
    const session: DataCollectionSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.dataCollectionSessions.set(id, session);
    return session;
  }

  async getDataCollectionSessionByApplicationId(applicationId: number): Promise<DataCollectionSession | undefined> {
    return Array.from(this.dataCollectionSessions.values()).find(
      (session) => session.applicationId === applicationId
    );
  }

  async updateSessionProgress(id: number, progress: number, logs: any[]): Promise<void> {
    const session = this.dataCollectionSessions.get(id);
    if (session) {
      session.progress = progress;
      session.logs = logs;
      this.dataCollectionSessions.set(id, session);
    }
  }

  async updateSessionStatus(id: number, status: string): Promise<void> {
    const session = this.dataCollectionSessions.get(id);
    if (session) {
      session.status = status;
      if (status === "completed") {
        session.completedAt = new Date();
      }
      this.dataCollectionSessions.set(id, session);
    }
  }

  async createAuditResult(insertResult: InsertAuditResult): Promise<AuditResult> {
    const id = this.currentId++;
    const result: AuditResult = {
      ...insertResult,
      id,
      createdAt: new Date(),
    };
    this.auditResults.set(id, result);
    return result;
  }

  async getAuditResultsByApplicationId(applicationId: number): Promise<AuditResult[]> {
    return Array.from(this.auditResults.values()).filter(
      (result) => result.applicationId === applicationId
    );
  }

  async updateAuditResultStatus(id: number, status: string, documentPath?: string): Promise<void> {
    const result = this.auditResults.get(id);
    if (result) {
      result.status = status;
      if (documentPath) {
        result.documentPath = documentPath;
      }
      this.auditResults.set(id, result);
    }
  }
}

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application || undefined;
  }

  async getAllApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }

  async updateApplication(id: number, insertApplication: InsertApplication): Promise<Application | undefined> {
    const [updatedApplication] = await db
      .update(applications)
      .set(insertApplication)
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication || undefined;
  }

  async createDataRequest(insertDataRequest: InsertDataRequest): Promise<DataRequest> {
    const [dataRequest] = await db
      .insert(dataRequests)
      .values(insertDataRequest)
      .returning();
    return dataRequest;
  }

  async getDataRequestByApplicationId(applicationId: number): Promise<DataRequest | undefined> {
    const [dataRequest] = await db
      .select()
      .from(dataRequests)
      .where(eq(dataRequests.applicationId, applicationId));
    return dataRequest || undefined;
  }

  async createToolConnector(insertConnector: InsertToolConnector): Promise<ToolConnector> {
    const [connector] = await db
      .insert(toolConnectors)
      .values(insertConnector)
      .returning();
    return connector;
  }

  async getToolConnectorsByApplicationId(applicationId: number): Promise<ToolConnector[]> {
    return await db
      .select()
      .from(toolConnectors)
      .where(eq(toolConnectors.applicationId, applicationId));
  }

  async updateToolConnectorStatus(id: number, status: string): Promise<void> {
    await db
      .update(toolConnectors)
      .set({ status })
      .where(eq(toolConnectors.id, id));
  }

  async createDataCollectionSession(insertSession: InsertDataCollectionSession): Promise<DataCollectionSession> {
    const [session] = await db
      .insert(dataCollectionSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getDataCollectionSessionByApplicationId(applicationId: number): Promise<DataCollectionSession | undefined> {
    const [session] = await db
      .select()
      .from(dataCollectionSessions)
      .where(eq(dataCollectionSessions.applicationId, applicationId));
    return session || undefined;
  }

  async updateSessionProgress(id: number, progress: number, logs: any[]): Promise<void> {
    await db
      .update(dataCollectionSessions)
      .set({ progress, logs })
      .where(eq(dataCollectionSessions.id, id));
  }

  async updateSessionStatus(id: number, status: string): Promise<void> {
    await db
      .update(dataCollectionSessions)
      .set({ status })
      .where(eq(dataCollectionSessions.id, id));
  }

  async createAuditResult(insertResult: InsertAuditResult): Promise<AuditResult> {
    const [result] = await db
      .insert(auditResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getAuditResultsByApplicationId(applicationId: number): Promise<AuditResult[]> {
    return await db
      .select()
      .from(auditResults)
      .where(eq(auditResults.applicationId, applicationId));
  }

  async updateAuditResultStatus(id: number, status: string, documentPath?: string): Promise<void> {
    await db
      .update(auditResults)
      .set({ status, ...(documentPath && { documentPath }) })
      .where(eq(auditResults.id, id));
  }
}

export const storage = new DatabaseStorage();
