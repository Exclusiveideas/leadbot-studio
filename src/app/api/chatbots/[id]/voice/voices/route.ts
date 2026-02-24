import { NextResponse } from "next/server";
import { withRLS } from "@/lib/middleware/rls-wrapper";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

/**
 * GET /api/chatbots/[id]/voice/voices
 * List available ElevenLabs voices
 */
export const GET = withRLS(
  async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ElevenLabs not configured" },
        { status: 500 },
      );
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        headers: { "xi-api-key": apiKey },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch voices" },
          { status: 502 },
        );
      }

      const data = (await response.json()) as {
        voices: Array<{
          voice_id: string;
          name: string;
          preview_url?: string;
          labels?: { accent?: string; gender?: string; use_case?: string };
        }>;
      };

      const voices = data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        previewUrl: v.preview_url,
        accent: v.labels?.accent,
        gender: v.labels?.gender,
        useCase: v.labels?.use_case,
      }));

      return NextResponse.json({ success: true, data: voices });
    } catch (error) {
      console.error("Failed to fetch ElevenLabs voices:", error);
      return NextResponse.json(
        { success: false, error: "Voice service unavailable" },
        { status: 502 },
      );
    }
  },
  { routeName: "GET /api/chatbots/[id]/voice/voices" },
);
