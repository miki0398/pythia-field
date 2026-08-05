import { supabase } from "./supabase-client";
async function saveConversationToSupabase(
  patientId: string,
  role: "user" | "assistant",
  content: string,
  nfbSignals?: Record<string, any>
) {
  try {
    const { error } = await supabase.from("conversations").insert({
      patient_id: patientId,
      role: role,
      content: content,
      nfb_signals: nfbSignals,
    });

    if (error) console.error("Save error:", error);
  } catch (error) {
    console.error("Failed to save conversation:", error);
  }
}

const WORKER_URL = "http://localhost:8787";

export async function callPythia(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<any> {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: "user", content: userMessage }
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker error: ${response.statusText}`);
  }

  return await response.json();
}
export { saveConversationToSupabase };
