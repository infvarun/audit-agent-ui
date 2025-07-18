import { z } from "zod";

// Static JSON data schemas - no database needed

export const applicationSchema = z.object({
  id: z.number(),
  auditName: z.string(),
  name: z.string(),
  ciId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  settings: z.object({
    enableFollowUpQuestions: z.boolean(),
    emailNotifications: z.boolean(),
  }).optional(),
  createdAt: z.string().optional(),
});

export const dataRequestSchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    category: z.string(),
    subcategory: z.string().optional(),
  })),
  totalQuestions: z.number(),
  categories: z.array(z.string()),
  subcategories: z.array(z.string()),
  columnMappings: z.record(z.string()),
  uploadedAt: z.string().optional(),
});

export const questionAnalysisSchema = z.object({
  id: z.string(),
  applicationId: z.number(),
  questionId: z.string(),
  originalQuestion: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  aiPrompt: z.string(),
  toolSuggestion: z.string(),
  connectorReason: z.string(),
  connectorToUse: z.string(),
  createdAt: z.string().optional(),
});

export const dataCollectionSessionSchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  status: z.string(),
  progress: z.number(),
  logs: z.array(z.object({
    timestamp: z.string(),
    message: z.string(),
    level: z.string(),
  })),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export const toolConnectorSchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  ciId: z.string(),
  connectorType: z.string(),
  configuration: z.record(z.any()),
  status: z.string(),
  createdAt: z.string().optional(),
});

export const auditResultSchema = z.object({
  id: z.number(),
  applicationId: z.number(),
  sessionId: z.number(),
  questionId: z.string(),
  question: z.string(),
  category: z.string(),
  status: z.string(),
  documentPath: z.string().optional(),
  createdAt: z.string().optional(),
});

// Insert schemas for form validation
export const insertApplicationSchema = applicationSchema.omit({
  id: true,
  createdAt: true,
});

export const insertDataRequestSchema = dataRequestSchema.omit({
  id: true,
  uploadedAt: true,
});

export const insertQuestionAnalysisSchema = questionAnalysisSchema.omit({
  id: true,
  createdAt: true,
});

export const insertToolConnectorSchema = toolConnectorSchema.omit({
  id: true,
  createdAt: true,
});

export const insertDataCollectionSessionSchema = dataCollectionSessionSchema.omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertAuditResultSchema = auditResultSchema.omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type Application = z.infer<typeof applicationSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type DataRequest = z.infer<typeof dataRequestSchema>;
export type InsertDataRequest = z.infer<typeof insertDataRequestSchema>;
export type QuestionAnalysis = z.infer<typeof questionAnalysisSchema>;
export type InsertQuestionAnalysis = z.infer<typeof insertQuestionAnalysisSchema>;
export type ToolConnector = z.infer<typeof toolConnectorSchema>;
export type InsertToolConnector = z.infer<typeof insertToolConnectorSchema>;
export type DataCollectionSession = z.infer<typeof dataCollectionSessionSchema>;
export type InsertDataCollectionSession = z.infer<typeof insertDataCollectionSessionSchema>;
export type AuditResult = z.infer<typeof auditResultSchema>;
export type InsertAuditResult = z.infer<typeof insertAuditResultSchema>;
