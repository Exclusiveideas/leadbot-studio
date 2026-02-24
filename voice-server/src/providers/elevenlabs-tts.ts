import type { TTSProvider, TTSConfig, TTSVoice } from "./tts.js";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = [500, 502, 503, 429];
const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.ok) return response;

    if (
      !RETRYABLE_STATUSES.includes(response.status) ||
      attempt === MAX_RETRIES
    ) {
      return response;
    }

    const delay = 200 * Math.pow(2, attempt);
    console.warn(
      `[ElevenLabsTTS] Retrying after ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES}) in ${delay}ms`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }

  throw new Error("Unreachable");
}

export function createElevenLabsTTS(apiKey: string): TTSProvider {
  return {
    async *synthesize(
      text: string,
      voiceId: string,
      config?: TTSConfig,
    ): AsyncIterable<Buffer> {
      const outputFormat = config?.outputFormat ?? "ulaw_8000";

      const response = await fetchWithRetry(
        `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream?output_format=${outputFormat}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_flash_v2_5",
            voice_settings: {
              stability: config?.stability ?? 0.5,
              similarity_boost: config?.similarityBoost ?? 0.75,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ElevenLabs TTS failed (${response.status}): ${errorText}`,
        );
      }

      if (!response.body) {
        throw new Error("ElevenLabs TTS returned no body");
      }

      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield Buffer.from(value);
        }
      } finally {
        reader.releaseLock();
      }
    },

    async listVoices(): Promise<TTSVoice[]> {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        headers: { "xi-api-key": apiKey },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs listVoices failed (${response.status})`);
      }

      const data = (await response.json()) as {
        voices: Array<{
          voice_id: string;
          name: string;
          preview_url?: string;
          labels?: { accent?: string; gender?: string };
        }>;
      };

      return data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        previewUrl: v.preview_url,
        accent: v.labels?.accent,
        gender: v.labels?.gender,
      }));
    },
  };
}
