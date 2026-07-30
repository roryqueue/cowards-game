---
phase: 262-foundation-admission-measurement-custody-and-containment-con
verified: 2026-07-30T14:35:49Z
status: gaps_found
score: "0/5 must-haves verified"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: "1/5"
  gaps_closed:
    - "The historical expected-result placeholder was replaced by an independently rooted, mutation-detecting pre-v1.38 predicate."
    - "Bounded parallel scheduling, charged accounting, sampler/cleanup handling, historical Git-object verification, ambient branch isolation, atomic publication, and hostile shard-output validation were implemented and reviewed clean."
  gaps_remaining:
    - "Current successor HEAD has no independently sealed authority attestation."
    - "ADMIT-03 has no passed_exact 540/540 reproduction; accepted cells remain zero."
    - "Plans 262-03 through 262-07 remain blocked and unexecuted."
  regressions: []
gaps:
  - truth: "Authoritative v1.38 work is admitted only by an exact machine-checked predecessor and current-source authority join."
    status: partial
    reason: "The historical v1.37 admission implementation and receipt exist, but code-review commits changed the live admission/matrix source after the sealed Plan 262-13 evidence. Current HEAD 973fd409 has no independently authorized successor seal, so the present source cannot serve as authoritative execution evidence."
    artifacts:
      - path: ".planning/artifacts/v1.38-foundation-admission.json"
        issue: "Historical passed_exact receipt exists, but it does not independently attest the post-review successor HEAD."
      - path: "scripts/lib/v1-38-current-matrix-reproduction.ts"
        issue: "Current SHA-256 is 2a837bb44fcbf1fc91309953c407079f543022bac9dfe68771c83d693133cf02, which postdates the sealed Plan 262-13 source and lacks a separately authorized seal."
    missing:
      - "An independently authorized successor-HEAD attestation binding the exact current Git/source objects to every immutable predecessor root"
      - "A safe read-only verification of that newly sealed chain"
  - truth: "Researchers can reproduce the persisted current-rules matrix under the resolved tuple, while Starter and Advanced Strategies remain fixture-only."
    status: failed
    reason: "No authoritative successor reached passed_exact. The latest persisted Plan 262-13 branch stopped at 437 basis points of node:os headroom against the unchanged 2,500-basis-point gate, charged all eight calibration:v4 identities, launched no child or 540-cell reproduction, and accepted zero cells. Partial evidence is explicitly non-reusable."
    artifacts:
      - path: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json"
        issue: "disposition is preflight_refused at 437/2500 basis points"
      - path: ".planning/artifacts/v1.38-current-matrix-calibration-v4.json"
        issue: "status is stopped_process_failure; acceptedCellCount is 0; fullRunLaunched is false"
      - path: ".planning/artifacts/v1.38-current-matrix-reproduction-v5.json"
        issue: "missing because the frozen preflight correctly prohibited launch"
    missing:
      - "A newly planned and exactly authorized measurement successor"
      - "A successor-HEAD seal before any new measurement authority is used"
      - "A successful unchanged-policy calibration and fresh 540/540 supervised reproduction"
      - "A passed_exact receipt with zero failures, complete cleanup, exact historical predicate match, and no prior/calibration-cell reuse"
  - truth: "Before candidate output is inspected, one immutable scientific, budget, accounting, gate, selection, reporting, and bounded-claims contract is frozen."
    status: failed
    reason: "Plans 262-03 and 262-04 remain blocked behind ADMIT-03 and have not executed. Their implementation and immutable artifacts are absent."
    artifacts:
      - path: "scripts/lib/v1-38-study-contract.ts"
        issue: "missing"
      - path: "scripts/lib/v1-38-measurement.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-calibration-freeze-policy.json"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-pre-search-contract.json"
        issue: "missing"
    missing:
      - "Execute Plans 262-03 and 262-04 only after a successful ADMIT-03 successor"
  - truth: "A separately permissioned custodian can demonstrate commitment, storage, access/query, one-open, safe-receipt, contamination, retirement, and orthogonal reporting controls."
    status: failed
    reason: "Plans 262-06 and 262-07 remain blocked and unexecuted. No synthetic custody state machine, genuine authorized custody handoff, public custody reference, containment receipt, or aggregate foundation root exists."
    artifacts:
      - path: "scripts/lib/v1-38-custody.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-custody-public-reference.json"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-foundation-contract-root.json"
        issue: "missing"
    missing:
      - "Synthetic custody mechanics"
      - "A genuine separately permissioned custodian, one-open actor, encrypted external store, and authenticated bounded handoff"
      - "A final aggregate foundation root, or the planned terminal no-authority artifact if custody cannot be authorized"
  - truth: "The literal three profiles, equal-compute dimensions, telemetry, classifiers, and rejection thresholds are precommitted as protocol-only data while executable formation material remains absent."
    status: failed
    reason: "The negative boundary currently has no observed forbidden formation material, but Plan 262-05 never executed, so the required positive protocol, classifier, denominator, fixture, and sealed containment evidence is absent."
    artifacts:
      - path: "scripts/lib/v1-38-containment.ts"
        issue: "missing"
      - path: "scripts/lib/v1-38-measurement.ts"
        issue: "missing"
      - path: ".planning/artifacts/v1.38-pre-formation-containment.json"
        issue: "missing"
    missing:
      - "Protocol-only three-profile records and profile-neutral lineage/order/holdout-construction schemas"
      - "Validated classifier fixtures with exact denominators and non-compensating logic"
      - "A sealed pre-formation containment receipt over the finalized Phase 262 scope"
