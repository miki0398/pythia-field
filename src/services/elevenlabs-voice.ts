const ELEVENLABS_API_KEY = "9f04943bf0658ff1384ef421b7efd426c26b77690b88ac7b43a0a0dad64b32ba";
const PYTHIA_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

console.log("API Key loaded:", ELEVENLABS_API_KEY ? "✓" : "✗");

export async function synthesizeVoice(text: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + PYTHIA_VOICE_ID, {
  method: "POST",
  headers: {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: text,
    model_id: "eleven_multilingual_v2",
  }),
});

console.log("ElevenLabs response:", response.status, response.statusText);

if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
return await response.arrayBuffer();
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
}

export async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
}