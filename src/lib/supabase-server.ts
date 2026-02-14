import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role key
// This bypasses RLS and should only be used on the server with proper authentication
let supabaseServerInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (!supabaseServerInstance) {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for server-side operations",
      );
    }

    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseServerInstance;
}

// Helper to validate that we're on the server
export function ensureServerSide(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseServerClient can only be used on the server side",
    );
  }
}

// Use getSupabaseServerClient() for lazy initialization
