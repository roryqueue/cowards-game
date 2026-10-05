---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-startup-v5-source
reviewed: 2026-10-05T22:19:25Z
depth: standard
scope: source_only_crossfile
diff_base: a4b372f0
source_commit: 74a92f5d98bd9bfea5b92d64a3d0e3ef5d52a6da
independently_reviewed: true
reviewer_agent: /root/review_265_startup_v5
files_reviewed: 12
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-startup-v5.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# Phase 265: Prospective startup v5 source review

## Summary

Two source correctness blockers prevent a clean source gate: actual-loader broker generation captures an undefined transpiler helper, and v5 monotonic time closure disagrees with the retained reader's exact timestamp joins. One bounded coverage warning remains for the unsynthesized positive filesystem request/authorization and accepted-diagnostic authentication paths. The author's reported 28 passing fixtures are not evidence that these paths work.

Review covered the explicit twelve-file scope and its reached request, allocation/cap, parent, publication, authority, factory/planner/session, broker and retained-reader edges. Context included AGENTS.md, current approved planning overlays, Phase265 context, startup approval, checked supplement, research, source validation and source summary. No project-local skill directories were found. No structural pre-pass was supplied.

Only one additional executable diagnostic was performed: inert import and broker-string construction under `node --import tsx`, the loader named by the launch wrapper. It did not evaluate the generated broker or any guest. No tests, Worker/child/provider/Docker/Match, real allocation preparation, empirical reader, private payload/history scan, or source changes were performed. Only this new report is written; no commit. Original v4 initiating cause remains UNKNOWN; no performance-fix, startup-sufficiency, empirical, freeze, formation, holdout, public, counted or production credit follows.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — The actual tsx loader emits an undefined helper into the v5 broker

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:305-306`

**Related:** same file:263-268, 451-452; `scripts/run-v1-38-lean-correction.sh:17`; `scripts/run-v1-38-lean-startup-v5.test.ts:145-150`.

**Issue:** `superviseLeanStartupV5.toString()` is not a closure-free serialization of the source function. Under the real `node --import tsx` loader, the generated function contains:

```javascript
const remaining=__name(()=>Math.max(0,Math.floor(deadline-host.now())),"remaining");
```

The generated broker has no `__name` declaration. It launches as plain container JavaScript, not through the host's tsx transformation environment. The first accepted v5 request therefore throws `ReferenceError: __name is not defined` before the function's try block and before `host.construct()`, READY or GO. The broker's queue catch exits73; a fresh charged diagnostic is consumed as a system failure, with no usable startup receipt. This is a deterministic route failure, not a startup-performance hypothesis.

**Finite reproduction:** From the repository root, perform inert construction only:

```sh
node --import tsx --input-type=module -e 'const m = await import("./scripts/lib/v1-38-lean-container-match-session.ts"); const s = m.buildLeanContainerBrokerSourceV5(); console.log(JSON.stringify({helperPresent:s.includes("__name("),helperDeclared:s.includes("function __name")||s.includes("const __name=")}));'
```

Observed output was `{"helperPresent":true,"helperDeclared":false}`. Inspection of the returned string established the exact snippet above. No broker/Strategy execution was needed. The Vitest check asserts absence of `__name` only for its own differently transformed module; the vertical transport fixtures fabricate broker responses and do not resolve this loader discrepancy.

**Fix:** Generate the supervisor from explicit checked-in closure-free JavaScript source, and use that same source to define/exercise the control path in no-native fixtures. Do not serialize a loader-transformed function. If preserving this approach temporarily, explicitly provide every captured helper and prove closure completeness, not syntax alone. Add an inert actual-loader build regression to the scoped gate; recompute generated broker/source roots under the exact execution loader after repair. Keep the legacy builders unchanged.

### CR-02: BLOCKER — Monotonic close rounding breaks exact accepted-reader custody

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:980-986`

