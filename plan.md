# Summer OS — product and implementation specification

## 1. Product contract

Summer OS is a mobile-first personal execution system for adults balancing health habits, IELTS preparation, GRE research, internship work, and coursework. The primary interface is Simplified Chinese and is designed for quick use from an Android home-screen shortcut.

The first public release is a **personal, non-commercial, best-effort beta**, not an SLA-backed service or medical product. It must deploy for `$0/month` with Vercel Hobby, two Supabase Free projects, Brevo Free SMTP, Cloudflare Turnstile Free, and the generated `*.vercel.app` URL. The application must be upgraded or migrated before monetization, advertising, business use, or material growth.

Success means a verified user can create an account, complete onboarding, generate a deterministic plan, execute and edit daily work, submit check-ins, review trends, export or delete their data, install the PWA, and recover gracefully from ordinary failures on mobile and desktop.

### Audience and safety

- Adults 18+ using the product for general wellness and personal organization.
- The app must not encourage starvation, purging, dehydration, unsafe supplements, or exercise as punishment.
- Weight and correlation features are descriptive, not medical advice. Persistent pain, dizziness/fainting, eating-disorder symptoms, or other medical concerns direct the user to an appropriate professional.
- 75 kg is an aspiration for the canonical profile, not a promise. The UI must warn that the required 83 kg-to-75 kg pace over 50 days exceeds the approximate 1%-of-body-weight-per-week safety threshold. The 73 kg stretch value is never used to prescribe intake or exercise.

## 2. Experience and information architecture

### Modern OS design direction

- Graphite dark theme and high-clarity neutral light theme with restrained cyan/violet accents, subtle depth, and original non-anime branding.
- Mobile: five-item bottom navigation (`今日`, `日历`, `打卡`, `数据`, `更多`), thumb-reachable primary actions, sheets and segmented controls, and 44–48 px touch targets.
- Desktop: collapsible sidebar and responsive dashboard grid.
- 150–220 ms micro-interactions, optimistic task feedback with rollback, animated metric changes that honor reduced motion, skeletons, toasts, and complete loading/empty/error/success states.
- WCAG 2.2 AA target: semantic controls, visible focus, useful labels, keyboard access, non-color status, error summaries, `aria-live` mutation feedback, text summaries for charts, and no horizontal overflow at 360 px.
- The check-in is a progressive form with quick-value chips, smart defaults, inline validation, a sticky submit action, and completion target under two minutes.

### Routes

Public routes:

- `/`, `/login`, `/signup`, `/forgot-password`, `/auth/callback`
- `/privacy`, `/terms`, `/health`, `/offline`
- `/api/health` exposes only shallow service status

Protected routes:

- `/onboarding`, `/today`, `/calendar`, `/check-in`, `/analytics`
- `/ielts`, `/gre`, `/weekly-review`, `/plan`, `/settings`, `/export`

The default authenticated route is `/today`. An unverified account cannot complete onboarding. An onboarded user is not sent back through onboarding unless they explicitly edit profile/setup data.

### Core screens

- **Landing:** concise value proposition, product preview, privacy/beta copy, login and signup.
- **Today:** date/category, commitments, top priorities, grouped task list, weighted completion, minimum-day progress, quick metrics/check-in, weight summary, next IELTS action, streak, alerts, and plan edit.
- **Calendar:** month and agenda layouts, category/status keys that do not rely on color alone, completion indicators, and inspect/edit by date.
- **Check-in:** weight/waist, sleep, steps, water, nutrition flags and optional estimates, workout, IELTS, mood/energy/hunger, pain, dizziness/fainting, note, and explicit skipped metrics.
- **Analytics:** weight/trends, adherence, steps, sleep, workouts, IELTS time/skills/scores, task completion, mood/energy, and non-causal correlation disclosure, filterable by 7 days, 30 days, plan, or custom range.
- **IELTS:** skill cards, sessions, mock trends, error log, exam placeholder, readiness checklist, and accessible forms.
- **GRE:** program research table, requirement summary, decision checklist/helper, and written final decision. The app never fabricates program requirements.
- **Weekly review:** plan versus actual, trends, wins, obstacles, next adjustment, burnout, one activity to stop, and finalize/save.
- **Plan editor:** edit/duplicate a day, edit commitments and tasks, reset one day from its immutable template, and full-plan reset behind typed confirmation.
- **Settings/export:** profile, goals, targets, timezone, theme, exam date, install help, notification placeholder, safe reseed, CSV downloads, and account deletion.

