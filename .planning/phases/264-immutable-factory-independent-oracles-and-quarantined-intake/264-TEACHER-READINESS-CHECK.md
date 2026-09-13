---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-03-teacher-readiness
checked: 2026-09-13
status: gaps_found
targeted_test: 3/3 passed
---

# Phase 264 Teacher Readiness Check

This is a bounded source/mechanics review, not candidate, empirical, Match, runtime, or certification evidence. No generated source was executed.

## Evidence checked

- `packages/strategy-oracle-teacher/src/teacher.ts`
- `packages/strategy-oracle-teacher/src/distill.ts`
- `packages/strategy-oracle-teacher/src/emit.ts`
- `packages/strategy-oracle-teacher/src/index.ts`
- `packages/strategy-oracle-teacher/src/teacher.test.ts`
- Plan/context requirements for D-03, D-14, D-16, D-18, and D-19

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` — **3 tests passed**.

## Scientist-critical checks

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

## Required actions

1. Replace the one-transition parity heuristic in `teacher.ts` with an explicit bounded counterfactual search state/frontier that evaluates alternatives through `MATCH_KERNEL` only, with deterministic limits and a receipt that records the bounded search outcome.
2. Make emitted `selectActivations` consume the same compiled legal-observation/objective/memory policy representation as the trusted chooser, or narrow/redefine the student contract and test it explicitly. Do not leave a fixed sorted-prefix surrogate under the current “same student” claim.
3. Add a paired regression proving the emitted source representation and trusted chooser agree for both `selectActivations` and `soldierBrain`, while keeping generated source unexecuted in this package.

## Scope disposition

These are Plan 03 / ORCL-01 and ORCL-03 readiness gaps. Plan 05 factory ingestion and Plan 07 independent-channel evidence may add integration and cross-channel proofs, but they do not by themselves repair a teacher that lacks bounded search or an emitted policy that differs from its tested student. No actual candidate or empirical claim is made.

_Independent bounded review; no source edits or commit performed._