**Related:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:225-233`, same file:289-291 and 203-218; `scripts/run-v1-38-lean-correction.ts:112-121`.

**Issue:** For v5, `closeLeanInterval` may increase the supplied close timestamp to `start + ceil(monotonic elapsed)`. Its callers continue constructing adjacent interval timestamps from the *unadjusted* wall observation. `closeLeanFreshSupervisorReader` ignores the returned effective verifier close and starts `reader-close` at raw `closingStart`. Later `authenticateLeanSupervisorDiagnosticCheck` requires `starts(reader-close) === closes(verifier)`. A successful one-shot diagnostic can thus produce a check file and close every interval, yet never authenticate for the baseline route.

**Finite counterexample:** Take a synthetic v5 verifier begun at wall1000 and close it at wall1000 after monotonic1ns. Both clocks are nonnegative and forward; no rollback is needed. The new code writes verifier close1001 because `ceil(1ns / 1ms) = 1`. The reader helper still starts `reader-close` at1000. Authentication requires `1000 === 1001` and refuses `ACCEPTED_READER_CLOSURE`. The same counterexample generalizes whenever monotonic rounding exceeds the observed wall delta. The reader identity is already spent, so this is not a recoverable ordinary retry.

The run-finalization/gap joins also assume exact supplied timestamps (retained reader:208). `closeLeanCorrectionAdmission` publishes its wall/monotonic receipt before closing/importing intervals (correction runner:112-121); silently advancing a later ledger close can similarly disagree with that receipt. This is one cross-module timestamp-contract defect, not a reason to remove conservative elapsed accounting.

**Fix:** Keep raw wall observations and conservative elapsed debits as distinct fields, or propagate the actual effective close returned by `closeLeanInterval` into all adjacent intervals and their authenticated receipts/joins. Define one consistent v5 timestamp contract through admission finalization, reader gap, verifier closure and accepted-check authentication. Preserve monotonic no-refund behavior; do not relax identity checks or rewrite consumed journals. Add deterministic synthetic clocks for same-wall-ms/nonzero-monotonic, monotonic one millisecond ahead, and rollback cases, then authenticate the resulting complete diagnostic check successfully once.

## Warnings

### WR-01: WARNING — The positive authorization-to-accepted-check seam is not tested

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-startup-v5.test.ts:196-257`

**Related:** `scripts/run-v1-38-lean-correction.ts:244-262`; `scripts/lib/v1-38-lean-correction-retained.ts:284-310`; test file:309-323.

**Issue:** The full positive retained audit uses an abbreviated synthetic request and time object; it does not pass that request through the exact filesystem request reader/authorization-carrier checks. The actual retained-reader fixture proves refusal/finally, while the reader-gap fixture checks closed flags and total cost, not successful `authenticateLeanSupervisorDiagnosticCheck`. These are useful isolated tests but leave the central positive machine-carrier/one-shot acceptance composition uncovered. CR-02 is precisely an incompatibility between individually exercised producer and consumer predicates. The source validation candidly discloses this limitation; it is a coverage/robustness warning, not an independent allegation that the authorization hash graph is impossible.

**Fix:** Add one bounded positive synthetic filesystem fixture, with deny-by-default native mocks, containing the exact v5 request keys, execution carrier, setup witness, source/data-review bindings, request bytes, result, finite origin, parent reason, ledger and closed reader accounting. Exercise the real request read and accepted-check authentication; mutate authorization root, request-data root, cap/policy, source/HEAD, charge and effective close individually to prove refusal. No live route, real preparation, historical reader, guest or36-Match run is necessary. Also assert closure joins rather than only interval presence.

## Scope conclusions and remaining gates

The inspected cap wiring selects twelve hours through strict `admitLeanAllocation`/`leanCapsForAllocation`, including the real parent timer/periodic guards, correction resource/admission predicates, prefix checks, charge/checkpoint and retained checks. Global old eight-hour caps and non-time bounds remain unchanged; v5 allocation admission requires the explicit approval/supplement/policy roots and23 diagnostic predecessors or24 baseline predecessors. This observation is not a blanket proof of every old version or later data carrier.

The request-data root intentionally excludes data-review path/root and v5 authorizationRoot, allowing later authorization/data bindings without a direct hash cycle. Both independently reviewed source and request-data reviews are still required by the real reader. No authorization carrier was created or accepted during this review. The wrapper does not currently expose v5 selectors, so the later data/entry handoff must explicitly select and validate its bounded launch path; this review did not launch it.

The opaque authority is retained in a WeakMap and ordered claims reach factory→planner→session. Trusted harness setup precedes the original hostile source path; metadata schemas are finite and private. Generated control and time custody nonetheless have the blockers above. Old default broker/harness and origin-v1 initializers are unchanged in the reviewed diff. No canonical engine/rules, solver, search vector, cold-training procedure, freeze-before-formation order or holdout opening was changed by this source diff.

Source review is **issues_found**, not clean or empirical admission. Fix and revalidate the bounded source defects before any new allocation/charge. Fresh same-process capacity, final source/HEAD binding, complete accepted diagnostic and the single conditional fresh36 baseline remain subsequent gates.

---

_Reviewed: 2026-10-05T22:19:25Z_
_Reviewer: /root/review_265_startup_v5 (gsd-code-reviewer)_
_Depth: standard with targeted cross-file tracing; source only_
