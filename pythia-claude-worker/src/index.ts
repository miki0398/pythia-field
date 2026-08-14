import Anthropic from "@anthropic-ai/sdk";
import { classifyALCSIntent, type ALCSIntent } from "./alcs-intent-classifier";
import { handleHealthcareCoordination } from "./healthcare-coordinator";

interface Env {
  ANTHROPIC_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;
  AWS_REGION: string;
  GOOGLE_OAUTH_CLIENT_ID: string;
  GOOGLE_OAUTH_CLIENT_SECRET: string;
}

async function executeALCSTool(
  intent: ALCSIntent,
  apiKey: string
): Promise<any> {
  switch (intent.toolType) {
    case "healthcare_coordinator":
      return await handleHealthcareCoordination(
        { action: intent.action as any, details: intent.details },
        { lat: 0, lng: 0 }
      );
    default:
      return null;
  }
}

async function synthesizeVoiceWithElevenLabs(
  text: string,
  voiceId: string,
  env: Env
): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs ${response.status}: ${errText}`);
  }

  return await response.arrayBuffer();
}

async function handleGmailTokenExchange(request: Request, env: Env): Promise<Response> {
  console.log("🔵 Gmail token exchange called");
  try {
    const body = await request.json() as any;
    const { code, redirectUri } = body;

    console.log("🔵 Exchanging code for token with Google...", { code: code?.substring(0, 10), redirectUri });

    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: "Missing code or redirectUri" }), { status: 400 });
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });

async function handleCalendarTokenExchange(request: Request, env: Env): Promise<Response> {
  console.log("🔵 Calendar token exchange called");
  try {
    const body = await request.json() as any;
    const { code, redirectUri } = body;

    console.log("🔵 Exchanging code for token with Google...", { code: code?.substring(0, 10), redirectUri });

    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: "Missing code or redirectUri" }), { status: 400 });
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("🔴 Google token exchange failed:", data);
      return new Response(JSON.stringify({ error: data.error_description || data.error }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🟢 Calendar token exchange successful");
    return new Response(JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("🔴 Calendar token exchange error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

    const data = await response.json() as any;

    if (!response.ok) {
      console.error("🔴 Google token exchange failed:", data);
      return new Response(JSON.stringify({ error: data.error_description || data.error }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🟢 Token exchange successful");
    return new Response(JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("🔴 Token exchange error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
async function handleDocumentUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    // TODO: Textract integration (Phase 2)
    // For now, return placeholder with file info

    return new Response(JSON.stringify({
      status: "pending",
      message: "OCR processing (Textract integration in Phase 2)",
      fileName: file.name,
      fileSize: buffer.byteLength,
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);

    if (url.pathname === "/voice") {
      try {
        const body = await request.json() as any;
        const audioBuffer = await synthesizeVoiceWithElevenLabs(
          body.text,
          body.voiceId || "21m00Tcm4TlvDq8ikWAM",
          env
        );

        return new Response(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("Voice error:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    if (url.pathname === "/gmail/token-exchange") {
      return await handleGmailTokenExchange(request, env);
    }
    if (url.pathname === "/calendar/token-exchange") {
  return await handleCalendarTokenExchange(request, env);
    }

    if (url.pathname === "/upload") {
      return await handleDocumentUpload(request, env);
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("API key not configured", { status: 500 });
    }

    try {
      const body = await request.json() as any;
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: body.max_tokens || 1024,
        system: body.system,
        messages: body.messages,
      });

      const intent = await classifyALCSIntent(
        body.messages[body.messages.length - 1].content,
        apiKey
      );

      let alcsResult = null;
      if (intent.toolType !== "none") {
        alcsResult = await executeALCSTool(intent, apiKey);
      }

      return new Response(
        JSON.stringify({
          claudeResponse: response,
          alcsResult: alcsResult,
          intent: intent,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  },
};