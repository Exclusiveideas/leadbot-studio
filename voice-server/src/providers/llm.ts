export type VoiceLLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type VoiceLLMTool = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type VoiceLLMToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type VoiceLLMStreamParams = {
  systemPrompt: string;
  messages: VoiceLLMMessage[];
  tools?: VoiceLLMTool[];
  onChunk: (text: string) => void;
  onToolUse?: (toolCall: VoiceLLMToolCall) => void;
  signal?: AbortSignal;
};

export type VoiceLLMResult = {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
};

export type VoiceLLMProvider = {
  streamConversation(params: VoiceLLMStreamParams): Promise<VoiceLLMResult>;
};
