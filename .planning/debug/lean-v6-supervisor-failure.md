---
status: investigating
trigger: "could you fix the blocker then continue please?"
created: 2026-10-04
updated: 2026-10-04
scope: prospective source diagnosis and repair; consumed v6 unchanged
---

# Lean v6 supervisor failure

## Symptoms

- Expected: eight supervised current-rules pilot Matches, resource-selected complete matched tier, then dependency-order milestone execution.
- Actual: final v6 reached dispatch; one charged cell, zero successful, seven unused; two invocations, zero transitions/events, cleanup complete.
- Error: safe compact system_failure / SUPERVISOR_FAILURE; underlying cause not yet established.
- Timeline: observed on source005650cd and heldHEAD73b97a3d, uniquely verified once and terminal report pushed db0bfd4c.
- Reproduction: no consumed route may be rerun. Use source-only regression fixtures first; fresh prospective execution only after reviewed fixed source/new allocation/passing same-process capacity.

## Current Focus

- hypothesis: no historical cause is recoverable from the retained compact result; prospective failures can be localized by an additive finite diagnostic sidecar derived from trusted runtime accounting and explicit host wrapper observations.
- test: add inert tests proving a trusted allowlisted runtime system code is preserved in the sidecar projection, untrusted/raw fields are excluded, and unknown host/cleanup cases fail closed to allowlisted enums.
- expecting: focused tests pass without changing the strict compact match record schema or any consumed artifact.
- next_action: root runs the coordinated source review and stable joint gates; if they pass, continue only with the newly authorized versioned successor/preflight path and one prospective observation, never the consumed v6 route.
- reasoning_checkpoint:
  hypothesis: "The consumed run's cause was erased because the canonical bridge failure path is projected to SUPERVISOR_FAILURE; accounting may retain a finite runtime systemFailure code, while runner-level thrown/verification/cleanup failures require explicit wrapper-stage capture."
  confirming_evidence:
    - "runCanonicalLabMatch catches exceptions and returns LAB_SUPERVISOR_FAILURE; compactExecution maps every execution failure/systemFailure evidence to SUPERVISOR_FAILURE."
    - "Planner runtime evidence carries systemFailure.code, and session private diagnostics expose only finite stage/reason pairs through a WeakMap-bound issued evidence path."
  falsification_test: "An inert synthetic execution with an allowlisted systemFailure code projects to that exact finite code; unknown/malformed inputs project to unknown/null; raw strings and extra fields never appear."
  fix_rationale: "A diagnostic-only sidecar restores bounded attribution for future source runs without modifying historical compact records, classification, Match rules, or runtime bounds."
  blind_spots: "The original v6 result has no cause field; even a perfect prospective diagnostic cannot establish the consumed run's specific initiating cause."
- authority: root explicitly authorized the fix and continuation; RED/GREEN is internal technical validation. No old result, journal, allocation or authority is changed.
- authority: human explicitly requested repair and continuation after the terminal report. Supersedes the prospective no-more-corrections stop only; no old result, journal, allocation or authority is changed. No budget reset or bounds increase.

## Constraints

Same shared15GB/28800000ms/300Match caps, carry2168630ms and one prior lean charge plus surviving-file debit; guest1000ms/host5000ms/Match600000ms unchanged. Keep all historical consumed bytes immutable and failed; no second v6 reader. Source-only tests never provide empirical credit. Current-rules freeze before formation; private holdout unopened; no public/counting/production authority. No raw private errors/source/objectives/memory/IO/stdio in safe artifacts.

## Evidence

- Existing finalv6 result/reader and terminal audit: feasibility_not_established; no established root cause.
- timestamp: 2026-10-04
  checked: `FactoryAdmission`/`FactoryNativeLane` declarations, factory identity guard, and lean runner identity guard
  found: `FactoryAdmission` indeed uses `nativeLane.runtimeProfileRoot`, but the lean runner guard compares against `ledger.allocation.runtimeRoot`; this is the allocation's admitted runtime root, not a nonexistent admission field
  implication: the suspected identity-guard bug is not supported; no implementation change made
- timestamp: 2026-10-04
  checked: inert source-level assertion for the suspected admission-field mismatch
  found: RED was only because the asserted corrected source text was absent; inspection of the exact existing expression showed it refers to `ledger.allocation.runtimeRoot`, so this did not establish a defect and the test was removed
  implication: eliminate this hypothesis; do not change runtime identity guard
- timestamp: 2026-10-04
  checked: `runCanonicalLabMatch` exception handling, lean compact projection, planner private diagnostic issuance
  found: bridge exceptions become generic `LAB_SUPERVISOR_FAILURE`; compact projection drops runtime systemFailure codes and writes only `SUPERVISOR_FAILURE`; trusted provider evidence/private origin are available in-process before projection
  implication: historical cause remains unknown; add only a finite forward-only sidecar that localizes provider invoke/verification/native response/cleanup or remains unknown
- timestamp: 2026-10-04
  checked: focused inert diagnostic projection regression and `git diff --check`
  found: RED before helper implementation (`deriveLeanSupervisorDiagnostic` absent); GREEN after additive helper/runner integration; trusted `MALFORMED_IPC` is retained only in the sidecar projection while compact output remains `SUPERVISOR_FAILURE`; forged stage/reason/code/method/ordinal fall back to unknown/null; whitespace check passes
  implication: diagnostic-loss subgoal is repaired and locally verified; no conclusion about historical v6 cause or future native response is established

## Eliminated

- hypothesis: lean identity guard reads a nonexistent `FactoryAdmission.runtimeRoot` and rejects valid providers
  evidence: exact source expression compares against `ledger.allocation.runtimeRoot`; allocation schema carries `runtimeRoot`; initial assertion was a misread and red only because an incorrect source-text expectation was absent
  timestamp: 2026-10-04

## Resolution

root_cause: Historical v6 initiating cause remains unknown because its strict compact terminal retained only SUPERVISOR_FAILURE. A prospective observability defect is confirmed: trusted runtime systemFailure codes and bounded session origins were available before projection but discarded by the runner's generic compact failure projection.
fix: Added a separate exact-key, enum-limited per-charge diagnostic sidecar for failed prospective cells, capturing only trusted provider invoke/verification/native-response/cleanup stage, reason, allowlisted subprocess code, method, ordinal, and charge root. The compact match-record schema and consumed v6 store remain unchanged.
verification: New inert source-level RED/GREEN regression passes; focused test command passes (1 test); git diff --check passes. Root's coordinated types/review/joint gates remain pending.
files_changed:
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