## 3. Authentication, privacy, and beta controls

### Email authentication

- `/signup` collects email, password, password confirmation, 18+ acknowledgement, general-wellness disclaimer acknowledgement, and a Turnstile token.
- `/login` uses email/password. Errors are generic and do not disclose whether an account exists.
- `/forgot-password` and the reset callback work through Supabase Auth and Brevo custom SMTP.
- Email confirmation is required before onboarding. Google OAuth is not implemented.
- Enforce a strong password policy through Supabase and server validation. Auth/session flows use current Supabase SSR cookie guidance.
- Turnstile tokens are verified server-side, are single-use, and fail closed outside explicit local/test mode.

### Enrollment and deletion

- Production accepts at most 100 active beta users. Capacity is enforced transactionally on the server/database, not by a client counter. Existing users can continue signing in when capacity is reached.
- A capacity failure clearly says that beta enrollment is full without leaking account state.
- Deletion requires a fresh/recent session plus typed email confirmation. Delete owned active records transactionally, then use a narrowly scoped server-only administrative client to delete that same Auth identity and revoke sessions.
- The UI explains that deleted values may remain in provider-level backups until those backups expire.

### Privacy and caching

- Derive user identity from the verified session; never accept `user_id` from form or JSON input.
- Authenticated responses use `private, no-store` and are never placed in shared or service-worker caches.
- The service worker caches only public static build assets, icons/manifest, and the public offline fallback. It never queues writes or intercepts authenticated mutation APIs.
- A check-in draft is schema-versioned and namespaced by authenticated user ID and local date. It expires after seven days and clears on successful submit, logout, account switch, or account deletion.
- Logs must not contain email, check-in/health values, free-text notes, tokens, cookies, authorization headers, database URLs, or request bodies.

## 4. Planning templates and behavior

### Canonical template: `kirito-summer-2026@1`

Profile defaults:

| Field               | Value                          |
| ------------------- | ------------------------------ |
| Display name        | Kirito                         |
| Height              | 180 cm                         |
| Starting weight     | 83 kg                          |
| Aspirational target | 75 kg                          |
| Stretch value       | 73 kg                          |
| Previous IELTS      | 7.5                            |
| Timezone            | `Asia/Shanghai`                |
| Plan dates          | 2026-07-13 through 2026-08-31  |
| IELTS placeholder   | 2026-08-29, marked unconfirmed |

The immutable fixture contains exactly 50 unique dates with these categories:

| Category               | Count | Dates/rule                                    |
| ---------------------- | ----: | --------------------------------------------- |
| `BASELINE`             |     1 | 2026-07-13                                    |
| `INTERNSHIP_PART_TIME` |    11 | Mon/Wed/Thu after baseline through 2026-08-07 |
| `COURSE_DAY`           |     8 | Tue/Fri through 2026-08-07                    |
| `WEEKEND_INTENSIVE`    |     6 | Saturdays 2026-07-18 through 2026-08-22       |
| `WEEKEND_RECOVERY`     |     6 | Sundays 2026-07-19 through 2026-08-23         |
| `INTERNSHIP_FULL_TIME` |    10 | Weekdays 2026-08-10 through 2026-08-21        |
| `IELTS_TAPER`          |     6 | 2026-08-24 through 2026-08-28 and 2026-08-30  |
| `EXAM_DAY`             |     1 | 2026-08-29                                    |
| `FINAL_REVIEW`         |     1 | 2026-08-31                                    |

