# Database design

The baseline schema is defined in `supabase/migrations/202610140001_initial_schema.sql`. Phase 3 adds authenticated profiles through `supabase/migrations/202610140002_phase3_auth_profiles.sql`. Migrations are committed for review and are not applied to a remote project automatically.

## Ownership model

Every tenant-owned row contains `user_id`. Composite foreign keys include that `user_id` when one tenant-owned row references another, preventing a row from linking to another user's account, entity, folder, or processing job. Row Level Security is enabled on all application tables; server-side authorization remains mandatory as a second control.

## Tables

| Table | Purpose | Sensitive fields |
| --- | --- | --- |
| `profiles` | Email mirror, display name, locale, lifecycle and retention preferences | account identity |
| `connected_accounts` | Google connection state | encrypted token ciphertext only |
| `organizational_entities` | Person, property, company and project records | user-defined labels |
| `destination_folders` | Explicitly authorized Drive destinations | provider folder IDs |
| `organization_rules` | User-created suggestion rules | JSON conditions/actions |
| `processing_jobs` | State and expiry for transient processing | temporary object reference |
| `document_metadata` | Minimal document history | extracted metadata, Drive file ID |
| `audit_events` | Security and consent evidence | redacted contextual metadata |
| `subscription_plans` | Future catalog definition | none |
| `subscriptions` | Future billing state | provider customer/subscription IDs |

The Phase 3 policy allows authenticated users to select only their own profile and update only `display_name` and `locale`. Profile creation and email synchronization are owned by database triggers; browser clients cannot insert or delete profiles or change ownership and email columns.

All future-feature tables are unavailable to `anon` and `authenticated` until their implementation phases add explicit grants and narrowly scoped policies. This includes `audit_events`, whose integrity requires trusted server-side writers. The inactive plan catalog is the sole exception: it grants read access but its RLS policy exposes only active plans.

## Data rules

- Token fields contain authenticated encryption ciphertext and key-version metadata, never plaintext.
- `temporary_object_key` is an opaque internal locator and must expire; public URLs are forbidden.
- `document_metadata` does not contain OCR text or original file bytes.
- AI metadata is persisted only after schema validation and user review where required.
- Audit metadata must use allowlisted keys; document text, tokens, and raw provider errors are prohibited.
- Hard account deletion is implemented as a controlled server workflow after external token revocation and temporary-object cleanup.

## Indexing

Indexes prioritize owner/time history, processing queues, active connections, entity filters, and Drive reference lookups. Query plans must be measured with representative tenant volumes before adding more indexes.
