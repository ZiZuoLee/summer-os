## Summary

Describe the user-visible outcome and why it is needed.

## Risk and data impact

- [ ] No schema/auth/RLS/service-worker/export/account-deletion behavior changed
- [ ] Schema/auth/RLS changes include migrations and two-user isolation coverage
- [ ] No production credentials or real user data were used
- [ ] Destructive/migration behavior has an explicit rollback or fix-forward note

## Verification

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npx supabase test db` (when database behavior is in scope)
- [ ] `npm run test:db` (when database behavior is in scope)
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] 360 px and keyboard/reduced-motion behavior checked when UI changed

Add command output or CI links; do not mark a gate passed without evidence.
