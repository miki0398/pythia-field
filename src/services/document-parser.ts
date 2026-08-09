import { callPythia } from "./pythia-api";

export interface ExtractedPrescription {
  labType: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  urgency: "routine" | "urgent" | "stat";
  doctorName: string;
  prescriptionDate: string;
  confidence: number;
  rawText: string;
}

export async function uploadAndParseDocument(file: File): Promise<ExtractedPrescription> {
  try {
    // Why: Send to Worker instead of calling AWS directly (avoids CORS)
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8787/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    // TODO: Parse with Claude when Textract returns text
    return {
      labType: "pending",
      urgency: "routine",
      doctorName: "Unknown",
      prescriptionDate: new Date().toISOString().split('T')[0],
      confidence: 0,
      rawText: "Extraction in progress...",
    };
  } catch (error) {
    console.error("Document parsing error:", error);
    throw error;
  }
}