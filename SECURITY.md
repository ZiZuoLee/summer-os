# Security policy and design

Summer OS stores personal planning, study, and wellness observations. Treat all authenticated data as sensitive even when a particular field is not legally classified as health information in the operator's jurisdiction.

## Supported version

Only the commit currently deployed to the production `*.vercel.app` URL is supported. Preview/staging builds and superseded deployments are test artifacts. Before the first public deployment, the project is pre-release and no hosted version is supported.

## Reporting a vulnerability

Do not open a public issue containing user data, credentials, exploit details, or screenshots of private records. Use the repository's private GitHub Security Advisory feature. If that feature is unavailable, contact the operator through the privacy contact published in the deployed application.

Include the affected route/version, reproduction steps using synthetic data, impact, and any safe mitigation. Do not access another person's data, degrade the service, send bulk email, or retain data while testing.

No paid support or response SLA is promised for the free beta. The operator should acknowledge a credible high-impact report promptly and close public registration while assessing it.

## Data classification

| Class                  | Examples                                                                          | Handling                                                |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Public                 | landing copy, manifest, public icons, health endpoint status                      | May be cached publicly                                  |
| User-private           | plans, tasks, IELTS/GRE work, preferences                                         | Authenticated, RLS-protected, private/no-store          |
| Sensitive user-private | weight, sleep, pain, dizziness, nutrition, notes                                  | Same controls plus never log/cache/telemetry            |
| Secret                 | service-role key, Turnstile secret, database URL, SMTP credential, cookies/tokens | Provider secret stores/server only; rotate on suspicion |

The browser-safe Supabase anonymous/publishable key and Turnstile site key are not secrets, but their environment must still match the deployed host. Security depends on correct RLS and server-side Turnstile verification.

## Security invariants

- Identity comes from the verified server session, never a client-supplied user ID.
- Email is verified before onboarding. Auth errors are enumeration-safe.
- Signup capacity and Turnstile validation are enforced server-side and transactionally where state is involved.
- Every user-owned table has RLS enabled/forced. Policies restrict all CRUD to `auth.uid()`.
- Composite ownership foreign keys stop a child row from referencing another user's parent even if application validation fails.
- All mutations are schema-validated on the server. Seed/check-in operations are idempotent; task updates carry the intended state and expected row version.
- The service-role credential is imported only by server-only modules and used narrowly for same-user account deletion/administration.
- Authenticated pages and APIs use `private, no-store`. The service worker stores only explicit public static assets and `/offline`.
- Check-in drafts are user/date namespaced, schema-versioned, expire after seven days, and clear on submit/logout/account switch/deletion.
- CSV exports escape formula prefixes (`=`, `+`, `-`, `@`, tab, and carriage return) as well as delimiters, and contain only the current user's rows.
- Destructive actions require explicit confirmation; account deletion additionally requires recent reauthentication and typed email.

## Secret management

- Never commit `.env.local`, provider state, dumps, age private identities, tokens, or credentials.
- Vercel receives only runtime variables for its environment. Preview gets non-production credentials; production gets production credentials.
- Brevo SMTP credentials live only in the relevant Supabase Auth dashboard.
- GitHub Actions receives the production database URL and age **public recipient** for backups. The age private identity stays offline.
- Do not print secrets, full environment objects, request bodies, cookies, authorization headers, or URLs containing database passwords.
- Rotate a secret immediately if it appears in a commit, log, screenshot, artifact, browser bundle, or untrusted environment. Rewriting Git history does not replace rotation.

## Application and HTTP controls

- Use secure, HTTP-only, same-site session cookies through the current Supabase SSR integration.
- Validate redirect destinations against an allowlist and use exact production auth callback URLs.
- Apply a restrictive Content Security Policy compatible with Supabase and Turnstile, plus HSTS in production, `X-Content-Type-Options: nosniff`, a conservative Referrer Policy, and appropriate Permissions Policy.
- State-changing endpoints accept only intended methods/content types and verify the authenticated session. Do not use CORS wildcards for credentialed requests.
- Return stable user-safe errors; keep provider/database detail out of responses.
- Rate-limit auth through Supabase and Turnstile. Add application-level protection to expensive or administrative paths if abuse appears.
- `/api/health` is shallow and must not query or reveal user rows, schema versions, project refs, credentials, or internal exceptions.

## PWA controls

The service worker is deliberately narrow. It must not cache navigation successes, `/api/**`, Supabase responses, authenticated HTML, check-ins, exports, or mutations. Offline drafts are implemented in application-scoped local storage, not a background sync queue. Cache names are versioned and old Summer OS caches are removed on activation.

## Logging and telemetry

Allowed operational fields are coarse status, route template, response class, latency, deployment ID, migration version, and random request/correlation ID. Never collect email, user ID when avoidable, weights, wellness metrics, notes, task text, study errors, tokens, headers, or request bodies.

If error monitoring is added later, disable session replay and request-body capture by default, scrub URLs and breadcrumbs, and document retention before enabling it.

## Verification before public registration

- Dependency, lint, type, unit, database, build, Playwright, and accessibility gates pass.
- Two real local Auth users prove cross-user isolation for every CRUD direction and forged relationships.
- Browser assets/responses are searched for service-role, database, SMTP, and Turnstile secrets.
- Verification/reset email, generic auth errors, Turnstile failure, enrollment capacity, session invalidation, export, and deletion are exercised on staging.
- Cache Storage is inspected after authenticated use to prove private responses were not stored.
- Backup encryption is verified offline and a restore test succeeds.

## Incident priorities

1. Protect users: close signup or disable the affected path without destroying evidence.
2. Contain: revoke/rotate credentials, invalidate sessions, and isolate the environment.
3. Assess using sanitized provider logs and exact deployment/migration IDs.
4. Recover with a known-good deployment and fix-forward database changes.
5. Notify affected users honestly when required, then document cause and prevention without publishing exploitable secrets.

Operational details are in `RUNBOOK.md`.
