# Implementation status

This is the honest release ledger for Summer OS. A checked item means evidence exists in the repository or in the command/deployment record below; it is not a forecast.

Last documentation update: 2026-07-11 (Asia/Singapore)

## Delivery checklist

### Specification and repository

- [x] Zero-cost, personal/non-commercial beta contract documented
- [x] Email/password, Brevo SMTP, Turnstile, and 100-user enrollment contract documented
- [x] Engineering, security, deployment, and operations guides added
- [x] CI, dependency update, encrypted backup, and smoke-test scaffolding added
- [x] Safe static-only service-worker policy added
- [x] Final integrated diff reviewed after all application/database work

### Application

- [x] Authentication, verification, reset, protected routes, and deletion verified against local Supabase and Mailpit
- [x] Onboarding and both template choices verified in unit/demo browser coverage
- [x] Today, tasks, minimum-day mode, and check-in verified in unit/demo browser coverage
- [x] Calendar, plan editor, IELTS, GRE, weekly review, and analytics verified in unit/demo browser coverage
- [x] Settings, CSV export, recent-reauth deletion, and enrollment cap covered by static/unit/demo tests
- [x] Responsive dark/light UI, accessibility, and PWA install/offline behavior verified

### Database and security

- [x] Migrations rebuild successfully from an empty local database
- [x] All user-owned tables have RLS enabled and forced by migration inspection tests
- [x] Composite ownership foreign keys and range/unique constraints verified by migration inspection tests
- [x] Two-user cross-tenant isolation test passes for select/insert/update/delete/forged parent
- [x] Deterministic fixture and non-destructive seed/reset contracts verified statically and in unit tests
- [ ] Client bundles and HTTP responses checked for server-only secrets

### Quality gates

Record the date, commit, command, and result after the final integrated implementation. Do not mark a command passed because a narrower command succeeded.

| Gate                   | Result            | Evidence                                                       |
| ---------------------- | ----------------- | -------------------------------------------------------------- |
| `npm ci`               | Passed 2026-07-12 | 610 packages installed; npm audit reported 0 vulnerabilities   |
| `npm run format:check` | Passed 2026-07-12 | All matched files use Prettier formatting                      |
| `npm run lint`         | Passed 2026-07-12 | ESLint completed with zero warnings                            |
| `npm run typecheck`    | Passed 2026-07-12 | Strict TypeScript check completed                              |
| `npm run test`         | Passed 2026-07-12 | 69 unit/component tests passed                                 |
| `npx supabase test db` | Passed 2026-07-12 | 13 pgTAP schema, RLS, and forged-parent checks passed          |
| `npm run test:db`      | Passed 2026-07-12 | 10 migration and live two-user RLS/integration tests passed    |
| `npm run build`        | Passed 2026-07-12 | Next.js production build generated 20 routes                   |
| `npm run test:e2e`     | Passed 2026-07-12 | Demo matrix plus real signup-to-deletion auth lifecycle passed |

### Environments and launch

- [x] Non-production Supabase Free project created in Singapore and migrations applied
- [ ] Production Supabase Free project created in Singapore; migrations pending
- [ ] Brevo SMTP verification and reset deliveries confirmed
- [ ] Turnstile host restrictions and server-side validation confirmed
- [x] Noindex Vercel Hobby staging preview created with non-production credentials only
- [ ] Production `*.vercel.app` deployment completed from `main`
- [ ] Encrypted production backup created and restore-tested
- [ ] Production smoke test and 30-minute observation recorded in `DEPLOYMENT.md`
- [ ] Public registration opened only after every launch gate passes

## Current deployment record

- Production URL: **Not deployed**
- Staging URL: **https://summer-os-staging.vercel.app** (public noindex; synthetic staging data only)
- Production Supabase project: **Created in Singapore; not linked**
- Non-production Supabase project: **Linked; migrations 202607110001–202607110004 applied**
- Latest production migration: **None recorded**
- Latest verified backup: **None recorded**
- Public registration: **Closed until launch checks pass**

Provider credentials and account authentication are intentionally not stored in the repository. Follow `DEPLOYMENT.md` when the final integrated build is green.
