---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T10:54:00-04:00
depth: deep
scope: Plan264-07_stable_static_recheck
source_commit: d1cbfa984fd60dc399a4d0fe856a2704448bf1d3
files_reviewed: 11
files_reviewed_list:
  - packages/strategy-oracle-model/src/bundle.ts
  - packages/strategy-oracle-model/src/emit.ts
  - packages/strategy-oracle-model/src/index.ts
  - packages/strategy-oracle-model/src/model.test.ts
  - packages/strategy-lab/src/factory/contracts.ts
  - packages/strategy-lab/src/factory/index.ts
  - packages/strategy-lab/src/factory/contracts.test.ts
  - scripts/ingest-v1-38-factory-packet.ts
  - scripts/ingest-v1-38-factory-packet.test.ts
  - scripts/prepare-v1-38-factory-calibration.ts
  - scripts/prepare-v1-38-factory-calibration.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: relevant_static_scope_resolved
verification:
  - "vitest initial stable scope: 21 passed"
  - "vitest CR-03 repair scope: 15 passed"
  - "vitest final relevant source scope: 38 passed"
---

# Phase 264: Plan 07 Stable Static Recheck

**Current disposition:** Zero relevant Plan07 source findings at `d1cbfa98`; see the final cross-scope disposition below. Earlier findings and test counts are historical snapshots. Plan08 remains unexecuted.

**Scope:** The stable source listed above at `6f338c1243`. The active authoring-command and app-server transport changes were deliberately excluded; this is not a whole-Plan-07 release review.

## Summary

The model packet and ingestion path remain inert data-only code, and `createFreshFactoryCalibrationCells()` does declare twelve slots and 48 fixed cells. However, the callable preparation/CLI route can still publish an arbitrary v1 calibration manifest, the fresh preparer never validates that the named slots contain their prescribed producer/control origins, and successor provenance does not bind raw response semantics to the retained source/usage. A structurally equal V2 provider also falsely becomes an identity-drift block because its unavailable snapshot is compared by object identity.

## Critical Issues

### CR-03A: BLOCKER — The callable calibration CLI still publishes arbitrary v1 manifests

**File:** `scripts/prepare-v1-38-factory-calibration.ts:101-160`

**Issue:** The exported `prepareFactoryCalibration()` and the only CLI entrypoint (line 157) accept `factory-calibration-authorization-v1`, which permits any positive `maxAttempts`, any nonempty workload list, and arbitrary roots. The focused test deliberately publishes a one-workload, 64-invocation v1 manifest (`prepare-v1-38-factory-calibration.test.ts:35-46`). `prepareFreshFactoryCalibration()` is separate and is never called by the CLI. This retains the precise CR-03 bypass: a Plan-07 caller can prepare a manifest without the fixed 12 slots, 48 cells, 256 invocations, or 120000-ms lifetime.

**Fix:** Make the Plan-07 callable/CLI path accept only a new exact rooted authorization produced by `prepareFreshFactoryCalibration()` (or route the CLI directly to that validator). Reject v1 generic authorizations for this route; retain the historical generic preparer only if it is inaccessible to Plan-07 calibration.

### CR-03B: BLOCKER — The fresh 48-cell manifest accepts arbitrary slot producers instead of the frozen source graph

**File:** `scripts/prepare-v1-38-factory-calibration.ts:45-74`

**Issue:** The fresh path verifies only the set of string slot labels and twelve distinct artifact roots (lines 47-53). It reads each ingestion record but never checks its producer, source recipe, base origin, transformation relation, or declared control edge before binding the artifact to S01..S12. The passing fixture demonstrates the bypass by assigning twelve independently emitted tactical packets to every slot, including S03/S04 (teacher) and S05/S06/S11/S12 (model/control) (`prepare-v1-38-factory-calibration.test.ts:51-58`). Therefore an arbitrary private or human-intake source can be mislabeled as a control, defeating the approved frozen 12-slot transformation graph before any workload is run.

