export type TTSVoice = {
  id: string;
  name: string;
  previewUrl?: string;
  accent?: string;
  gender?: string;
};

export type TTSConfig = {
  outputFormat?: string;
  stability?: number;
  similarityBoost?: number;
};

export type TTSProvider = {
  synthesize(
    text: string,
    voiceId: string,
    config?: TTSConfig,
  ): AsyncIterable<Buffer>;
  listVoices(): Promise<TTSVoice[]>;
};
