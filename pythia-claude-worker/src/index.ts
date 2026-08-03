import Anthropic from "@anthropic-ai/sdk";
import { classifyALCSIntent, type ALCSIntent } from "./alcs-intent-classifier.ts";
import { handleHealthcareCoordination } from "./healthcare-coordinator.ts";
import type { ExportedHandler } from "cloudflare:workers";

interface Env {
  ANTHROPIC_API_KEY: string;
  ELEVENLABS_API_KEY: string;
}

async function synthesizeVoice(
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

  return await response.arrayBuffer();
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
      return { status: "pending", message: "Tool not yet implemented" };
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

      // Classify intent from user message
      const intent = await classifyALCSIntent(
        body.messages[body.messages.length - 1].content,
        apiKey
      );

      // If ALCS action needed, execute it
      let alcsResult = null;
      if (intent.toolType !== "none") {
        alcsResult = await executeALCSTool(intent, apiKey);
      }

      // Return both Claude response AND ALCS result
      return new Response(
        JSON.stringify({
          claudeResponse: response,
          alcsAction: alcsResult,
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
} satisfies ExportedHandler<Env>;