import type { TTSProvider } from "./providers/tts.js";

const FILLER_PHRASES = [
  "Let me check on that for you.",
  "One moment please.",
  "Sure, let me look into that.",
];

export async function preSynthesizeFillers(
  ttsProvider: TTSProvider,
  voiceId: string,
): Promise<string[]> {
  const results = await Promise.allSettled(
    FILLER_PHRASES.map(async (phrase) => {
      const chunks: Buffer[] = [];
      for await (const chunk of ttsProvider.synthesize(phrase, voiceId, {
        outputFormat: "ulaw_8000",
      })) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString("base64");
    }),
  );

  const fillers: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      fillers.push(result.value);
    } else {
      console.warn("[FillerAudio] Failed to synthesize filler:", result.reason);
    }
  }

  console.log(
    `[FillerAudio] Pre-synthesized ${fillers.length}/${FILLER_PHRASES.length} fillers`,
  );
  return fillers;
}

export function getRandomFiller(fillers: string[]): string | null {
  if (fillers.length === 0) return null;
  return fillers[Math.floor(Math.random() * fillers.length)];
}
