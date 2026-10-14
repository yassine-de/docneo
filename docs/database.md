# Database design

The baseline schema is defined in `supabase/migrations/202610140001_initial_schema.sql`. It is a design-ready migration and has not been applied to any remote Supabase project.

## Ownership model

Every tenant-owned row either contains `user_id` directly or is reachable only through a parent row owned by that user. Row Level Security is enabled on all application tables. Policies compare `auth.uid()` to the row owner; server-side authorization remains mandatory as a second control.

## Tables

| Table | Purpose | Sensitive fields |
| --- | --- | --- |
| `profiles` | Locale, lifecycle and retention preferences | account identity |
| `connected_accounts` | Google connection state | encrypted token ciphertext only |
| `organizational_entities` | Person, property, company and project records | user-defined labels |
| `destination_folders` | Explicitly authorized Drive destinations | provider folder IDs |
| `organization_rules` | User-created suggestion rules | JSON conditions/actions |
| `processing_jobs` | State and expiry for transient processing | temporary object reference |
| `document_metadata` | Minimal document history | extracted metadata, Drive file ID |
| `audit_events` | Security and consent evidence | redacted contextual metadata |
| `subscription_plans` | Future catalog definition | none |
| `subscriptions` | Future billing state | provider customer/subscription IDs |

## Data rules

- Token fields contain authenticated encryption ciphertext and key-version metadata, never plaintext.
- `temporary_object_key` is an opaque internal locator and must expire; public URLs are forbidden.
- `document_metadata` does not contain OCR text or original file bytes.
- AI metadata is persisted only after schema validation and user review where required.
- Audit metadata must use allowlisted keys; document text, tokens, and raw provider errors are prohibited.
- Hard account deletion is implemented as a controlled server workflow after external token revocation and temporary-object cleanup.

## Indexing

Indexes prioritize owner/time history, processing queues, active connections, entity filters, and Drive reference lookups. Query plans must be measured with representative tenant volumes before adding more indexes.
