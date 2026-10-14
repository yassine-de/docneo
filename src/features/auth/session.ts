import "server-only";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string };

export async function getOptionalUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function requireUser(locale: Locale) {
  const user = await getOptionalUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}
