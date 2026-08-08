import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { callPythia } from "./pythia-api";

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const textractClient = new TextractClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET;

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
    // Step 1: Upload to S3
    const s3Key = `prescriptions/${Date.now()}-${file.name}`;
    await uploadToS3(file, s3Key);

    // Step 2: Extract text with Textract
    const rawText = await extractTextWithTextract(s3Key);

    // Step 3: Parse with Claude
    const parsed = await parsePrescriptionWithClaude(rawText);

    // Step 4: Clean up S3
    await deleteFromS3(s3Key);

    return parsed;
  } catch (error) {
    console.error("Document parsing error:", error);
    throw error;
  }
}

async function uploadToS3(file: File, s3Key: string): Promise<void> {
  const buffer = await file.arrayBuffer();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: new Uint8Array(buffer),
    ContentType: file.type,
  });

  await s3Client.send(command);
  console.log(`Uploaded to S3: ${s3Key}`);
}

async function extractTextWithTextract(s3Key: string): Promise<string> {
  const command = new AnalyzeDocumentCommand({
    Document: {
      S3Object: {
        Bucket: BUCKET_NAME,
        Name: s3Key,
      },
    },
    FeatureTypes: ["TABLES", "FORMS"],
  });

  const response = await textractClient.send(command);
  
  let extractedText = "";
  if (response.Blocks) {
    for (const block of response.Blocks) {
      if (block.BlockType === "LINE" && block.Text) {
        extractedText += block.Text + "\n";
      }
    }
  }

  console.log("Extracted text:", extractedText.substring(0, 200) + "...");
  return extractedText;
}

async function parsePrescriptionWithClaude(rawText: string): Promise<ExtractedPrescription> {
  const systemPrompt = `You are a medical document parser. Extract prescription details from text.
Return ONLY valid JSON:
{
  "labType": "blood test|imaging|follow-up|other",
  "dosage": "string or null",
  "frequency": "string or null",
  "duration": "string or null",
  "urgency": "routine|urgent|stat",
  "doctorName": "extracted name",
  "prescriptionDate": "YYYY-MM-DD",
  "confidence": 0.0-1.0
}`;

  const response = await callPythia(
    rawText,
    systemPrompt,
    []
  );

  const responseText = response.claudeResponse?.content?.[0]?.text || "{}";
  
  // Extract JSON from response (in case there's extra text)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    labType: parsed.labType || "other",
    dosage: parsed.dosage,
    frequency: parsed.frequency,
    duration: parsed.duration,
    urgency: parsed.urgency || "routine",
    doctorName: parsed.doctorName || "Unknown",
    prescriptionDate: parsed.prescriptionDate || new Date().toISOString().split('T')[0],
    confidence: parsed.confidence || 0.5,
    rawText: rawText,
  };
}

async function deleteFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
  console.log(`Deleted from S3: ${s3Key}`);
}