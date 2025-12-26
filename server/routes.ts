import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { processJob, handleUserMessage } from "./extraction";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup object storage routes
  registerObjectStorageRoutes(app);

  // === EXTRACTION JOBS ===
  
  // List all jobs for current user
  app.get(api.jobs.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobsByUser(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error listing jobs:", error);
      res.status(500).json({ message: "Failed to list jobs" });
    }
  });

  // Get single job with details
  app.get(api.jobs.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJobWithDetails(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Verify ownership
      if (job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  // Create new job
  app.post(api.jobs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.jobs.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const job = await storage.createJob({
        ...input,
        userId,
        status: "pending",
      });
      
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Delete job
  app.delete(api.jobs.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteJob(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // === DOCUMENTS ===
  
  // Add document to job
  app.post(api.documents.add.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const input = api.documents.add.input.parse(req.body);
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const doc = await storage.createDocument({
        jobId,
        filename: input.filename,
        objectPath: input.objectPath,
        mimeType: input.mimeType,
        status: "pending",
      });
      
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error adding document:", error);
      res.status(500).json({ message: "Failed to add document" });
    }
  });

  // Delete document
  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const docId = parseInt(req.params.docId);
      
      const job = await storage.getJob(jobId);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteDocument(docId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // === EXTRACTION ===
  
  // Process job (extract from all documents)
  app.post(api.extraction.process.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Start processing in background
      processJob(jobId).catch(err => {
        console.error("Background job processing failed:", err);
      });
      
      res.json({ message: "Processing started", jobId });
    } catch (error) {
      console.error("Error starting extraction:", error);
      res.status(500).json({ message: "Failed to start extraction" });
    }
  });

  // Get job status (for polling)
  app.get(api.extraction.status.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJobWithDetails(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const completedDocs = job.documents.filter(d => d.status === "completed").length;
      const progress = job.documents.length > 0 
        ? Math.round((completedDocs / job.documents.length) * 100)
        : 0;
      
      res.json({
        status: job.status,
        progress,
        extractedData: job.extractedData,
        missingFields: job.missingFields,
        documents: job.documents.map(d => ({
          id: d.id,
          filename: d.filename,
          status: d.status,
          documentType: d.documentType,
          error: d.error,
        })),
      });
    } catch (error) {
      console.error("Error getting status:", error);
      res.status(500).json({ message: "Failed to get status" });
    }
  });

  // === MESSAGES ===
  
  // List messages for job
  app.get(api.messages.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      
      const job = await storage.getJob(jobId);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getMessagesByJob(jobId);
      res.json(messages);
    } catch (error) {
      console.error("Error listing messages:", error);
      res.status(500).json({ message: "Failed to list messages" });
    }
  });

  // Send message to agent
  app.post(api.messages.send.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const input = api.messages.send.input.parse(req.body);
      
      const job = await storage.getJob(jobId);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Save user message
      await storage.createMessage({
        jobId,
        role: "user",
        content: input.content,
      });
      
      // Generate and save agent response
      const agentResponse = await handleUserMessage(jobId, input.content);
      const agentMessage = await storage.createMessage({
        jobId,
        role: "agent",
        content: agentResponse,
      });
      
      res.status(201).json(agentMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Update job extracted data (manual edits)
  app.patch("/api/jobs/:id/data", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { extractedData } = req.body;
      
      const job = await storage.getJob(id);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateJob(id, { extractedData });
      res.json(updated);
    } catch (error) {
      console.error("Error updating job data:", error);
      res.status(500).json({ message: "Failed to update job data" });
    }
  });

  // Generate filled PDF
  app.post("/api/jobs/:id/generate-pdf", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const job = await storage.getJob(id);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!job.extractedData || Object.keys(job.extractedData).length === 0) {
        return res.status(400).json({ message: "No form data to generate PDF from" });
      }

      const fs = await import("fs");
      const templatePath = "attached_assets/Financial_statement_TEMPLATE.pdf";
      
      if (!fs.existsSync(templatePath)) {
        return res.status(400).json({ 
          message: "PDF template not found. Please upload the Massachusetts Court Financial Statement PDF template to the attached_assets folder as 'Financial_statement_TEMPLATE.pdf'" 
        });
      }

      const { generateFilledPdf } = await import("./pdfGenerator");
      const outputPath = `/tmp/filled_statement_${id}_${Date.now()}.pdf`;
      
      const result = await generateFilledPdf(templatePath, outputPath, job.extractedData);
      
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to generate PDF" });
      }
      
      await storage.updateJob(id, { pdfOutputPath: result.outputPath });
      
      res.json({ success: true, pdfPath: result.outputPath });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Download generated PDF
  app.get("/api/jobs/:id/download-pdf", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const job = await storage.getJob(id);
      if (!job || job.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!job.pdfOutputPath) {
        return res.status(404).json({ message: "No PDF generated yet" });
      }
      
      const fs = await import("fs");
      if (!fs.existsSync(job.pdfOutputPath)) {
        return res.status(404).json({ message: "PDF file not found" });
      }
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${job.name.replace(/[^a-zA-Z0-9]/g, '_')}_financial_statement.pdf"`);
      
      const fileStream = fs.createReadStream(job.pdfOutputPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      res.status(500).json({ message: "Failed to download PDF" });
    }
  });

  return httpServer;
}
