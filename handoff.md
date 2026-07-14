# Summer OS handoff

Last updated: 2026-07-14 (Asia/Singapore)

## Accepted stopping point

The owner has decided that the working staging deployment is sufficient for now. No production launch is requested at this point.

- Staging URL: <https://summer-os-staging.vercel.app>
- Tested Git commit: `a256189`
- Git branch: `codex/production-beta`
- Staging policy: public URL, `noindex`, personal/non-commercial beta, synthetic/non-production data
- Staging Supabase project: `summer-os-staging` (`mcpisogwmpudafowzqxq`)
- Production Supabase project: `summer-os-production` (`fdpgpcamyegfylmuyhig`)

The staging site is fully usable through its direct URL, but it remains free-tier non-production infrastructure. It has no SLA or managed backup guarantee and may pause after inactivity. Important records should be exported regularly. Do not silently reclassify staging as a commercial production service.

## Completed work

### Product and interface

- Built the Next.js 16 App Router application with strict TypeScript, Tailwind, Supabase, Zod, React Hook Form, Recharts, Vitest, and Playwright.
- Implemented the responsive graphite/neutral design system, dark and light themes, desktop sidebar, mobile bottom navigation, sheets, loading/empty/error states, reduced motion, accessible chart summaries, and 360 px overflow protection.
- Implemented Simplified Chinese workflows for Today, calendar/agenda, plan editing, minimum-day mode, check-in, IELTS, GRE, weekly review, analytics, settings, JSON/CSV export, and account deletion.
- Added the installable PWA shell, public offline page/banner, user-scoped local drafts, and a standalone static offline fallback. Authenticated HTML, API responses, and health data are excluded from service-worker caches.

### Authentication and data

- Implemented email/password signup, email confirmation, login, forgot/reset password, protected routes, onboarding, recent-password account deletion, and the 100-user beta enrollment cap.
- Removed Google OAuth from the product contract.
- Implemented Turnstile verification and Brevo-compatible Supabase custom SMTP configuration.
- Added migrations for profiles, preferences, plan templates/cycles, commitments, daily plans/tasks, check-ins, workouts, IELTS, GRE, weekly reviews, alerts, provenance, transactional RPCs, safe plan helpers, and the health check.
- Enabled and forced RLS on user-owned tables and added composite ownership constraints that reject forged cross-user parent relationships.
- Added the immutable `kirito-summer-2026@1` 50-day fixture and customizable `summer-os-flex@1` generator.
- Added deterministic, transactional, concurrent-safe, non-destructive seed/reset behavior.

### Verification

- `npm ci`: 610 packages installed and zero audit vulnerabilities at the recorded run.
- `npm run format:check`, lint, strict typecheck, unit/component tests, and production build passed.
- 70 unit/component tests passed; 5 environment-gated cases were skipped in the general unit run.
- 13 pgTAP database/schema/RLS checks passed.
- 11 migration and live two-user integration checks passed across the recorded database runs.
- The optimized desktop/Android Playwright matrix passed 85 cases with 5 correctly scoped skips.
- The hosted staging disposable-user lifecycle passed: confirmed login, exact 50-day onboarding, Today persistence, atomic check-in, IELTS, GRE, weekly review, plan edit, analytics, authenticated export, and account deletion.
- The latest focused production-build regression run passed 24 desktop/Android product, export, and offline cases.
- Staging health returned database `ok` and version `a256189` after the exact-commit deployment.
- Local and deployed browser assets were checked for server-only secret patterns with no matches.

### Deployment work

