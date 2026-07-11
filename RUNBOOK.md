# Summer OS operations runbook

This runbook is for the operator of the personal, non-commercial free beta. Free services can pause, throttle, or change quotas without an SLA. Prefer honest degraded-state messaging over unsafe shortcuts.

## Routine checks

### After every production release

1. Record commit, Vercel deployment, migration version, backup artifact, and approver in `DEPLOYMENT.md`.
2. Run `node scripts/smoke-test.mjs https://<project>.vercel.app`.
3. Complete the authenticated canary: verify/login, 50-day seed, task update, check-in, export, logout, reset, and canary cleanup.
4. Inspect Cache Storage to confirm no authenticated HTML/API response is present.
5. Watch Vercel functions, Supabase Auth/database, Brevo delivery, and uptime for at least 30 minutes.

### Weekly

- Review Vercel, Supabase, Brevo, and GitHub Actions/artifact usage. Warn at 70%, restrict optional activity at 85%, and close new signup before 95% of a service quota that affects safe operation.
- Check `/api/health`, auth success/failure trend, email bounces/blocks, 5xx rate, and latency using provider dashboards without inspecting private payloads.
- Confirm the latest scheduled encrypted backup workflow succeeded and the artifact is non-empty.
- Review dependency update PRs and provider security notices.
- Confirm public beta account count remains at or below 100.

### Monthly

- Download an encrypted backup to operator-controlled offline storage.
- Verify and restore it into a disposable local database; record timestamp, archive hash, PostgreSQL tool version, migration version, and result.
- Exercise password reset and a full test-account deletion.
- Recheck current free-tier terms, quotas, project-pausing rules, SMTP quota, and Turnstile host restrictions.
- Delete expired synthetic staging users and data. Never copy production data into non-production.

## Alert matrix

| Signal                           | First response                                                      | Escalation                                                        |
| -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Health endpoint repeatedly fails | Check Vercel deployment/status, then Supabase status                | Roll back application if release-related                          |
| Elevated 5xx/latency             | Identify route template and deployment, without request bodies      | Disable affected feature or roll back                             |
| Verification/reset email fails   | Check Supabase Auth and Brevo transaction status/quota              | Close signup; preserve login for existing users                   |
| Supabase project paused          | Restore from Supabase dashboard and run smoke checks                | Display beta outage; do not switch environments                   |
| Quota >=70%                      | Notify operator and identify coarse source                          | At 85% reduce optional usage; before 95% close signup             |
| Backup job fails                 | Preserve error, retry once after checking connectivity/tool version | Do not migrate production until a verified backup exists          |
| Suspected cross-user access      | Close signup and affected writes immediately                        | Rotate secrets/sessions as relevant and follow incident procedure |
| Secret exposure                  | Rotate at provider first                                            | Invalidate sessions, remove source/log artifact, review scope     |

## Application rollback

Use Vercel to promote the previous known-good deployment. Record the bad and restored deployment IDs, then repeat public and authenticated smoke checks. Rollback does not undo database migrations.

If old application code is incompatible with the current schema, deploy a reviewed compatibility fix instead. This is why migrations must use expand/contract sequencing.

## Database incident and migration failure

1. Stop the affected mutation path or close signup; keep read-only functionality if safe.
2. Record the failing migration, exact sanitized error, project, and deployment.
3. Do not run an unreviewed down migration and do not edit migration history already applied to production.
4. Create a forward corrective migration and test it from a clean local rebuild plus a production-shaped synthetic fixture.
5. Take and verify a fresh encrypted dump before the corrective production change when the database remains accessible.
6. Apply, smoke-test, and monitor.

Restore is a last-resort operator decision because it can discard newer writes. Communicate the recovery point honestly.

## Backup procedure

The scheduled GitHub workflow uses a PostgreSQL 17 container and `scripts/backup-production.sh` to:

1. connect through the production session-pooler/direct URL supplied as a secret;
2. create a custom-format `pg_dump` without owners/ACLs;
3. validate the dump table of contents;
4. encrypt it to the operator's offline age recipient;
5. upload only the `.age` file for seven days.

The database URL is never written to the artifact. The age private identity is never present in GitHub.

The logical dump does not back up Vercel variables, Supabase project/Auth settings, Brevo configuration, Turnstile widgets, GitHub settings, or provider logs. Keep a non-secret configuration inventory and recovery checklist separately; never place provider secrets in the database archive documentation. Binary Storage is intentionally unused by this beta.

Manual local backup from WSL/macOS/Linux:

```bash
export SOURCE_DATABASE_URL='set-without-echoing'
export AGE_RECIPIENT='age1...'
export PG_DUMP_IMAGE='postgres:17-alpine'
bash scripts/backup-production.sh
unset SOURCE_DATABASE_URL AGE_RECIPIENT
```

Do not paste real values into shell history. Prefer a temporary environment injected by a password manager.

## Offline verification

On a trusted offline machine with `age`, PostgreSQL client tools (or Docker), and the private identity:

```bash
export AGE_IDENTITY_FILE='/secure/offline/location/summer-os.agekey'
bash scripts/verify-encrypted-backup.sh backups/summer-os-YYYYMMDDTHHMMSSZ.dump.age
unset AGE_IDENTITY_FILE
```

Record the SHA-256 printed by the script. A valid archive listing proves decryption and structural readability, not a complete restore.

## Restore test

Create a disposable local database with no valuable data. The restore script refuses non-local targets unless the operator sets an explicit destructive confirmation.

```bash
export AGE_IDENTITY_FILE='/secure/offline/location/summer-os.agekey'
export TARGET_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
export RESTORE_CONFIRMATION='RESTORE SUMMER_OS'
bash scripts/restore-backup.sh backups/summer-os-YYYYMMDDTHHMMSSZ.dump.age
unset AGE_IDENTITY_FILE TARGET_DATABASE_URL RESTORE_CONFIRMATION
```

After restore, run schema checks, row counts on synthetic/restored records, RLS policy inspection, and an application smoke test. Drop the disposable database afterward using the same trusted local tool; never automate destructive cleanup against a computed remote URL.

Remote restore is disabled by default. If disaster recovery truly requires it, review the script and set `ALLOW_REMOTE_RESTORE='I_UNDERSTAND_THIS_DESTROYS_DATA'` in addition to the confirmation. A second operator review is strongly recommended.

## Auth/email incident

- **Brevo quota/outage:** close new signup and password-reset initiation if it would create misleading success. Existing verified sessions/login remain available. Do not switch to Supabase's default public mailer.
- **Abuse spike:** verify Turnstile server validation, host restrictions, Supabase auth rate limits, and generic errors. Close signup temporarily if needed.
- **Account enumeration:** replace differentiated errors, clear affected logs, and assess exposure.
- **Compromised account:** advise password reset, revoke sessions when possible, and preserve only sanitized operational evidence.

## Security incident

1. Close signup and disable the affected route or mutation.
2. Rotate the affected provider secret immediately; source cleanup alone is insufficient.
3. Revoke sessions if auth/service-role exposure is plausible.
4. Review Vercel/Supabase/Brevo/Cloudflare logs without downloading user content.
5. Determine affected users/time window and any legal notification duty with the operator's jurisdiction/contact.
6. Deploy and verify a fix, monitor, and write a private post-incident record.

Never include private health/study data or active exploit details in a public issue.

## Capacity and service retirement

At 100 active accounts, reject only new signup and preserve existing login/export/deletion. Before commercial use or growth, migrate to infrastructure whose terms, backup, observability, collaboration, and availability guarantees match that use.

If retiring the beta, announce an export window, close signup, keep authenticated export/deletion available for the announced period, take a final encrypted backup, then remove Vercel/Supabase projects and provider credentials according to the published privacy commitment.
