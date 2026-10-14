# Architecture

## Status

Phases 1 and 2 establish the public experience. Phase 3 adds Supabase Auth and the protected bilingual account area. Phase 4 adds separate least-privilege Drive authorization, encrypted server-side tokens, a strict selected-root boundary, personalized onboarding, and pending-document preparation; its database migration is installed. Document analysis, uploads, AI, and billing remain inactive.

## System shape

Docneo uses a modular monolith in Next.js App Router. This keeps deployment and authorization simple while leaving clear seams for later background processing.

```text
Browser / PWA
  -> Next.js pages and client interactions
  -> Route Handlers (validation + authorization)
     -> Supabase Auth / PostgreSQL
     -> temporary private object storage
     -> OpenAI document classification adapter
     -> Google OAuth / Drive adapter
  -> asynchronous worker boundary for long-running processing
```

The browser never receives provider secrets, service-role credentials, or refresh tokens. Route Handlers authenticate first, derive the user ID from the server session, validate input, and call feature services. Feature services operate on domain values rather than raw request objects.

## Source boundaries

- `src/app`: routes, metadata, and composition
- `src/components`: reusable UI and landing experience
- `src/features`: auth now, with future Drive, processing, organization, and billing modules
- `src/lib`: Supabase SSR clients, site configuration, and future provider/security utilities
- `src/i18n`: locale configuration and structured dictionaries
- `supabase/migrations`: versioned database changes
- `tests`: unit, integration, security, and later end-to-end tests

## Key decisions

1. **Explicit approval is a domain invariant.** AI output can create a draft suggestion, never a Drive write. The final Drive operation accepts a user-confirmed, server-validated folder ID and normalized filename.
2. **Documents are transient.** Original content is kept in private temporary storage only while a processing job is active, then deleted by completion and expiry cleanup paths. Durable history contains metadata and the Drive file reference, not the document body.
3. **Provider integrations are isolated.** Google Drive, OpenAI, and Stripe each sit behind a typed adapter so tests can use deterministic fakes.
4. **Background work is a separate execution concern.** Upload endpoints should enqueue processing and return a job ID. Netlify request functions must not be used for OCR/AI work that may exceed payload or duration limits.
5. **Localization is route-first.** `/de` and `/fr` are statically generated; dictionaries are server-loaded and client components receive only the copy they need.
6. **Authentication is server-authorized.** The request proxy refreshes Supabase cookies, while protected layouts and every mutation independently verify the authenticated user. RLS is defense in depth, not the only authorization check.

## Google Drive permission model

The only requested Drive scope is `drive.file`. It does not permit arbitrary browsing. Folder authorization uses an app-created folder or an explicitly Picker-selected resource; every write derives the stored owner-bound root on the server. See `docs/phase4-google-drive.md` for the redirect-Picker compatibility limitation that must be validated before production.

## Processing state machine

`pending -> validating -> analyzing -> awaiting_review -> saving -> completed`

Any active state can enter `failed` or `cancelled`. A job cannot enter `saving` without a recorded confirmation event. Retried provider calls require idempotency keys; Drive file creation results are persisted only after Google confirms success.

## Architecture risks

- HEIC decoding support and resource cost must be validated in the chosen runtime.
- OCR/vision payload size and serverless duration may require a managed queue/worker service.
- Regional processing options for Supabase, OpenAI, and Google require a data-protection review.
- `drive.file` usability must be verified with the intended Picker workflow before UI commitments.
