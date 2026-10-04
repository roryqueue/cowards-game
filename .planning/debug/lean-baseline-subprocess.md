---
status: investigating
trigger: "could you fix the blocker then continue please?"
created: 2026-10-04
updated: 2026-10-04
scope: source_only
---

# Lean current baseline subprocess failure

## Symptoms

- Expected: the approved current-only cold baseline executes its fixed 36 pre-holdout slots through the supervised runtime, then independently verifies; no formation or holdout before freeze.
- Actual: the first training cell stopped after 5,083 ms with system_failure/SUPERVISOR_FAILURE, one invocation and no transitions/events; cleanup completed. Producer and exactly one ordinary retained reader are closed. Current successful cells zero, 35 unused; cumulative charges ten.
- Authenticated finite diagnostic: SUBPROCESS_SIGNAL, native_response, selectActivations, executor, ordinal 0. Signal identity and underlying cause were not retained in that finite report; do not infer memory exhaustion or guest fault.
- Timeline: eight pilot cells previously succeeded with the same canonical engine/runtime bounds. This is the first current baseline attempt, fixed source03e2a09d/876entries at HEAD05d3cb8732906f37e3125be856fb815ed2603f66.
- Consumed route: .strategy-lab/lean-baseline-20261004-v1; actual result raw5aa36738cda28049b60a294ece81518f8cd74e56e05612d9852092fe3c4298ab; unique verification report ace1f5df26e2d1bd9f4895fe76725b207ea0fdc789dce2dd4f63112e22bc4962. No rerun/re-reader is authorized by this diagnosis.

## Current Focus

- hypothesis: unknown; compare actual source composition, supervisor lifecycle and subprocess timeout/error attribution against successful pilot wiring.
- test: source inspection and bounded mock/fixture regressions only; no private source publication, provider dispatch, Match, allocation, capacity admission, or ordinary empirical reader.
- expecting: identify a demonstrable wiring defect or honestly document that finite retained metadata cannot establish the initiating cause.
- next_action: delegate source-only diagnosis and repair to GSD debug manager; preserve all consumed artifacts and frozen runtime/resource/gameplay/privacy bounds.

## Evidence

- Root handoff and independent report 265-16-RETAINED-VERIFICATION-v1.md close both actual entry and exactly one reader. Source/HEAD hold released only after closure; no old artifact mutation.

## Eliminated

- None yet. A SUBPROCESS_SIGNAL classification alone does not identify a signal, a resource violation, or a Strategy violation.

## Resolution

- root_cause: not established
- fix: none yet
- verification: no new empirical execution allowed in this source-only session
- files_changed: this prospective debug journal only
