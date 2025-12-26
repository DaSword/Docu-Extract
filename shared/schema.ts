import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
export * from "./models/chat";

// Document extraction job
export const extractionJobs = pgTable("extraction_jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  targetFormType: text("target_form_type").notNull(), // invoice, contract, receipt, custom
  extractedData: jsonb("extracted_data").$type<Record<string, unknown>>(),
  missingFields: text("missing_fields").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents uploaded for extraction
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => extractionJobs.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  objectPath: text("object_path").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("uploading"), // uploading, processing, completed, failed
  documentType: text("document_type"), // detected type: invoice, contract, receipt, etc
  extractedFields: jsonb("extracted_fields").$type<Record<string, unknown>>(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent messages for human-in-the-loop
export const agentMessages = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => extractionJobs.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, agent
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
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

// Insert schemas
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

// Types
export type ExtractionJob = typeof extractionJobs.$inferSelect;
export type InsertExtractionJob = z.infer<typeof insertExtractionJobSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;

// API Request/Response types
export type CreateJobRequest = {
  name: string;
  targetFormType: string;
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

// Form field definitions by type
export const formFieldDefinitions: Record<string, { name: string; key: string; required: boolean }[]> = {
  invoice: [
    { name: "Invoice Number", key: "invoiceNumber", required: true },
    { name: "Invoice Date", key: "invoiceDate", required: true },
    { name: "Due Date", key: "dueDate", required: false },
    { name: "Vendor Name", key: "vendorName", required: true },
    { name: "Vendor Address", key: "vendorAddress", required: false },
    { name: "Total Amount", key: "totalAmount", required: true },
    { name: "Tax Amount", key: "taxAmount", required: false },
    { name: "Line Items", key: "lineItems", required: false },
  ],
  contract: [
    { name: "Contract Title", key: "contractTitle", required: true },
    { name: "Effective Date", key: "effectiveDate", required: true },
    { name: "Expiration Date", key: "expirationDate", required: false },
    { name: "Party A Name", key: "partyAName", required: true },
    { name: "Party B Name", key: "partyBName", required: true },
    { name: "Contract Value", key: "contractValue", required: false },
    { name: "Key Terms", key: "keyTerms", required: false },
  ],
  receipt: [
    { name: "Store Name", key: "storeName", required: true },
    { name: "Receipt Date", key: "receiptDate", required: true },
    { name: "Total Amount", key: "totalAmount", required: true },
    { name: "Payment Method", key: "paymentMethod", required: false },
    { name: "Items Purchased", key: "items", required: false },
  ],
  custom: [
    { name: "Title", key: "title", required: false },
    { name: "Date", key: "date", required: false },
    { name: "Description", key: "description", required: false },
    { name: "Key Information", key: "keyInfo", required: false },
  ],
};
