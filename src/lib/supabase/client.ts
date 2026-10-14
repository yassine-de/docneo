"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "./config";

export function createClient() {
  const { url, key } = requireSupabasePublicConfig();
  return createBrowserClient(url, key);
}
