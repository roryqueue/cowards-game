---
phase: 250
slug: counted-entry-and-one-active-revision-enforcement
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-16
---

# Phase 250 - Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest, Go test, targeted boundary monitor scripts |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `apps/go-backend/go.mod`, `package.json` |
| Quick run command | `pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts packages/persistence/src/ladder.test.ts` |
| Full suite command | `pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts packages/spec/src/spec.test.ts packages/persistence/src/ladder.test.ts apps/web/lib/public-discovery-service.test.ts apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Provider.*Readiness|Test.*Counted' -count=1` |
| Estimated runtime | ~90 seconds for targeted suite; service-backed database proof may need `pnpm services:up` if added during execution |

## Sampling Rate

- After every task commit: run the automated command listed for that task.
- After every plan wave: run the plan-level targeted suite for touched modules.
- Before phase verification: run the full suite command plus `pnpm v1.36:competition-policy:check`.
- Max feedback latency: 120 seconds for non-service checks.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 250-01-01 | 01 | 1 | ELIG-01, ELIG-02, ELIG-03 | T-250-01-02, T-250-01-03, T-250-01-06 | Category contract covers full rejection matrix and public copy stays leak-safe | unit | `pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts` | no - W0 | pending |
| 250-01-02 | 01 | 1 | ELIG-01, ELIG-02, ELIG-03 | T-250-01-03, T-250-01-07 | Spec contract exports TypeScript/Python/Rust/Zig lane list, excludes JavaScript/TinyGo, and does not execute Strategy code | unit/static | `pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts packages/spec/src/spec.test.ts` | no - W0 | pending |
| 250-02-01 | 02 | 2 | ELIG-01, ELIG-02, ELIG-04, ELIG-05 | T-250-02-01, T-250-02-02, T-250-02-05 | Persistence tests reject invalid/stale/duplicate/replacement entries before mutation | unit/integration | `pnpm exec vitest run packages/persistence/src/ladder.test.ts` | yes - extend | pending |
| 250-02-02 | 02 | 2 | ELIG-01, ELIG-02, ELIG-03, ELIG-04, ELIG-05 | T-250-02-01 through T-250-02-07 | Entry mutation consumes stored proof, returns public categories, preserves full owner/Season uniqueness, and catches `23505` safely | unit/static | `pnpm exec vitest run packages/persistence/src/ladder.test.ts packages/spec/src/competition-entry-eligibility.test.ts` | yes - extend | pending |
| 250-03-01 | 03 | 3 | ELIG-01, ELIG-02, ELIG-03 | T-250-03-01, T-250-03-06 | API route returns `{ ok: false, eligibility: { category, publicMessage, remediation } }` without raw private details | unit/API | `pnpm exec vitest run apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` | no - W0 | pending |
| 250-03-02 | 03 | 3 | ELIG-01, ELIG-02, ELIG-03 | T-250-03-06, T-250-03-07 | Public discovery and entry page project authoritative eligibility without React-owned rules or private data | unit/static | `pnpm exec vitest run apps/web/lib/public-discovery-service.test.ts apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` | partial - extend | pending |
| 250-03-03 | 03 | 3 | ELIG-02, ELIG-06 | T-250-03-03, T-250-03-07 | Go readiness category parity holds and exhibitions remain separate/non-counted for trial standings | Go/unit/static | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Provider.*Readiness|Test.*Counted' -count=1 && pnpm exec vitest run packages/persistence/src/competition.test.ts apps/web/lib/public-discovery-service.test.ts` | yes - extend | pending |

## Wave 0 Requirements

- [ ] `packages/spec/src/competition-entry-eligibility.test.ts` - contract tests for ELIG-01, ELIG-02, ELIG-03.
- [ ] `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` - API response and privacy tests for ELIG-03.
- [ ] `packages/persistence/src/ladder.test.ts` - extend with duplicate owner, withdrawn replacement, invalidated replacement, and race-fallback cases for ELIG-04 and ELIG-05.

## Manual-Only Verifications

All Phase 250 behaviors have automated verification. Full service-backed entry to standings to replay proof remains Phase 255 scope.

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 120 seconds for non-service checks.
- [x] `nyquist_compliant: true` set in frontmatter.

Approval: approved 2026-06-16