---

# Phase 262: Foundation Admission, Measurement, Custody, and Containment Contract Verification Report

**Phase Goal:** Maintainers can begin v1.38 research only under the exact released v1.37 authority and an immutable pre-search scientific, budget, custody, claim, and containment contract.
**Verified:** 2026-07-30T14:35:49Z
**Status:** gaps_found
**Re-verification:** Yes — after Plans 262-08 through 262-14, deep code-review closure, and partial Nyquist audit

## Verdict

Phase 262 has not achieved its goal. The implementation-quality repair cycle is clean, but task completion and code quality do not supply scientific admission authority.

The decisive facts are:

- Exact ADMIT-03 reproduction has not succeeded: no branch has produced `passed_exact` with 540/540 accepted cells.
- The latest persisted branch stopped at **437 basis points** of `node:os` headroom against the frozen **2,500-basis-point** threshold. The policy was not changed.
- Accepted cells remain **0**, every stopped allocation remains charged, and partial evidence remains non-reusable.
- Plans 262-03 through 262-07 remain blocked and unexecuted.
- Current post-review HEAD lacks an independently sealed successor attestation. This is an external authority blocker, not a code-review defect.
- Deep code review is clean. Nyquist coverage remains partial: **3/17 covered, 7 partial, 7 missing**.
- Phase 263 and every later phase remain prohibited from starting.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Exact predecessor/current-source authority permits an authoritative v1.38 run only after all joins pass. | ✗ FAILED | Historical admission artifact is `passed_exact`, but current HEAD `973fd409` postdates the sealed Plan 262-13 source. No independent successor-HEAD attestation exists. |
| 2 | The persisted current-rules matrix is reproduced under the selected supervised runtime/kernel tuple, with Starter/Advanced evidence fixture-only. | ✗ FAILED | Latest persisted branch is `stopped_process_failure`; preflight is 437/2500 bp, all eight calibration:v4 identities are charged, no child/full run launched, and accepted cells are 0. |
| 3 | One immutable pre-search scientific, budget, accounting, gate, selection, reporting, and claims contract is frozen. | ✗ FAILED | Plans 262-03/04 are unexecuted; study, measurement, calibration-freeze-policy, and pre-search artifacts are missing. |
| 4 | Separately permissioned custody and orthogonal reporting controls are demonstrable. | ✗ FAILED | Plans 262-06/07 are unexecuted; custody implementation/reference and aggregate root are missing; genuine custody authorization has not occurred. |
| 5 | Protocol-only profiles, equal-compute rules, classifiers, rejection thresholds, and containment proof are precommitted without materialization. | ✗ FAILED | Plan 262-05 is unexecuted. No forbidden executable formation artifacts were observed, but the required positive protocol/classifier/containment evidence is missing. |

