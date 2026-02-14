const THINKING_SYNONYMS = [
  "Thinking...",
  "Processing...",
  "Analyzing...",
  "Considering...",
  "Evaluating...",
  "Pondering...",
  "Contemplating...",
  "Reflecting...",
  "Reasoning...",
  "Deliberating...",
  "Examining...",
  "Assessing...",
  "Reviewing...",
  "Calculating...",
  "Formulating...",
] as const;

const THINKING_SYNONYMS_SET = new Set(THINKING_SYNONYMS);

export const getRandomThinkingText = (): string => {
  const randomIndex = Math.floor(Math.random() * THINKING_SYNONYMS.length);
  return THINKING_SYNONYMS[randomIndex];
};

export const isThinkingMessage = (content: string): boolean => {
  return THINKING_SYNONYMS_SET.has(content);
};
