<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Summer OS engineering guide

## Product contract

- Read `plan.md`, `SECURITY.md`, and the relevant implementation before changing behavior.
- Summer OS is a Simplified Chinese, mobile-first, general-wellness application for adults. It is not medical software.
- The hosted beta is personal and non-commercial and must remain compatible with Vercel Hobby plus two Supabase Free projects.
- Authentication is email/password with verified email. Google OAuth and magic-link-only sign-in are out of scope.
- Never weaken security, accessibility, or timezone correctness to save hosting cost.

## Architecture

- Use Next.js App Router, strict TypeScript, React Server Components for authenticated reads, Server Actions for normal mutations, and Route Handlers only where an HTTP endpoint is required.
- Read the matching Next.js 16 guide under `node_modules/next/dist/docs/` before using framework APIs. In particular, this project uses the current `proxy` convention rather than legacy middleware.
- Keep client components small and interaction-focused. Never ship service-role credentials or server-only environment variables to the browser.
- Validate untrusted input on the server with Zod. Derive the user ID from the verified Supabase session, never from form or JSON input.
- Store instants in UTC, calendar buckets as SQL `date`, and recurring local times with an IANA timezone. Do not silently substitute the server timezone.
- Normal application data access must use the authenticated Supabase client and RLS. Reserve the service-role client for narrowly scoped server-only administration such as deleting the authenticated user's identity.

## Data and security

- Every user-owned table requires RLS and ownership constraints. Child rows must use composite ownership foreign keys so cross-user parent references fail independently of RLS.
- Add migrations rather than editing deployed schema by hand. Production migrations use expand/contract changes and fix-forward recovery.
- Authenticated HTML and API responses must be `private, no-store`. The service worker may cache only explicitly public static assets and the public offline fallback.
- When the public offline fallback or cache allowlist changes, bump the service worker cache version and verify old Summer OS caches are removed on activation.
- Do not log email addresses, health/check-in values, notes, tokens, cookies, authorization headers, request bodies, database URLs, or provider secrets.
- CSV exports must escape formulas as well as CSV delimiters. Account deletion requires recent reauthentication and typed email confirmation.
- All destructive actions require explicit confirmation and must preserve history unless the product contract explicitly authorizes deletion.

## UI conventions

- Use Simplified Chinese user-facing copy and English engineering documentation.
- Maintain a graphite dark theme and neutral light theme with restrained cyan/violet accents.
- Target WCAG 2.2 AA: semantic controls, visible focus, useful labels, non-color status, accessible chart summaries, reduced-motion support, and 44–48 px touch targets.
- Verify layouts at 360 px without horizontal overflow. Mobile uses the five-item bottom navigation; desktop uses the collapsible sidebar.
- Mutations need pending, success, failure, and rollback behavior. Forms need inline validation and keyboard-accessible error summaries.

## Commands and quality gates

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

- Docker is required for `db:start`, database tests, and authenticated end-to-end tests.
- Add or update unit, component, database/RLS, and Playwright coverage in proportion to each behavior change.
- Never make Playwright optional in CI. If an external dependency is unavailable, report the exact failure; do not turn the gate into a silent pass.
- Run `npm run format:check` before handoff. Formatters may be run only when their output has been reviewed.

## Repository hygiene

- Keep dependencies pinned in `package-lock.json` and do not edit the lockfile by hand.
- Do not commit `.env*`, dumps, Playwright artifacts, provider state, or secrets. `.env.example` contains names and non-secret placeholders only.
- Preserve unrelated user changes in a dirty worktree. Do not reset or discard work you did not create.
- Update `IMPLEMENTATION_STATUS.md` and deployment documentation when behavior, gates, environment variables, migrations, or release steps change.
- Never claim that a migration, backup, restore, email, smoke test, or deployment succeeded without direct evidence.
