import { useState } from "react";
import { uploadAndParseDocument, type ExtractedPrescription } from "../services/document-parser";
import { saveConversationToSupabase } from "../services/pythia-api";

export function PrescriptionUpload({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedPrescription | null>(null);
  const [error, setError] = useState("");

  // Why: Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  // Why: Upload file, extract text with Textract, parse with Claude, save to Supabase
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Parse document (Textract + Claude)
      const parsed = await uploadAndParseDocument(file);
      setResult(parsed);

      // Step 2: Save to Supabase for care team
      await saveConversationToSupabase(
        "550e8400-e29b-41d4-a716-446655440000", // Owen's patient ID
        "assistant",
        `Prescription extracted: ${parsed.labType}, Urgency: ${parsed.urgency}, Confidence: ${Math.round(parsed.confidence * 100)}%`
      );

      setError("");
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(26, 92, 107, 0.95)',
      border: '2px solid rgba(184, 150, 46, 0.6)',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
      color: '#e8d4b8'
    }}>
      <h2 style={{ margin: '0 0 15px 0', color: '#f0d080' }}>Upload Prescription</h2>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        disabled={loading}
        style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '6px',
          border: '1px solid #b8962e',
          background: 'rgba(0,0,0,0.3)',
          color: '#e8d4b8'
        }}
      />

      {file && (
        <p style={{ fontSize: '14px', color: '#b8962e', marginBottom: '15px' }}>
          Selected: {file.name}
        </p>
      )}

      {error && (
        <div style={{
          padding: '10px',
          background: 'rgba(255, 0, 0, 0.2)',
          borderRadius: '6px',
          marginBottom: '15px',
          color: '#ff6b6b'
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          background: 'rgba(184, 150, 46, 0.1)',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <strong>Extracted Data:</strong><br/>
          Lab Type: {result.labType}<br/>
          Urgency: {result.urgency}<br/>
          Doctor: {result.doctorName}<br/>
          Confidence: {Math.round(result.confidence * 100)}%
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: '10px 20px',
          background: '#b8962e',
          color: '#1a5c6b',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          marginBottom: '10px'
        }}
      >
        {loading ? "Parsing..." : "Upload & Parse"}
      </button>

      <button
        onClick={onClose}
        style={{
          padding: '8px',
          background: 'transparent',
          color: '#b8962e',
          border: '1px solid #b8962e',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  );
}