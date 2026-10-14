# Netlify deployment plan

No deployment has been created in Phases 1–2.

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

Before first deployment, verify the exact Next.js version against Netlify's current support matrix and pin compatible versions. Do not add Vercel services or configuration.

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
