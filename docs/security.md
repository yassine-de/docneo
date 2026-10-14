# Security architecture

## Phase 4 Drive controls

Google Drive authorization is separate from Supabase Google Sign-In and requests only `drive.file`. OAuth state uses a short-lived HttpOnly cookie and constant-time verification. Provider tokens are encrypted independently with AES-256-GCM and are reachable only from server-only code using owner-derived queries. Folder mutations derive the selected root from the database, validate the root with Google, require explicit confirmation, and record an idempotent operation. Browser roles cannot read or mutate Drive integration tables. See `docs/phase4-google-drive.md` for the complete model and the Picker compatibility validation required before production.

## Trust boundaries

Browser input, uploaded files, extracted text, AI responses, OAuth responses, webhooks, and provider error bodies are untrusted. Each boundary requires parsing, size limits, schema validation, and safe errors.

## Core controls

- Supabase Auth sessions use secure cookie handling through the official SSR adapter; the request proxy refreshes sessions while protected layouts revalidate identity server-side.
- Every mutation authenticates and authorizes the resource owner server-side.
- PostgreSQL Row Level Security provides defense in depth against cross-user access.
- Service-role, OAuth, encryption, OpenAI, and future Stripe secrets are server-only environment variables.
- Refresh tokens are encrypted with an authenticated cipher and key rotation/version support.
- Logs use structured event names and opaque IDs; document content, filenames where sensitive, tokens, and provider payloads are redacted.
- Security headers disable framing, MIME sniffing, and unnecessary browser permissions. CSP will be finalized once provider scripts and preview requirements are known.
- State-changing browser requests use same-site cookies, origin checks, and CSRF tokens where cookie-based Route Handlers require them.
- Per-user and per-IP rate limits protect auth, uploads, AI jobs, and Drive writes.

## Authentication controls (Phase 3)

- Login errors are generic and recovery responses do not reveal whether an account exists.
- Google login uses Supabase's PKCE flow with identity-only `openid email profile` scopes. Google Drive permissions are deliberately excluded and must use a later, separate authorization flow.
- Supabase automatic identity linking may join a Google identity to an existing user only when the provider email is verified; manual identity linking is not enabled in this phase.
- Confirmation and recovery tokens are exchanged only by the server callback and callback responses are private/no-store.
- The callback applies Supabase session cookies directly to the returned redirect response so PKCE exchanges cannot succeed without delivering the browser session through the deployment adapter.
- Redirect targets are allowlisted to localized in-app routes to prevent open redirects.
- Password input is length-bounded and requires at least ten characters, upper- and lowercase letters, and a number.
- Authenticated pages verify the user on the server; the proxy is not treated as the authorization boundary.
- Profile RLS restricts reads to the owner and client updates to display name and locale only.
- Future Drive, processing, organization, subscription, and audit tables have no client-role privileges until their implementation phases explicitly enable them.
- Composite ownership foreign keys reject cross-user references even when a foreign UUID becomes known.
- Auth trigger functions use an empty search path and explicitly deny direct execution by public, anonymous, and authenticated roles.
- Next.js Server Actions enforce same-origin request checks for form mutations. Production must also add a distributed rate limiter for signup, login, and recovery; per-process memory is not a reliable control on Netlify.

## Upload controls (Phase 5)

1. Enforce a documented byte limit before buffering.
2. Check file signatures with a maintained parser; do not trust extension or MIME type.
3. Reject encrypted/unsupported PDFs, polyglots, active content, and decompression bombs.
4. Store with generated opaque keys in private temporary storage.
5. Scan/convert in an isolated worker with constrained CPU, memory, and time.
6. Delete after completion, cancellation, failure, or the configured maximum retention window.

## AI controls (Phase 6)

Document text is data, never instruction. The model receives a fixed system policy and a strict versioned JSON schema. Output is parsed, range-checked, normalized, and treated as a draft. AI-provided filenames cannot become paths; folder IDs must resolve to an authorized database record. Low confidence and ambiguous entity matches require manual review.

## OAuth controls (Phase 4)

Use PKCE, cryptographically random state, exact redirect URI matching, least-privilege scopes, encrypted refresh-token storage, and explicit disconnect/revocation. Tokens are never returned to the browser or written to logs. Expired/revoked credentials move the account to a reconnect-required state.

## Privacy posture

The design supports data minimization, purpose limitation, export, account deletion, and configurable retention. This is not a claim of GDPR, GoBD, or certification compliance. Data processing agreements, transfer mechanisms, subprocessors, retention periods, privacy text, and deletion verification need legal and operational review before launch.

## Dependency management

CI should run lockfile installs, lint/type/test/build gates, dependency audit, secret scanning, and code scanning. High-severity findings require triage; automated forced upgrades are not allowed without compatibility validation.
