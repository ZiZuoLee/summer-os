# Deployment guide

This guide publishes Summer OS as a `$0/month`, personal, non-commercial public beta. It does not claim guaranteed availability or recovery. Vercel Hobby usage must remain within its [personal/non-commercial terms](https://vercel.com/docs/plans/hobby), and current provider limits must be rechecked before launch.

## 1. Environment topology

| Environment | Branch/URL                        | Supabase                           | Allowed data                          |
| ----------- | --------------------------------- | ---------------------------------- | ------------------------------------- |
| Local/CI    | local server                      | Local Docker stack                 | Synthetic only                        |
| PR preview  | feature preview URL               | Shared non-production Free project | Synthetic only; noindex               |
| Staging     | `staging` stable preview          | Shared non-production Free project | Persistent synthetic canaries         |
| Production  | `main` / generated `*.vercel.app` | Dedicated production Free project  | Real beta users and isolated canaries |

Use a personal GitHub repository and a personal Vercel Hobby account. Do not connect a business repository, charge users, run ads, or otherwise use the Hobby deployment commercially.

The two hosted Supabase projects should use the Singapore region:

1. `summer-os-nonprod` — previews and staging only.
2. `summer-os-production` — production only.

Never point a preview at production, even temporarily. Preview URLs are not treated as secret or fully protected on a free plan.

As verified on 2026-07-11, Supabase Free lists two active projects, 500 MB database per project, 50,000 monthly active users, 5 GB egress, and 1 GB Storage; consult the dashboard because non-database quotas can be organization-wide. Brevo Free lists 300 daily email sends. These are ceilings, not capacity targets, and can change. Summer OS applies its own 100-account cap and quota alerts well before provider limits.

## 2. Provider setup

### Supabase

For each project:

1. Create the project in Singapore and save credentials in a password manager.
2. In Authentication, enable email/password and require email confirmation.
3. Configure the password policy, session lifetime, and auth rate limits conservatively.
4. Set the exact Site URL and allowed callback URL for that environment. Production should allow only `https://<project>.vercel.app/auth/callback`; non-production should use the stable staging URL. Exercise hosted auth on that stable staging deployment rather than adding a broad callback wildcard for every pull-request URL.
5. Do not enable Google OAuth.
6. Confirm that every migration has applied, every user-owned table has RLS enabled/forced, and two-user isolation tests pass.

Supabase's built-in email sender is not suitable for a public beta. Follow the [custom SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).

### Brevo SMTP

1. Create a free Brevo account and a transactional sender. With no purchased domain, follow the sender restrictions shown by Brevo and expect provider branding/rewrite behavior.
2. Generate an SMTP credential in Brevo. Enter it directly in each Supabase project's Authentication > SMTP settings using the current host, port, username, and password shown by Brevo.
3. Do not put SMTP credentials in Vercel, GitHub source, `.env.local`, screenshots, or chat.
4. Send one verification message and one password-reset message from both hosted Supabase projects. Confirm delivery, callback, and expiration behavior.
5. Monitor the Brevo transaction log and current daily quota. Delivery is best-effort.

### Cloudflare Turnstile

1. Create one production widget and one non-production widget.
2. Restrict each widget to its exact Vercel host(s). Do not use an unrestricted production widget.
3. Put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the secret in server-only `TURNSTILE_SECRET_KEY` for the corresponding Vercel environment.
4. Verify tokens server-side using Cloudflare's [Siteverify requirements](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Client-side success alone is not validation.
5. Use Cloudflare's published test key pair only in local/CI environments.

### Vercel Hobby

1. Import the personal GitHub repository into Vercel.
2. Keep `main` as Production Branch. Allow feature branches and `staging` to create previews.
3. Set Node.js to 22 and use `npm ci`/the committed lockfile.
4. Do not enable paid add-ons. Use the generated `*.vercel.app` URL.
5. Scope variables exactly as shown below. Use branch-specific preview overrides for `staging` where available.
6. Enable Git integration only after GitHub CI passes on the candidate.

Arbitrary pull-request previews are for build, layout, and synthetic non-authenticated review; the stable `staging` preview is the hosted authentication test surface. This keeps the Supabase redirect allowlist narrow on a free deployment.

### GitHub and uptime

1. Keep the repository under the same personal/non-commercial ownership model. Configure required checks for `staging` and `main` where the GitHub plan permits it.
2. Monitor included GitHub Actions minutes and artifact storage; CI and encrypted backup workflows are best-effort when the free allowance is exhausted.
3. After production passes smoke tests, configure UptimeRobot Free (or an equivalent no-cost monitor) against `https://<project>.vercel.app/api/health`. Do not put a token, email, or other secret in the monitor URL.
4. Route uptime notifications to the operator's private alert destination and test one alert/recovery cycle.

## 3. Environment variables

| Variable                         | Local/CI                | Preview/staging                     | Production                      | Sensitivity                       |
| -------------------------------- | ----------------------- | ----------------------------------- | ------------------------------- | --------------------------------- |
| `APP_ENV`                        | `local`/`test`          | `preview` or `staging`              | `production`                    | Public classification, server use |
| `NEXT_PUBLIC_SITE_URL`           | `http://localhost:3000` | Stable non-production URL           | Production `*.vercel.app` URL   | Browser-safe                      |
| `NEXT_PUBLIC_SUPABASE_URL`       | Local URL               | Non-production URL                  | Production URL                  | Browser-safe                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Local anon key          | Non-production anon/publishable key | Production anon/publishable key | Browser-safe but RLS-dependent    |
| `SUPABASE_SERVICE_ROLE_KEY`      | Local key               | Non-production key                  | Production key                  | Secret; server-only               |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Published test key      | Non-production widget               | Production widget               | Browser-safe                      |
| `TURNSTILE_SECRET_KEY`           | Published test secret   | Non-production secret               | Production secret               | Secret; server-only               |
| `BETA_SIGNUP_LIMIT`              | `100`                   | `100`                               | `100`                           | Server configuration              |
| `NEXT_PUBLIC_DEMO_MODE`          | `false` or local demo   | `false`                             | `false`                         | Browser-safe feature control      |

New Supabase projects may label the browser key `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the server key `SUPABASE_SECRET_KEY`. The implementation accepts those aliases. Configure one issued key of each class rather than leaving a placeholder alias that could take precedence.

`SUPABASE_PRODUCTION_DB_URL` is a GitHub Actions secret for backups only. It must not be added to Vercel. Prefer the Supabase **session pooler** connection string when GitHub-hosted IPv4 runners cannot reach the direct IPv6 endpoint. Never use the transaction pooler for `pg_dump`.

Store the age public recipient as the GitHub Actions secret `BACKUP_AGE_RECIPIENT`. The corresponding private identity remains offline and is never uploaded to GitHub, Vercel, or Supabase.

## 4. Local and CI verification

With Docker Desktop running:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:start
npm run db:reset
npm run lint
npm run typecheck
npm run test
npx supabase test db
npm run test:db
npm run build
npx playwright install chromium
npm run test:e2e
```

Use Supabase Inbucket for local verification/reset messages. No hosted provider or real email is required by CI.

GitHub Actions runs lockfile install, formatting, lint, typecheck, unit/component tests, build, local database/RLS tests, and Playwright. Required checks should protect `staging` and `main` where the GitHub plan supports rulesets. Add a real `CODEOWNERS` rule once the operator's GitHub username is known, especially for migrations, auth code, workflows, and security-sensitive scripts.

## 5. Applying hosted migrations

Authenticate in the CLI directly; never paste the access token into source or chat.

```powershell
npx supabase login
npx supabase link --project-ref <NONPROD_PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
```

Run database integration and full browser smoke tests against non-production. Then repeat the dry-run and push against production only after a fresh encrypted backup exists.

Use additive/expand migrations first, deploy compatible application code, backfill if needed, and contract only in a later release. A successful production migration is never automatically rolled back; database recovery is fix-forward.

## 6. Backup before production changes

The scheduled `.github/workflows/backup.yml` creates an archive with PostgreSQL 17 tooling, validates its table of contents, encrypts it to the offline-held age recipient, and retains the GitHub artifact for seven days. It can also be run manually.

Required GitHub Actions secrets:

- `SUPABASE_PRODUCTION_DB_URL`
- `BACKUP_AGE_RECIPIENT`

Generate the age identity on a trusted offline machine, not in CI:

```bash
age-keygen -o summer-os.agekey
age-keygen -y summer-os.agekey
```

The second command prints the public `age1...` recipient to store as `BACKUP_AGE_RECIPIENT`. Secure the private `summer-os.agekey` offline with the operator's recovery materials; never upload it to a provider or repository.

Before a production migration:

1. Run the **Encrypted database backup** workflow manually.
2. Confirm that the workflow succeeded and the encrypted artifact is non-empty.
3. Download the artifact to operator-controlled storage.
4. Verify decryption/listing offline with `scripts/verify-encrypted-backup.sh`.
5. Record artifact name, timestamp, source project, and verification result in the release record below.

GitHub's copy is short-lived operational convenience, not the only backup. Retain a monthly encrypted copy offline and restore-test into a disposable local database every month. See `RUNBOOK.md`.

## 7. Release procedure

1. Confirm `IMPLEMENTATION_STATUS.md` has evidence for every mandatory gate.
2. Merge the exact candidate into `staging`; deploy with non-production credentials.
3. Apply non-production migrations and complete all functional, mobile, accessibility, RLS, email, Turnstile, and secret-exposure smoke checks.
4. Create and offline-verify a new encrypted production dump.
5. Apply the reviewed backward-compatible migrations to production.
6. Merge the exact tested commit to `main`; Vercel builds and deploys it.
7. Run `node scripts/smoke-test.mjs https://<project>.vercel.app`.
8. Manually run the authenticated canary flow below.
9. Observe Vercel, Supabase, Brevo, and uptime status for at least 30 minutes.
10. Fill in the release record and only then open public registration.

### Authenticated canary

- Create/verify a fresh synthetic canary email and confirm onboarding is blocked before verification.
- Complete onboarding with `kirito-summer-2026@1`; verify exactly 50 dates and canonical category counts.
- Update a task and refresh; verify persistence.
- Submit a check-in and verify its composite workout/IELTS entries are all-or-nothing.
- Export CSV and inspect ownership and formula escaping.
- With a second user, prove no cross-user row is readable or mutable.
- Exercise password reset, logout/session invalidation, and recent-reauth account deletion.
- Confirm 360 px layout, dark/light themes, manifest/install, offline fallback, and that authenticated pages/API responses are absent from Cache Storage.

### Rollback

- **Application-only regression:** promote the previous known-good Vercel deployment, then repeat public smoke tests.
- **Migration regression:** stop the affected write path if necessary, preserve evidence, and apply a reviewed fix-forward migration. Do not automatically run a down migration.
- **Possible exposure:** close signup, revoke/rotate the affected secret in its provider, invalidate sessions if relevant, review sanitized provider logs, and follow `SECURITY.md`/`RUNBOOK.md`.

## 8. Release record

No production deployment has been performed from this repository yet.

| Item                                     | Value   |
| ---------------------------------------- | ------- |
| Release commit                           | Pending |
| Staging URL/deployment ID                | Pending |
| Production URL/deployment ID             | Pending |
| Non-production migration version         | Pending |
| Production migration version             | Pending |
| Backup artifact and offline verification | Pending |
| CI run URL                               | Pending |
| Smoke-test result/time                   | Pending |
| 30-minute observation result             | Pending |
| Production approver                      | Pending |

Do not replace `Pending` with a success claim without direct evidence.