- Deployed the tested commit to Vercel Preview and assigned the stable staging alias.
- Disabled Vercel SSO protection for staging because it redirected Next.js chunks and caused onboarding `ChunkLoadError` failures. Staging remains protected from indexing through `robots.txt`.
- Applied migrations `202607110001` through `202607130005` to staging.
- Fixed staging account deletion by replacing a BOM-corrupted Preview environment value with a correctly encoded server-only credential.
- Created and migrated the production Supabase project. Its anonymous `health_check` RPC returned `true`.
- Configured the following Vercel Production variables: application environment, production site URL, production Supabase URL, production publishable key, production server-only admin key, beta signup limit, and demo mode disabled.
- Created an empty-database, pre-migration production schema snapshot at `C:\Users\user\AppData\Local\Temp\summer-os-production-pre-migration-20260713.sql`; SHA-256: `7994F515BB9AAD98E2FD5B4CDBFF51B8626F6AD031B4464CE739698506830E5F`. This is an unencrypted local schema snapshot, not a compliant ongoing backup.

## Current provider and repository state

- The local Supabase CLI link currently points to **production**: `fdpgpcamyegfylmuyhig`. Always verify `supabase/.temp/project-ref` before any remote database command.
- Staging has the complete application and non-production provider configuration.
- The generated Vercel production alias is expected to be `https://summer-os-gold.vercel.app`, but the current production deployment was created before production configuration and is **not approved or launched**.
- The source branch was pushed to `origin/codex/production-beta` at commit `a256189` before this handoff update.
- Vercel GitHub automatic deployment was not confirmed; deployments during this work used the Vercel CLI.
- No provider credential is stored in the repository. A Turnstile secret was previously pasted into chat and must be treated as compromised even if it still works.

## Intentionally not completed

The following work is not required for the accepted staging stopping point and remains unfinished:

- Production Supabase Auth Site URL and redirect allowlist were not confirmed for `https://summer-os-gold.vercel.app`.
- Production Brevo SMTP delivery and password-reset delivery were not configured or confirmed.
- A newly rotated production Turnstile secret and production hostname restriction were not confirmed.
- No new production Vercel deployment was made from the fully configured environment.
- No production signup/login/onboarding/persistence/export/deletion canary was run.
- No production RLS isolation canary or 30-minute observation window was recorded.
- No encrypted production backup or restore test was completed. The offline-held `age` identity/recipient is still required before real production data or public registration.
- UptimeRobot, quota alerts, weekly usage review, and Brevo delivery monitoring were not configured.
- Production public registration was not opened.
- GitHub-to-Vercel automatic deployments and protected branch checks were not fully connected/confirmed.

## If work resumes later

1. Decide explicitly whether to keep using staging or launch production. Do not infer a production launch from the existence of the migrated production database.
2. Rotate the previously exposed Turnstile secret. Enter the replacement directly in Cloudflare/Vercel; never paste it into chat or commit it.
3. Configure production Supabase Auth:
   - Site URL: `https://summer-os-gold.vercel.app`
   - Redirect URL: `https://summer-os-gold.vercel.app/auth/callback`
   - Brevo custom SMTP and sender settings
4. Add Production-only Vercel variables `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` using the rotated widget credentials, with `summer-os-gold.vercel.app` allowed in Cloudflare.
5. Create and offline-verify an encrypted production dump before deploying or accepting real users.
6. Re-run every mandatory gate in `DEPLOYMENT.md` from the exact release commit.
7. Deploy to Vercel Production, verify `/api/health`, then run the full disposable production canary and RLS isolation checks.
8. Observe the deployment for at least 30 minutes, record the result, and only then decide whether to open registration.
9. After production work, relink the CLI to staging if that is the safer default for subsequent development:

   ```powershell
   npx supabase link --project-ref mcpisogwmpudafowzqxq
   ```

## Reference documents

- `IMPLEMENTATION_STATUS.md` — evidence ledger and current launch checklist
- `DEPLOYMENT.md` — environment setup, migrations, backups, release, smoke tests, and rollback
- `SECURITY.md` — security boundaries and incident handling
- `RUNBOOK.md` — ongoing operations, backup, restore, and incident procedures
- `plan.md` and `CODEX_MASTER_PROMPT.md` — product and acceptance contract
