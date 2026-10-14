const localFallback = "http://localhost:3000";

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.URL,
    localFallback,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Ignore malformed environment values and try the next safe candidate.
    }
  }

  return localFallback;
}
