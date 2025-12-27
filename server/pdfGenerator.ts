import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { financialStatementSchema } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GeneratePdfResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export async function generateFilledPdf(
  templatePdfPath: string,
  outputPdfPath: string,
  formData: Record<string, string>
): Promise<GeneratePdfResult> {
  const schema = {
    name: financialStatementSchema.name,
    description: financialStatementSchema.description,
    fields: financialStatementSchema.fields.map(f => ({
      id: f.id,
      label: f.label,
      type: f.type,
      pdfMapping: f.pdfMapping,
    })),
  };

  const inputData = {
    data: formData,
    schema,
  };

  const tempDataPath = path.join("/tmp", `form_data_${Date.now()}.json`);

  try {
    fs.writeFileSync(tempDataPath, JSON.stringify(inputData, null, 2));

    const scriptPath = path.join(__dirname, "fill_form.py");

    return new Promise((resolve) => {
      const python = spawn("python3", [
        scriptPath,
        templatePdfPath,
        outputPdfPath,
        tempDataPath,
      ]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      python.on("close", (code) => {
        try {
          fs.unlinkSync(tempDataPath);
        } catch (e) { }

        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || `Python script exited with code ${code}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            success: true,
            outputPath: result.outputPath,
          });
        } catch (e) {
          resolve({
            success: false,
            error: `Failed to parse output: ${stdout}`,
          });
        }
      });
    });
  } catch (error) {
    try {
      fs.unlinkSync(tempDataPath);
    } catch (e) { }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
