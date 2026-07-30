---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-28
---

# Phase 262 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 |
| **Config file** | Package scripts and root Vitest defaults |
| **Quick run command** | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts --maxWorkers=1` |
| **Full suite command** | `pnpm turbo test --concurrency=1` |
| **Estimated runtime** | Calibrate during Wave 0; focused checks must remain under 60 seconds |

## Sampling Rate

- **After every task commit:** Run the focused `-t` selector for the touched gate followed by `pnpm typecheck`.
- **After every plan wave:** Run `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts --maxWorkers=1 && pnpm typecheck`. Also run each immutable checker whose producer exists in that wave: admission after Wave 1; expectation reconstruction after Wave 3; injected scheduler/resource/cleanup checks after Wave 4; the stopped Plan 262-10 checker after Wave 5; repaired sampler/cleanup and stopped v2/v3 checks after Wave 6; exact preflight and branch-aware v3/v4 successor checks after Wave 7; pre-search regeneration after Wave 9; the containment monitor after Wave 10; and `pnpm v1.38:foundation-contract:check` after the authorized Wave 12 route.
- **Before `$gsd-verify-work`:** The serialized full suite, exact regeneration checks, and forbidden-artifact inventory must be green.
- **Max feedback latency:** 60 seconds for focused checks; long matrix reproduction is a separately reported integration gate.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 262-01 | 262-01 | 1 | ADMIT-01, ADMIT-02, ADMIT-04 | T-262-01 | Exact authority join or typed fail-closed stop | unit + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t admission` | ✅ | ✅ green |
| 262-02 | 262-02 | 2 | ADMIT-03 | T-262-04 | Historical matrix executes only through supervised runtime and canonical kernel | integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t matrix` | ✅ | ❌ stopped |
| 262-G1 | 262-08 | 3 | ADMIT-03 | T-262-30 | Historical expectation is independently bound to immutable pre-v1.38 evidence | unit + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix expectation"` | ✅ | ✅ green |
| 262-G2 | 262-09 | 4 | ADMIT-03 | T-262-34 | Precommitted calibration policy/projector, deterministic bounded scheduler, exact accounting, resource refusal, cancellation, and cleanup | property + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix calibration policy\|matrix scheduler\|matrix accounting\|matrix resources\|matrix cleanup\|matrix cancellation"` | ✅ | ✅ green |
| 262-G3 | 262-10 | 5 | ADMIT-03 | T-262-40 | Exact calibration CLI with admitted/stopped receipt verification and exact 540-cell authoritative receipt under the unchanged 90-minute gate | integration + mutation | Plan 262-10 calibration/check commands | ✅ | ❌ stopped |
| 262-G4 | 262-11 | 6 | ADMIT-03 | T-262-45 | Repaired sampler/cleanup, immutable diagnostic:v2, recorded authorization, and stopped calibration:v2 with no v3 launch | real process + mutation + integration | Plan 262-11 diagnostic:v2, calibration:v2, and stopped branch checkers | ✅ | ❌ stopped at 3.45% headroom |
| 262-G5 | 262-12 | 7 | ADMIT-03 | T-262-51 | Existing authority reuse, exact preflight, one charged calibration:v3 set, and fresh reproduction:v4 only after admission | real process + mutation + integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix headroom preflight v3\|matrix calibration v3 lineage\|matrix authoritative v4 branches\|matrix real cleanup proof"` plus preflight, calibration:v3, and v3/v4 branch checkers | ✅ | ⬜ pending execution |
| 262-03 | 262-03 | 8 | MEAS-01, MEAS-02, MEAS-03 | T-262-08 | Contract, complete cells, opportunity vector, and claims are immutable | unit + property | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t contract` | ✅ | ⬜ blocked by 262-12 |
| 262-04 | 262-03 | 8 | MEAS-04 | T-262-09 | Failures remain charged and cannot become accepted cells | mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t accounting` | ✅ | ⬜ blocked by 262-12 |
| 262-05 | 262-04 | 9 | MEAS-05, MEAS-06, MEAS-07, MEAS-08 | T-262-12 | Numeric gates have frozen denominators and claims stay oracle-relative | unit | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t gates` | ✅ | ⬜ pending |
| 262-06 | 262-04 | 9 | MEAS-09 | T-262-13 | Process, current, formation, and contamination states remain orthogonal | table + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t reporting` | ✅ | ⬜ pending |
| 262-07 | 262-05 | 10 | MEAS-10, DECI-02 | T-262-18 | Classifiers remain profile-neutral and profiles remain protocol-only | property + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t classifiers` | ✅ | ⬜ pending |
| 262-08 | 262-06, 262-07 | 11-12 | SEAL-01 | T-262-20 | Commitment/open-once/safe-projection/contamination/retirement state machine | integration + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t custody` | ✅ | ⬜ pending |
| 262-09 | 262-05 | 10 | MEAS-10 | T-262-16 | Forbidden imports, namespaces, and artifacts are detected | boundary integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t containment` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [x] `scripts/evaluate-v1-38-foundation-contract.test.ts` — shared Phase 262 test entrypoint; gap selectors are added by Plans 262-08 through 262-10.
- [ ] Synthetic canonical classifier fixtures that never materialize a formation `GameState`.
- [ ] Temporary external-directory custody fixture with restrictive permissions.
- [ ] Runtime-service Advanced-revision request helper that does not import fixture trust.
- [ ] `v1.38:foundation-contract:write` and `v1.38:foundation-contract:check` package scripts.
- [ ] Boundary mutation fixtures that seed forbidden imports/artifacts and prove detection.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real custody role and encrypted private-store authorization | SEAL-01 | Repository code cannot name or authorize an external human/store | Record the named custodian role, opening actor, store identity, and authorization receipt; verify no secret/preimage enters Git |
| Recorded Plan 262-11 resource sampler authority | ADMIT-03 | Host process sampling required explicit external permission | Verify the recorded `authorized-unsandboxed-ps` selection, literal authorization, exact read-only boundary, and policy root; Plan 262-12 introduces no new choice |

## Validation Sign-Off

- [x] All planned behaviors have an automated check or explicit Wave 0 dependency.
- [x] Sampling continuity requires an automated check after every task.
- [x] Wave 0 covers every missing test reference.
- [x] Commands use no watch-mode flags.
- [x] Focused feedback latency target is under 60 seconds.
- [x] Numeric freeze is automated by the preregistered deterministic selector policy; the two named manual checkpoints are the already-completed Plan 262-11 sampler-policy authorization and the still-pending real custody authority/encrypted-store naming.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved for planning 2026-07-28; Wave 0 completion remains pending execution
