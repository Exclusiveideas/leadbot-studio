/**
 * Splits streaming text into complete sentences for TTS chunking.
 * Buffers incoming text and emits complete sentences at natural boundaries.
 *
 * Supports clause-level splitting at commas for faster TTS start:
 * - Short openers before comma (<=8 chars like "Sure,") → emit eagerly
 * - Long clauses before comma (>=20 chars) → split at comma
 * - Does NOT split between digits (e.g. "1,000")
 */
export function createSentenceSplitter(
  onSentence: (sentence: string) => void,
): {
  push: (text: string) => void;
  flush: () => void;
} {
  let buffer = "";

  const SENTENCE_END = /([.!?]+)\s+/;
  const COMMA_CLAUSE = /,\s+/;

  function tryEmit(): boolean {
    const sentenceMatch = SENTENCE_END.exec(buffer);
    const commaMatch = COMMA_CLAUSE.exec(buffer);

    // If no matches at all, nothing to emit
    if (!sentenceMatch && !commaMatch) return false;

    // Check if comma comes before sentence end (and is valid to split)
    if (
      commaMatch &&
      (!sentenceMatch || commaMatch.index < sentenceMatch.index)
    ) {
      const beforeComma = buffer.slice(0, commaMatch.index);

      // Don't split between digits (e.g. "1,000")
      if (
        /\d$/.test(beforeComma) &&
        /^\d/.test(buffer.slice(commaMatch.index + 1))
      ) {
        // Skip this comma, try sentence end instead
        if (sentenceMatch) {
          return emitSentence(sentenceMatch);
        }
        return false;
      }

      const clause = beforeComma.trim();

      // Short opener (<=8 chars) → emit eagerly
      if (clause.length > 0 && clause.length <= 8) {
        const emitted = buffer.slice(0, commaMatch.index + 1).trim();
        buffer = buffer.slice(commaMatch.index + commaMatch[0].length);
        onSentence(emitted);
        return true;
      }

      // Long clause (>=20 chars) → split at comma
      if (clause.length >= 20) {
        const emitted = buffer.slice(0, commaMatch.index + 1).trim();
        buffer = buffer.slice(commaMatch.index + commaMatch[0].length);
        onSentence(emitted);
        return true;
      }

      // Medium clause (9-19 chars) → don't split at comma, try sentence end
      if (sentenceMatch) {
        return emitSentence(sentenceMatch);
      }
      return false;
    }

    // Sentence end is first (or only match)
    if (sentenceMatch) {
      return emitSentence(sentenceMatch);
    }

    return false;
  }

  function emitSentence(match: RegExpExecArray): boolean {
    const sentenceEnd = match.index + match[0].length;
    const sentence = buffer.slice(0, sentenceEnd).trim();
    buffer = buffer.slice(sentenceEnd);

    if (sentence.length > 0) {
      onSentence(sentence);
      return true;
    }
    return false;
  }

  function drain(): void {
    while (tryEmit()) {
      // keep emitting
    }
  }

  return {
    push(text: string): void {
      buffer += text;
      drain();
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
