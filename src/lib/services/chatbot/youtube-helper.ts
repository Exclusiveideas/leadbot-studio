// Constants
const YOUTUBE_VIDEO_ID_LENGTH = 11;
const YOUTUBE_FETCH_TIMEOUT_MS = 5000;

/**
 * Validate video ID format (11 characters, alphanumeric with _ and -)
 */
export function isValidVideoId(videoId: string | null): boolean {
  if (!videoId) return false;
  return new RegExp(`^[a-zA-Z0-9_-]{${YOUTUBE_VIDEO_ID_LENGTH}}$`).test(
    videoId,
  );
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  // Handle direct video ID (11 characters)
  if (isValidVideoId(url)) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const isYouTube =
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "www.youtube.com";

    // youtube.com/watch?v=VIDEO_ID
    if (isYouTube && urlObj.pathname === "/watch") {
      const videoId = urlObj.searchParams.get("v");
      return isValidVideoId(videoId) ? videoId : null;
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1);
      return isValidVideoId(videoId) ? videoId : null;
    }

    // youtube.com/shorts/VIDEO_ID
    if (isYouTube && urlObj.pathname.startsWith("/shorts/")) {
      const videoId = urlObj.pathname.slice(8);
      return isValidVideoId(videoId) ? videoId : null;
    }

    // youtube.com/embed/VIDEO_ID
    if (isYouTube && urlObj.pathname.startsWith("/embed/")) {
      const videoId = urlObj.pathname.slice(7);
      return isValidVideoId(videoId) ? videoId : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Normalize YouTube URL to standard format
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): {
  valid: boolean;
  error?: string;
  videoId?: string;
  normalizedUrl?: string;
} {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return {
      valid: false,
      error:
        "Invalid YouTube URL. Supported formats: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/, or direct video ID.",
    };
  }

  const normalizedUrl = normalizeYouTubeUrl(url);

  return {
    valid: true,
    videoId,
    normalizedUrl: normalizedUrl!,
  };
}

/**
 * Fetch video title from YouTube oEmbed API
 */
export async function fetchYouTubeVideoTitle(
  videoId: string,
): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(YOUTUBE_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.title || null;
  } catch (error) {
    console.warn("Failed to fetch YouTube video title:", error);
    return null;
  }
}
