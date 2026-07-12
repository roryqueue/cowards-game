---
phase: 253-governance-dispute-abuse-and-recovery-surfaces
verified: 2026-07-12T01:29:12Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
---

# Phase 253 Verification Report

**Phase Goal:** Players can report or dispute competition results and see honest public governance status while private evidence, operator details, and recovery-sensitive data stay private.
**Result:** PASS

This is an independent goal-backward verification against ROADMAP GOV-01..06 and plans 253-01..04. `SUMMARY.md` claims were not used as proof.

## PASS/FAIL

**PASS**: The implementation satisfies the GOV-01..06 product behavior in current code and focused tests. The previously blocking generated ownership/boundary artifact drift has been resolved; inventory and surface-label checks now pass with 230 labeled surfaces.

## Verified Must-Haves

| Area | Status | Evidence |
| --- | --- | --- |
| Report vs dispute authorization | PASS | `submitCompetitionReport` lets signed-in users file general reports but requires entrant ownership for disputes; non-entrant disputes return 403. Route identity is derived from session, not body. |
| Private-safe report metadata | PASS | Report detail is trimmed, max 500 chars, rejects control characters, and stores in `competition_reports.private_detail`, not public DTOs. |
| Transaction/atomicity | PASS | Report/dispute and admin actions run through `withTransaction`; group governance sorts and locks targets before mutation and writes one audit event per target. |
| Duplicate/rate bounded intake | PASS | Open duplicate reports are idempotent through lookup plus partial unique index; intake is capped at 5 per 10 minutes. |
| Fixed public copy | PASS | Governance actions use spec-owned action/category matrix; routes reject arbitrary `publicExplanation`; public readers derive copy from counted-state/governance projection. |
| Evidence-gated counted restoration | PASS | `counted` admin action reclassifies with stored state `counted`, review `resolved`, scoring availability, expected match count, and Chronicle count; incomplete evidence is rejected. |
| TypeScript/Go public projection parity | PASS | TypeScript and Go derive public governance from counted/review state, `governance_changed_at`, scoring, and Chronicle availability. Focused Go parity tests passed. |
| Privacy and non-promises | PASS | Public governance leak guards, OpenAPI/public fixture checks, fair-play copy, and recovery copy exclude reporter/operator/recovery/private runtime/Strategy-private data and avoid punishment, sanction history, appeal SLA, full recovery, ownership transfer, and rating repair promises. |
| Temporary ownership exception evidence | PASS | `pnpm typescript-backend:inventory:check` and `pnpm typescript-surface-labels:check` pass; surface-label artifact contains 230 surfaces. |

## Focused Checks Run

| Check | Result |
| --- | --- |
| `pnpm exec vitest run packages/spec/src/competition-governance.test.ts packages/persistence/src/governance.test.ts packages/persistence/src/competition.test.ts packages/persistence/src/ladder.test.ts packages/persistence/src/standings-recompute.test.ts 'apps/web/app/api/matchsets/[matchSetId]/reports/route.test.ts' 'apps/web/app/api/admin/matchsets/governance/route.test.ts' 'apps/web/app/matchsets/[matchSetId]/competition-report-client.test.tsx' apps/web/app/competitions/fair-play/page.test.tsx apps/web/app/account/recovery/page.test.tsx scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` | PASS: 12 files, 117 tests |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Governance|Test.*Counted|Test.*Standings|Test.*Public' -count=1` | PASS |
| `pnpm --filter @cowards/spec typecheck && pnpm --filter @cowards/persistence typecheck && pnpm --filter @cowards/web typecheck` | PASS |
| `pnpm --filter @cowards/spec contract:check` | PASS |
| `pnpm go:parity` | PASS |
| `pnpm v1.36:competition-policy:check` | PASS |
| `pnpm exec tsx scripts/check-boundary-monitors.ts` | PASS |
| `pnpm typescript-backend:inventory:check` | PASS: TypeScript backend inventory artifacts are current |
| `pnpm typescript-surface-labels:check` | PASS: final TypeScript surface label artifacts are current; 230 surfaces verified |

## Residual Risks

- The `/api/matchsets/[matchSetId]/flags` compatibility route still accepts a loose JSON body for `note`, but it is constrained to a fixed entrant dispute wrapper and does not accept actor IDs or public copy.
- Several UI tests are source-inspection tests rather than full interaction/render tests. The code path is wired, but browser-level UX proof remains better suited to Phase 255.
- DB-backed Go governance assertions remain conditional on the established Go test database environment variable; focused non-DB Go parity tests passed.
- Full service-backed governance/browser proof is explicitly deferred to Phase 255; this verification only reran focused checks and did not start services.

_Verified: 2026-07-12T01:29:12Z_
_Verifier: the agent (gsd-verifier)_
