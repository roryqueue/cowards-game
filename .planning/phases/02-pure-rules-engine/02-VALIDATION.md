---
phase: 2
slug: pure-rules-engine
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm --filter @cowards/engine test` |
| **Full suite command** | `pnpm verify` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @cowards/engine test`
- **After every plan wave:** Run `pnpm verify`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ENG-15 | T-02-01 | Canonical spec reflects Backstab clarification before tests encode it | doc/spec | `rg "position-triggered" /Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | ENG-01, ENG-21 | T-02-02 | Engine state is pure and deterministic | unit | `pnpm --filter @cowards/engine test -- state.test.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | TEST-01, TEST-02 | — | Fake runtime helpers stay outside engine package | unit | `pnpm --filter @cowards/test-utils test` | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-16 | T-02-03 | Runtime violations cannot crash the engine path | unit | `pnpm --filter @cowards/engine test -- activation.test.ts` | ✅ | ✅ green |
| 02-03-01 | 03 | 3 | ENG-07, ENG-08, ENG-09, ENG-10, ENG-11, ENG-12, ENG-13, ENG-14, ENG-16 | T-02-04 | Illegal movement resolves deterministically | unit | `pnpm --filter @cowards/engine test -- movement.test.ts` | ✅ | ✅ green |
| 02-03-02 | 03 | 3 | ENG-15 | T-02-05 | Backstab boundary rule is simultaneous and deterministic | unit | `pnpm --filter @cowards/engine test -- backstab.test.ts` | ✅ | ✅ green |
| 02-04-01 | 04 | 4 | ENG-17, ENG-18, ENG-19, ENG-20 | T-02-06 | Contraction and ending cannot leave illegal board state | unit | `pnpm --filter @cowards/engine test -- contraction.test.ts` | ✅ | ✅ green |
| 02-05-01 | 05 | 5 | ENG-21, TEST-01, TEST-02 | T-02-07 | Engine remains side-effect free and deterministic end to end | full | `pnpm verify` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `packages/engine/src/state.test.ts` — covers ENG-01, ENG-21
- [x] `packages/engine/src/activation.test.ts` — covers ENG-02 through ENG-06, ENG-16
- [x] `packages/engine/src/movement.test.ts` — covers ENG-07 through ENG-14, ENG-16
- [x] `packages/engine/src/backstab.test.ts` — covers ENG-15 and clarified Backstab boundary behavior
- [x] `packages/engine/src/contraction.test.ts` — covers ENG-17 through ENG-20
- [x] `packages/engine/src/invariants.test.ts` — covers TEST-02
- [x] `packages/engine/src/match.test.ts` — covers full deterministic `runMatch`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Update original spec in Downloads | ENG-15 | File is outside the repo and may require user-approved write access | Confirm `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md` describes activation-boundary, position-triggered Backstab |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-16
