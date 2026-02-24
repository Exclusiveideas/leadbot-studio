import type { WebSocket } from "ws";
import type { STTProvider } from "./providers/stt.js";
import type { TTSProvider } from "./providers/tts.js";
import type { VoiceLLMProvider, VoiceLLMMessage } from "./providers/llm.js";
import type { RAGProvider } from "./providers/rag.js";
import { mulawToLinear16 } from "./audioUtils.js";
import { createSentenceSplitter } from "./sentenceSplitter.js";
import { checkVoicePromptInjection } from "./promptGuard.js";
import { buildVoiceSystemPrompt } from "./voicePromptBuilder.js";
import type { VoicePromptParams } from "./voicePromptBuilder.js";

export type CallSessionConfig = {
  callSid: string;
  streamSid: string;
  chatbotId: string;
  organizationId: string;
  callerNumber: string;
  voiceId: string;
  greetingMessage: string;
  systemPrompt: string;
  maxCallDurationSeconds: number;
  silenceTimeoutSeconds: number;
  voicePromptParams?: VoicePromptParams;
};

export type CallSessionDeps = {
  sttProvider: STTProvider;
  ttsProvider: TTSProvider;
  llmProvider: VoiceLLMProvider;
  ragProvider?: RAGProvider;
  fillerAudios?: string[];
};

export type CallTranscriptEntry = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type CallSessionEvents = {
  onCallEnd?: (
    transcript: CallTranscriptEntry[],
    durationSeconds: number,
  ) => void;
  onLeadCaptured?: (data: Record<string, unknown>) => void;
  onTransferRequested?: (phoneNumber: string) => void;
  onError?: (error: Error) => void;
};

const VOICE_TOOLS = [
  {
    name: "capture_lead",
    description:
      "Capture caller's contact information as a lead. Use when the caller provides their name, email, or expresses interest in services.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Caller's full name" },
        email: { type: "string", description: "Caller's email address" },
        phone: { type: "string", description: "Caller's phone number" },
        notes: {
          type: "string",
          description: "Brief context about what the caller needs",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "transfer_call",
    description:
      "Transfer the call to a human representative. Use when the caller explicitly asks to speak with a person, or when you cannot adequately help them.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Why the call is being transferred",
        },
      },
      required: ["reason"],
    },
  },
];