2026-07-13 remains `BASELINE` and also contains the 09:00–17:30 internship commitment. The fixture therefore has 12 internship commitments before 2026-08-08 (including July 13) and 16 weekday internship commitments afterward. Course commitments are 09:00–11:30. Commitments remain editable after seeding.

Required special content:

- 2026-07-13: baseline measurements/setup and IELTS diagnostic.
- 2026-07-19: first weekly review.
- 2026-08-07: course closeout.
- 2026-08-08: transition planning for full-time internship.
- 2026-08-23: exam-readiness review.
- 2026-08-29: editable, unconfirmed IELTS exam placeholder.
- 2026-08-30: GRE decision record.
- 2026-08-31: final measurement and retrospective.

Daily tasks vary by phase, weekday, commitment load, recovery needs, and IELTS progression. The fixture targets roughly three strength sessions and two or three cardio/walk sessions weekly, at least one low-intensity recovery day, shorter study on heavy workdays, deeper weekend practice, and reduced exercise/study fatigue during taper. No more than three seeded `HIGH` days are consecutive.

### Flexible template: `summer-os-flex@1`

- User-selected 7–120 day range, IANA timezone, goals, recurring commitments, and dated special events.
- Uses the same task/health safety rules and supports dates beyond the canonical summer.
- Category precedence for deterministic generation is: exam event, final review, baseline, IELTS taper, dominant weekday commitment, Saturday intensive, Sunday recovery, then flexible day.
- A special event may add tasks without removing a fixed commitment.

### Seed and reset semantics

- Seeding runs in one database transaction with a per-user/cycle lock and an idempotency key.
- Template rows are immutable and versioned. Generated rows record template key/version and a stable content hash.
- A repeat seed fills missing untouched records only. It never overwrites edits, completions, custom tasks, check-ins, workouts, study history, or weekly reviews.
- Template upgrades show a diff and require confirmation.
- Resetting a day restores only template-derived plan content after confirmation. Full reset requires typed confirmation and still preserves tracking/study history.
- Task completion uses explicit target status plus an expected row version, rather than a replay-sensitive toggle.

### Minimum-day and scoring

Minimum-day mode retains the original plan but presents a reduced set: record/skip weight, 6,000 steps, a short IELTS review, protein-forward meal quality, tomorrow planning, and on-time sleep. It is never framed as failure.

Required tasks weigh 2 and optional tasks weigh 1 for the ordinary completion percentage. The tooltip explains the calculation. Minimum-day completion is shown as a separate measure.

## 5. Tracking, IELTS, GRE, and analytics

### Health-aware check-in

- Optional metrics are represented as recorded, explicitly skipped, or not answered; zero is never used as a missing-value sentinel.
- Nutrition defaults to simple quality/portion flags. Optional calorie/macronutrient estimates are accepted but do not produce restrictive prescriptions.
- The user self-reports intake concern; the system does not infer starvation from optional calorie values.
- Daily log, optional quick workout, and optional quick IELTS entry submit in one idempotent transaction.
- Health alerts cover: loss trend over about 1%/week, trailing sleep below six hours, dizziness/fainting, pain at least 7/10, repeated self-reported intake concern, and seven consecutive high-RPE days. Copy is non-alarming and recommends reducing intensity/professional support as appropriate.

### Analytics rules

- Seven-day weight average requires at least three readings in the window.
- Target projection requires at least 14 elapsed days and seven readings, uses a robust recent weekly trend, caps displayed safe loss at 1%/week, and returns no target date for flat/rising trends.
- Do not celebrate extreme day-to-day drops.
- Correlations require at least ten paired observations and are labeled descriptive, not causal.
- Timezone conversion happens before assigning an instant to a user's calendar date.

### IELTS

The canonical progression is recalibration, accuracy, output improvement, mixed timed practice, full-time-work adaptation, exam readiness, and taper. Session fields include date, skill, material/source, planned/actual minutes, optional score/band, errors, next action, and an optional HTTPS attachment link. Binary uploads are out of scope for the free beta.

