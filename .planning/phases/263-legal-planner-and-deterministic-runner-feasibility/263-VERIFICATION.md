---
phase: 263-legal-planner-and-deterministic-runner-feasibility
verified: 2026-09-13T17:19:40Z
status: gaps_found
score: 8/11 must-haves verified
behavior_unverified: 2
overrides_applied: 0
phase_complete: false
factory_eligible: false
allocation_consumed: true
retries_remaining: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/11
  gaps_closed: []
  gaps_remaining:
    - "PLAN-06 frozen selection-method p99 remains above 5 ms after the third and final consumed attempt"
    - "FACT-02 actual-source Match equivalence has no Match evidence"
    - "FACT-03 complete actual-source reproduction matrix has no semantic evidence"
    - "FACT-04 actual-source publication/shard/trace inventory has no empirical evidence"
  regressions: []
requirements_satisfied: [PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, FACT-01]
requirements_blocked: [PLAN-06]
requirements_pending_empirical: [FACT-02, FACT-03, FACT-04]
gaps:
  - truth: "The candidate meets frozen runtime feasibility limits before factory scale."
    status: failed
    reason: "Independently rederived retry-3 selection-method p99 is 14.171262 ms; the frozen gate is strictly below 5 ms. Three consumed attempts are exhausted."
    artifacts:
      - path: packages/strategy-lab/src/planner/assign.ts
        issue: "The measured emitted selection implementation misses the unchanged direct-method speed gate."
      - path: .planning/phases/263-legal-planner-and-deterministic-runner-feasibility/263-FEASIBILITY.md
        issue: "Terminal non-pass; zero Matches and no empirical semantic reduction."
    missing:
      - "A qualifying runtime result under an explicitly approved future bounded contract and fresh allocation; no retry remains in the current envelope."
behavior_unverified_items:
  - truth: "Actual-source research Matches advance through the selected canonical kernel with equivalent gameplay evidence."
    test: "Only under future approved authority, inspect the bounded actual-source Match/effect evidence."
    expected: "Canonical state, transition and accounting equivalence; no alternative resolver."
    why_human: "The bridge is present and wired, but zero Matches ran; static call tracing cannot establish actual-source equivalence."
  - truth: "The complete actual-source schedule reproduces semantic bytes across worker, shard, order, restart and resume variants."
    test: "Only under future approved authority, compare the contracted complete two-run inventory and private traces."
    expected: "24 accounted attempts, eight scientific cells, alias agreement and identical semantic reductions."
    why_human: "The benchmark correctly prevented dispatch; there are no Match records or semantic roots. Synthetic fixtures are not this empirical proof."
---

# Phase 263: Legal Planner and Deterministic Runner Feasibility Verification

**Phase Goal:** Researchers can prove that the hierarchical planner and deterministic lab runner produce legal, deployable, reproducible work through the canonical kernel before committing to factory scale.

**Status:** gaps_found — valid terminal non-pass, not phase completion. **Initial verification:** no previous Phase263 VERIFICATION or accepted override existed.

The selection method fails the frozen runtime feasibility gate. The runner correctly stops before Matches. Preserving a valid negative experiment satisfies the stop/accounting contract, but does not satisfy the roadmap's deployable/reproducible-work goal or unlock Phase264.

## Evidence boundary

This final re-verification independently read implementation and retry-3 retained private records; SUMMARY claims were navigation only. The parent ran the planned read-only `--verify`; its result is `non_pass`, `executed:false`, 256 retained validation cases and no semantic root. This verifier independently recalculated both retry-3 p99 values directly from all 2200 retained observations and confirmed the count/cleanup inventory. Original evidence and retry-1/retry-2 evidence remain preserved. No guest, host, benchmark, preflight, full Match, preparation or consumed selector was rerun. No executable source or empirical evidence was changed.

Original frozen bindings remain historical: manifest `sha256:074d63e3879dee0f43ee01cb18eec4e088d79eb5092b2219feeb27cd8d87721e`; source `sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b`; execution `sha256:08cb747202ea9d67ec28119b1c776fcc2efabfcd8986887dd1dfdf25bfc2ca1c`; source commit `d138fdb2fe1767bb1d5439b4c935e1ea91deba0c`. Inherited line-number pointers below refer to that original reviewed source, not the shifted lines in the optimized file. Final retry-3 review reports clean source review at `bca54da1`; integration/source/type evidence is recorded at `62`/`51` by the parent. The retry-3 retained envelope independently reports terminal non-pass; no new authority is inferred from source cleanliness. Current exact roots are in263-RETRY-ENVELOPE.md and263-feasibility-retry-3-manifest.json.