export function createCallSession(
  twilioWs: WebSocket,
  config: CallSessionConfig,
  deps: CallSessionDeps,
  events: CallSessionEvents,
) {
  const { sttProvider, ttsProvider, llmProvider, ragProvider, fillerAudios } =
    deps;
  const messages: VoiceLLMMessage[] = [];
  const transcript: CallTranscriptEntry[] = [];

  let isAssistantSpeaking = false;
  let currentTTSAbort: AbortController | null = null;
  let currentLLMAbort: AbortController | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  let utteranceBuffer = "";
  let isDestroyed = false;
  let marksSent = 0;
  let marksReceived = 0;
  const startedAt = Date.now();

  function sendTwilioMedia(audioPayload: string): void {
    if (isDestroyed || twilioWs.readyState !== twilioWs.OPEN) return;
    twilioWs.send(
      JSON.stringify({
        event: "media",
        streamSid: config.streamSid,
        media: { payload: audioPayload },
      }),
    );
  }

  function clearTwilioAudio(): void {
    if (isDestroyed || twilioWs.readyState !== twilioWs.OPEN) return;
    twilioWs.send(
      JSON.stringify({ event: "clear", streamSid: config.streamSid }),
    );
  }

  function sendTwilioMark(name: string): void {
    if (isDestroyed || twilioWs.readyState !== twilioWs.OPEN) return;
    marksSent++;
    twilioWs.send(
      JSON.stringify({
        event: "mark",
        streamSid: config.streamSid,
        mark: { name },
      }),
    );
  }

  function resetSilenceTimer(): void {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
      if (isDestroyed) return;
      await speakText("Are you still there?");

      silenceTimer = setTimeout(() => {
        if (isDestroyed) return;
        speakText("It seems like you may have stepped away. Goodbye!").then(
          destroy,
        );
      }, config.silenceTimeoutSeconds * 1000);
    }, config.silenceTimeoutSeconds * 1000);
  }

  async function speakText(text: string): Promise<void> {
    if (isDestroyed) return;

    isAssistantSpeaking = true;
    currentTTSAbort = new AbortController();

    try {
      for await (const audioChunk of ttsProvider.synthesize(
        text,
        config.voiceId,
        { outputFormat: "ulaw_8000" },
      )) {
        if (currentTTSAbort.signal.aborted || isDestroyed) break;
        sendTwilioMedia(audioChunk.toString("base64"));
      }
      sendTwilioMark("speech_end");
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("[CallSession] TTS error:", err);
      }
    } finally {
      isAssistantSpeaking = false;
      currentTTSAbort = null;
    }
  }

  function cancelCurrentResponse(): void {
    if (currentLLMAbort) {
      currentLLMAbort.abort();
      currentLLMAbort = null;
    }
    if (currentTTSAbort) {
      currentTTSAbort.abort();
      currentTTSAbort = null;
    }
    clearTwilioAudio();
    isAssistantSpeaking = false;
  }

  async function handleUserUtterance(text: string): Promise<void> {
    if (isDestroyed || text.trim().length === 0) return;

    resetSilenceTimer();

    // Prompt guard check
    const guardResult = checkVoicePromptInjection(text);
    if (guardResult.blocked) {
      transcript.push({ role: "user", content: text, timestamp: Date.now() });
      transcript.push({
        role: "assistant",
        content: guardResult.response,
        timestamp: Date.now(),
      });
      await speakText(guardResult.response);
      return;
    }

    transcript.push({ role: "user", content: text, timestamp: Date.now() });
    messages.push({ role: "user", content: text });

    // Build system prompt with RAG context
    let effectiveSystemPrompt = config.systemPrompt;
    if (ragProvider && config.voicePromptParams) {
      try {
        const ragContext = await ragProvider.queryContext(
          text,
          config.chatbotId,
        );
        effectiveSystemPrompt = buildVoiceSystemPrompt({
          ...config.voicePromptParams,
          ragContext,
        });
      } catch {
        // Fall back to static system prompt
      }
    }

    // Set up filler timer
    let fillerTimer: ReturnType<typeof setTimeout> | null = null;
    let firstChunkReceived = false;

    if (fillerAudios && fillerAudios.length > 0) {
      fillerTimer = setTimeout(() => {
        if (!firstChunkReceived && !isDestroyed) {
          const filler =
            fillerAudios[Math.floor(Math.random() * fillerAudios.length)];
          sendTwilioMedia(filler);
          sendTwilioMark("filler_end");
        }
      }, 500);
    }

    currentLLMAbort = new AbortController();
    isAssistantSpeaking = true;
    let fullResponse = "";

    const splitter = createSentenceSplitter(async (sentence) => {
      if (currentLLMAbort?.signal.aborted || isDestroyed) return;
      fullResponse += (fullResponse ? " " : "") + sentence;
      await speakText(sentence);
    });

    try {
      const result = await llmProvider.streamConversation({
        systemPrompt: effectiveSystemPrompt,
        messages,
        tools: VOICE_TOOLS,
        onChunk: (chunk) => {
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            if (fillerTimer) clearTimeout(fillerTimer);
          }
          splitter.push(chunk);
        },
        onToolUse: (toolCall) => {
          if (toolCall.name === "capture_lead" && events.onLeadCaptured) {
            events.onLeadCaptured(toolCall.input);
          }
          if (toolCall.name === "transfer_call" && events.onTransferRequested) {
            const reason =
              (toolCall.input.reason as string) || "Caller requested transfer";
            events.onTransferRequested(reason);
          }
        },
        signal: currentLLMAbort.signal,
      });

      splitter.flush();

      if (
        fullResponse.trim().length === 0 &&
        result.content.trim().length > 0
      ) {
        fullResponse = result.content;
        await speakText(result.content);
      }

      if (fullResponse.trim().length > 0) {
        transcript.push({
          role: "assistant",
          content: fullResponse,
          timestamp: Date.now(),
        });
        messages.push({ role: "assistant", content: fullResponse });
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.message.includes("aborted"))
      ) {
        return;
      }
      console.error("[CallSession] LLM error:", err);
      await speakText(
        "I'm sorry, I'm having trouble processing that. Could you repeat?",
      );
    } finally {
      if (fillerTimer) clearTimeout(fillerTimer);
      isAssistantSpeaking = false;
      currentLLMAbort = null;
    }
  }

  function destroy(): void {
    if (isDestroyed) return;
    isDestroyed = true;

    if (silenceTimer) clearTimeout(silenceTimer);
    if (maxDurationTimer) clearTimeout(maxDurationTimer);
    cancelCurrentResponse();
    sttProvider.close();

    const durationSeconds = Math.ceil((Date.now() - startedAt) / 1000);
    events.onCallEnd?.(transcript, durationSeconds);
  }

  // --- Initialize ---

  async function start(): Promise<void> {
    // Connect STT
    await sttProvider.connect({
      sampleRate: 16000,
      encoding: "linear16",
      language: "en",
    });

    // Wire STT events
    sttProvider.onTranscript((event) => {
      if (event.isFinal) {
        utteranceBuffer += (utteranceBuffer ? " " : "") + event.text;
      }

      if (event.speechFinal && utteranceBuffer.trim().length > 0) {
        const utterance = utteranceBuffer.trim();
        utteranceBuffer = "";
        handleUserUtterance(utterance);
      }
    });

    sttProvider.onSpeechStarted(() => {
      if (isAssistantSpeaking) {
        cancelCurrentResponse();
      }
      resetSilenceTimer();
    });

    sttProvider.onError((err) => {
      console.error("[CallSession] STT error:", err);
      events.onError?.(err);
    });

    // Start timers
    resetSilenceTimer();
    maxDurationTimer = setTimeout(() => {
      speakText(
        "We've reached the maximum call duration. Thank you for calling. Goodbye!",
      ).then(destroy);
    }, config.maxCallDurationSeconds * 1000);

    // Speak greeting
    await speakText(config.greetingMessage);
  }

  return {
    start,
    handleTwilioMedia(payload: string): void {
      if (isDestroyed) return;
      const mulawBuffer = Buffer.from(payload, "base64");
      const pcm16 = mulawToLinear16(mulawBuffer);
      sttProvider.sendAudio(pcm16);
    },
    handleDtmf(digit: string): void {
      if (digit === "0" && events.onTransferRequested) {
        events.onTransferRequested("Caller pressed 0 for operator");
      }
    },
    handleMark(markName: string): void {
      marksReceived++;
      console.log(
        `[CallSession] Mark received: ${markName}, sent=${marksSent}, received=${marksReceived}`,
      );
    },
    destroy,
    getTranscript(): CallTranscriptEntry[] {
      return [...transcript];
    },
  };
}