The error log stores skill, type, detail, correction, recurrence count, and resolution. The exam event defaults to 2026-08-29 and stays visibly unconfirmed until the user confirms or changes it.

### GRE

The research table stores university, program, intake, official HTTPS requirement URL, status, scholarship relevance, deadline, notes, and verification date. Status is required/optional/not required/not accepted/unknown.

The decision checklist evaluates actual program requirements, opportunity cost, timing, cost, and whether a score could materially help. The final record is `PREPARE`, `DO_NOT_PREPARE`, or `DEFER_PENDING_SCHOOL_LIST`, with user-written rationale. No external requirement is invented or silently inferred.

## 6. Technical architecture and data

### Runtime and interfaces

- Current mutually compatible Next.js App Router, React, strict TypeScript, Tailwind, accessible UI primitives, Supabase JS/SSR, Zod, React Hook Form, Recharts, date-fns timezone utilities, Vitest, Testing Library, and Playwright.
- Pin Node 22 LTS and all packages through `package-lock.json`.
- Server Components perform authenticated reads. Server Actions handle ordinary mutations. Route Handlers are limited to auth callbacks, exports, account deletion, health, and PWA HTTP assets where needed.
- Internal mutations return a typed result with stable error codes and user-safe Chinese messages. There is no supported public data API in v1.
- Attachments are HTTPS links only; no binary file storage in the beta.

### Data model

Use normalized migrations for:

- profiles, app preferences, goals/targets;
- immutable template/version records, plan cycles, recurring commitment rules, daily plans, daily commitments, and tasks;
- daily logs and workout sessions;
- IELTS sessions and errors;
- GRE programs and decisions;
- weekly reviews and alert acknowledgements;
- seed-run/idempotency provenance.

All mutable rows have created/updated timestamps. Store instants as UTC `timestamptz`, calendar buckets as SQL `date`, and recurring commitment times as local time plus the plan-cycle timezone snapshot.

Every user-owned parent exposes unique `(id, user_id)`. Child ownership uses composite foreign keys referencing `(parent_id, user_id)`. Add range/enum checks, unique daily constraints, indexes for common user/date queries, update triggers, and intentional cascades.

### RLS

- Enable and force RLS on every user-owned table.
- Authenticated users select/insert/update/delete only rows owned by `auth.uid()`.
- Profile `id` equals `auth.uid()`.
- Policy predicates and composite ownership constraints prevent forged cross-user parent references.
- Database tests create two real Auth users and prove denial for cross-user select, insert, update, delete, and forged parent relationships. Static SQL searches alone are not acceptance evidence.

## 7. PWA and offline behavior

- Provide a valid manifest, original icons, theme colors, standalone display, Android install guidance, public `/offline` page, and online/offline banner.
- The service worker precaches or runtime-caches only explicitly public static assets. Navigation requests always go to the network and fall back to the cached public offline page without storing successful authenticated HTML.
- No authenticated write is queued for later replay. Only the user-scoped check-in draft remains locally available.
- Service-worker updates clean old named caches and support an explicit safe activation message.

## 8. Verification and acceptance

Mandatory local and CI gates:

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

### Automated coverage

- Unit: exact fixture dates/categories/commitments, recurrence/timezones, stable hashes, idempotency/concurrency helpers, analytics thresholds, alerts, scoring, validation, and CSV escaping/formula protection.
- Component: auth forms and generic errors, Turnstile failure, navigation, task rollback, check-in validation/drafts, alerts, charts/text summaries, and destructive confirmations.
- Database: migrations rebuild from zero, constraints, RLS enabled/forced, two-user isolation, forged ownership rejection, and transactional seed/check-in behavior.
- Playwright: verification/login/reset, onboarding, both templates, 50-day seed, Today persistence, check-in, calendar/editor, analytics, IELTS/GRE, export, offline fallback, logout, and deletion.
- Visual/accessibility: desktop and Android screenshots for Today/check-in/calendar/analytics in dark/light themes, 360 px overflow, keyboard/focus, reduced motion, and automated accessibility checks.

