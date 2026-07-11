import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "not-configured";
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.rpc("health_check");
      database = error ? "degraded" : "ok";
    } catch {
      database = "degraded";
    }
  }

  const status = database === "degraded" ? 503 : 200;
  return Response.json(
    {
      status: status === 200 ? "ok" : "degraded",
      database,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