**Score:** 0/5 truths verified (0 present, behavior-unverified)

## What the Repair Cycle Did Verify

The Phase 262 code-quality work is substantive:

- `scripts/lib/v1-38-current-matrix-reproduction.ts` is 7,349 lines and remains wired to `executePreparedRuntimeServiceRequestV118`; runtime-service continues into `runVersionedMatchV119`.
- The historical expectation is independently rooted in immutable pre-v1.38 Git evidence and is no longer an all-zero placeholder.
- Deterministic sharding, immutable charged accounting, no-partial publication, sampler-denial classification, real cleanup/orphan evidence, producing-Git-object verification, explicit persisted/supplied branch selection, atomic publication, composed failure handling, descriptor cleanup, and exact hostile child-output parsing exist.
- The deep review reports zero critical, warning, or informational findings.
- Current safe checks passed: `pnpm exec tsc --noEmit --pretty false`; focused injected parent-boundary test **10 passed, 142 skipped**.

These repairs make the stopped system safer and more truthful. They do not create accepted matrix evidence, measurement authority, a pre-search contract, custody authorization, or an aggregate Phase 262 root.

## Persisted Evidence and Data Flow

| Stage | Evidence | Result | Authority consequence |
|---|---|---|---|
| v1.37 admission | `.planning/artifacts/v1.38-foundation-admission.json` | Historical `passed_exact`, root `sha256:eb8819...491c` | Predecessor join exists; current successor HEAD still needs independent sealing. |
| Historical predicate | `.planning/artifacts/v1.38-historical-matrix-expectation.json` | Exact 540 inventory, declared leaders/third place, nine cycles, Smoke/Open Field equality | Independent predicate is valid input; it is not observed gameplay evidence. |
| Plan 262-10 | `v1.38-current-matrix-reproduction.json` | `SHARD_RUNNER_EXCEPTION`, 0 accepted | Full run prohibited. |
| Plan 262-11 | diagnostic:v2 + calibration:v2 | 345 bp headroom, 0 accepted | Stopped, charged, no v3. |
| Plan 262-12 | preflight:v3 + calibration:v3 | 402 bp headroom, 0 accepted | Stopped, charged, no v4. |
| Plan 262-13 | context:v4 + preflight:v4 + calibration:v4 | 437 bp headroom, 0 accepted | Stopped, charged, no v5. |
| Plan 262-14 | source/test repair | Historical/synthetic verification repaired without writer or measurement authority | No change to accepted evidence or admission state. |
| Code review | source/test fixes through `b61e25f2` | Clean | Quality evidence only; successor HEAD remains externally unsealed. |

The accepted-cell data flow terminates at the frozen resource gate:

`437 bp observed` → `preflight_refused` → `8 charged unfilled calibration:v4 identities` → `0 children` → `no reproduction:v5` → `0 accepted cells` → `Plans 262-03..07 blocked`.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `scripts/lib/v1-38-foundation-admission.ts` | Exact predecessor admission | ⚠️ PARTIAL | Exists, substantive, and both planned links are wired; current successor HEAD lacks independent sealing. |
| `.planning/artifacts/v1.38-foundation-admission.json` | Immutable admission receipt | ⚠️ PARTIAL | Historical `passed_exact` receipt exists; not a successor-HEAD attestation. |
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | Supervised matrix execution, reduction, and immutable checks | ✓ VERIFIED as code | Exists, substantive, runtime/kernel-wired, and cleanly reviewed. It has not produced goal-level passed evidence. |
| `.planning/artifacts/v1.38-historical-matrix-expectation.json` | Independent historical predicate | ✓ VERIFIED | Exact source commit/blob/byte/derivation bindings and non-placeholder declared results exist. |
| Current matrix successor receipts | Immutable stopped/passed lineage | ⚠️ VERIFIED as stopped evidence | v2/v3/v4 stopped receipts are byte-persisted and consistently record zero accepted cells. |
| `.planning/artifacts/v1.38-current-matrix-reproduction-v5.json` | Fresh passed 540-cell successor | ✗ MISSING | Correctly absent after the 437 bp preflight refusal, but required to satisfy ADMIT-03. |
| `scripts/lib/v1-38-study-contract.ts` | Study/accounting/calibration contract | ✗ MISSING | Plan 262-03 blocked. |
| `scripts/lib/v1-38-measurement.ts` | Gates/report/claim/classifier logic | ✗ MISSING | Plans 262-04/05 blocked. |
| `.planning/artifacts/v1.38-pre-search-contract.json` | Immutable pre-search contract | ✗ MISSING | Plans 262-03/04 blocked. |
| `scripts/lib/v1-38-containment.ts` | Pre-formation containment monitor | ✗ MISSING | Plan 262-05 blocked. |
| `scripts/lib/v1-38-custody.ts` | Custody state machine | ✗ MISSING | Plan 262-06 blocked. |
| `.planning/artifacts/v1.38-foundation-contract-root.json` | Aggregate Phase 262 authority | ✗ MISSING | Correctly unavailable while admission, measurement, containment, and custody prerequisites are incomplete. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Foundation admission | v1.37 release checker | Read-only post-tag join | ✓ WIRED | Static artifact query and source inspection find the planned post-tag link. |
| Foundation admission | generated semantic authority | Exact tuple resolution | ✓ WIRED | `CURRENT_SEMANTIC_AUTHORITY_GENERATED` is imported and checked. |
| Matrix reproduction | runtime service | `executePreparedRuntimeServiceRequestV118` | ✓ WIRED | Direct import and per-attempt invocation exist. |
| Runtime service | canonical kernel | `runVersionedMatchV119` | ✓ WIRED | Runtime-service dependency invokes the selected v1.19 path. |
| Historical expectation | pre-v1.38 Git evidence | Exact commit/blob/bytes/derivation | ✓ WIRED | Artifact and source bindings are present and mutation-protected. |
| Stopped matrix branch | accepted-cell ledger | Atomic 0-or-540 publication | ✓ WIRED as stop | All persisted stopped branches publish zero accepted cells and forbid reuse. |
| Current post-review HEAD | independent successor seal | External authority | ✗ NOT WIRED | No authorized attestation binds current source/Git objects to the immutable predecessor chain. |
| Passed matrix receipt | Plan 262-03 study contract | Required `passed_exact` 540/540 root | ✗ NOT WIRED | The receipt does not exist and Plan 262-03 is explicitly blocked. |
| Custody handoff | aggregate foundation root | Bounded approved reference | ✗ NOT WIRED | Both producer and consumer artifacts are missing. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Current source typechecks | `pnpm exec tsc --noEmit --pretty false` | exit 0 | ✓ PASS |
| Malformed child results fail closed | `pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "matrix parent boundary rejects" --maxWorkers=1` | 10 passed, 142 skipped | ✓ PASS |
| Existing persisted evidence bytes | `shasum -a 256` over all ten foundation/matrix artifacts | Matches documented Plan 262-14 hashes for protected matrix artifacts | ✓ PASS |
| Full audit/matrix reproduction | Not run | Prohibited by verification scope and requires new exact authority | ? SKIP |
| Persisted post-review calibration chain | Not rerun | Validation already established that the current checker transitively re-enters live admission and current HEAD lacks a successor seal | ? SKIP |

## Probe Execution

