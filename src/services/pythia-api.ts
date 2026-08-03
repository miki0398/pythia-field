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