Only aggregates and source-code references appear below. Private source, inputs, outputs, objectives, memories and per-call diagnostics remain in the ignored evidence directory.

## Goal Achievement

### Observable Truths

Rows 1–5 retain the complete roadmap success-criterion scope. Rows 6–11 merge distinct PLAN-frontmatter additions; overlapping PLAN truths are mapped to the roadmap row, never used to reduce its scope.

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Full-board ordered assignment under both initiative hypotheses, all ten missions/fallbacks, hard survival/tactical constraints before soft preferences. | VERIFIED | `planner/assign.ts:6` lexicographic comparison, `:53` worst whole-hypothesis score, `:59` bounded beam and reserved assignments; `missions.ts` implements all ten lifecycle branches. Fresh expired-memory/visible-danger and evacuation-lifecycle tests pass; retained validation passes. This proves bounded policy behavior, not strategic strength. |
| 2 | 5x5 SoldierBrain considers nine Actions, detects stale objectives, uses authoritative Advance, handles immediate threats/opportunities and reserves cheap fallback. | VERIFIED | `planner/brain.ts:7` nine Actions, `:12` local mission admission, `:43` intention ranking, `:99` reservation before optional work. Fresh zero-budget and authoritative-Advance tests pass; actual validation includes tactical/stale controls. No exhaustive optimality is claimed. |
| 3 | Legal-information paired choices and self-contained deterministic bounded candidate pass frozen source/objective/memory/output/runtime gates; failure is preserved without extra compute. | FAILED — BLOCKER | Retry-3 retained envelope: 256 validation cases pass, 232 guest calls; 2,200 benchmark calls. Selection p99 **14.171262 ms** fails strict **<5 ms**; brain p99 **1.732708 ms** passes. Correct failure preservation does not cancel the runtime requirement. |
| 4 | Private one-way dependency graph and every research Match through exact MATCH_KERNEL, without copied resolver/legality/transition loop. | UNCERTAIN — WARNING; PRESENT_BEHAVIOR_UNVERIFIED | Static boundary scan: 6618 files, zero violations. `runtime-bridge.ts:29–72` calls canonical machine/step/resume; CLI invokes it. Actual-source Match equivalence is unexercised: zero Matches. |
| 5 | Non-secret command, stable task/stream identities, strict artifacts and identical complete reductions across worker/shard/order/restart/resume, atomicity and tamper detection. | UNCERTAIN — WARNING; PRESENT_BEHAVIOR_UNVERIFIED | `tasks.ts`, `identity.ts`, `shards.ts`, `reduce.ts`, `runner.ts` are substantive and wired to CLI. The complete empirical branch at CLI `:517–526` is not reached. Empty Match inventory, no semantic root; synthetic proofs do not establish actual-source reproducibility. |
| 6 | Wrong bindings/host failures return unscored unchanged gameplay with complete owned-resource cleanup. | VERIFIED | `runtime-bridge.ts:35–82` retains initial state, emits empty failed transitions, validates request/identity and closes providers. Fresh focused run: `./node_modules/.bin/vitest run packages/strategy-lab/src/runtime-bridge.test.ts --maxWorkers=1` — 11/11 tests passed, including eight wrong-binding faults, unchanged-state/no-result assertions, player/system distinction, and cleanup uncertainty rejection. |
| 7 | Trusted method-body timing stays within supervision without exposing guest clocks or relaxing limits. | VERIFIED | `benchmark.ts` validates issued request/method/input/identity observations; retry-3 contains 2,200 successful completed records with unique ordinals/invocation roots and cleanup. Exact p99 is derived from `timing.observation.durationMs`, not transport/host timing. |
| 8 | Manifest/admission and allocation distinguish 24 attempts from eight scientific cells; every unit is charged or unused and failures cannot become payoffs. | VERIFIED | Strict admitted roots/manifest checks in `contracts.ts` and CLI `admitPrepared`; `tasks.ts` pre-enumerates 12 labels/cells twice, with aliases. Retry-3 receipt: 256 cases, 232 validation guest calls, 2,200 benchmark calls, 0 charged/24 unused Matches, zero uncertain units. `reduce.ts` admits payoffs only for complete comparable success. |
| 9 | Actual source passes or records an honest terminal non-pass; failed feasibility blocks scale and grants no broader authority. | VERIFIED | `consumed.json` binds exact manifest/execution roots; CLI `:516` throws on benchmark non-pass before Match dispatch. Receipt and FEASIBILITY report say non-pass and production false. No retries remain; unused Match capacity is not new execution authority. |
| 10 | All ten requirements are independently mapped to code and actual evidence. | VERIFIED | Requirements table below distinguishes six bounded/static satisfactions, one failed gate and three pending empirical requirements; none omitted or orphaned. |
| 11 | Validation/UAT distinguish automated proof, private trace review and unverified behavior. | VERIFIED | Independently read final `263-UAT.md` (3 passed/1 issue/2 blocked) and `263-VALIDATION.md` (partial, Nyquist false; executed audit supersedes historical pending map). Both preserve failed speed and unavailable Match/reproduction/realism evidence, without inventing human acceptance. |

