# Summer OS

Summer OS is a mobile-first personal operating system for a focused summer: daily planning, health-aware check-ins, IELTS practice, GRE research, weekly reviews, and trend analytics in one Simplified Chinese interface.

The application is designed as a **personal, non-commercial public beta**. Its deployment target deliberately stays within free tiers: Vercel Hobby, two Supabase Free projects, Brevo Free SMTP, and Cloudflare Turnstile. It is not an SLA-backed service and must be upgraded or moved before commercial use.

## Product highlights

- Email-and-password authentication with email verification and password reset
- Deterministic 50-day `kirito-summer-2026@1` plan and customizable `summer-os-flex@1` plans
- Today dashboard, calendar, fast check-in, IELTS and GRE workspaces, weekly reviews, analytics, export, and account deletion
- Dark/light graphite UI, responsive bottom navigation/sidebar, reduced-motion support, and accessible chart summaries
- Supabase Row Level Security (RLS), authenticated server-side mutations, and private non-cached user responses
- Installable PWA shell with a public offline fallback; authenticated pages and health data are never cached by the service worker

The complete acceptance contract is in [plan.md](plan.md). Honest implementation and deployment state is tracked in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Local development

### Prerequisites

- Node.js 22 LTS
- npm (the lockfile is authoritative)
- Docker Desktop for the local Supabase stack
- Git

Install dependencies and create a local environment file:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:start
```

Copy the local API URL, browser publishable/anonymous key, and server secret/service-role key printed by the Supabase CLI into `.env.local`. Keep the server key server-only. Then apply/reset the local database and start Next.js:

```powershell
npm run db:reset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local email is captured by Supabase Inbucket; the CLI prints its URL. Turnstile must use Cloudflare's published test keys locally or an explicit development bypass implemented server-side—never a production secret in source control.

## Quality gates

```powershell
npm run lint
npm run typecheck
npm run test
npx supabase test db
npm run test:db
npm run build
npx playwright install chromium
npm run test:e2e
```

The pgTAP suite, `npm run test:db`, and authenticated browser flows require the local Supabase stack. CI repeats these gates on GitHub-hosted runners.

## Deployment model

| Environment     | Web                         | Data/auth                                   | Data policy                           |
| --------------- | --------------------------- | ------------------------------------------- | ------------------------------------- |
| Local/CI        | Local Next.js               | Local Supabase                              | Synthetic data and Inbucket           |
| Preview/staging | Vercel Hobby preview        | Shared non-production Supabase Free project | Synthetic users only; noindex         |
| Production      | Vercel Hobby `*.vercel.app` | Dedicated Supabase Free project             | Real beta users; maximum 100 accounts |

Production setup requires personal accounts for GitHub, Vercel, Supabase, Brevo, and Cloudflare. Secrets are entered only into the relevant provider dashboards or GitHub Actions secrets. Follow [DEPLOYMENT.md](DEPLOYMENT.md), then operate the beta with [RUNBOOK.md](RUNBOOK.md).

## Important limitations

- Vercel Hobby is restricted to personal, non-commercial use. See the [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby).
- Supabase Free projects can pause and do not provide the paid backup/SLA guarantees. See [Supabase billing documentation](https://supabase.com/docs/guides/platform/billing-on-supabase).
- Email delivery through a free SMTP provider is best-effort. Monitor verification and reset delivery.
- GitHub Actions and artifact storage also have included-use limits. CI/backups stop rather than silently gaining a paid guarantee when those limits are exhausted.
- Summer OS provides general wellness tracking, not medical advice. It must never prescribe unsafe restriction, dehydration, purging, supplements, or exercise as punishment.

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — provider setup, environment separation, release, smoke test, and rollback
- [SECURITY.md](SECURITY.md) — security model, data handling, reporting, and launch controls
- [RUNBOOK.md](RUNBOOK.md) — monitoring, incidents, quotas, backup, and restore operations
- [AGENTS.md](AGENTS.md) — engineering rules for future contributors and coding agents
- [CODEX_MASTER_PROMPT.md](CODEX_MASTER_PROMPT.md) — end-to-end implementation contract for coding agents

## License

See [LICENSE](LICENSE).
