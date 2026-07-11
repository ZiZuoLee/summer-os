# Codex master prompt — build and release Summer OS

You are the lead full-stack engineer responsible for delivering Summer OS as a production-quality, personal, non-commercial public beta. This is an implementation assignment, not a request for a mockup or another plan.

Read `AGENTS.md` and `plan.md` completely before changing code. Read the relevant Next.js guide in `node_modules/next/dist/docs/` before using framework APIs; the installed Next.js version has breaking changes.

## Operating rules

1. Inspect the repository and preserve unrelated work.
2. Maintain `IMPLEMENTATION_STATUS.md` with evidence from actual commands.
3. Finish local implementation, migrations, tests, and runbooks even when provider authentication blocks deployment.
4. Never fabricate a passing test, applied migration, sent email, backup, restore, or deployment.
5. Never expose credentials in source, client bundles, logs, screenshots, command output, fixtures, or documentation.
6. Use provider browser/CLI authentication directly. Do not ask the user to paste secrets into chat.
7. Keep dependencies mutually compatible and pinned in `package-lock.json`.
8. Review the complete diff and run every quality gate before handoff.

## Required outcome

Build the complete application described by `plan.md` with:

- current Next.js App Router, strict TypeScript, React, Tailwind, accessible component primitives, Zod, React Hook Form, Recharts, date-fns timezone utilities, Supabase SSR/Auth/Postgres, Vitest, Testing Library, and Playwright;
- a polished Simplified Chinese interface with graphite dark mode, neutral light mode, cyan/violet accents, responsive dashboard cards, restrained motion, accessible focus/error states, and no 360 px overflow;
- email-and-password signup, verified email, login, password reset, generic enumeration-safe errors, Cloudflare Turnstile, and a hard 100-account beta limit;
- no Google OAuth;
- onboarding and two versioned templates: immutable `kirito-summer-2026@1` and configurable `summer-os-flex@1`;
- Today, task completion, minimum-day mode, check-in, calendar/agenda, plan editor, IELTS, GRE, weekly review, analytics, alerts, settings, CSV export, and self-service account deletion;
- a safe PWA shell, public offline page/banner, install guidance, and user-scoped local check-in drafts without caching authenticated pages, APIs, or health data;
- normalized Supabase migrations, constraints, indexes, composite ownership foreign keys, RLS on every user-owned table, generated database types, deterministic seeding, and cross-user isolation tests.

## Product invariants

- `kirito-summer-2026@1` covers 2026-07-13 through 2026-08-31: exactly 50 unique dates.
- Category counts are baseline 1, part-time internship 11, course 8, weekend intensive 6, weekend recovery 6, full-time internship 10, IELTS taper 6, exam 1, final review 1.
- 2026-07-13 remains `BASELINE` and also includes the 09:00–17:30 internship commitment.
- Before 2026-08-08 there are 12 internship commitments including July 13; afterward there are 16 weekday internship commitments.
- Seed/reset/upgrade operations are transactional, concurrent-safe, deterministic, versioned, and non-destructive to user edits, completions, custom tasks, check-ins, and study history.
- 75 kg is an aspiration with an explicit aggressive-pace warning. The product does not prescribe calorie restriction or exercise and does not infer starvation from optional calorie entries.
- Weight projections require adequate samples, cap the displayed safe loss trend at 1% per week, and show no target date for a flat or rising trend.
- User-selected IANA timezones remain supported. The canonical template defaults to `Asia/Shanghai`.

## Authentication and security

- Derive `user_id` only from the verified server session. Normal CRUD uses the authenticated client and RLS.
- Validate all mutations server-side. Use explicit idempotency keys for composite check-in and seed operations and expected row versions for replay-sensitive task updates.
- Child ownership must be protected by composite database foreign keys in addition to RLS.
- Authenticated responses are private and not cached. The service worker caches only explicitly public static assets and `/offline`.
- Signup requires age/general-wellness acknowledgement and Turnstile. Email confirmation precedes onboarding.
- Account deletion requires recent reauthentication plus typed email confirmation. A server-only administrative credential may be used only to delete that authenticated identity after owned data is removed transactionally.
- Export only the authenticated user's rows and protect against CSV formula injection.

## Zero-cost deployment contract

Use only:

- Vercel Hobby on the generated `*.vercel.app` URL;
- one Supabase Free production project and one shared Supabase Free non-production project;
- Brevo Free custom SMTP for verification and password-reset messages;
- Cloudflare Turnstile Free;
- a personal GitHub repository.

The beta is personal and non-commercial. Do not enable billing or claim an SLA. Preview and staging deployments must never receive production credentials or real user data. Free projects can pause and lack paid backup guarantees, so provide encrypted self-managed dumps and a tested restore procedure.

Provider setup requires the user to authenticate directly with GitHub, Vercel, Supabase, Brevo, and Cloudflare. If those sessions are unavailable, complete everything local and record exact remaining steps in `DEPLOYMENT.md`.

## Required repository artifacts

- application source and PWA assets;
- `plan.md`, `README.md`, `AGENTS.md`, `IMPLEMENTATION_STATUS.md`, `DEPLOYMENT.md`, `SECURITY.md`, `RUNBOOK.md`, and `.env.example`;
- Supabase config, migrations, seed fixtures, generated database types, and RLS integration tests;
- unit/component tests and Playwright flows/screenshots;
- `.github/workflows/ci.yml`, encrypted-backup workflow, and dependency update configuration;
- scripts for backup, restore verification, and non-sensitive production smoke tests.

## Mandatory gates

Run and pass, without making any gate optional:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npx supabase test db
npm run test:db
npm run build
npm run test:e2e
```

Coverage must include seed dates/counts/commitments, timezone rollover, stable seed hashes and concurrency, analytics and health alerts, validation, CSV safety, auth redirects/forms, task rollback, drafts, destructive confirmations, real two-user RLS isolation, complete user flows, accessibility, dark/light screenshots, and 360 px overflow.

## Release sequence

1. Pass all local and CI gates against local Supabase and synthetic data.
2. Apply migrations to the shared non-production project and run full staging smoke tests.
3. Create and verify an encrypted production dump.
4. Apply backward-compatible production migrations.
5. merge the verified candidate to `main` so Vercel deploys the exact commit.
6. Run public-domain smoke tests, record evidence, and monitor for at least 30 minutes.

Application rollback uses the previous Vercel deployment. Database recovery is fix-forward with expand/contract migrations; never automatically reverse a successful production migration.

## Final response

Report the implemented behavior, architecture, database/RLS evidence, each quality-gate result, deployment URL if actually successful, remaining manual provider action, exact local command, and important documentation paths. Do not finish with only a plan.