**Score: 8/11 truths verified; 2 present-but-behavior-unverified; 1 blocker.** A recorded non-pass is not an override. No overrides or explicit PLAN prohibition blocks were found. Retry-3 is the third and final consumed attempt; the envelope is exhausted.

### Required Artifacts and Key Links

All listed implementation artifacts exist, contain substantive behavior and are reachable through direct imports/calls. Presence/wiring is not runtime verification.

| Artifacts | Required wiring | Result |
|---|---|---|
| `contracts.ts`, `feasibility-protocol.ts` | CLI → exact roots, canonical encoding, fixed corpus/allocation; frozen measurement-policy references | WIRED; bounded schemas and fixed threshold retained |
| `planner/missions.ts`, `planner/assign.ts` | assignment → mission creation/lifecycle; canonical input/output contracts | WIRED; four-component hard ordering before soft score |
| `planner/brain.ts`, `planner/emit.ts`, `planner-corpus.ts` | emitter statically assembles full assignment/controller; corpus maps to real mission ABI | WIRED; exact emitted source was actually validated/benchmarked |
| `runtime-bridge.ts`, `scripts/lib/v1-38-planner-supervised-runtime.ts` | CLI → supervised host → selected runtime adapter; bridge → MATCH_KERNEL | WIRED; actual method calls observed, actual-source Match branch unexercised |
| `benchmark.ts`, runtime-js `worker-harness.ts` | trusted observer → bound method observations → frozen nearest-rank evaluator | WIRED; empirical non-pass independently recalculated |
| `identity.ts`, `tasks.ts` | frozen material → preassigned tasks/streams → runner | WIRED; layout excluded from scientific identity |
| `runner.ts`, `worker.ts`, `shards.ts`, `reduce.ts` | preassigned dispatch → complete validated shards → canonical reduction | WIRED; actual-source publication/restart/reduction unexercised |
| `scripts/check-v1-38-lab-boundaries.ts` | production/core graph → transitive and deployment-denial checks | WIRED; fresh read-only scan passes |
| `scripts/run-v1-38-planner-feasibility.ts`, manifest, `263-FEASIBILITY.md` | exact immutable preparation → run → retained verification/report | WIRED; bounded terminal non-pass, not a stub |
| `263-VERIFICATION.md`, `263-UAT.md`, `263-VALIDATION.md` | verdict/report and parent-owned acceptance/validation bookkeeping | This report created; final UAT/validation independently read and consistent with non-pass |

### Data-Flow Trace (Level 4)

No UI component or dynamic database view was produced. Equivalent CLI data-flow trace: frozen material → actual supervised validation/timing records → immutable result/receipt → read-only verification and aggregate report is **FLOWING**. The separate Match → trace/shard → semantic reduction path is **NOT EXECUTED BY DESIGN** after the failed gate, not hardcoded successful data. An empty payoff/Match result is correct non-pass behavior and cannot establish FACT-03.

### Behavioral Spot-Checks

Each test command uses `./node_modules/.bin/vitest run --maxWorkers=1` with the indicated file and one exact `-t` name. All four tests use trusted in-memory canonical fixtures; they do not execute emitted guests or full Matches.

