import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
export * from "./models/chat";
export * from "./formSchema";

export const extractionJobs = pgTable("extraction_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"),
  extractedData: jsonb("extracted_data").$type<Record<string, string>>(),
  missingFields: text("missing_fields").array(),
  pdfOutputPath: text("pdf_output_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => extractionJobs.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  objectPath: text("object_path").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("uploading"),
  documentType: text("document_type"),
  extractedFields: jsonb("extracted_fields").$type<Record<string, string>>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentMessages = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => extractionJobs.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const extractionJobsRelations = relations(extractionJobs, ({ many }) => ({
  documents: many(documents),
  messages: many(agentMessages),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  job: one(extractionJobs, {
    fields: [documents.jobId],
    references: [extractionJobs.id],
  }),
}));

export const agentMessagesRelations = relations(agentMessages, ({ one }) => ({
  job: one(extractionJobs, {
    fields: [agentMessages.jobId],
    references: [extractionJobs.id],
  }),
}));

export const insertExtractionJobSchema = createInsertSchema(extractionJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({
  id: true,
  createdAt: true,
});

export type ExtractionJob = typeof extractionJobs.$inferSelect;
export type InsertExtractionJob = z.infer<typeof insertExtractionJobSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;

export type CreateJobRequest = {
  name: string;
};

export type CreateJobResponse = ExtractionJob;

export type JobWithDetails = ExtractionJob & {
  documents: Document[];
  messages: AgentMessage[];
};

export type AddDocumentRequest = {
  jobId: number;
  filename: string;
  objectPath: string;
  mimeType: string;
};

export type SendMessageRequest = {
  jobId: number;
  content: string;
};
