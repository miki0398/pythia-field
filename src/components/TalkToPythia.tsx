import { useState } from "react";
import { callPythia } from "../services/pythia-api";
import { saveConversationToSupabase } from "../services/pythia-api";
import { synthesizeVoice, playAudio } from "../services/elevenlabs-voice";

const PYTHIA_MASTER_SYSTEM_PROMPT = `Your name is Pythia. You are a compassionate neurological health companion. You speak warmly and attentively. Never use medical jargon. Listen deeply.`;

// Why: Single source of truth for patient identity
const PATIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

export function TalkToPythia({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      // Why: Call Claude API with conversation history
      const response = await callPythia(
        userMessage,
        PYTHIA_MASTER_SYSTEM_PROMPT,
        messages
      );

      const assistantMessage = response.claudeResponse?.content?.[0]?.text || "I didn't understand that.";

      // Why: Single source of truth for conversation state
      const newMessages = [
        ...messages,
        { role: "user" as const, content: userMessage },
        { role: "assistant" as const, content: assistantMessage },
      ];

      setMessages(newMessages);

      // Why: Save both messages to Supabase in parallel
      await Promise.all([
        saveConversationToSupabase(PATIENT_ID, "user", userMessage),
        saveConversationToSupabase(PATIENT_ID, "assistant", assistantMessage),
      ]);

      // Why: Play voice if available, gracefully degrade if fails
      try {
        const audioBuffer = await synthesizeVoice(assistantMessage);
        await playAudio(audioBuffer);
      } catch (error) {
        console.error("Voice playback error:", error);
        // Continue even if voice fails
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(26, 92, 107, 0.95)",
        border: "2px solid rgba(184, 150, 46, 0.6)",
        borderRadius: "12px",
        padding: "20px",
        maxWidth: "500px",
        maxHeight: "600px",
        display: "flex",
        flexDirection: "column",
        color: "#e8d4b8",
      }}
    >
      <h2 style={{ margin: "0 0 15px 0", color: "#f0d080" }}>Pythia</h2>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "15px",
          padding: "10px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "8px",
          minHeight: "300px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#b8962e" }}>
            Speak with me. I'm listening.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                padding: "8px",
                background:
                  msg.role === "user"
                    ? "rgba(184, 150, 46, 0.2)"
                    : "rgba(26, 92, 107, 0.5)",
                borderRadius: "6px",
                textAlign: msg.role === "user" ? "right" : "left",
              }}
            >
              <strong>{msg.role === "user" ? "You" : "Pythia"}:</strong>{" "}
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #b8962e",
            background: "rgba(0,0,0,0.3)",
            color: "#e8d4b8",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#b8962e",
            color: "#1a5c6b",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: "10px",
          padding: "8px",
          background: "transparent",
          color: "#b8962e",
          border: "1px solid #b8962e",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );
}