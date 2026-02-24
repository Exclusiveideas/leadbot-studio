export type DetectedTone =
  | "neutral"
  | "frustrated"
  | "confused"
  | "urgent"
  | "friendly";

const TONE_PATTERNS: Array<{ tone: DetectedTone; patterns: RegExp[] }> = [
  {
    tone: "frustrated",
    patterns: [
      /\bridiculous\b/i,
      /\bbeen waiting\b/i,
      /\bdoesn'?t work\b/i,
      /\btired of\b/i,
      /\bwaste of time\b/i,
      /\bunacceptable\b/i,
      /\bfed up\b/i,
    ],
  },
  {
    tone: "confused",
    patterns: [
      /\bdon'?t understand\b/i,
      /\bwhat do you mean\b/i,
      /\bnot sure\b/i,
      /\bhuh\??/i,
      /\bconfused\b/i,
      /\bmakes no sense\b/i,
    ],
  },
  {
    tone: "urgent",
    patterns: [
      /\bemergency\b/i,
      /\bright now\b/i,
      /\basap\b/i,
      /\bimmediately\b/i,
      /\burgent\b/i,
    ],
  },
  {
    tone: "friendly",
    patterns: [
      /\bthanks so much\b/i,
      /\byou'?ve been great\b/i,
      /\bappreciate\b/i,
      /\bthank you so much\b/i,
      /\bwonderful\b/i,
    ],
  },
];

const TONE_INSTRUCTIONS: Record<DetectedTone, string> = {
  neutral: "",
  frustrated:
    "The caller sounds frustrated. Acknowledge their frustration, apologize for any inconvenience, and focus on resolving their issue efficiently.",
  confused:
    "The caller seems confused. Slow down, use simpler language, and offer to explain step by step.",
  urgent:
    "The caller has an urgent need. Be direct and efficient. Prioritize getting them to a solution or the right person quickly.",
  friendly:
    "The caller is being warm and friendly. Match their positive energy and be personable.",
};

export function detectTone(text: string): DetectedTone {
  for (const { tone, patterns } of TONE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return tone;
      }
    }
  }
  return "neutral";
}

export function getToneInstruction(tone: DetectedTone): string {
  return TONE_INSTRUCTIONS[tone];
}
