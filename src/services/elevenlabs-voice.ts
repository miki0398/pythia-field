const WORKER_URL = "http://localhost:8787";

export async function synthesizeVoice(text: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(WORKER_URL + "/voice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      }),
    });

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