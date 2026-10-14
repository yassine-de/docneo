"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { GOOGLE_IDENTITY_SCOPES, googleOAuthRedirectTo } from "@/features/auth/google";
import { createClient } from "@/lib/supabase/client";

export function GoogleAuthButton({
  locale,
  label,
  pendingLabel,
  errorMessage,
  next,
}: {
  locale: Locale;
  label: string;
  pendingLabel: string;
  errorMessage: string;
  next?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);
    setHasError(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: googleOAuthRedirectTo(window.location.origin, locale, next),
          scopes: GOOGLE_IDENTITY_SCOPES,
        },
      });

      if (error) {
        setHasError(true);
        setIsPending(false);
      }
    } catch {
      setHasError(true);
      setIsPending(false);
    }
  }

  return (
    <div className="oauth-entry">
      <button className="button button-google" type="button" onClick={signInWithGoogle} disabled={isPending}>
        <span className="google-mark" aria-hidden="true">G</span>
        {isPending ? pendingLabel : label}
      </button>
      {hasError ? <p className="form-message error" role="alert">{errorMessage}</p> : null}
    </div>
  );
}
