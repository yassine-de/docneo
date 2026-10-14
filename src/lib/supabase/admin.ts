import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

export function createAdminClient() {
  const publicConfig = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicConfig || !serviceKey) return null;
  return createClient(publicConfig.url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
