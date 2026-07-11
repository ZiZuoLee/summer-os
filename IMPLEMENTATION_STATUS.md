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

- [ ] Authentication, verification, reset, and protected-route flows verified
- [x] Onboarding and both template choices verified in unit/demo browser coverage
- [x] Today, tasks, minimum-day mode, and check-in verified in unit/demo browser coverage
- [x] Calendar, plan editor, IELTS, GRE, weekly review, and analytics verified in unit/demo browser coverage
- [x] Settings, CSV export, recent-reauth deletion, and enrollment cap covered by static/unit/demo tests
- [x] Responsive dark/light UI, accessibility, and PWA install/offline behavior verified

### Database and security

- [ ] Migrations rebuild successfully from an empty local database
- [x] All user-owned tables have RLS enabled and forced by migration inspection tests
- [x] Composite ownership foreign keys and range/unique constraints verified by migration inspection tests
- [ ] Two-user cross-tenant isolation test passes for select/insert/update/delete/forged parent
- [x] Deterministic fixture and non-destructive seed/reset contracts verified statically and in unit tests
- [ ] Client bundles and HTTP responses checked for server-only secrets

### Quality gates

Record the date, commit, command, and result after the final integrated implementation. Do not mark a command passed because a narrower command succeeded.

| Gate                   | Result                  | Evidence                                                                            |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `npm ci`               | Passed 2026-07-12       | 610 packages installed; npm audit reported 0 vulnerabilities                        |
| `npm run format:check` | Passed 2026-07-12       | All matched files use Prettier formatting                                           |
| `npm run lint`         | Passed 2026-07-12       | ESLint completed with zero warnings                                                 |
| `npm run typecheck`    | Passed 2026-07-12       | Strict TypeScript check completed                                                   |
| `npm run test`         | Passed 2026-07-12       | 69 passed; 5 live-database tests skipped without Docker                             |
| `npx supabase test db` | Blocked locally         | Docker Desktop Linux engine is unavailable                                          |
| `npm run test:db`      | Partial pass 2026-07-12 | 5 migration inspection tests passed; 5 live RLS tests skipped without Docker        |
| `npm run build`        | Passed 2026-07-12       | Next.js production build generated 20 routes                                        |
| `npm run test:e2e`     | Demo suite verified     | Visual, WCAG, responsive, and feature flows pass; real auth requires local Supabase |

### Environments and launch

- [ ] Non-production Supabase Free project created in Singapore and migrations applied
- [ ] Production Supabase Free project created in Singapore and migrations applied
- [ ] Brevo SMTP verification and reset deliveries confirmed
- [ ] Turnstile host restrictions and server-side validation confirmed
- [ ] Vercel Hobby staging preview created with non-production credentials only (CLI authenticated; withheld until Supabase staging exists)
- [ ] Production `*.vercel.app` deployment completed from `main`
- [ ] Encrypted production backup created and restore-tested
- [ ] Production smoke test and 30-minute observation recorded in `DEPLOYMENT.md`
- [ ] Public registration opened only after every launch gate passes

## Current deployment record

- Production URL: **Not deployed**
- Staging URL: **Not deployed**
- Production Supabase project: **Not linked**
- Non-production Supabase project: **Not linked**
- Latest production migration: **None recorded**
- Latest verified backup: **None recorded**
- Public registration: **Closed until launch checks pass**

Provider credentials and account authentication are intentionally not stored in the repository. Follow `DEPLOYMENT.md` when the final integrated build is green.
