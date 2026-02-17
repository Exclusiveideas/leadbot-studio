import { YoutubeTranscript } from "@danielxceron/youtube-transcript";
import axios from "axios";

const RAPIDAPI_CONFIG = {
  URL: "https://youtube-transcript3.p.rapidapi.com/api/transcript",
  HOST: "youtube-transcript3.p.rapidapi.com",
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
} as const;

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export const YOUTUBE_ERROR_CODES = {
  INVALID_URL: "INVALID_URL",
  RATE_LIMITED: "RATE_LIMITED",
  VIDEO_UNAVAILABLE: "VIDEO_UNAVAILABLE",
  TRANSCRIPT_DISABLED: "TRANSCRIPT_DISABLED",
  NO_TRANSCRIPT: "NO_TRANSCRIPT",
  LANGUAGE_NOT_AVAILABLE: "LANGUAGE_NOT_AVAILABLE",
  EMPTY_TRANSCRIPT: "EMPTY_TRANSCRIPT",
  FETCH_FAILED: "FETCH_FAILED",
} as const;

export type YouTubeErrorCode =
  (typeof YOUTUBE_ERROR_CODES)[keyof typeof YOUTUBE_ERROR_CODES];

export class YouTubeTranscriptError extends Error {
  constructor(
    message: string,
    public readonly code: YouTubeErrorCode,
    public readonly videoId?: string,
  ) {
    super(message);
    this.name = "YouTubeTranscriptError";
  }
}

const YOUTUBE_ERROR_MAPPING: Record<
  string,
  { message: string; code: YouTubeErrorCode }
> = {
  YoutubeTranscriptTooManyRequestError: {
    message: "Too many requests to YouTube. Please try again later.",
    code: YOUTUBE_ERROR_CODES.RATE_LIMITED,
  },
  YoutubeTranscriptVideoUnavailableError: {
    message: "Video is unavailable or private",
    code: YOUTUBE_ERROR_CODES.VIDEO_UNAVAILABLE,
  },
  YoutubeTranscriptDisabledError: {
    message: "Transcripts are disabled for this video",
    code: YOUTUBE_ERROR_CODES.TRANSCRIPT_DISABLED,
  },
  YoutubeTranscriptNotAvailableError: {
    message:
      "No English transcript available for this video. Please ensure the video has English captions or subtitles.",
    code: YOUTUBE_ERROR_CODES.NO_TRANSCRIPT,
  },
  YoutubeTranscriptNotAvailableLanguageError: {
    message: "English transcript not available for this video",
    code: YOUTUBE_ERROR_CODES.LANGUAGE_NOT_AVAILABLE,
  },
  YoutubeTranscriptEmptyError: {
    message: "Transcript is empty",
    code: YOUTUBE_ERROR_CODES.EMPTY_TRANSCRIPT,
  },
};

export function extractVideoId(urlOrId: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }

  const watchMatch = urlOrId.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (watchMatch) return watchMatch[1];

  const shortsMatch = urlOrId.match(
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  );
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = urlOrId.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

