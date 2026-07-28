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

- **After every task commit:** Run the focused `-t` selector for the touched gate plus the affected workspace typecheck.
- **After every plan wave:** Run the complete Phase 262 test file, artifact `--check`, admission checker, and containment monitor.
- **Before `$gsd-verify-work`:** The serialized full suite, exact regeneration checks, and forbidden-artifact inventory must be green.
- **Max feedback latency:** 60 seconds for focused checks; long matrix reproduction is a separately reported integration gate.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 262-01 | TBD | 0 | ADMIT-01, ADMIT-02, ADMIT-04 | T-262-01 | Exact authority join or typed fail-closed stop | unit + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t admission` | ❌ W0 | ⬜ pending |
| 262-02 | TBD | 1 | ADMIT-03 | T-262-02 | Historical matrix executes only through supervised runtime and canonical kernel | integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t matrix` | ❌ W0 | ⬜ pending |
| 262-03 | TBD | 1 | MEAS-01, MEAS-02, MEAS-03 | T-262-03 | Contract, complete cells, opportunity vector, and claims are immutable | unit + property | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t contract` | ❌ W0 | ⬜ pending |
| 262-04 | TBD | 1 | MEAS-04 | T-262-04 | Failures remain charged and cannot become accepted cells | mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t accounting` | ❌ W0 | ⬜ pending |
| 262-05 | TBD | 1 | MEAS-05, MEAS-06, MEAS-07, MEAS-08 | T-262-05 | Numeric gates have frozen denominators and claims stay oracle-relative | unit | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t gates` | ❌ W0 | ⬜ pending |
| 262-06 | TBD | 1 | MEAS-09 | T-262-06 | Process, current, formation, and contamination states remain orthogonal | table + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t reporting` | ❌ W0 | ⬜ pending |
| 262-07 | TBD | 1 | MEAS-10, DECI-02 | T-262-07 | Classifiers remain profile-neutral and profiles remain protocol-only | property + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t classifiers` | ❌ W0 | ⬜ pending |
| 262-08 | TBD | 2 | SEAL-01 | T-262-08 | Commitment/open-once/safe-projection/contamination/retirement state machine | integration + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t custody` | ❌ W0 | ⬜ pending |
| 262-09 | TBD | 2 | MEAS-10 | T-262-09 | Forbidden imports, namespaces, and artifacts are detected | boundary integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t containment` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [ ] `scripts/evaluate-v1-38-foundation-contract.test.ts` — shared Phase 262 test entrypoint.
- [ ] Synthetic canonical classifier fixtures that never materialize a formation `GameState`.
- [ ] Temporary external-directory custody fixture with restrictive permissions.
- [ ] Runtime-service Advanced-revision request helper that does not import fixture trust.
- [ ] `v1.38:foundation-contract:write` and `v1.38:foundation-contract:check` package scripts.
- [ ] Boundary mutation fixtures that seed forbidden imports/artifacts and prove detection.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real custody role and encrypted private-store authorization | SEAL-01 | Repository code cannot name or authorize an external human/store | Record the named custodian role, opening actor, store identity, and authorization receipt; verify no secret/preimage enters Git |
| Calibration freeze decision | MEAS-05, MEAS-06, MEAS-07 | Final numeric values must derive from pre-candidate calibration evidence | Run the contained calibration, review its exact denominators, then freeze the resulting contract root before any candidate output |

## Validation Sign-Off

- [x] All planned behaviors have an automated check or explicit Wave 0 dependency.
- [x] Sampling continuity requires an automated check after every task.
- [x] Wave 0 covers every missing test reference.
- [x] Commands use no watch-mode flags.
- [x] Focused feedback latency target is under 60 seconds.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved for planning 2026-07-28; Wave 0 completion remains pending execution
