---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-03-teacher-readiness
checked: 2026-09-14
status: passed
targeted_test: 7/7 passed
recheck: 2026-09-14
repaired_source_commit: 961d3e07
resolved_gaps: 7
open_gaps: 0
---

# Phase 264 Teacher Readiness Check

This is a bounded source/mechanics review, not candidate, empirical, Match, runtime, or certification evidence. No generated source was executed.

## Re-check after `961d3e07` / review fix `f27230e1`

The focused test passed 7/7. The six authoritative findings in `264-TEACHER-CODE-REVIEW.md` are closed at the source/mechanics boundary; no generated source was executed and no empirical claim is made.

| Check | Result | Evidence |
|---|---|---|
| Canonical frontier/depth search and global cap | PASS (mechanics) | `teacher.ts` charges machine creation, every advance, and every `runtime_resume` through one `nodesVisited` counter. Branch depth increments only on student decisions; terminal and low-budget paths report actual depth/alternatives. The focused test covers `maxNodes: 2`, `maxDepth: 6`, and early terminal work. |
| Counterfactual state affects teacher ranking | PASS (mechanics) | Cautious/aggressive opponent policies are selected separately from candidate templates and alter canonical branch state roots, outcome roots, and work counts in the focused paired test. |
| Canonical branch exploration reaches scored outcomes | PASS (mechanics) | Each candidate mission/Action is schema-valid, resumed through `MATCH_KERNEL`, and advanced/resumed through bounded depth. Scores use canonical outcome and Soldier state consequences, not event counts or arbitrary hypothesis bonuses. `runtime_resume` applies the selected action before the returned machine is scored. |
| Teacher search is connected to distillation | PASS (mechanics) | `projectTeacherSearchToLegalTraining` accepts the exact receipt shape, strips receipt scores/state to selected schema-admitted legal input/target records, and those records feed `distillLegalStudent` and packet emission. |
| Legal-schema student boundary and unseen legal inputs | PASS (mechanics) | Exact Strategy/Brain schemas, Action schemas, bounded feature policies, deep freezing, and paired unseen legal inputs are covered by the focused test. Teacher-only fields and unknown record kinds are rejected. |
| Same tested representation in both emitted entrypoints | PASS (mechanics) | `controller.ts` owns both entrypoints; trusted wrappers and `emitTeacherSource` call those same named controller functions. The controller manifest hashes the owned bytes, requires both entrypoints, and the test detects changed bytes for either function. |
| Source/packet roots and strict closure | PASS (mechanics) | Closure checks require one default object with two locally callable methods, reject imports/free identifiers/async/this and nonnumeric computed access, embed the controller manifest, and validate the rooted factory packet. |
| Teacher/opponent/host data leakage | PASS (mechanics) | Emitted source contains only bounded distilled feature policy/controller data and legal observation processing; no counterfactual/opponent/search state or host/evaluator data is embedded. Source remains unexecuted. |

The distilled brain intentionally reduces teacher Action directions to legal feature-conditioned modes; the student recomputes a direction from its legal observation rather than memorizing a privileged or opaque target. This is a bounded representation choice, not a disconnected search path, and its gameplay quality remains unclaimed.

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

## Historical required actions (resolved by the repaired source)

1. Enforce `maxNodes` globally across all branches/depths and report actual reached depth in `teacher.ts`.
2. Bind `opponentHypothesis`/`hiddenBranchBias` into deterministic branch generation or ranking so counterfactual alternatives affect teacher selection while remaining teacher-only.
3. Derive both emitted entrypoints from the same tested student controller representation, or add exact correspondence proof that prevents handwritten emitted-policy drift.
4. Resume canonical effects for bounded alternatives with legal Actions/mission choices, and rank branch outcomes using deterministic outcome data rather than event-count bookkeeping.
5. Add an explicit sanitized search-receipt-to-legal-training projection; ensure teacher-only state is stripped before `distillLegalStudent` and test that the projection actually drives student training.

## Scope disposition

The Plan 03 / ORCL-01 and ORCL-03 source/mechanics checks pass after the repaired source review. Plan 05 factory ingestion and Plan 07 independent-channel evidence may add integration and cross-channel proofs, but this report makes no actual candidate, empirical, provider, gameplay, or certification claim.

_Independent bounded review; no source edits or commit performed._
