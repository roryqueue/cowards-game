---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: false
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
- **After every plan wave:** Run `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts --maxWorkers=1 && pnpm typecheck`. Also run each immutable checker whose producer exists in that wave: admission after Wave 1; expectation reconstruction after Wave 3; injected scheduler/resource/cleanup checks after Wave 4; the stopped Plan 262-10 checker after Wave 5; repaired sampler/cleanup and stopped v2/v3 checks after Wave 6; stopped preflight:v3/calibration:v3 checks after Wave 7; stopped v4/v5 evidence checks after Wave 8; producing-source and ambient-isolation checks after Wave 9; pre-search regeneration after Wave 11; the containment monitor after Wave 12; and `pnpm v1.38:foundation-contract:check` after the authorized Wave 14 route.
- **Before `$gsd-verify-work`:** The serialized full suite, exact regeneration checks, and forbidden-artifact inventory must be green.
- **Max feedback latency:** 60 seconds for focused checks; long matrix reproduction is a separately reported integration gate.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 262-01 | 262-01 | 1 | ADMIT-01, ADMIT-02, ADMIT-04 | T-262-01 | Exact authority join or typed fail-closed stop | unit + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t admission` | ✅ | ⚠️ PARTIAL — historical coverage exists; current successor HEAD requires separately sealed authority and this audit did not run the prohibited reproducer |
| 262-02 | 262-02 | 2 | ADMIT-03 | T-262-04 | Historical matrix executes only through supervised runtime and canonical kernel | integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t matrix` | ✅ | ⚠️ PARTIAL — exact 540/540 reproduction remains stopped with zero accepted cells |
| 262-G1 | 262-08 | 3 | ADMIT-03 | T-262-30 | Historical expectation is independently bound to immutable pre-v1.38 evidence | unit + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix expectation"` | ✅ | ✅ green |
| 262-G2 | 262-09 | 4 | ADMIT-03 | T-262-34 | Precommitted calibration policy/projector, deterministic bounded scheduler, exact accounting, resource refusal, cancellation, and cleanup | property + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix calibration policy\|matrix scheduler\|matrix accounting\|matrix resources\|matrix cleanup\|matrix cancellation"` | ✅ | ✅ green |
| 262-G3 | 262-10 | 5 | ADMIT-03 | T-262-40 | Exact calibration CLI with admitted/stopped receipt verification and exact 540-cell authoritative receipt under the unchanged 90-minute gate | integration + mutation | Plan 262-10 calibration/check commands | ✅ | ❌ stopped |
| 262-G4 | 262-11 | 6 | ADMIT-03 | T-262-45 | Repaired sampler/cleanup, immutable diagnostic:v2, recorded authorization, and stopped calibration:v2 with no v3 launch | real process + mutation + integration | Plan 262-11 diagnostic:v2, calibration:v2, and stopped branch checkers | ✅ | ❌ stopped at 3.45% headroom |
| 262-G5 | 262-12 | 7 | ADMIT-03 | T-262-51 | Exact single-use retry, stopped 4.02% preflight:v3, eight charged unfilled calibration:v3 identities, and no v4 launch | real process + mutation + integration | Plan 262-12 preflight:v3, calibration:v3, and stopped branch checkers | ✅ | ❌ stopped at 4.02% headroom |
| 262-G6 | 262-13 | 8 | ADMIT-03 | T-262-58 | Pattern C context, stopped 4.37% preflight:v4, eight charged unfilled calibration:v4 identities, no v5, and explicit isolation gap | inline context + real process + mutation + integration | Plan 262-13 persisted context/preflight/calibration/stopped branch checkers | ✅ | ⚠️ PARTIAL — stopped with zero accepted cells |
| 262-G7 | 262-14 | 9 | ADMIT-03 | T-262-66 | Producing-Git-object historical validation and explicit persisted/supplied branch isolation with no measurement authority | unit + mutation + regression | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix historical execution context source evolution\|matrix authoritative v5 ambient isolation\|matrix inline execution context v4\|matrix authoritative v5 branches"` plus read-only persisted v4 checkers | ✅ | ⚠️ PARTIAL — repair tests exist, but current post-review HEAD is not successor-sealed and the persisted calibration checker now fails |
| 262-CR1 | 262-REVIEW-FIX | review | ADMIT-03 | CR-01 | Malformed child output cannot become calibration admission or accepted evidence | injected integration + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix parent boundary rejects" --maxWorkers=1` | ✅ | ✅ COVERED — 10/10 passed 2026-07-30; no subprocess or Match launched |
| 262-03 | 262-03 | 10 | MEAS-01, MEAS-02, MEAS-03 | T-262-08 | Contract, complete cells, opportunity vector, and claims are immutable | unit + property | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t contract` | ❌ | ❌ MISSING — plan is blocked and no matching tests/implementation exist |
| 262-04 | 262-03 | 10 | MEAS-04 | T-262-09 | Failures remain charged and cannot become accepted cells | mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t accounting` | ❌ | ❌ MISSING — plan is blocked and no matching tests/implementation exist |
| 262-05 | 262-04 | 11 | MEAS-05, MEAS-06, MEAS-07, MEAS-08 | T-262-12 | Numeric gates have frozen denominators and claims stay oracle-relative | unit | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t gates` | ❌ | ❌ MISSING — dependent plan is unexecuted |
| 262-06 | 262-04 | 11 | MEAS-09 | T-262-13 | Process, current, formation, and contamination states remain orthogonal | table + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t reporting` | ❌ | ❌ MISSING — dependent plan is unexecuted |
| 262-07 | 262-05 | 12 | MEAS-10, DECI-02 | T-262-18 | Classifiers remain profile-neutral and profiles remain protocol-only | property + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t classifiers` | ❌ | ❌ MISSING — dependent plan is unexecuted |
| 262-08 | 262-06, 262-07 | 13-14 | SEAL-01 | T-262-20 | Commitment/open-once/safe-projection/contamination/retirement state machine | integration + mutation | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t custody` | ❌ | ❌ MISSING — synthetic custody and later operational authority are unimplemented |
| 262-09 | 262-05 | 12 | MEAS-10 | T-262-16 | Forbidden imports, namespaces, and artifacts are detected | boundary integration | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t containment` | ❌ | ❌ MISSING — containment implementation/fixtures are absent |

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
| Recorded Plan 262-11 resource sampler policy | ADMIT-03 | Host process sampling required explicit external permission | Verify the recorded `authorized-unsandboxed-ps` selection, literal authorization, exact read-only boundary, and policy root; Plan 262-12 does not broaden or replace this policy |
| Plan 262-12 single-use environmental retry | ADMIT-03 | The frozen sampler policy does not authorize a new resource-consuming retry | Grant the exact literal scoped to one preflight:v3, one eight-attempt calibration:v3 set, and conditionally one 540-cell reproduction:v4; verify distinct root, no default, single use, and expiry at terminal outcome |
| Plan 262-13 lean-main single-use retry | ADMIT-03 | Removing resident executor pressure changes execution context and requires a new bounded run grant | Verify Pattern C main ownership, terminal Plan 262-13 helpers, plan-scoped no-active-executor proof without OS-global claim, and exact literal for one preflight:v4, one calibration:v4 set, conditional at-most-one v5, distinct root, single use, and expiry |
| Exact current-rules reproduction | ADMIT-03 | The required 540/540 supervised run is resource-consuming and expressly prohibited in this validation audit | A separately planned and authorized measurement successor must produce `passed_exact`, exactly 540 accepted cells, the unchanged v1.18/v1.19/MATCH_KERNEL tuple, exact historical predicate match, complete cleanup, and no partial reuse |
| Successor-HEAD sealing authority | ADMIT-01, ADMIT-02, ADMIT-03, ADMIT-04 | Code-review commits changed live source after the sealed Plan 262-13 evidence; repository tests cannot invent authority for the new HEAD | Obtain a separately authorized successor seal binding the exact current source/Git objects and all immutable predecessor roots; then rerun the read-only receipt chain |
| New measurement-policy authority | ADMIT-03 | Existing stopped authorizations are consumed/expired and cannot authorize another preflight, calibration, or reproduction | Approve a new exact single-use successor plan without changing the 90-minute, resource, runtime, kernel, accounting, or 0-or-540 policy |
| Later custody authority | SEAL-01 | A real custodian, one-open actor, encrypted store, key/trust domain, retention, and retirement authority cannot be invented in repository tests | Supply and authenticate the exact bounded operational handoff only after ADMIT-03 and Plans 262-03 through 262-05 pass |

## Validation Sign-Off

- [ ] All planned behaviors have an automated check or explicit Wave 0 dependency; blocked Plans 262-03 through 262-07 still lack their behavioral tests and implementations.
- [x] Sampling continuity requires an automated check after every task.
- [ ] Wave 0 covers every missing test reference.
- [x] Commands use no watch-mode flags.
- [x] Focused feedback latency target is under 60 seconds.
- [x] Numeric freeze is automated by the preregistered deterministic selector policy; completed manual checkpoints are Plan 262-11 sampler-policy authorization and Plans 262-12/13 retry authorizations, while real custody authority/encrypted-store naming remains pending. Plan 262-14 has no authorization checkpoint or execution authority.
- [ ] Nyquist compliance remains false until the missing safe tests are created by their authorized plans and the external/manual blockers are satisfied without implying ADMIT-03 success.

**Approval:** approved for planning 2026-07-28; validation is partial and Phase 262 remains stopped.

## Validation Audit 2026-07-30

| Metric | Count |
|--------|-------|
| Requirement/task rows audited | 17 |
| COVERED | 3 |
| PARTIAL | 7 |
| MISSING | 7 |
| Safe gaps resolved in this audit | 0 new tests required; CR-01 already had a real injected regression |
| Escalated/manual-only blockers | 4 |

### Audit Trail

| Check | Command | Actual result | Classification |
|---|---|---|---|
| Code-review CR-01 malformed child-output boundary | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix parent boundary rejects" --maxWorkers=1` | 10 passed, 142 skipped; no subprocess, sampler, Match, reproduction, or writer | COVERED |
| TypeScript contract check | `pnpm exec tsc --noEmit --pretty false` | passed | COVERED |
| Plan 262-14 safe-selector attempt | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix parent boundary rejects\|matrix historical execution context source evolution\|matrix authoritative v5 ambient isolation" --maxWorkers=1` | 11 passed, 1 failed at `MATRIX_ADMISSION_INVALID`; invalid audit evidence because the selector transitively invoked the prohibited audit reproducer before branch isolation | PARTIAL; not counted as a valid branch-isolation run |
| Read-only execution-context:v4 checker | `node --import tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-execution-context-v4-receipt .planning/artifacts/v1.38-current-matrix-execution-context-v4.json` | passed; root `sha256:7ff8e5b8a3d580ba6b1f821ebe35ff8688fb3247b4772ada979c2975f46c0a71`, 0 accepted | COVERED |
| Read-only headroom-preflight:v4 checker | `node --import tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-headroom-preflight-v4-receipt .planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json` | passed; `preflight_refused`, 437 basis points, 0 accepted | COVERED |
| Persisted calibration:v4 checker attempt | `node --import tsx scripts/lib/v1-38-current-matrix-reproduction.ts --check-calibration-v4-receipt .planning/artifacts/v1.38-current-matrix-calibration-v4.json` | failed `MATRIX_CALIBRATION_V4_RECEIPT_INVALID` after later code-review source commits; static call-graph review confirmed this checker transitively re-enters live matrix admission and the retained audit gate | PARTIAL — successor-HEAD seal required; implementation/evidence not modified; the attempt is not counted as a purely read-only safe check |

No sampler, real subprocess calibration, preflight writer, Match, reproduction, or evidence writer was intentionally run. The rejected selector and persisted calibration checker attempt are recorded because each transitively entered the audit reproducer contrary to the safe-command assumption; neither result is counted as safe validation evidence, and no artifact bytes were written.