**Fix:** Bind each slot to a retained source-materialization/provenance record and validate the expected base producer and exact declared parent/transform relation from the frozen recipe. Reject human/external intake and unrelated producer identities, and add negative tests for S03/S05 substitution and each control lineage mismatch.

### CR-03C: BLOCKER — Opposite initiatives are put in different singleton pair groups

**File:** `scripts/prepare-v1-38-factory-calibration.ts:55-63`

**Issue:** Each cell’s `pairGroup` includes `initialInitiative` (`${slot}-${block}-${initialInitiative}`). The two cells that differ only in candidate/opponent initiative consequently receive separate group names, even though the runner requires the opposite-initiative pair to share one group. Every declared workload is then a singleton rather than the required paired control, so the 48-cell manifest cannot be consumed by the intended paired runner.

**Fix:** Derive `pairGroup` from the common slot and block only, leaving `initialInitiative` as the two-member comparison axis. Add an assertion that every Plan-07 pair group contains exactly candidate and opponent initiative once.

### CR-04A: BLOCKER — V2 rederives raw-record bytes but never binds them to emitted source or actual usage

**File:** `packages/strategy-oracle-model/src/bundle.ts:110-125`

**Issue:** V2 checks the hash of `rawResponseRecord.bodyUtf8`, but it never parses the declared `codex-exec-json` body or compares its returned source and usage to `response.source` and `provenance.actualUsage`. An attacker can replace the raw response with canonical JSON naming a different source/model/usage, rederive `rawResponseRecord.root`, `responseRecordRoot`, and the bundle root, and the bundle is admitted. The current negative test changes bytes while retaining the old root, so it only proves hash checking, not record-to-source/usage provenance.

**Fix:** Strictly decode the allowed raw response schema and require its selected source, requested/reported identifiers, and usage fields to equal the retained bundle fields before root admission. Add a negative test that rederives every affected root after changing the raw response source or usage; it must still fail.

### CR-04B: BLOCKER — Equal V2 unavailable identities are falsely treated as drifted due to snapshot reference comparison

**File:** `packages/strategy-oracle-model/src/bundle.ts:166-180`

**Issue:** `assessFrozenModelIdentity()` compares every top-level provider value with `===`. For V2, `servingSnapshot` is an object, so an independently constructed but structurally identical `{ availability: "unavailable" }` always fails equality and produces a charged `identity_drift` block. This is a false terminal result on the authorized unavailable-snapshot path; it can exhaust the fixed authoring allocation without actual identity drift.

**Fix:** Compare the V2 provider by exact primitive fields plus `servingSnapshot.availability`, or compare canonical domain roots, rather than object reference identity. Add a test that an independently constructed equal V2 provider is available and that an actual primitive/provider change remains a charged drift block.

## Verification

`./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts packages/strategy-lab/src/factory/contracts.test.ts scripts/ingest-v1-38-factory-packet.test.ts scripts/prepare-v1-38-factory-calibration.test.ts`

Result: **4 files passed, 21 tests passed.** The suite does not cover the coherent-root raw-response substitution, V2 structural equality, fresh-slot producer substitution, or the generic CLI path as a Plan-07 bypass.

---

_Reviewer: reused gsd-code-reviewer role; partial stable-source review only._

## Repair Recheck: CR-03 at `9a45f1a7` plus `5966860a`

**Disposition: RESOLVED (static/source scope).** The actual Plan-07 callable and CLI now accept only the exact canonical fresh-input shape; the generic v1 parser is explicitly named `prepareHistoricalFactoryCalibration` and has no CLI route. The fresh path reopens every named ingestion, requires S01/S03/S05 to be the prescribed real producer, and requires every successor to be an exact, re-derived `materializeFactoryCalibrationControl` from its declared S01/S03/S05 parent. Controls are distinguished as `calibration_only`; the runner only permits `real_producer` records on the selected real path, so control descendants are emitted as mechanics-only evidence and cannot become independent-producer evidence.

