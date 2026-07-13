---
phase: 257
slug: canonical-transition-kernel-and-v1-4-semantic-integrity
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-13
---

# Phase 257 — Validation Strategy

> Per-phase validation contract for one transition authority, semantic validity, approved defect repair, and unchanged v1.4 behavior.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6, Go test, PostgreSQL integration harness, Playwright board-realism smoke |
| **Config file** | `vitest.config.ts`, `apps/go-backend/go.mod`, `docker-compose.yml`, root `playwright.config.ts` |
| **Quick run command** | `pnpm --filter @cowards/engine test && pnpm --filter @cowards/replay test` |
| **Full suite command** | `pnpm test -- --concurrency=1 && (cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1) && pnpm boundary:monitors` |
| **Estimated runtime** | ~420 seconds |

## Sampling Rate

- **After every task commit:** Run the focused Vitest or Go test named by the task plus semantic tuple/artifact checks.
- **After every plan wave:** Run engine, spec, replay, affected persistence/runtime-service tests, and the current structural guard.
- **Before `$gsd-verify-work`:** Full serialized suite, exact audit delta, v1.4 compatibility corpus, PostgreSQL rejection/rollback, and board-realism smoke must be green.
- **Max feedback latency:** 420 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 257-W0-01 | 257-01, 257-11 | 0 | KERN-01, KERN-02, KERN-07 | T-257-01 | One engine driver advances Matches; replay only records; exact executable ownership rejects duplicate loops and contiguous entrypoints | structural/integration | `pnpm exec vitest run scripts/check-v1-37-integrity-boundaries.test.ts scripts/check-v1-37-executable-reference-inventory.test.ts` | ❌ W0 | ⬜ pending |
| 257-W0-02 | 257-04, 257-05 | 0 | KERN-03 | T-257-02 | Deterministically ordered semantic codes reject invalid arena/state/version/outcome combinations at every trust boundary | unit/integration | `pnpm --filter @cowards/spec test && pnpm --filter @cowards/engine test && pnpm --filter @cowards/replay test` | ❌ W0 | ⬜ pending |
| 257-W0-03 | 257-02, 257-09 | 0 | KERN-04, KERN-05, KERN-06 | T-257-03 | Permanent RED cases close with approved event/outcome/order semantics and excess suffixes remain ignored | regression | `pnpm --filter @cowards/engine test && pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` | ❌ W0 | ⬜ pending |
| 257-W0-04 | 257-06, 257-07, 257-12, 257-19 | 0 | KERN-08, KERN-09 | T-257-04 | Caller mutation cannot alter constants; every current event is produced or removed under an exact minted tuple | unit/generated | `pnpm --filter @cowards/spec test && pnpm --filter @cowards/engine test && pnpm --filter @cowards/replay test` | ❌ W0 | ⬜ pending |
| 257-W0-05 | 257-03 | 0 | KERN-10, KERN-11 | T-257-05 | Full-state/event/observation compatibility fixtures preserve every approved v1.4 ruling and reject unexplained golden drift | differential/history | `pnpm --filter @cowards/engine test && pnpm --filter @cowards/replay test && pnpm exec tsx scripts/check-v1-36-historical-proof.ts` | ❌ W0 | ⬜ pending |
| 257-W0-06 | 257-13, 257-14, 257-15, 257-16, 257-17 | 0 | KERN-01, KERN-02, KERN-03 | T-257-06 | Runtime final, TypeScript/Go persistence, Chronicle reconstruction, and replay reject semantic drift as no-mutation system failure | integration/PostgreSQL | `pnpm --filter @cowards/runtime-service test && DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence test && (cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1)` | ❌ W0 | ⬜ pending |
| 257-W0-07 | 257-21, 257-22 | 0 | KERN-03, KERN-10 | T-257-07 | Canonical starts remain admitted and visible Match positions stay in bounds without clipped replay; final proof reruns root-configured browser projects into a named JSON result | browser/integration | `pnpm --filter @cowards/web test && pnpm exec playwright test --config=playwright.config.ts apps/web/e2e/v1-37-rules-integrity-proof.spec.ts --workers=1` | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] Engine kernel/driver RED tests for one-step transitions, runtime yield/resume identity, unchanged-on-failure, and one authoritative loop.
- [ ] Exact lifecycle regression tests for last-Soldier cleanup, Cycle-end Backstab slot closure, and excess-order precedence.
- [ ] Semantic arena/state invariant vectors with stable bounded code ordering and boundary-specific failure classification.
- [ ] Before-refactor v1.4 full-state/event/Strategy-observation compatibility corpus, including same-direction collision and push-history behavior.
- [ ] Current event producer/consumer/validator coverage and public export/duplicate-loop structural guards.
- [ ] Chronicle recorder/reconstruction equivalence tests proving transitions are recorded rather than reimplemented.
- [ ] Runtime-service, PostgreSQL TypeScript, and Go no-mutation semantic rejection tests.
- [ ] Board-realism smoke for canonical start admission, in-bounds positions, and a plausible full Match.

## Manual-Only Verifications

All required Phase-257 behaviors have automated verification. Any discovered compatibility delta is a blocking approval checkpoint under KERN-11, not a manual-only pass.

## Validation Sign-Off

- [x] Every requirement class has an automated verifier or explicit Wave-0 dependency.
- [x] Sampling continuity prevents three consecutive tasks without automated feedback.
- [x] Wave 0 covers every missing test class identified by research.
- [x] No watch-mode flags are used.
- [x] Feedback latency target is under seven minutes for the full gate and under one minute for focused tasks.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved by autonomous milestone execution request, 2026-07-12.
