import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicEnv.url || !secretKey) {
    throw new Error("The account-deletion admin client is not configured.");
  }
  return createSupabaseClient(publicEnv.url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