The fresh workload builder now derives `pairGroup` from slot and block, yielding 24 two-member opposite-initiative groups. The initial S06 opaque-prefix transform had a repeated-prefix non-involution; `5966860a` replaces it with total UTF-16-unit reversal, whose double application is exact for every string, and adds the corresponding source assertion. This remains static source materialization: no generated source was imported, evaluated, or executed.

**Verification:**

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/prepare-v1-38-factory-calibration.test.ts scripts/v1-38-factory-controls.test.ts scripts/ingest-v1-38-factory-packet.test.ts`

Result: **3 files passed, 15 tests passed.**

## Repair Recheck: CR-04 at `4b36e1c0`

**CR-04A, source/usage component: RESOLVED.** V2 now strictly decodes the retained JSONL response and binds its emitted source, model identifier, and token totals to the retained response/source/accounting records before bundle-root admission. Coherent re-rooted source and usage substitutions have negative tests.

**CR-04B: RESOLVED.** `assessFrozenModelIdentity()` now compares canonical provider identity roots, so a separately constructed but structurally identical unavailable V2 provider is available while a primitive drift remains a charged block.

### CR-04C: BLOCKER — Raw protocol provider identity is parsed but not bound

**File:** `packages/strategy-oracle-model/src/bundle.ts:105-113, 199-203` at `4b36e1c0`

`decodeFrozenModelRawResponse()` reads `result.modelProvider` only to check that it is nonempty, then discards it. No retained provenance field or validation comparison binds that raw provider value to `provider.providerId`. Therefore a coherent substitution which changes the JSONL response's `modelProvider`, rederives `rawResponseRecord.root`, `responseRecordRoot`, and the V2 bundle root still admits while the bundle asserts the original provider. This is a remaining provider/model-identity substitution route.

**Required regression:** start from the admitted V2 fixture, replace the id-2 JSONL `modelProvider` with a different nonempty value, rederive the raw-response record and enclosing bundle roots, and assert `admitFrozenModelBundle()` rejects it. Bind the decoded provider directly to an explicitly retained provider identity rather than merely testing its presence.

_Reviewer: reused existing gsd-code-reviewer rubric, not a fresh typed reviewer. This is a read-only repair recheck; CR-01/CR-02 author/transport work remains excluded while edited._

## Final Static Disposition at `4eda4d27`

**CR-04C: RESOLVED.** The strict JSONL decoder now retains `modelProvider` and validation binds it to `provider.providerId`; it also requires the returned read-only sandbox, disabled network, empty instruction sources, and `approvalPolicy: "never"`. The coherent provider-substitution fixture rederives raw-response and bundle roots yet is rejected.

CR-03 remains resolved as described above: only the exact fresh route can create the 48-cell manifest; all nine descendants reopen to their frozen named base materialization; controls remain calibration-only mechanics evidence; and slot/block pair groups produce the required 24 opposite-initiative pairs. The final pure relevant-source suite passed 36 tests. These are static/source dispositions only. They neither authorize nor demonstrate Plan 08 runner authority, numeric assessment, the 90-minute guard, a provider attempt, generated-source execution, guest validation, or a Match.

The separate authoring recheck recorded two CR-01A/CR-02 operational-path findings at the prior `4eda4d27` snapshot; they were outside this packet/calibration static scope and are dispositioned below.

## Final Cross-Scope Source Disposition at `d1cbfa98`

The two authoring findings referenced above are now resolved: the callable launch canonically binds the executable to both retained request and transport, while rooted cleanup records cover observed success and `failed_to_exit`; V2 bundle conversion accepts only an observed successful cleanup. The same six relevant pure/fake-process suites now pass **38 tests**. There are **zero relevant Plan 07 source findings** at this exact tip.

This is not an empirical release determination. Plan 08 still needs its strict V2 runner authority, receipt/source-backed numeric assessment, and 90-minute guard before any actual provider attempt or calibration workload can be authorized.
