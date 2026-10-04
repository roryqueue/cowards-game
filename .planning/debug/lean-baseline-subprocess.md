---
status: awaiting_human_verify
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

- hypothesis: runMethod's cleanup can overwrite the original native failure because poison calls remove without containing cleanup exceptions. This is an attribution/lifecycle defect, not the established initiating cause of the consumed baseline failure.
- test: synthetic session frame/stream plus throwing cleanup transport; assert original error/classification preserved, session poisoned, cleanup remains explicitly incomplete, no second dispatch. No Worker, child, provider, private source, allocation or retained reader.
- expecting: original code/origin is replaced today when cleanup throws; preserved error plus fail-closed cleanup receipt is the desired source behavior.
- next_action: atomically commit the four owned source/fixture/journal/supplement files; return exact commit and bounded proofs to manager for independent source review/verification. No empirical verification/retry is authorized; keep this original journal path.

tdd_checkpoint:
  test_file: scripts/lib/v1-38-lean-subprocess-attribution.test.ts
  test_name: should preserve native signal classification when %s cleanup throws
  status: green
  command: pnpm exec vitest run scripts/lib/v1-38-lean-subprocess-attribution.test.ts --maxWorkers=1
  failure_output: 3 failures; expected original SUBPROCESS_SIGNAL classification, received null after cleanup exception replacement.

reasoning_checkpoint:
  hypothesis: cleanup exceptions mask native response errors because runMethod executes poison before rethrow, while remove calls stream.close/control transport/inspect without exception containment.
  confirming_evidence:
    - runMethod catch executes poison(); throw error; remove performs three independently throwable synchronous cleanup calls.
    - inner-response admission already protects its original error when poison throws; the native/outer path does not.
  falsification_test: a mock native signal or authenticated stream error followed by a throwing cleanup operation still yields the original code and origin plus an incomplete cleanup receipt on unmodified source.
  fix_rationale: contain each cleanup operation independently, still attempt owned removal and absence inspection, and retain cleanupComplete false/orphanedChild true when any cleanup operation throws.
  blind_spots: this branch was not observed in the consumed baseline (cleanup complete and signal code retained); no actual initiating cause or empirical repair is proved.

## Evidence

- timestamp: 2026-10-04
  checked: final fixture formatting and repeat of exact expanded regression before commit
  found: formatting applied only to the new fixture; exact regression exits0 again, 16/16 PASS (duration2.05s), git diff --check exits0. No pre-existing staged files; only the four owned files will be committed.
  implication: stable source-only mocked regression across two expanded executions. All empirical/root gates remain unchanged; manager independent review next.
- timestamp: 2026-10-04
  checked: corrected standalone strict no-emit owned-file command
  found: pnpm exec tsc --noEmit --ignoreConfig --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts exits0 with no diagnostics.
  implication: owned source/fixture and imported dependencies pass this configured strict no-emit gate. First unconfigured invocation remains disclosed; no broader project typecheck is claimed. Source-only repair awaits independent root review, not human testing of the consumed route.
- timestamp: 2026-10-04
  checked: first standalone strict no-emit command and source diff whitespace
  found: type command exit2 because explicit Node types were omitted under standalone TypeScript6; many TS2591 missing-node declarations, not evidence of a source repair defect. git diff --check exit0; source diff changes only remove's exception containment, no bound/identity/stale/broker logic.
  implication: correct checker configuration once with --types node; do not alter project source or claim that first command passed.
- timestamp: 2026-10-04
  checked: expanded attribution fixtures and selected existing safe session lifecycle/identity/origin cases
  found: attribution command exit0, 16/16; selected session command exit0, 51 passed/57 skipped. Expanded cases cover individual/all cleanup throws, signal classification, stream primary object identity+unknown origin, stale correlation origin and explicit close. Selected existing tests cover exact absence tuples/near misses, malformed/stale frames, isolated native timeout/state origins, no fallback and request counters. No broker/child/Strategy test was selected.
  implication: primary precedence and fail-closed cleanup pass across isolated mocks; frozen identity and absence checks remain unchanged. Type/diff checks next; initiating cause UNKNOWN and empirical proof absent.
- timestamp: 2026-10-04
  checked: original exact regression command after the cleanup-only source change
  found: exit0; 1 file and 3/3 tests pass. Independently contained close/removal/inspection preserve SUBPROCESS_SIGNAL, poison the session, attempt each operation once and cache cleanupComplete:false/orphanedChild:true.
  implication: confirmed RED-to-GREEN for adjacent cleanup/error-precedence defect only. Extend finite mocks to origin/error identity and inspect adjacent stale/correlation/absence lifecycle behavior; no empirical repair follows.