### Production smoke acceptance

- Public pages, manifest, service worker, health endpoint, security headers, and mobile layout respond correctly.
- Verification/reset email delivery works through Brevo; callback allowlists are exact.
- A synthetic canary completes auth, onboarding, 50-day seed, task update, check-in, and export.
- Cross-user RLS isolation is rechecked without exposing real data.
- No service-role key, Turnstile secret, database URL, or source map secret appears in browser assets/responses.
- Deployment commit, Vercel deployment URL, migration version, dump artifact, results, and observation window are recorded in `DEPLOYMENT.md`.

## 9. Free-tier environments and operations

| Environment | Vercel                   | Supabase                           | Policy                                 |
| ----------- | ------------------------ | ---------------------------------- | -------------------------------------- |
| Local/CI    | Local Next.js            | Local Docker stack                 | Synthetic users and Inbucket           |
| PR previews | Hobby preview            | Shared non-production Free project | Synthetic data, protected/noindex      |
| Staging     | Stable `staging` preview | Same non-production project        | Persistent synthetic canaries          |
| Production  | `main` on `*.vercel.app` | Dedicated production Free project  | Real beta users plus isolated canaries |

- Environment variables are scoped so no preview can access production credentials. Runtime guards reject an environment/hostname/Supabase-project mismatch.
- Supabase Free currently grants two projects and limited quotas; provider terms and limits must be rechecked before launch. Free projects can pause and do not carry a managed-backup or availability guarantee.
- As verified on 2026-07-11, the Supabase Free allowance lists 500 MB database per project, 50,000 monthly active users, 5 GB egress, and 1 GB Storage; non-database quotas may be organization-wide. The product's own 100-account cap is intentionally far lower. See [Supabase billing documentation](https://supabase.com/docs/guides/platform/billing-on-supabase).
- As verified on 2026-07-11, Brevo Free lists 300 email sends per day, including transactional email. Delivery is best-effort, unused daily sends do not roll over, and quota/branding may change. Supabase's default mailer is not used for public users. See [Brevo plan documentation](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans).
- Monitor Vercel/Supabase/Brevo/GitHub dashboards weekly and alert at 70%, 85%, and 95% of relevant quotas. UptimeRobot Free (or an equivalent no-cost monitor) may call only the shallow `/api/health` endpoint.
- Create a restricted scheduled GitHub Action that makes a `pg_dump`, validates the archive, encrypts it to an offline-held age recipient, and retains the artifact for seven days. The age private identity never enters GitHub or Vercel.
- Download a monthly encrypted copy to user-controlled storage and restore-test monthly into a disposable local database.

Release sequence:

1. Feature work passes CI against local Supabase.
2. Merge the candidate to `staging`, apply migrations to non-production, and run all browser/smoke checks.
3. Create and validate an encrypted production dump.
4. Apply backward-compatible production migrations.
5. Merge/promote the exact verified commit to `main`; Vercel deploys it.
6. Run public-domain smoke tests and monitor for at least 30 minutes.

Application rollback promotes the previous known-good Vercel deployment. Database changes use expand/contract migrations and fix-forward recovery; never automatically reverse a successfully applied production migration.

## 10. Definition of done and external inputs

The implementation is done only when all product areas, database/RLS behavior, automated gates, documentation, PWA behavior, and production smoke criteria above are complete. Staged delivery is not permission to stop at the core dashboard.

The operator must provide or approve, through provider dashboards rather than chat:

- personal GitHub repository and Vercel Hobby connection;
- two Singapore-region Supabase Free projects;
- Brevo sender/SMTP setup and delivery test;
- Cloudflare Turnstile widget restricted to production and staging hosts;
- GitHub Actions secrets for database backup plus an offline age identity;
- privacy contact, incident contact, and production release approval.

If provider authentication is unavailable, the repository must remain fully deployable from `DEPLOYMENT.md`; status must say deployment is pending rather than claiming success.
