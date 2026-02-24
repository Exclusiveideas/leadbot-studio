export type STTTranscriptEvent = {
  text: string;
  isFinal: boolean;
  speechFinal: boolean;
  confidence: number;
  timestamp: number;
};

export type STTConfig = {
  sampleRate: number;
  encoding: string;
  language: string;
};

export type STTProvider = {
  connect(config: STTConfig): Promise<void>;
  sendAudio(audio: Buffer): void;
  onTranscript(handler: (event: STTTranscriptEvent) => void): void;
  onSpeechStarted(handler: () => void): void;
  onError(handler: (error: Error) => void): void;
  close(): void;
};
