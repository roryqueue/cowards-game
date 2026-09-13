---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-03-teacher-readiness
checked: 2026-09-13
status: gaps_found
targeted_test: 3/3 passed
recheck: 2026-09-13
resolved_gaps: 2
open_gaps: 5
---

# Phase 264 Teacher Readiness Check

This is a bounded source/mechanics review, not candidate, empirical, Match, runtime, or certification evidence. No generated source was executed.

## Re-check after `7516aa5c` / `4e6b4360`

The focused test passed 3/3, and the two original findings are substantively improved: the teacher now evaluates multiple canonical branches over multiple depths, and both trusted entrypoints consume schema-admitted legal input. The following open gaps remain after inspecting the repaired code directly.

| Check | Result | Evidence |
|---|---|---|
| Actual canonical frontier/depth search | **PARTIAL — GAP** | `teacher.ts:12-25` evaluates three seeded branches and repeated `MATCH_KERNEL.stepMatch` nodes, but `maxNodes` is not a global cap: each branch can consume `maxDepth` nodes, so `maxNodes: 2, maxDepth: 6` can visit 12 nodes. `depthReached` is also reported as `maxDepth` even when a branch terminates early. Enforce the cap across the whole frontier and report actual depth. |
| Counterfactual state affects teacher ranking | **GAP** | `teacher.ts:12-25` validates `hiddenBranchBias` but never uses `hiddenBranchBias` or `opponentHypothesis` in branch seeds, node scoring, or selection. The teacher’s counterfactual input therefore cannot change the selected result. |
| Canonical branch exploration reaches scored outcomes | **GAP** | `teacher.ts:16-23` advances each branch until the first `effect`/non-transition result and never sends a `runtime_resume` result for any alternative mission/Action. The score is only accumulated event count/completion status; it is not a counterfactual gameplay outcome ranking. |
| Teacher search is connected to distillation | **GAP** | `TeacherSearchReceipt` is not accepted by or converted into `LegalTrainingRecord`; `distillLegalStudent` accepts caller-supplied `activation`/`brain` labels only. There is no receipt → legal training target → distilled student seam, so privileged offline exploration is not actually what produces the student. |
| Legal-schema student boundary and unseen legal inputs | PASS (mechanics) | `distill.ts:24-32` parses `StrategyInputV119Schema`/`SoldierBrainInputV119Schema`; activation and brain controllers vary over legal observations, and the focused test exercises unseen enemy directions and both entrypoints. Unknown teacher fields are rejected by schema parsing. |
| Same tested representation in both emitted entrypoints | **GAP** | `emit.ts:80-82` embeds the distilled modes but reimplements activation/brain logic as a handwritten source string. It mirrors `runDistilledActivations`/`runDistilledSoldierBrain` rather than bundling or mechanically deriving the exact tested controller. Add correspondence tests or emit the shared controller representation without a second handwritten policy. |
| Source/packet roots and strict closure | PASS (mechanics) | `emit.ts:34-48,94-101` rejects free identifiers/imports/capabilities, requires `export default`, embeds `controllerRoot`, hashes emitted source, and `FactoryOraclePacketSchema` validates the packet root/source/provenance linkage. |
| Teacher/opponent/host data leakage | PASS (mechanics) | Emitted source contains only the distilled student modes/controller root and legal observation fields; no `counterfactual`, `opponentHypothesis`, host, or search-state identifiers appear. Source remains unexecuted. |

The repaired test count alone does not close the three gaps above. The previous one-step teacher and fixed-prefix findings are retained below as resolved history, not current findings.

## Historical initial review (superseded findings retained)

The following section records the initial pre-repair evidence. Its one-step-search and fixed-prefix findings were resolved by `7516aa5c`; the current open findings are the re-check table above.

## Evidence checked (historical baseline)

- `packages/strategy-oracle-teacher/src/teacher.ts`
- `packages/strategy-oracle-teacher/src/distill.ts`
- `packages/strategy-oracle-teacher/src/emit.ts`
- `packages/strategy-oracle-teacher/src/index.ts`
- `packages/strategy-oracle-teacher/src/teacher.test.ts`
- Plan/context requirements for D-03, D-14, D-16, D-18, and D-19

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` — **3 tests passed**.

## Scientist-critical checks (historical baseline)

| Check | Result | Evidence |
|---|---|---|
| Canonical transition authority | PASS | `teacher.ts` calls `MATCH_KERNEL.createMachine` and `MATCH_KERNEL.stepMatch`; no copied resolver or local transition implementation was found. |
| Bounded counterfactual search | **GAP** | `searchCanonicalCounterfactual` evaluates exactly one `stepMatch` transition and chooses parity from one hash character plus bias. It has no bounded candidate/counterfactual enumeration or search-state frontier. This is a teacher stub relative to the stated bounded-search goal. |
| Student input boundary | PASS | `distill.ts` exposes only observation, allowed objective, and memory; altered teacher-only data is ignored by the tested chooser. |
| Emitted source teacher-data isolation | PASS (mechanics) | Closure test rejects free identifiers/imports/capabilities; emitted source contains no `counterfactual` or `opponentHypothesis` identifiers. This is not an execution or factory-admission claim. |
| Emitted source implements the same tested student | **GAP** | `emit.ts` emits `studentAction` for `soldierBrain`, but `selectActivations` uses a fixed sorted active-soldier prefix and `objective: null`; it does not apply the distilled legal policy used by `chooseDistilledStudentAction`. The deployed source is therefore a simplified surrogate for part of the tested student. |
| Strict source closure | PASS (mechanics) | `assertTeacherSourceClosure` uses TypeScript diagnostics/free-identifier checks and denies imports, dynamic execution, host capabilities, and `Math.random`; targeted tests cover missing identifiers and direct imports. |
| Packet/data API and root wiring | PASS (mechanics) | `emitTeacherFactoryPacket` is exported from the leaf, constructs the strict `FactoryOraclePacket`, binds inherited authority/build/lineage/provider roots, and the test parses the packet through `FactoryOraclePacketSchema`. No candidate or production path is exercised here. |
| Shared strategic core prohibition | PASS in reviewed files | The teacher leaf does not import the tactical selector, scorer, or planner search implementation; only canonical engine and factory/schema seams are imported. Full phase-wide independence remains a later integration concern. |

## Current required actions

1. Enforce `maxNodes` globally across all branches/depths and report actual reached depth in `teacher.ts`.
2. Bind `opponentHypothesis`/`hiddenBranchBias` into deterministic branch generation or ranking so counterfactual alternatives affect teacher selection while remaining teacher-only.
3. Derive both emitted entrypoints from the same tested student controller representation, or add exact correspondence proof that prevents handwritten emitted-policy drift.
4. Resume canonical effects for bounded alternatives with legal Actions/mission choices, and rank branch outcomes using deterministic outcome data rather than event-count bookkeeping.
5. Add an explicit sanitized search-receipt-to-legal-training projection; ensure teacher-only state is stripped before `distillLegalStudent` and test that the projection actually drives student training.

## Scope disposition

These are Plan 03 / ORCL-01 and ORCL-03 readiness gaps. Plan 05 factory ingestion and Plan 07 independent-channel evidence may add integration and cross-channel proofs, but they do not by themselves repair a teacher that lacks bounded search or an emitted policy that differs from its tested student. No actual candidate or empirical claim is made.

_Independent bounded review; no source edits or commit performed._
