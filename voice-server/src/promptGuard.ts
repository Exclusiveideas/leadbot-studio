export type PromptGuardResult = {
  blocked: boolean;
  response: string;
};

const JAILBREAK_PATTERNS = [
  /\b(dan|do\s*anything\s*now)\s*(mode|prompt|jailbreak)?/i,
  /\bignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|guidelines?|constraints?)/i,
  /\bforget\s+(all\s+)?(your\s+)?(instructions?|rules?|training|guidelines?)/i,
  /\bdisregard\s+(all\s+)?((your\s+)?(previous|prior)\s+)?(instructions?|rules?)/i,
  /\byou\s+are\s+now\s+(a|an|in)\s+(unrestricted|unfiltered|evil|jailbroken)/i,
  /\bpretend\s+(you\s+)?(have\s+no|there\s+are\s+no)\s+(rules?|restrictions?|limits?)/i,
  /\bact\s+as\s+if\s+you\s+have\s+no\s+(ethical|safety|moral)\s+(guidelines?|restrictions?)/i,
  /\[\s*system\s*\]|\[\s*INST\s*\]|<\|im_start\|>|<\|system\|>/i,
];

const SYSTEM_PROMPT_LEAK_PATTERNS = [
  /\b(show|reveal|display|print|output|repeat|tell\s+me)\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i,
  /\bwhat\s+(are|is)\s+your\s+(initial|system|original)\s+(instructions?|prompt)/i,
  /\brepeat\s+(your\s+)?(initial|system|first)\s+(instructions?|prompt|message)/i,
  /\b(dump|leak|expose)\s+(the\s+)?(system|initial)\s+(prompt|instructions?)/i,
];

const ROLE_MANIPULATION_PATTERNS = [
  /\byou\s+are\s+now\s+(a|an)\s+(hacker|attacker|villain|evil)/i,
  /\b(pretend|imagine|roleplay|act)\s+(to\s+be|as|like)\s+(a|an)\s+(hacker|malicious|evil)/i,
  /\bswitch\s+(to|into)\s+(evil|unrestricted|unfiltered)\s+mode/i,
];

const DATA_EXTRACTION_PATTERNS = [
  /\b(show|give|list|access)\s+(me\s+)?(all\s+)?(other\s+)?(users?'?|clients?'?|callers?'?)\s+(data|documents?|info|information|calls?|details?)/i,
  /\baccess\s+(data|documents?|info|calls?)\s+(from|of)\s+other\s+(users?|callers?|clients?)/i,
  /\b(bypass|skip|ignore)\s+(the\s+)?(access|permission|authorization)\s+(check|control|restriction)/i,
];

const BLOCKED_RESPONSES: Record<string, string> = {
  jailbreak:
    "I'm here to help you with your call today. Is there something specific I can assist you with?",
  system_prompt_leak:
    "I'd be happy to tell you about what I can help with. I can answer questions about our business, schedule appointments, and connect you with our team. How can I help?",
  role_manipulation:
    "I'm a virtual receptionist here to help you. What can I do for you today?",
  data_extraction:
    "I can only help with your own inquiry. How can I assist you today?",
};

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function checkVoicePromptInjection(text: string): PromptGuardResult {
  if (matchesAny(text, JAILBREAK_PATTERNS)) {
    return { blocked: true, response: BLOCKED_RESPONSES.jailbreak };
  }

  if (matchesAny(text, SYSTEM_PROMPT_LEAK_PATTERNS)) {
    return { blocked: true, response: BLOCKED_RESPONSES.system_prompt_leak };
  }

  if (matchesAny(text, ROLE_MANIPULATION_PATTERNS)) {
    return { blocked: true, response: BLOCKED_RESPONSES.role_manipulation };
  }

  if (matchesAny(text, DATA_EXTRACTION_PATTERNS)) {
    return { blocked: true, response: BLOCKED_RESPONSES.data_extraction };
  }

  return { blocked: false, response: "" };
}