No Phase 262 probe scripts are declared. No audit reproducer, sampler, preflight writer, calibration writer, Match, reproduction, or evidence writer was run during this verification.

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| ADMIT-01 | 262-01 | ⚠️ PARTIAL | Historical admission implementation/receipt exists; current successor HEAD lacks independent sealing. |
| ADMIT-02 | 262-01 | ⚠️ PARTIAL | Exact tuple resolution exists; no current-HEAD authority seal. |
| ADMIT-03 | 262-02, 262-08..14 | ✗ BLOCKED | No `passed_exact` 540/540 reproduction; accepted cells are zero. |
| ADMIT-04 | 262-01 | ⚠️ PARTIAL | Fail-closed implementation exists, but current source is not independently attested. |
| MEAS-01..MEAS-04 | 262-03 | ✗ BLOCKED | Plan unexecuted; study/accounting/calibration artifacts missing. |
| MEAS-05..MEAS-09 | 262-04 | ✗ BLOCKED | Plan unexecuted; gate/report/claim artifacts missing. |
| MEAS-10 | 262-05 | ✗ BLOCKED | Protocol-only profile and containment implementation missing. |
| SEAL-01 | 262-06/07 | ✗ BLOCKED | Synthetic custody and genuine operational authorization are absent. |
| DECI-02 | 262-05 | ✗ BLOCKED | Classifier definitions, denominators, fixtures, and thresholds are absent. |

All 17 Phase 262 requirements are claimed by a plan; none is orphaned. None of these gaps is clearly assigned to a later phase. Phases 263–270 depend on Phase 262 rather than completing its missing admission/contract work, so no gap is deferred.

## Validation and Review Status

| Gate | Result | Meaning |
|---|---|---|
| Deep code review | Clean: 0 critical, 0 warning, 0 info | The reviewed implementation has no remaining code-quality finding in scope. |
| Review fix | All fixed, including exact hostile shard-output validation | Code closure is verified, not phase-goal closure. |
| Nyquist audit | Partial: 3/17 covered, 7 partial, 7 missing | Required tests/implementations for blocked Plans 262-03..07 do not exist; current authority chain also remains partial. |
| Current safe verification | Typecheck passed; injected boundary tests 10/10 passed | Safe code behavior remains green without entering live admission or measurement. |

## Anti-Patterns Found

No unreferenced `TBD`, `FIXME`, or `XXX` markers were found in the reviewed Phase 262 source/test files. No new `TODO`, `HACK`, placeholder, direct `runMatch`, `new Function`, or `node:vm` implementation path was found. The one `return []` match is a legitimate `flatMap` omission for a nonterminal shard, not a user-visible stub.

There are no code-review blockers. The blockers are absent authority/evidence and deliberately unexecuted downstream plans.

## External Authority and Manual Blockers

### 1. Successor-HEAD seal

**Required:** A separately authorized independent attestation must bind current HEAD/source objects and every immutable predecessor root before any current checker is treated as authoritative.

**Why external:** Repository tests cannot invent execution authority or attest themselves.

### 2. New measurement successor

**Required:** A new exact single-use plan/authorization must preserve the unchanged runtime/kernel, 90-minute gate, 2,500-bp headroom rule, resource limits, charged accounting, cleanup proof, and atomic 0-or-540 publication.

**Why external:** All earlier retry authorizations are consumed and expired. This verification grants no new measurement authority.

### 3. Genuine custody authorization

**Required later in Phase 262:** A separately permissioned custodian, one-open actor, approved encrypted store, key/trust domain, retention and retirement authority, and authenticated bounded handoff.

**Why external:** Repository code may test mechanics but may not invent these controls.

## Gaps Summary

The repair/review cycle improved correctness without moving the scientific gate. The exact current-rules reproduction still has zero accepted cells, and the latest observed host policy result is 437 bp against the unchanged 2,500-bp minimum. Plans 262-03 through 262-07 therefore remain correctly blocked.

The current source also postdates the sealed Plan 262-13 evidence. A successor-HEAD attestation is required before any new authoritative checker or measurement run. No later phase may start.

---

_Verified: 2026-07-30T14:35:49Z_
_Verifier: the agent (gsd-verifier)_
