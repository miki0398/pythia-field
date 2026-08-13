// Why: Handle Gmail OAuth flow and read prescriptions from inbox
import { callPythia } from "./pythia-api";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/oauth/gmail/callback`;

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: any[];
    body?: { data: string };
  };
}

// Why: Initiate OAuth flow when user clicks "Connect Gmail"
export function initiateGmailOAuth() {
  const scope = "https://www.googleapis.com/auth/gmail.readonly";
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  window.location.href = authUrl.toString();
}

// Why: Exchange authorization code for access token via secure Worker endpoint
export async function exchangeCodeForToken(code: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";
  
  const response = await fetch(`${workerUrl}/gmail/token-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code,
      redirectUri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Why: Read prescription emails from Gmail inbox
export async function readPrescriptionEmails(accessToken: string): Promise<GmailMessage[]> {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:doctor OR subject:prescription",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  return data.messages || [];
}

// Why: Get full email content
export async function getEmailContent(
  messageId: string,
  accessToken: string
): Promise<GmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return await response.json();
}

// Why: Parse email body and extract prescription data with Claude
export async function extractPrescriptionFromEmail(
  email: GmailMessage,
  apiKey: string
): Promise<any> {
  const emailBody = decodeEmailBody(email);

  const systemPrompt = `Extract prescription details from this email. Return JSON:
{
  "labType": "blood test|imaging|follow-up|other",
  "urgency": "routine|urgent|stat",
  "doctorName": "extracted name",
  "prescriptionDate": "YYYY-MM-DD"
}`;

  const response = await callPythia(emailBody, systemPrompt, []);
  const responseText = response.claudeResponse?.content?.[0]?.text || "{}";
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

// Helper: Decode base64 email body
function decodeEmailBody(email: GmailMessage): string {
  if (!email.payload) return email.snippet || "";
  
  const parts = email.payload.parts || [];
  const textPart = parts.find((p: any) => p.mimeType === "text/plain");
  
  if (textPart && textPart.body?.data) {
    // Why: Use standard atob for browser base64 decode (no Buffer needed)
    return atob(textPart.body.data);
  }
  
  return email.snippet || "";
}