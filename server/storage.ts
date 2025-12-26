import { db } from "./db";
import { 
  extractionJobs, 
  documents, 
  agentMessages,
  type ExtractionJob,
  type InsertExtractionJob,
  type Document,
  type InsertDocument,
  type AgentMessage,
  type InsertAgentMessage,
  type JobWithDetails
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Extraction Jobs
  getJobsByUser(userId: string): Promise<ExtractionJob[]>;
  getJob(id: number): Promise<ExtractionJob | undefined>;
  getJobWithDetails(id: number): Promise<JobWithDetails | undefined>;
  createJob(job: InsertExtractionJob): Promise<ExtractionJob>;
  updateJob(id: number, updates: Partial<ExtractionJob>): Promise<ExtractionJob | undefined>;
  deleteJob(id: number): Promise<void>;
  
  // Documents
  getDocumentsByJob(jobId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<void>;
  
  // Agent Messages
  getMessagesByJob(jobId: number): Promise<AgentMessage[]>;
  createMessage(msg: InsertAgentMessage): Promise<AgentMessage>;
}

export class DatabaseStorage implements IStorage {
  // Extraction Jobs
  async getJobsByUser(userId: string): Promise<ExtractionJob[]> {
    return db.select().from(extractionJobs)
      .where(eq(extractionJobs.userId, userId))
      .orderBy(desc(extractionJobs.createdAt));
  }

  async getJob(id: number): Promise<ExtractionJob | undefined> {
    const [job] = await db.select().from(extractionJobs).where(eq(extractionJobs.id, id));
    return job;
  }

  async getJobWithDetails(id: number): Promise<JobWithDetails | undefined> {
    const [job] = await db.select().from(extractionJobs).where(eq(extractionJobs.id, id));
    if (!job) return undefined;
    
    const docs = await db.select().from(documents).where(eq(documents.jobId, id)).orderBy(documents.createdAt);
    const msgs = await db.select().from(agentMessages).where(eq(agentMessages.jobId, id)).orderBy(agentMessages.createdAt);
    
    return {
      ...job,
      documents: docs,
      messages: msgs,
    };
  }

  async createJob(job: InsertExtractionJob): Promise<ExtractionJob> {
    const [created] = await db.insert(extractionJobs).values(job).returning();
    return created;
  }

  async updateJob(id: number, updates: Partial<ExtractionJob>): Promise<ExtractionJob | undefined> {
    const [updated] = await db.update(extractionJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(extractionJobs.id, id))
      .returning();
    return updated;
  }

  async deleteJob(id: number): Promise<void> {
    await db.delete(extractionJobs).where(eq(extractionJobs.id, id));
  }

  // Documents
  async getDocumentsByJob(jobId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.jobId, jobId)).orderBy(documents.createdAt);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(doc).returning();
    return created;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Agent Messages
  async getMessagesByJob(jobId: number): Promise<AgentMessage[]> {
    return db.select().from(agentMessages).where(eq(agentMessages.jobId, jobId)).orderBy(agentMessages.createdAt);
  }

  async createMessage(msg: InsertAgentMessage): Promise<AgentMessage> {
    const [created] = await db.insert(agentMessages).values(msg).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
