import { z } from "zod";

const publicSchema = z.object({
  url: z.string().url().optional(),
  publishableKey: z.string().min(1).optional(),
  siteUrl: z.string().url().optional(),
  turnstileSiteKey: z.string().min(1).optional(),
  demoMode: z.boolean(),
});

export const publicEnv = publicSchema.parse({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    undefined,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
});

export function isSupabaseConfigured() {
  return Boolean(publicEnv.url && publicEnv.publishableKey);
}

export function getSiteUrl() {
  if (publicEnv.siteUrl) return publicEnv.siteUrl.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export function assertProductionEnvironment() {
  if (process.env.NODE_ENV !== "production") return;
  if (!isSupabaseConfigured()) {
    throw new Error("Production requires Supabase environment variables.");
  }
  if (!publicEnv.siteUrl && !process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    throw new Error("Production requires NEXT_PUBLIC_SITE_URL.");
  }
}