| Behavior | File / exact named test | Fresh result |
|---|---|---|
| Mission and expired-memory transition | `planner/assign.test.ts` — `visible danger changes mission and ordering; expired memory does not survive` | PASS, 1 test, 2.47s |
| Reserved zero-budget fallback | `planner/brain.test.ts` — `enumerates all concrete Actions and reserves exactly nine evaluations at zero budget` | PASS, 1 test, 2.63s |
| Mission lifecycle | `planner/missions.test.ts` — `evacuation: active, complete, stale, failed and fallback` | PASS, 1 test, 1.24s |
| Authoritative Advance | `planner/brain.test.ts` — `uses authoritative Advance, not forged SoldierMemory, at final Cycle` | PASS, 1 test, 2.41s |
| Wrong bindings / unchanged failure / cleanup | `runtime-bridge.test.ts` — `rolls back bad %s binding without a score` (8 cases), `keeps player violations distinct and rejects cleanup uncertainty` | PASS, 11 tests total in focused file, 2.17s |
| Dependency denial | `./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts` | PASS; 6618 files, zero violations |
| Benchmark reduction | Read-only parser over retry-3's 2,200 retained JSON records; exclude first 100 per method, numeric sort, index 989 | 1,000 measured/method, 0 failed/incomplete observations; selection 14.171262 FAIL, brain 1.732708 PASS |

No full-suite rerun. No separate shell probe is declared in Phase263 plans. The phase-specific retained `--verify` is the applicable read-only runnable check, performed by the parent; probe/guest regeneration is prohibited for this consumed run.

### Retry-3 Re-verification (Terminal)

Independent read-only audit of `.strategy-lab/phase263-feasibility-retry-3` confirms 2,200 benchmark records and charge receipts (1,100 per method), unique ordinals and invocation roots, and zero malformed/incomplete records. The 1,000 measured samples per method (after the frozen first-100 warmups) independently produce selection p99 **14.171262 ms** and SoldierBrain p99 **1.732708 ms**, matching the retained benchmark result. Validation remains 256 cases / 232 guest calls / 24 rejects (16 source, 8 input). The receipt records 0 charged and 24 unused Match attempts, cleanup complete, terminal `non_pass`; `benchmark-cleanup.json` reports no orphaned child; `lab-matches/` contains zero files. The three-attempt envelope is exhausted. Final review artifacts record clean source review (`bca54da1`) and integration/source/type evidence (`62`/`51`); these do not convert the failed frozen speed gate or absent Match evidence into a pass.

### Requirements Coverage

All PLAN-01..06 and FACT-01..04 appear in plans and the Phase263 traceability table. No orphaned Phase263 requirement was found. SATISFIED below is bounded evidence coverage, not global phase or factory eligibility.

| Requirement | Plans | Contract / evidence | Disposition |
|---|---|---|---|
| PLAN-01 | 02,07 | Ordered dual-initiative bounded beam; hard-before-soft comparator; source read, fresh transition test and retained validation | SATISFIED |
| PLAN-02 | 02,07 | Ten explicit mission constructors/lifecycles/objectives/fallbacks in `missions.ts`; fresh evacuation lifecycle plus retained cases | SATISFIED |
| PLAN-03 | 03,07 | Nine Actions, stale/local mission, authoritative Advance and reserved legal intention; fresh zero-budget/Advance checks and actual tactical validation | SATISFIED |
| PLAN-04 | 03,04,06,07 | `emit.ts` lexical closure and legal-input-only policy; actual paired hidden-state/fresh/reused-context validation | SATISFIED for frozen validation domain; no arbitrary-state exhaustive proof |
| PLAN-05 | 03,06,07 | Exact 24294-byte synchronous self-contained source; capability/source and canonical result bounds; expected 16 source/8 input rejections and 232 guest calls | SATISFIED; does not include PLAN-06's distinct p99 gate |
| PLAN-06 | 01,04,06,07 | Retry-3 validation passes but selectActivations p99 14.171262 ms violates strict <5 ms; three-attempt envelope is exhausted | BLOCKED; honest failure preserved |
| FACT-01 | 01,07 | Private package and executable dependency graph; fresh static scan 6618 files/zero violations | SATISFIED within supported static-graph model, not arbitrary-code sandbox certification |
| FACT-02 | 04,06,07 | Canonical bridge is present/wired, no alternate transition owner found | NEEDS HUMAN / pending actual-source Match equivalence; zero Matches |
| FACT-03 | 05,06,07 | Preassigned identity/stream and one-command runner/reduction implemented | NEEDS HUMAN / pending actual two-run worker/shard/order/restart/resume evidence |
| FACT-04 | 01,05,06,07 | Strict bounded schemas and canonical identities; exclusive temporary-file publication, digest readback, atomic link, coverage/ledger checks | NEEDS HUMAN / pending full actual-source shard/trace/reduction path; no empirical publication inventory |

Exactly **6/10 requirements have bounded/static satisfaction evidence**. **PLAN-06 is blocked; FACT-02, FACT-03 and FACT-04 remain pending empirical verification.** Neither plans-completed counts nor safe synthetic regressions make this 10/10.

