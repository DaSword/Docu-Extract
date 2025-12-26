import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { financialStatementSchema, type Document, type ExtractionJob, type FormField } from "@shared/schema";
import { ObjectStorageService } from "./replit_integrations/object_storage";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const objectStorage = new ObjectStorageService();

function buildExtractionPrompt(fields: FormField[]): string {
  const fieldDescriptions = fields.map(f => 
    `- "${f.id}": ${f.label} (${f.type}${f.required ? ", required" : ""}). ${f.description || ""}`
  ).join("\n");

  return `You are a document extraction expert specializing in financial and legal documents.
Your task is to extract specific information from the provided document to fill out a Massachusetts Court Financial Statement form.

Here are the fields to extract:

${fieldDescriptions}

Instructions:
1. Carefully analyze the document for any information that matches these fields.
2. For number fields, extract just the numeric value (e.g., "1500.00" not "$1,500.00").
3. For date fields, use MM/DD/YYYY format.
4. If a field cannot be found in the document, use null.
5. Be as accurate as possible - this information will be used in legal proceedings.

Respond ONLY with a valid JSON object containing the extracted values. Example:
{
  "p1_your_name": "John Smith",
  "p1_income_2a_base_pay": "1500.00",
  "p1_date_of_birth": "01/15/1980",
  "p1_social_security_no": null
}`;
}

export async function processDocument(doc: Document): Promise<Record<string, string>> {
  try {
    await storage.updateDocument(doc.id, { status: "processing" });

    const objectFile = await objectStorage.getObjectEntityFile(doc.objectPath);
    const [fileBuffer] = await objectFile.download();
    const base64Data = fileBuffer.toString("base64");

    const prompt = buildExtractionPrompt(financialStatementSchema.fields);

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
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse extraction response");
    }

    const extractedFields = JSON.parse(jsonMatch[0]) as Record<string, string>;
    
    const cleanedFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(extractedFields)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanedFields[key] = String(value);
      }
    }

    const documentType = detectDocumentType(cleanedFields);

    await storage.updateDocument(doc.id, {
      status: "completed",
      documentType,
      extractedFields: cleanedFields,
    });

    return cleanedFields;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await storage.updateDocument(doc.id, {
      status: "failed",
      error: errorMsg,
    });
    throw error;
  }
}

function detectDocumentType(fields: Record<string, string>): string {
  const hasPersonalInfo = fields.p1_your_name || fields.p1_social_security_no;
  const hasIncome = fields.p1_income_2a_base_pay || fields.p1_income_2r_total;
  const hasEmployment = fields.p1_employer || fields.p1_occupation;
  
  if (hasIncome && hasEmployment) return "pay_stub";
  if (hasPersonalInfo && !hasIncome) return "id_document";
  if (hasIncome) return "financial_document";
  return "supporting_document";
}

export function aggregateExtractedData(
  documents: Document[]
): { data: Record<string, string>; missingFields: string[] } {
  const aggregated: Record<string, string> = {};
  const missingFields: string[] = [];

  for (const doc of documents) {
    if (doc.extractedFields) {
      for (const [key, value] of Object.entries(doc.extractedFields)) {
        if (value !== null && value !== undefined && value !== "") {
          if (!aggregated[key]) {
            aggregated[key] = String(value);
          }
        }
      }
    }
  }

  for (const field of financialStatementSchema.fields) {
    if (field.required && !aggregated[field.id]) {
      missingFields.push(field.id);
    }
  }

  return { data: aggregated, missingFields };
}

export async function processJob(jobId: number): Promise<void> {
  const job = await storage.getJob(jobId);
  if (!job) throw new Error("Job not found");

  await storage.updateJob(jobId, { status: "processing" });

  try {
    const docs = await storage.getDocumentsByJob(jobId);
    
    const results = await Promise.allSettled(
      docs.map(doc => processDocument(doc))
    );

    const updatedDocs = await storage.getDocumentsByJob(jobId);
    const { data, missingFields } = aggregateExtractedData(updatedDocs);

    await storage.updateJob(jobId, {
      status: missingFields.length > 0 ? "needs_info" : "completed",
      extractedData: data,
      missingFields,
    });

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(id => {
        const field = financialStatementSchema.fields.find(f => f.id === id);
        return field?.label || id;
      });

      await storage.createMessage({
        jobId,
        role: "agent",
        content: `I've processed your documents but couldn't find some required information:\n\n${fieldLabels.map(f => `- ${f}`).join("\n")}\n\nPlease upload additional documents or fill in these fields manually in the form.`,
        metadata: { missingFields },
      });
    } else {
      await storage.createMessage({
        jobId,
        role: "agent",
        content: "I've extracted all the required information from your documents. Please review the form and make any corrections before generating the PDF.",
        metadata: {},
      });
    }
  } catch (error) {
    await storage.updateJob(jobId, { status: "failed" });
    throw error;
  }
}

export async function handleUserMessage(jobId: number, userMessage: string): Promise<string> {
  const job = await storage.getJobWithDetails(jobId);
  if (!job) throw new Error("Job not found");

  const history = job.messages.map(m => ({
    role: m.role === "agent" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const currentData = job.extractedData || {};
  const docSummary = job.documents.map(d => 
    `- ${d.filename}: ${d.status} ${d.documentType ? `(${d.documentType})` : ""}`
  ).join("\n");

  const missingFieldLabels = (job.missingFields || []).map(id => {
    const field = financialStatementSchema.fields.find(f => f.id === id);
    return field?.label || id;
  });

  const systemPrompt = `You are a helpful assistant for filling out a Massachusetts Court Financial Statement form.

Current job: "${job.name}"
Status: ${job.status}

Documents uploaded:
${docSummary}

Currently extracted data:
${JSON.stringify(currentData, null, 2)}

Missing required fields: ${missingFieldLabels.join(", ") || "None"}

Help the user by:
1. Explaining what information is still needed and why
2. Suggesting what documents might contain missing information (pay stubs, tax returns, bank statements, etc.)
3. Answering questions about specific fields
4. Providing guidance on the form requirements

If the user provides specific values, acknowledge them and suggest they update the form directly.
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