function validateYouTubeUrl(urlOrId: string): { videoId: string; url: string } {
  const trimmed = urlOrId.trim();

  if (!trimmed) {
    throw new YouTubeTranscriptError(
      "YouTube URL or video ID is required",
      YOUTUBE_ERROR_CODES.INVALID_URL,
    );
  }

  const videoId = extractVideoId(trimmed);

  if (!videoId) {
    throw new YouTubeTranscriptError(
      "Invalid YouTube URL format. Please provide a valid YouTube video URL or video ID.",
      YOUTUBE_ERROR_CODES.INVALID_URL,
    );
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

interface RapidAPITranscriptSegment {
  text: string;
  duration: string;
  offset: string;
  lang: string;
}

interface RapidAPIResponse {
  success: boolean;
  transcript: RapidAPITranscriptSegment[];
}

async function fetchFromRapidAPI(
  videoId: string,
  maxRetries = RAPIDAPI_CONFIG.MAX_RETRIES,
): Promise<TranscriptSegment[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    throw new Error("RAPIDAPI_KEY environment variable is not set");
  }

  const options = {
    method: "GET" as const,
    url: RAPIDAPI_CONFIG.URL,
    params: { videoId },
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": RAPIDAPI_CONFIG.HOST,
    },
    timeout: RAPIDAPI_CONFIG.TIMEOUT_MS,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.request<RapidAPIResponse>(options);

      if (!response.data.success || !response.data.transcript) {
        throw new Error("RapidAPI returned unsuccessful response");
      }

      return response.data.transcript.map((segment) => ({
        text: segment.text,
        offset: parseFloat(segment.offset),
        duration: parseFloat(segment.duration),
      }));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" ||
          error.code === "ETIMEDOUT" ||
          error.response?.status === 429 ||
          error.response?.status === 503 ||
          error.response?.status === 502);

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      console.log(
        `[RapidAPI] Retry attempt ${attempt}/${maxRetries} after ${backoffMs}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error("Failed to fetch from RapidAPI");
}

function mapLibraryErrorToYouTubeError(
  error: unknown,
  videoId: string,
): YouTubeTranscriptError {
  if (error instanceof YouTubeTranscriptError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "Error";

  const mappedError = YOUTUBE_ERROR_MAPPING[errorName];
  if (mappedError) {
    return new YouTubeTranscriptError(
      mappedError.message,
      mappedError.code,
      videoId,
    );
  }

  if (errorMessage.includes("Could not find captions")) {
    const captionError =
      YOUTUBE_ERROR_MAPPING.YoutubeTranscriptNotAvailableError;
    return new YouTubeTranscriptError(
      captionError.message,
      captionError.code,
      videoId,
    );
  }

  return new YouTubeTranscriptError(
    `Failed to fetch transcript: ${errorMessage}`,
    YOUTUBE_ERROR_CODES.FETCH_FAILED,
    videoId,
  );
}

async function fetchFromYouTubeLibrary(
  videoId: string,
): Promise<TranscriptSegment[]> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: "en",
  });

  if (!transcript || transcript.length === 0) {
    throw new YouTubeTranscriptError(
      "No English transcript available for this video. Please ensure the video has English captions or subtitles.",
      YOUTUBE_ERROR_CODES.NO_TRANSCRIPT,
      videoId,
    );
  }

  return transcript.map((segment) => ({
    text: segment.text,
    offset: segment.offset,
    duration: segment.duration ?? 0,
  }));
}

export async function fetchYouTubeTranscript(
  urlOrId: string,
): Promise<{ segments: TranscriptSegment[]; fullText: string }> {
  const { videoId } = validateYouTubeUrl(urlOrId);
  let segments: TranscriptSegment[] = [];

  // Try RapidAPI first
  try {
    console.log(`[YouTube Transcript] Attempting RapidAPI for ${videoId}`);
    segments = await fetchFromRapidAPI(videoId);
    console.log(
      `[YouTube Transcript] Successfully fetched from RapidAPI: ${segments.length} segments`,
    );
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error(String(error));
    console.log(
      `[YouTube Transcript] RapidAPI failed, falling back to library method:`,
      lastError.message,
    );

    // Fallback to library method
    try {
      segments = await fetchFromYouTubeLibrary(videoId);
      console.log(
        `[YouTube Transcript] Successfully fetched from library: ${segments.length} segments`,
      );
    } catch (fallbackError) {
      throw mapLibraryErrorToYouTubeError(fallbackError, videoId);
    }
  }

  if (segments.length === 0) {
    throw new YouTubeTranscriptError(
      "No English transcript available for this video. Please ensure the video has English captions or subtitles.",
      YOUTUBE_ERROR_CODES.NO_TRANSCRIPT,
      videoId,
    );
  }

  const fullText = segments.map((s) => s.text).join(" ");

  if (!fullText.trim()) {
    throw new YouTubeTranscriptError(
      "Transcript is empty",
      YOUTUBE_ERROR_CODES.EMPTY_TRANSCRIPT,
      videoId,
    );
  }

  return { segments, fullText };
}