### Locked Context Decisions

| Decisions | Disposition |
|---|---|
| D-01, D-14 | Source/manifest admission binds predecessor identities and unchanged source/runtime/timing limits; timing gate fails openly. |
| D-02, D-21 | One selected kernel bridge present; no replacement resolver found; actual-source Match equivalence pending. |
| D-03, D-11, D-13 | Emitted source crosses existing supervised provider; legal-input-only source assembly/paired evidence; no coordinator/web/API/Go Strategy execution introduced. |
| D-04, D-16 | Private offline package and one-way graph pass current static scan. |
| D-05, D-17 | Immutable allocation/charge records and pre-enumerated identities; 24 unused Matches cannot become payoffs or retries. |
| D-06, D-07, D-08 | Both hypotheses, mission lifecycles and noncompensatory ordering implemented; bounded heuristic, not optimal planner proof. |
| D-09, D-10 | Nine Actions and reserved deterministic fallback exercised by fresh pure tests and retained validation. |
| D-12, D-15 | Validation passes, timing fails; correct terminal non-pass and factory stop. |
| D-18, D-19, D-20, D-22 | Identity/publication/reduction/reproduction implementation exists; retained verification does not substitute for the unexecuted actual Match/restart matrix. |

Threat checks cover teacher/capability leakage (legal-input source and retained validation), alternate rules (canonical bridge/static scan), production exposure (graph scan), identity/accounting/tampering (manifest and durable per-call records), and false reproducibility (explicitly withheld). The synthetic injected failure/cleanup seam is now behaviorally verified; actual-source Match/reproduction remains unexercised. No later milestone phase explicitly owns repair of the Phase263 runtime prerequisite; none of these gaps is deferred to Phase264 or later.

### Anti-Patterns and Evidence Caveats

| File / line | Finding | Severity / impact |
|---|---|---|
| `scripts/run-v1-38-planner-feasibility.ts:532` | Receipt cleanup falls back to `benchmark.passed` on the normal benchmark result shape. A timing failure therefore yields `cleanupComplete:false` even though retained benchmark cleanup is true/no orphan and validation cleanup is true. | WARNING; conservative reporting conflation, not evidence of an orphan. Preserve exact receipt bytes; cannot rescue timing failure. |
| `scripts/run-v1-38-planner-feasibility.ts:460` | Retained verification compares summary p99 fields against derived values only for a passing summary. | WARNING; non-pass summary numbers alone are insufficient evidence. Independent reduction of all current observations confirms both published values exactly; no current timing ambiguity remains. |
| Phase source/test scan | No unreferenced TBD/FIXME/XXX or TODO/HACK/PLACEHOLDER markers found in scanned Phase263 lab/CLI/boundary/host/observer source. | No debt-marker blocker. Empty failure transitions/payoffs are intentional fail-closed outputs, not stubs. |

Disconfirmation: PLAN-06 is demonstrably incomplete despite a clean source review; a source-size/static emission test cannot prove runtime speed. The safe synthetic failure/cleanup invariants were freshly exercised and passed; this does not substitute for actual-source Match evidence.

### Human Verification Required

1. **Do not advance to factory scale.** The operator must decide whether to stop with this valid negative result or approve a separately bounded future contract. This report authorizes no new measurement, source optimization, retry, guest call or Match.
2. **Actual Match/reproduction and private realism review remain unavailable.** There are no traces for the eight scientific baseline-start reviews or 24-attempt reproduction. If future work is explicitly approved, verify board bounds/full starts, selected kernel state/transition/accounting equivalence, alias comparisons, and worker/shard/restart/resume semantic equality. No existing unused slot is reopened by this request.

The injected wrong-binding/unchanged-state/cleanup checks are machine-verifiable and are not human-only; only starting a new consumed-envelope revision would require operator authority.

## Gaps Summary

One hard blocker prevents the phase goal: selection-method speed misses the unchanged threshold. Two actual-source truths remain present but behavior-unverified; the injected wrong-binding/unchanged-state/cleanup truth is independently verified by 11 focused tests. Final acceptance bookkeeping accurately preserves this non-pass. No unverified item grants execution authority. The one-shot allocation stays consumed, evidence/history stay immutable, Phase263 stays incomplete, and Phase264/factory scale remain blocked. Formation, holdout, public, counted, production gameplay, archive and tag authority are not granted.

---

_Verifier: independent goal-backward Phase263 agent. No commit performed._