- timestamp: 2026-10-04
  checked: manager continuation and independently confirmed RED gate
  found: manager independently reran the exact original regression command; exit1, all three fail with original SUBPROCESS_SIGNAL classification replaced. Narrow source/mocks-only repair authorized; no empirical continuation or initiating-cause claim.
  implication: apply the documented cleanup containment only, preserving unchanged stale/correlation/identity checks and fail-closed incomplete cleanup; root independently reviews after source commit.
- Root handoff and independent report 265-16-RETAINED-VERIFICATION-v1.md close both actual entry and exactly one reader. Source/HEAD hold released only after closure; no old artifact mutation.
- timestamp: 2026-10-04
  checked: scoped retained verification and current repository status
  found: authenticated ordinal0 native_response/selectActivations/executor SUBPROCESS_SIGNAL; no signal identity retained. Source hold released. Unrelated existing untracked files present; preserve them.
  implication: use static source plus mocks only. No resource/game-rule change, empirical replacement, old reader, or private payload output is authorized.
- timestamp: 2026-10-04
  checked: baseline Match create composition versus successful pilot nativeLeanProvider; factory/planner/session source trace
  found: both authorize immutable factory source, build container-subprocess revisions, bind admission/source/executable/tuple/image identity, issue charge-bound lean authority and call the same factory/planner/session. Guest1000/host5000/Match600000 unchanged. Both permit authenticated diagnostics after finite failure.
  implication: no demonstrated baseline-only runtime/lifetime identity divergence. The pilot's identity assertions are more explicit, but current constructor/session validation covers the relevant joins; absence of a duplicate assertion is not an initiating cause.
- timestamp: 2026-10-04
  checked: broker legacy timeout and session/planner failure attribution
  found: broker can synthesize SIGKILL after a bounded legacy wait; session raises SUBPROCESS_SIGNAL from an outer signal field; planner executor is the fallback when no finer session origin exists.
  implication: SUBPROCESS_SIGNAL/executor alone does not prove an external process signal, guest fault, memory shortage or host-timeout cause. No timeout/resource behavior change is justified.
- timestamp: 2026-10-04
  checked: native runMethod catch and cleanup remove versus inner-response catch
  found: native catch invokes unguarded poison before rethrow; cleanup exceptions can prevent original error propagation. Inner-response catch already preserves original error against poison exceptions.
  implication: demonstrable adjacent attribution/lifecycle defect to test once with isolated mocks; consumed failure initiating cause remains unknown.
- timestamp: 2026-10-04
  checked: isolated mock-only attribution fixture on unchanged implementation, exact vitest command above
  found: exit1; all three branches (stream-close, remove, absence-check throws) lose the original SubprocessSystemFailure classification. No Worker/child/Docker/provider/Strategy/Match was executed; no consumed artifact was read or written by the fixture.
  implication: attribution/lifecycle defect confirmed RED; stop before source fix for independent manager confirmation. This counterfactual branch does not authenticate the consumed failure's initiating cause.

## Eliminated

- None yet. A SUBPROCESS_SIGNAL classification alone does not identify a signal, a resource violation, or a Strategy violation.
- hypothesis: baseline uses a different runtime receipt/lifetime composition than the successful pilot
  evidence: both pass charge-bound lean authority through the same factory/planner/session and identical frozen runtime bounds.
  timestamp: 2026-10-04

## Resolution

- root_cause: consumed baseline initiating cause remains UNKNOWN. Separate source defect confirmed: native error propagation runs unguarded cleanup first, allowing cleanup exceptions to replace the original native error and classification.
- fix: independently contain stream close, owned removal and final absence inspection in remove(); attempt all three, cache fail-closed incomplete cleanup on any thrown operation and let the primary error propagate unchanged.
- verification: original 3/3 independently confirmed RED then GREEN; expanded mock-only regression16/16 PASS, selected existing lifecycle/stale/absence/origin mocks51/51 PASS (57 skipped), configured strict owned-file no-emit types PASS and diff whitespace PASS. Source review/verification remains with root. Consumed initiating cause UNKNOWN, no empirical repair proof or baseline unblock; no new empirical execution allowed.
- files_changed: [scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-subprocess-attribution.test.ts, .planning/debug/lean-baseline-subprocess.md, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SUBPROCESS-DIAGNOSIS-v1.md]
