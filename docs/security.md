# Security architecture

## Trust boundaries

Browser input, uploaded files, extracted text, AI responses, OAuth responses, webhooks, and provider error bodies are untrusted. Each boundary requires parsing, size limits, schema validation, and safe errors.

## Core controls

- Supabase Auth sessions use secure, HTTP-only cookie handling on the server.
- Every mutation authenticates and authorizes the resource owner server-side.
- PostgreSQL Row Level Security provides defense in depth against cross-user access.
- Service-role, OAuth, encryption, OpenAI, and future Stripe secrets are server-only environment variables.
- Refresh tokens are encrypted with an authenticated cipher and key rotation/version support.
- Logs use structured event names and opaque IDs; document content, filenames where sensitive, tokens, and provider payloads are redacted.
- Security headers disable framing, MIME sniffing, and unnecessary browser permissions. CSP will be finalized once provider scripts and preview requirements are known.
- State-changing browser requests use same-site cookies, origin checks, and CSRF tokens where cookie-based Route Handlers require them.
- Per-user and per-IP rate limits protect auth, uploads, AI jobs, and Drive writes.

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
