import type { TTSProvider } from "./providers/tts.js";

const FILLER_PHRASES = [
  "Let me check on that for you.",
  "One moment please.",
  "Sure, let me look into that.",
  "Good question.",
  "Let me see...",
  "Hmm, let me think about that.",
  "Right, so...",
  "Okay, let me check.",
  "Just a moment.",
  "Let me pull that up.",
];

const ACKNOWLEDGMENT_PHRASES = [
  "Mm-hmm.",
  "Okay.",
  "Sure.",
  "Got it.",
  "Right.",
];

async function synthesizePhrases(
  ttsProvider: TTSProvider,
  voiceId: string,
  phrases: string[],
  label: string,
): Promise<string[]> {
  const results = await Promise.allSettled(
    phrases.map(async (phrase) => {
      const chunks: Buffer[] = [];
      for await (const chunk of ttsProvider.synthesize(phrase, voiceId, {
        outputFormat: "ulaw_8000",
      })) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString("base64");
    }),
  );

  const audios: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      audios.push(result.value);
    } else {
      console.warn(
        `[FillerAudio] Failed to synthesize ${label}:`,
        result.reason,
      );
    }
  }

  console.log(
    `[FillerAudio] Pre-synthesized ${audios.length}/${phrases.length} ${label}`,
  );
  return audios;
}

export async function preSynthesizeFillers(
  ttsProvider: TTSProvider,
  voiceId: string,
): Promise<string[]> {
  return synthesizePhrases(ttsProvider, voiceId, FILLER_PHRASES, "fillers");
}

export async function preSynthesizeAcknowledgments(
  ttsProvider: TTSProvider,
  voiceId: string,
): Promise<string[]> {
  return synthesizePhrases(
    ttsProvider,
    voiceId,
    ACKNOWLEDGMENT_PHRASES,
    "acknowledgments",
  );
}

export function getRandomFiller(fillers: string[]): string | null {
  if (fillers.length === 0) return null;
  return fillers[Math.floor(Math.random() * fillers.length)];
}

export { FILLER_PHRASES, ACKNOWLEDGMENT_PHRASES };
