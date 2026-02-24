import type { VoiceLLMProvider, VoiceLLMMessage } from "./providers/llm.js";

export function isSpeculativeMatch(
  interimText: string,
  finalText: string,
): boolean {
  const interimTrimmed = interimText.toLowerCase().trim();
  const finalTrimmed = finalText.toLowerCase().trim();

  if (interimTrimmed.length === 0 || finalTrimmed.length === 0) return false;

  const interimWords = interimTrimmed.split(/\s+/);
  const finalWords = finalTrimmed.split(/\s+/);

  const finalSet = new Set(finalWords);
  let matchCount = 0;
  for (const word of interimWords) {
    if (finalSet.has(word)) matchCount++;
  }

  const overlap = matchCount / Math.max(interimWords.length, finalWords.length);
  return overlap > 0.8;
}

type SpeculativeResult = {
  interimText: string;
  response: string;
};

export function createSpeculativeEngine(llmProvider: VoiceLLMProvider) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentAbort: AbortController | null = null;
  let cachedResult: SpeculativeResult | null = null;

  function cancelAll(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
    cachedResult = null;
  }

  function speculate(
    interimText: string,
    systemPrompt: string,
    messages: VoiceLLMMessage[],
  ): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }

    debounceTimer = setTimeout(async () => {
      const abort = new AbortController();
      currentAbort = abort;

      try {
        let content = "";
        await llmProvider.streamConversation({
          systemPrompt,
          messages: [...messages, { role: "user", content: interimText }],
          onChunk: (chunk) => {
            content += chunk;
          },
          signal: abort.signal,
        });

        if (!abort.signal.aborted) {
          cachedResult = { interimText, response: content };
        }
      } catch {
        // Abort or error — ignore
      } finally {
        if (currentAbort === abort) {
          currentAbort = null;
        }
      }
    }, 400);
  }

  function getResult(finalText: string): string | null {
    if (!cachedResult) return null;
    if (isSpeculativeMatch(cachedResult.interimText, finalText)) {
      const response = cachedResult.response;
      cachedResult = null;
      return response;
    }
    return null;
  }

  return { speculate, getResult, cancelAll };
}
