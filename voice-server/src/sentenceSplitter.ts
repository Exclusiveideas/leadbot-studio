/**
 * Splits streaming text into complete sentences for TTS chunking.
 * Buffers incoming text and emits complete sentences at natural boundaries.
 */
export function createSentenceSplitter(
  onSentence: (sentence: string) => void,
): {
  push: (text: string) => void;
  flush: () => void;
} {
  let buffer = "";

  const SENTENCE_END = /([.!?]+)\s+/;

  return {
    push(text: string): void {
      buffer += text;

      let match: RegExpExecArray | null;
      while ((match = SENTENCE_END.exec(buffer)) !== null) {
        const sentenceEnd = match.index + match[0].length;
        const sentence = buffer.slice(0, sentenceEnd).trim();
        buffer = buffer.slice(sentenceEnd);

        if (sentence.length > 0) {
          onSentence(sentence);
        }
      }
    },

    flush(): void {
      const remaining = buffer.trim();
      if (remaining.length > 0) {
        onSentence(remaining);
      }
      buffer = "";
    },
  };
}
