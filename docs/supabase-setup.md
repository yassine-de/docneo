# Supabase setup for Phase 3

Phase 3 uses Supabase Auth and the `profiles` table. It does not need a database password or a service-role key.

## 1. Configure local variables

Copy `.env.example` to `.env.local`, then obtain the Project URL and publishable key from the Supabase project settings:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Keep `.env.local` private. Never place the Postgres connection string, database password, JWT secret, or service-role key in a `NEXT_PUBLIC_` variable.

## 2. Apply migrations

Link the Supabase CLI to the intended project and review both SQL files before applying them in order:

1. `202610140001_initial_schema.sql`
2. `202610140002_phase3_auth_profiles.sql`

Use the Supabase migration workflow for the target environment. Do not paste production database credentials into source files or shell history.

## 3. Configure Auth URLs

Enable email/password signups and require email confirmation. In **Authentication → URL Configuration**, set the production Site URL to the canonical HTTPS domain. Add these Redirect URLs:

- `http://localhost:3000/**`
- `https://docneo-codex.netlify.app/**`
- Any explicit Netlify deploy-preview pattern approved for the project

For SSR token verification, customize the confirmation email link to:

```html
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
```

Customize the password-recovery email link to:

```html
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
```

The application supplies a localized `/de/auth/callback` or `/fr/auth/callback` RedirectTo value. The callback verifies the token server-side, establishes the cookie session, and sends recovery users to the localized password form.

Review Supabase Auth rate limits before launch. Add a distributed edge/server rate limiter for login, signup, and recovery attempts by IP and normalized account identifier; an in-memory counter is intentionally avoided because it is unreliable across Netlify function instances. Keep generic responses so the limiter does not introduce account enumeration.

## 4. Configure Google identity login

Google login is an identity-only Supabase Auth flow. It requests exactly `openid email profile`. It does **not** request Google Drive permissions, create a Drive connection, or store Google provider tokens for document access. Drive authorization remains a separate, later workflow with separate consent.

### Google Cloud Console

Do not create or change production credentials without project-owner approval.

1. Open **Google Cloud Console → Google Auth Platform** for the approved Google Cloud project.
2. Under **Branding**, configure the Docneo application name, support email, authorized domain, homepage, privacy-policy URL, and terms URL. Submit branding verification if Google requires it.
3. Under **Audience**, select the appropriate Internal or External audience. While the app is in testing, add only approved test users.
4. Under **Data Access**, keep only these identity scopes:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Do not add any `drive`, `drive.file`, `drive.readonly`, or other Google Drive scope.
6. Under **Clients**, create an OAuth client of type **Web application**.
7. Add these authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://docneo-codex.netlify.app`
8. Add this exact authorized redirect URI:
   - `https://axmeokgpohcgukenxude.supabase.co/auth/v1/callback`
9. Store the generated Client ID and Client Secret in the Supabase provider configuration only. Never commit them or add the Client Secret to a `NEXT_PUBLIC_` variable.

If a Supabase custom domain is introduced later, copy the replacement callback URL shown by Supabase into the Google OAuth client before switching domains.

### Supabase Dashboard

1. Open project `axmeokgpohcgukenxude`.
2. Go to **Authentication → Providers → Google**.
3. Enable Google and enter the approved Google Client ID and Client Secret.
4. Confirm that the callback URL shown by Supabase is exactly `https://axmeokgpohcgukenxude.supabase.co/auth/v1/callback`.
5. Keep **Authentication → URL Configuration** set to:
   - Site URL: `https://docneo-codex.netlify.app`
   - Redirect URL: `http://localhost:3000/**`
   - Redirect URL: `https://docneo-codex.netlify.app/**`
6. Leave automatic identity linking at Supabase's secure default. Do not enable manual identity linking for this phase.

Supabase automatically links a new Google identity to an existing user when the provider supplies the same verified email. Because `public.profiles.user_id` is the primary key and the profile trigger runs only when a new `auth.users` row is inserted, a linked identity does not create a duplicate profile. A new Google user receives a profile through `on_auth_user_created`; the display name initially falls back to the email prefix and can be changed in Settings.

No additional Netlify variable is required. Google credentials remain in Supabase; the application continues to use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## 5. Verify locally

Restart `npm run dev` after changing environment variables. Test signup, email confirmation, email/password login, Google login, forgot-password, recovery, password update, logout, and direct navigation to all protected routes in both languages.

For Google login, verify both a new Google account and an existing confirmed email/password account with the same verified email. The second case should add a Google identity to the existing Supabase user and retain the single existing profile. Confirm on Google's consent screen that no Drive permission appears.

The automated suite validates input rules, redirect safety, Google identity scopes, localized OAuth callback construction, anonymous route behavior, translation parity, and profile-policy structure. A live Supabase test project is still required to verify Google consent, account linking, email delivery, token exchange, and RLS behavior against the deployed database.
