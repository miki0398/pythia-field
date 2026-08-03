import Anthropic from "@anthropic-ai/sdk";

export type ALCSToolType = 
  | "healthcare_coordinator" 
  | "daily_life_coordinator" 
  | "emergency_response" 
  | "none";

export interface ALCSIntent {
  toolType: ALCSToolType;
  action: string;
  details: Record<string, any>;
  confidence: number;
  requiresUserConfirmation: boolean;
}

const PYTHIA_MASTER_SYSTEM_PROMPT = `Your name is Pythia. You are a compassionate neurological health companion. You speak warmly and attentively. Never use medical jargon. Listen deeply.`;
const ALCS_SYSTEM_PROMPT = `You are an ALCS intent classifier.

Classify requests into:
1. healthcare_coordinator: Medical appointments
   Examples: "call my GP", "find a blood test lab", "schedule an MRI", "find nearest hospital"
   Actions: call_gp, find_lab, schedule_appointment, call_hospital
2. daily_life_coordinator: Personal services (transport, utilities, repairs)
3. emergency_response: Immediate danger (fall, severe pain, can't breathe)
4. none: Just conversation

Output ONLY JSON:
{
  "toolType": "healthcare_coordinator|daily_life_coordinator|emergency_response|none",
  "action": "call_gp|find_lab|schedule_appointment|call_hospital|none",
  "details": { "key": "value" },
  "confidence": 0.0-1.0,
  "requiresUserConfirmation": true|false
}`;

export async function classifyALCSIntent(
  userMessage: string,
  anthropicApiKey: string
): Promise<ALCSIntent> {
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    temperature: 0,
    system: ALCS_SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: userMessage,
    }],
  });

  const jsonStr = response.content[0].type === "text" ? response.content[0].text : "";
  const cleanJson = jsonStr.replace(/```json|```/g, "").trim();
  const intent = JSON.parse(cleanJson);

  return {
    toolType: intent.toolType,
    action: intent.action,
    details: intent.details,
    confidence: intent.confidence,
    requiresUserConfirmation: intent.requiresUserConfirmation,
  };
}