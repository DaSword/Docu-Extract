import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { formFieldDefinitions, type Document, type ExtractionJob } from "@shared/schema";
import { ObjectStorageService } from "./replit_integrations/object_storage";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const objectStorage = new ObjectStorageService();

// Process a single document and extract fields
export async function processDocument(doc: Document, formType: string): Promise<Record<string, unknown>> {
  try {
    await storage.updateDocument(doc.id, { status: "processing" });

    // Get the file from object storage
    const objectFile = await objectStorage.getObjectEntityFile(doc.objectPath);
    const [fileBuffer] = await objectFile.download();
    const base64Data = fileBuffer.toString("base64");

    // Get the field definitions for this form type
    const fields = formFieldDefinitions[formType] || formFieldDefinitions.custom;
    const fieldList = fields.map(f => `- ${f.name} (${f.key}): ${f.required ? "required" : "optional"}`).join("\n");

    // Create the prompt for extraction
    const prompt = `You are a document extraction expert. Analyze this document and extract the following fields:

${fieldList}

Respond ONLY with a valid JSON object containing the extracted values. Use null for fields that cannot be found.
Also include a "documentType" field with your classification of the document type (e.g., "invoice", "contract", "receipt", "letter", etc.).

Example response format:
{
  "documentType": "invoice",
  "invoiceNumber": "INV-001",
  "vendorName": "Acme Corp",
  ...
}`;

    // Call Gemini with the document
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: doc.mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse extraction response");
    }

    const extractedFields = JSON.parse(jsonMatch[0]);
    const documentType = extractedFields.documentType || "unknown";
    delete extractedFields.documentType;

    await storage.updateDocument(doc.id, {
      status: "completed",
      documentType,
      extractedFields,
    });

    return extractedFields;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await storage.updateDocument(doc.id, {
      status: "failed",
      error: errorMsg,
    });
    throw error;
  }
}

// Aggregate extracted data from all documents
export function aggregateExtractedData(
  documents: Document[],
  formType: string
): { data: Record<string, unknown>; missingFields: string[] } {
  const fields = formFieldDefinitions[formType] || formFieldDefinitions.custom;
  const aggregated: Record<string, unknown> = {};
  const missingFields: string[] = [];

  // Merge all extracted fields, preferring non-null values
  for (const doc of documents) {
    if (doc.extractedFields) {
      for (const [key, value] of Object.entries(doc.extractedFields)) {
        if (value !== null && value !== undefined && value !== "") {
          if (!aggregated[key]) {
            aggregated[key] = value;
          }
        }
      }
    }
  }

  // Check for missing required fields
  for (const field of fields) {
    if (field.required && !aggregated[field.key]) {
      missingFields.push(field.key);
    }
  }

  return { data: aggregated, missingFields };
}

// Process all documents in a job
export async function processJob(jobId: number): Promise<void> {
  const job = await storage.getJob(jobId);
  if (!job) throw new Error("Job not found");

  await storage.updateJob(jobId, { status: "processing" });

  try {
    const docs = await storage.getDocumentsByJob(jobId);
    
    // Process documents in parallel (but limit concurrency)
    const results = await Promise.allSettled(
      docs.map(doc => processDocument(doc, job.targetFormType))
    );

    // Get updated documents
    const updatedDocs = await storage.getDocumentsByJob(jobId);
    
    // Aggregate the results
    const { data, missingFields } = aggregateExtractedData(updatedDocs, job.targetFormType);

    // Update job with aggregated data
    await storage.updateJob(jobId, {
      status: missingFields.length > 0 ? "needs_info" : "completed",
      extractedData: data,
      missingFields,
    });

    // If there are missing fields, add an agent message
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(key => {
        const field = formFieldDefinitions[job.targetFormType]?.find(f => f.key === key);
        return field?.name || key;
      });

      await storage.createMessage({
        jobId,
        role: "agent",
        content: `I've processed your documents but couldn't find some required information:\n\n${fieldNames.map(f => `- ${f}`).join("\n")}\n\nCould you please upload additional documents that contain this information, or provide the details manually?`,
        metadata: { missingFields },
      });
    } else {
      await storage.createMessage({
        jobId,
        role: "agent",
        content: "I've successfully extracted all the required information from your documents. Please review the form on the right to verify the data is correct.",
        metadata: {},
      });
    }
  } catch (error) {
    await storage.updateJob(jobId, { status: "failed" });
    throw error;
  }
}

// Handle user message and generate agent response
export async function handleUserMessage(jobId: number, userMessage: string): Promise<string> {
  const job = await storage.getJobWithDetails(jobId);
  if (!job) throw new Error("Job not found");

  // Get conversation history
  const history = job.messages.map(m => ({
    role: m.role === "agent" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Build context about the current state
  const fields = formFieldDefinitions[job.targetFormType] || formFieldDefinitions.custom;
  const currentData = job.extractedData || {};
  const docSummary = job.documents.map(d => 
    `- ${d.filename}: ${d.status} ${d.documentType ? `(${d.documentType})` : ""}`
  ).join("\n");

  const systemPrompt = `You are a helpful document extraction assistant. You help users extract and verify information from documents like invoices, contracts, and receipts.

Current extraction job: "${job.name}"
Form type: ${job.targetFormType}
Status: ${job.status}

Documents uploaded:
${docSummary}

Currently extracted data:
${JSON.stringify(currentData, null, 2)}

Missing required fields: ${job.missingFields?.join(", ") || "None"}

Help the user by:
1. Answering questions about the extracted data
2. Explaining what information is still needed
3. Accepting manual corrections or additions to the form data
4. Suggesting what documents might contain missing information

If the user provides specific values for missing fields, acknowledge this and suggest they update the form directly.
Keep responses concise and helpful.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...history,
      { role: "user", parts: [{ text: userMessage }] },
    ],
  });

  return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
}
