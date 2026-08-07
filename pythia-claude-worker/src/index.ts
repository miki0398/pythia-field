import Anthropic from "@anthropic-ai/sdk";
import { classifyALCSIntent, type ALCSIntent } from "./alcs-intent-classifier";
import { handleHealthcareCoordination } from "./healthcare-coordinator";

interface Env {
  ANTHROPIC_API_KEY: string;
  ELEVENLABS_API_KEY: string;
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