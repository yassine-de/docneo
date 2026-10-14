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

## 4. Verify locally

Restart `npm run dev` after changing environment variables. Test signup, email confirmation, login, forgot-password, recovery, password update, logout, and direct navigation to all protected routes in both languages.

The automated suite validates input rules, redirect safety, anonymous route behavior, translation parity, and profile-policy structure. A live Supabase test project is still required to verify email delivery, token exchange, and RLS behavior against the deployed database.
