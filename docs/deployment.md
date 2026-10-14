# Netlify deployment plan

No deployment has been created in Phases 1–3. Deployment compatibility was rechecked against the official Netlify documentation on 2026-10-14.

## Intended flow

- Private GitHub repository `docneo`
- `main` is the production branch
- Pull requests create isolated Netlify preview deployments
- Production deploys require the repository checks and a deliberate merge to `main`
- Environment variables are configured in Netlify by context; secrets are never committed or exposed as `NEXT_PUBLIC_*`

## Build contract

```text
Runtime: Node.js 22 LTS
Install: npm ci
Build: npm run build
Framework: Next.js (Netlify-supported adapter/runtime)
```

The project currently uses Next.js 16.4 with App Router, Cache Components, Turbopack, localized routes, and a request proxy. Netlify documents full support for these capabilities through its automatically applied OpenNext adapter and tests the adapter against stable Next.js releases. The adapter is intentionally not installed or pinned in this repository.

Configuration lives in `netlify.toml`; Node.js 22 is pinned through `.nvmrc`, `package.json`, and the Netlify build environment. Netlify's documented hybrid Next.js defaults are `next build` and `.next`, matching this project.

Official references:

- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- https://docs.netlify.com/snippets/frameworks/nextjs-config-values/
- https://docs.netlify.com/build/configure-builds/manage-dependencies/

## Runtime boundaries

Landing pages should remain statically rendered. Authentication and lightweight APIs may run in serverless functions. Large uploads and AI document processing should not depend on a single request lifecycle; introduce private object storage plus a durable queue/background worker after measuring Netlify request size and execution limits.

## Required production controls

- Separate preview and production Supabase/Google/OpenAI projects or credentials
- Restricted OAuth redirect URIs and allowed origins
- Secret rotation procedure and least-privilege team access
- Error monitoring with redaction and sampling
- Uptime checks for public pages and critical APIs
- Backup/restore validation for PostgreSQL
- Migration step with rollback/forward-fix playbook
- Post-deploy smoke test and incident owner

## Manual setup still required

GitHub repository creation, Netlify site connection, domains/DNS, all third-party projects, legal content, provider agreements, and production secrets require explicit authorization and are intentionally absent.

## First connection checklist

1. Confirm the GitHub repository is private and select `main` as the production branch.
2. Connect the repository in Netlify; accept framework detection for Next.js.
3. Confirm `npm run build` and `.next` from the committed configuration.
4. Add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using Netlify's environment-variable UI for each deploy context.
5. Keep all future sensitive variables in Netlify's secret store, never in `netlify.toml`.
6. Trigger a Deploy Preview first and run smoke checks before authorizing a production deployment.
