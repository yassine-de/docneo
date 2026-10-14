# Phase 4 — Google Drive and personalized organization

## Implementation status

Phase 4 is implemented and database migration `202610140003_phase4_drive_organization.sql` is installed in the production Supabase project. No Google Drive mutation or test-user creation was performed during deployment preparation. Real Drive behavior still requires the manual post-deployment checks listed below.

## Architecture

- Google Sign-In remains a Supabase Auth flow with only `openid email profile`.
- Drive authorization is a separate server flow requesting only `https://www.googleapis.com/auth/drive.file`.
- OAuth state is a 256-bit random value stored in a short-lived, `HttpOnly`, `SameSite=Lax` cookie and compared in constant time.
- Authorization codes are exchanged only on the server. The callback redirects to a clean localized Drive URL and never logs or returns codes or tokens.
- Access and refresh tokens are encrypted independently with AES-256-GCM and a random 96-bit IV. `TOKEN_ENCRYPTION_KEY` is server-only.
- Database access to Drive tokens and organization state uses the Supabase service role only in `server-only` modules. Browser roles have no table grants.
- Every Drive operation derives the user from the verified Supabase session and the root folder from the owner-bound database row. Browser-supplied Drive folder IDs are not accepted for folder creation.

## Google Picker and scope constraints

Google documents `drive.file` as allowing access to files or folders created by the app or explicitly shared through Google Picker. Docneo never scans all of My Drive.

The implementation uses Google's redirect-based Picker parameters (`trigger_onepick=true`, `allow_folder_selection=true`, and the folder MIME type) so the access token stays on the server. Google's current guide explicitly supports granting a desktop, mobile, or web app access through this redirect flow, accepts the standard OAuth parameters, and states that the Picker imposes no additional restriction on a redirect URI appropriate for the application's OAuth client type. The existing Web OAuth client is therefore compatible when its authorized redirect URI exactly matches `GOOGLE_DRIVE_REDIRECT_URI`.

The redirect flow permits only `drive.file` and must not combine it with `drive` or `drive.readonly`. Docneo requests exactly that one scope, sets `include_granted_scopes=false`, validates the returned scopes, and exchanges the authorization code only on the server. The browser-based `PickerBuilder` integration remains intentionally unused because it would require exposing a short-lived OAuth token to browser JavaScript together with an API key and project number.

Official references:

- [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Picker overview](https://developers.google.com/workspace/drive/picker/guides/overview)
- [Redirect-based Picker](https://developers.google.com/workspace/drive/picker/guides/desktop-mobile-picker)
- [OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth security practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

## Root folder security

Users may explicitly create a new root or choose an existing folder. A new root requires a named confirmation checkbox. Existing selection is verified server-side as a non-trashed My Drive folder with `canAddChildren`; Shared Drives, shortcuts, inaccessible items, and non-folders are rejected. Changing a root updates configuration only and never moves or deletes data.

The selected root ID is persisted server-side. Confirmation ignores arbitrary provider IDs from the browser and creates/reuses only `00_UNERLEDIGT` with that stored root as parent. Existing matches are checked by exact name, folder MIME type, and parent relationship. Optional category folders remain a confirmed plan and are created lazily in future document workflows.

## Smart onboarding and folder editor

The typed deterministic generator supports personal, family, property, vehicle, and business selections, conditional entity counts (maximum 10 per type), optional labels, localized top-level names, and a minimal skipped-answer structure. Drafts resume from local browser storage; confirmed preferences and structure are stored server-side after the Phase 4 migration. The editor supports rename, add, remove, reparent, and keyboard-accessible reorder controls.

Validation rejects empty or invalid names, duplicate siblings, missing parents, cycles, depth over six, and more than 120 folders. `00_UNERLEDIGT` has stable ID `pending_documents`, always stays first at root, and cannot be renamed, moved, removed, or duplicated in Docneo.

## Pending documents

The new `document_actions` schema supports `pending`, `completed`, and `archived`, optional confirmed due dates, required-action text, completion timestamps, and owner-bound destination references. Phase 4 exposes only an honest empty state. It does not classify documents, invent deadlines, move files, or show fabricated counts.

## Migration

`202610140003_phase4_drive_organization.sql` is additive and must be reviewed and dry-run before remote application. It extends `connected_accounts` and adds:

- `organization_preferences`
- `onboarding_sessions`
- `folder_structure_drafts`
- `drive_operations`
- `document_actions`

All tables have RLS enabled, no `anon` or `authenticated` grants, service-role-only access, and composite owner foreign keys. The migration does not delete or rewrite existing records.

## Required environment variables

Server-only:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_DRIVE_REDIRECT_URI
TOKEN_ENCRYPTION_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`TOKEN_ENCRYPTION_KEY` must contain exactly 32 random bytes encoded as a 64-character hexadecimal string (`^[0-9a-fA-F]{64}$`). Never reuse the Next.js or Supabase secrets. Do not expose any of these as `NEXT_PUBLIC_*`.

`GOOGLE_PICKER_API_KEY` and `GOOGLE_CLOUD_PROJECT_NUMBER` are documented placeholders only; the current redirect-mode Picker does not read them. They become necessary only if an approved design later adopts Google's browser Web Picker.

## Manual Google Cloud setup

1. Reuse the existing `docneo` Google Cloud project.
2. Enable Google Drive API and Google Picker API. Confirm billing is not newly activated without approval.
3. Add the non-sensitive `.../auth/drive.file` scope to the OAuth consent screen. Keep the existing identity scopes for Supabase Google Sign-In.
4. Preserve the existing OAuth client. Add, after approval, exactly these Drive callback URIs:
   - local: `http://localhost:3000/api/drive/callback`
   - production: `https://docneo-codex.netlify.app/api/drive/callback`
5. Keep authorized JavaScript origins for the existing app. The redirect Picker path does not require an API key in browser code.
6. Test with a dedicated authorized Google account: connect, select an existing My Drive folder, create a new root, revoke consent, reconnect, and verify that Shared Drives/shortcuts are rejected.

## Deployment sequence

1. Review migration and run a Supabase dry-run.
2. Generate and install secrets securely in local/Netlify server contexts; do not paste them into chat or Git.
3. Apply the migration only after explicit approval.
4. Configure Google Cloud callback URIs and APIs only after explicit approval.
5. Deploy and run the redirect Picker smoke test with the configured Web OAuth client and exact callback URI.
6. Confirm only the approved root and `00_UNERLEDIGT` are touched.
7. Promote to production only after manual OAuth and Drive tests pass.

## Known limitations

- The production database migration is installed, but no live Drive mutation has been performed yet.
- Redirect Picker compatibility is documented by Google; the configured production client and callback still require an end-to-end smoke test after deployment.
- Onboarding resume currently uses per-browser local storage before confirmation; confirmed state is server-side.
- Optional category folders are intentionally lazy and are not created during Phase 4 confirmation.
- Partial failure records are persisted, but a future operations worker is still needed for automated retry orchestration.
- Repair detection for a user-renamed/deleted `00_UNERLEDIGT` is represented by operation/status fields; periodic detection UI is not active.
- AI analysis, uploads, document moves, payments, and automatic deadlines remain unimplemented.
