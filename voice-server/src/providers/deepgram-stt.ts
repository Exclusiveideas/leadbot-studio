import {
  createClient,
  LiveTranscriptionEvents,
  type DeepgramClient,
  type ListenLiveClient,
} from "@deepgram/sdk";
import type { STTProvider, STTConfig, STTTranscriptEvent } from "./stt.js";

const MAX_RECONNECT_ATTEMPTS = 3;

export function createDeepgramSTT(apiKey: string): STTProvider {
  let client: DeepgramClient;
  let connection: ListenLiveClient | null = null;
  let savedConfig: STTConfig | null = null;
  let reconnectAttempt = 0;
  let intentionalClose = false;
  let isReconnecting = false;

  const transcriptHandlers: Array<(event: STTTranscriptEvent) => void> = [];
  const speechStartedHandlers: Array<() => void> = [];
  const errorHandlers: Array<(error: Error) => void> = [];

  function setupConnectionHandlers(
    conn: ListenLiveClient,
    resolve?: () => void,
    reject?: (err: Error) => void,
  ): void {
    conn.on(LiveTranscriptionEvents.Open, () => {
      reconnectAttempt = 0;
      if (resolve) resolve();
    });

    conn.on(LiveTranscriptionEvents.Error, (error) => {
      const err = error instanceof Error ? error : new Error(String(error));
      for (const handler of errorHandlers) handler(err);
      if (reject) reject(err);
    });

    conn.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alternative = data.channel?.alternatives?.[0];
      if (!alternative) return;

      const event: STTTranscriptEvent = {
        text: alternative.transcript || "",
        isFinal: data.is_final ?? false,
        speechFinal: data.speech_final ?? false,
        confidence: alternative.confidence ?? 0,
        timestamp: Date.now(),
      };

      if (event.text.trim().length > 0 || event.speechFinal) {
        for (const handler of transcriptHandlers) handler(event);
      }
    });

    conn.on(LiveTranscriptionEvents.SpeechStarted, () => {
      for (const handler of speechStartedHandlers) handler();
    });

    conn.on(LiveTranscriptionEvents.Close, () => {
      connection = null;
      if (!intentionalClose && !isReconnecting) {
        attemptReconnect();
      }
    });
  }

  function attemptReconnect(): void {
    if (
      !savedConfig ||
      reconnectAttempt >= MAX_RECONNECT_ATTEMPTS ||
      intentionalClose
    ) {
      if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
        const err = new Error(
          `Deepgram STT reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`,
        );
        for (const handler of errorHandlers) handler(err);
      }
      return;
    }

    reconnectAttempt++;
    isReconnecting = true;
    const delay = 500 * Math.pow(2, reconnectAttempt - 1);

    console.log(
      `[DeepgramSTT] Reconnecting (attempt ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`,
    );

    setTimeout(async () => {
      try {
        const config = savedConfig!;
        const newConnection = client.listen.live({
          model: "nova-3",
          language: config.language || "en",
          encoding: config.encoding || "linear16",
          sample_rate: config.sampleRate || 16000,
          channels: 1,
          punctuate: true,
          smart_format: true,
          interim_results: true,
          endpointing: 500,
          utterance_end_ms: 1000,
          vad_events: true,
        });

        await new Promise<void>((resolve, reject) => {
          setupConnectionHandlers(newConnection, resolve, reject);
        });

        connection = newConnection;
        isReconnecting = false;
        console.log("[DeepgramSTT] Reconnected successfully");
      } catch (err) {
        console.error("[DeepgramSTT] Reconnection attempt failed:", err);
        isReconnecting = false;
        attemptReconnect();
      }
    }, delay);
  }

  return {
    async connect(config: STTConfig): Promise<void> {
      client = createClient(apiKey);
      savedConfig = config;
      reconnectAttempt = 0;
      intentionalClose = false;
      isReconnecting = false;

      connection = client.listen.live({
        model: "nova-3",
        language: config.language || "en",
        encoding: config.encoding || "linear16",
        sample_rate: config.sampleRate || 16000,
        channels: 1,
        punctuate: true,
        smart_format: true,
        interim_results: true,
        endpointing: 500,
        utterance_end_ms: 1000,
        vad_events: true,
      });

      return new Promise<void>((resolve, reject) => {
        if (!connection) {
          reject(new Error("Failed to create Deepgram connection"));
          return;
        }

        setupConnectionHandlers(connection, resolve, reject);
      });
    },

    sendAudio(audio: Buffer): void {
      if (connection) {
        const ab = audio.buffer.slice(
          audio.byteOffset,
          audio.byteOffset + audio.byteLength,
        );
        connection.send(ab as ArrayBuffer);
      }
    },

    onTranscript(handler: (event: STTTranscriptEvent) => void): void {
      transcriptHandlers.push(handler);
    },

    onSpeechStarted(handler: () => void): void {
      speechStartedHandlers.push(handler);
    },

    onError(handler: (error: Error) => void): void {
      errorHandlers.push(handler);
    },

    close(): void {
      intentionalClose = true;
      if (connection) {
        connection.requestClose();
        connection = null;
      }
    },
  };
}
