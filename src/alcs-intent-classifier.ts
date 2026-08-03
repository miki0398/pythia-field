import Anthropic from "@anthropic-ai/sdk";

export type ALCSToolType = 
  | "healthcare_coordinator" 
  | "daily_life_coordinator" 
  | "emergency_response" 
  | "financial_navigator" 
  | "information_delivery" 
  | "none";

export interface ALCSIntent {
  toolType: ALCSToolType;
  action: string;
  details: Record<string, any>;
  confidence: number;
  requiresUserConfirmation: boolean;
}

const ALCS_SYSTEM_PROMPT = `You are an ALCS (Agentic Life Coordination System) intent classifier.

Your job is to understand what Owen needs from his natural language request and classify it into one of these categories:

1. **healthcare_coordinator**: Medical appointments, lab tests, calling doctors, scheduling imaging, medication orders
2. **daily_life_coordinator**: Transport, groceries, utilities, services, repairs, personal errands
3. **emergency_response**: Falls, severe symptoms, chest pain, loss of consciousness
4. **financial_navigator**: Bill questions, insurance, payments, financial assistance
5. **information_delivery**: Health information, medication info, disease information
6. **none**: Just conversation, no action needed

For each request, output ONLY valid JSON:
{
  "toolType": "healthcare_coordinator|daily_life_coordinator|emergency_response|financial_navigator|information_delivery|none",
  "action": "specific action (e.g., 'call_gp', 'find_lab', 'call_mechanic')",
  "details": { "key": "value" },
  "confidence": 0.0-1.0,
  "requiresUserConfirmation": true|false
}

Rules:
- If it's medical/health-related → healthcare_coordinator
- If it's life/personal services → daily_life_coordinator
- If immediate danger → emergency_response
- If it's money/bills → financial_navigator
- If asking for info only → information_delivery
- Otherwise → none

Emergency patterns (always use emergency_response):
- "I fell", "I'm bleeding", "I can't breathe", "chest pain", "lost consciousness"
`;

export async function classifyALCSIntent(
  userMessage: string,
  anthropicApiKey: string
): Promise<ALCSIntent> {
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    temperature: 0, // Deterministic
    system: ALCS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const jsonStr =
    response.content[0].type === "text" ? response.content[0].text : "";
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