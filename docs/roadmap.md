# Roadmap

## Completed

- Phase 1: project foundation, architecture, security model, schema, documentation, and quality scripts
- Phase 2: premium German/French landing page, responsive design, interactive mock demo, SEO foundations, pricing preview, FAQ, and legal placeholders
- Phase 3: Supabase email/password auth integration, confirmation and recovery callbacks, protected account routes, profile settings, and profile RLS migration

## Approval gate

Work stops after Phase 3. Phase 4 must not begin without explicit approval.

## Planned phases

1. **Phase 4 — Google Drive:** OAuth/PKCE, Picker-based folder authorization, encrypted token lifecycle, disconnect/reconnect.
2. **Phase 5 — Upload:** private temporary storage, signature validation, PDF/image/HEIC intake, mobile capture, deletion jobs.
3. **Phase 6 — AI classification:** strict versioned schema, provider adapter, confidence/review policy, prompt-injection defenses.
4. **Phase 7 — Review and save:** editable metadata, explicit confirmation, normalized collision-safe filename, idempotent Drive write.
5. **Phase 8 — Organization/history:** entities, rules, filters, Drive deep links, minimal metadata retention.
6. **Phase 9 — Security and quality:** account deletion/export, threat-model review, accessibility and E2E coverage, load testing, privacy review.
7. **Phase 10 — Deployment preparation:** Netlify configuration, preview environments, monitoring, launch checklist.
8. **Phase 11 — Billing:** Stripe architecture and plan enforcement only after separate approval and finalized plan limits.

## Open product decisions

- Final plan prices and limits
- Maximum upload size and temporary retention window
- Exact Google Drive folder-selection experience under `drive.file`
- Regional data-processing requirements and chosen worker/storage provider
- Supported OCR languages beyond German and French
- Legal entity details, contact channels, and approved legal text
