# Docneo

**Scan. Organize. Done.**

Docneo is a bilingual, AI-assisted document organization SaaS for Germany and France. The product is designed to analyze a document, propose metadata and a destination, and save it to the user's existing Google Drive only after explicit confirmation.

This repository contains **Phase 1 (architecture)**, **Phase 2 (premium bilingual landing page)**, and **Phase 3 (authentication and account dashboard)**. Google Drive, document upload, AI processing, billing, and production deployment are deliberately not connected yet.

## What is implemented

- German (`/de`) and French (`/fr`) landing pages with browser-language redirect
- Responsive, accessible design system and localized SEO metadata
- Interactive, clearly labeled mock document-processing demo
- Audience, Google Drive, security, provisional pricing, FAQ, CTA, and footer sections
- Legal, contact, and login placeholders without invented company details
- PostgreSQL/Supabase baseline schema with tenant-scoped RLS policies
- Architecture, security, database, deployment, and roadmap documentation
- Automated localization/content contract tests
- Supabase email/password authentication with SSR cookie sessions
- Localized signup, email confirmation, login, recovery, and password reset flows
- Server-protected dashboard, documents, and settings routes
- Owner-scoped profile records with Row Level Security

## Local development

Requirements: Node.js 22+, npm 10+.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The root route redirects to French when the browser's preferred language begins with `fr`; otherwise it uses German.

Authentication also needs a Supabase project URL and publishable key in `.env.local`. Follow [the Supabase setup guide](docs/supabase-setup.md), then restart the development server.

### Cross-platform setup

On macOS or Linux, create the local environment file with:

```bash
cp .env.example .env.local
```

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the complete gate with `npm run check`.

## GitHub and Netlify preparation

The intended private GitHub repository is `https://github.com/yassine-de/docneo.git`. The local `main` branch may be connected to that remote, but no push or GitHub repository mutation is performed automatically.

Netlify configuration is committed in `netlify.toml`:

- Node.js 22 (also declared in `.nvmrc` and `package.json`)
- Build command: `npm run build`
- Publish directory: `.next`
- Production branch: configure as `main` in Netlify
- Deploy previews: enabled by Netlify when the repository is connected and pull requests are opened

Netlify automatically applies its OpenNext adapter to supported modern Next.js applications. Do not install or pin `@netlify/plugin-nextjs`; allowing Netlify to select the current adapter preserves compatibility updates.

Before the first deployment, set `NEXT_PUBLIC_SITE_URL` separately for Production and Deploy Preview contexts in Netlify. If it is omitted, metadata safely falls back to Netlify's read-only `DEPLOY_PRIME_URL` or `URL`. Future server-side secrets must be entered through Netlify environment-variable management and never added to `netlify.toml`.

## Environment variables

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are used in Phase 3. The publishable key is intended for browser use; database passwords and service-role keys are not required by this application and must never be committed. Future integration entries must stay unset until their phases begin.

## Documentation

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [Supabase setup](docs/supabase-setup.md)

## Current limitations

All document and Google Drive activity shown on the landing page and dashboard is simulated. Authentication and profile storage are the only live-capable integrations. No document is uploaded, analyzed, persisted, or sent to a third party. Prices are provisional and payments are disabled.
