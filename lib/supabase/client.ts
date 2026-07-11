"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Enable demo mode for local previews.",
    );
  }
  browserClient ??= createBrowserClient(
    publicEnv.url!,
    publicEnv.publishableKey!,
  );
  return browserClient;
}
