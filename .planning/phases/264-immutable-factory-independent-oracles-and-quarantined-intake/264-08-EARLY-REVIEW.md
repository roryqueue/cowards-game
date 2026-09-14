---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T12:09:00-04:00
depth: bounded
scope: Plan264-08_numeric_and_fresh-evidence_helpers
source_commit: a9b01570
reviewer_role: reused-existing-gsd-code-reviewer-not-fresh-typed-reviewer
files_reviewed:
  - packages/strategy-lab/src/factory/numeric-calibration.ts
  - packages/strategy-lab/src/factory/numeric-calibration.test.ts
  - scripts/v1-38-factory-fresh-evidence.ts
  - scripts/v1-38-factory-fresh-evidence.test.ts
  - scripts/prepare-v1-38-factory-calibration.ts
  - scripts/prepare-v1-38-factory-calibration.test.ts
  - scripts/v1-38-factory-allocation.ts
  - scripts/v1-38-factory-observations.ts
  - scripts/v1-38-factory-observations.test.ts
  - scripts/v1-38-factory-execution-evidence.ts
  - scripts/v1-38-factory-execution-evidence.test.ts
  - scripts/v1-38-factory-source-audit.ts
  - scripts/v1-38-factory-source-audit.test.ts
  - scripts/author-v1-38-factory-model-source.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/assess-v1-38-factory-independence.test.ts
  - scripts/v1-38-factory-implementation.ts
  - scripts/v1-38-factory-allocation.ts
  - scripts/check-v1-38-factory-boundaries.ts
  - scripts/check-v1-38-lab-boundaries.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
verification:
  - "vitest focused helper/preparation scope: 12 passed"
  - "vitest observation plus numeric comparator scope: 12 passed"
  - "vitest evidence, source-audit, and fake authoring scope: 14 passed"
---

# Phase 264 Plan 08: Early Helper Review

## Scope and Result

No concrete finding in the committed helper scope at `adaafa04`.

`numeric-calibration.ts` derives six bounded scores from parsed source structure, concrete graph edges, and matched sample content; it does not score roots. Empty edges and unmatched sample keys are non-informative. The fixed six-control table requires three informative dimensions, freezes positive floors and the 0.05 separation policy, requires exactly the three positive controls and latent divergence classifications, and retains both named borderlines as unresolved.

`readFreshFactoryCalibration()` canonically reopens the exact 12 ingestions and 48 fixed source cells, validates the three named bases and nine calibration-only descendants, and reconstructs each workload under the frozen 256-invocation/120000-ms limits. `remainingFreshWorkloadLifetime()` caps the finite 90-minute wall-clock envelope while reserving cleanup time; it cannot extend the per-workload cap.

## Verification

`./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/numeric-calibration.test.ts scripts/v1-38-factory-fresh-evidence.test.ts scripts/prepare-v1-38-factory-calibration.test.ts`

Result: **3 files passed, 12 tests passed.** No live authentication, provider/model operation, search, runtime execution, guest, or Match was run.

## Deliberate Exclusions

The runner/readiness and D-19 assessment are still being implemented and were not reviewed. Their absence is not a finding in this early helper review. This report does not authorize authoring, workload execution, empirical readiness, or any Plan 08 release claim.

_Reviewer: reused existing reviewer rubric; this is a bounded read-only early source review, not a fresh typed reviewer or an empirical approval._

## Observation Helper Recheck at `a859ec36`

### O1: BLOCKER — Slot-specific sample keys make every cross-slot behavioral comparison noninformative

**File:** `scripts/v1-38-factory-observations.ts:73,87-89`

All legal-input, Chronicle, and matchup keys begin with `input.cell.key`. The numeric comparator intersects sample keys exactly, while every labeled control compares different slots (for example, S01/S02). Therefore these three dimensions never have matching samples across control operands and are vacuous despite records being retained. The adapter must derive a slot-independent condition/sample key itself (block, declared condition, method/trace ordinal, and paired initiative axis), rather than relying on a caller to happen to provide the same cell key.

### O2: BLOCKER — Top-side coordinate normalization is not the canonical board mirror

**File:** `scripts/v1-38-factory-observations.ts:38`

For a top candidate, `x` and `y` become `-value`. The fixed board coordinates are 0..11, and the existing S06 reversible geometry transform uses `11 - value`; negation does not make bottom/top-equivalent positions compare equal. Normalize both coordinate axes with the board mirror and add a bottom/top-equivalent projection regression.

### O3: BLOCKER — A TURN_TO_STONE decision is mislabeled as an observed non-STONE-to-STONE transition

**File:** `scripts/v1-38-factory-observations.ts:81-82`

`nonStoneToStoneCount` increments whenever a soldierBrain projection returns `TURN_TO_STONE` while the request self status is not STONE. It does not inspect a retained Chronicle event or successor state, so it records an action decision rather than a state transition. This conflates S07's required reachable x=2 action override with S08's separate actual non-STONE-to-STONE observation. Retain a distinct decision count; derive a transition count only by correlating an eligible non-STONE trace to `SOLDIER_STONED.payload.soldierId` in retained event/state evidence.

### Privacy projection requirement for the repair

The actual stored trace shape is limited to `method`, `ordinal`, `classification`, `requestProjection`, and `decisionProjection`. soldierBrain projections expose `self`, `awarenessGrid`, cycle fields, and `hasAdvancedThisActivation`; its decision projection exposes `action`. Stored Chronicle records use `TransitionEventSummary { type, sequence, payload, context?, privacy?, privatePayload? }`; `SOLDIER_STONED` carries `payload.soldierId` and optional `payload.reason`.

Do not recursively tokenize arbitrary retained record values under a blacklist. Use an explicit whitelist of these privacy-safe projection fields and of needed public Chronicle fields; omit `privatePayload` and every unrecognized field/value. This avoids admitting a future private field whose name does not match the current blacklist.

**Focused verification:**

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/v1-38-factory-observations.test.ts packages/strategy-lab/src/factory/numeric-calibration.test.ts`

Result: **2 files passed, 9 tests passed**, but the passing fixtures do not exercise cross-slot key intersection, mirrored geometry, or action-versus-state ground truth.

## Observation Repair Recheck at `0932d615`

**O1: RESOLVED.** Legal-input, Chronicle, and matchup keys now derive from the declared common `block:initialInitiative` condition and retained method/record ordinal, rather than the slot-specific cell key. The cross-slot S01/S02 regression yields informative score 1 in all three dynamic dimensions.

**O2: RESOLVED.** Top absolute coordinates now mirror the fixed 0..11 board as `11 - coordinate`; directional deltas negate independently. The targeted top projection regression observes `position.x=9` for the mirrored test input.

**O3: RESOLVED.** The helper now retains `nonStoneToStoneDecisionCount` separately from `nonStoneToStoneCount`. The latter requires a retained `result-event` whose type is `SOLDIER_STONED` and whose `payload.soldierId` matches a non-STONE soldierBrain trace. This supports actual transition evidence without relabeling the S07 x=2 action override as a state transition.

The explicit field allowlist remains in place; unknown values are omitted by regression. Focused verification reran `scripts/v1-38-factory-observations.test.ts` plus the numeric comparator: **2 files passed, 12 tests passed.**

## Execution-Evidence and Source-Audit Review at `ee71a6ad`

### EE-01: BLOCKER — Earlier charged authoring attempts are not held to the frozen isolation contract

**File:** `scripts/v1-38-factory-execution-evidence.ts:105-110`

`verifyFactoryAuthoringRecords()` reopens the raw JSONL for every charged attempt, but it only checks an `id=2` model/provider and token usage before accepting an earlier `invalid` attempt. It does not require that attempt's returned `thread/start` record to retain `approvalPolicy: "never"`, a `readOnly` sandbox with `networkAccess: false`, empty `instructionSources`, or the isolated packet-only cwd. The V2 frozen-bundle decoder does require those fields, but only for the last, valid winner. A retry can therefore spend charged model tokens with tools, network, inherited instructions, or a repository cwd and still be included as a valid execution-evidence chain.

**Fix:** Reuse the exact thread-start protocol decoder for *each* retained raw JSONL response; compare the returned model/provider, policy, sandbox, instruction sources, and canonical isolated cwd with the corresponding retained request. Retain an exact/re-rootable cwd binding rather than only `cwdClass`. Add a two-attempt fake-record regression where an invalid first response changes each of those fields and the valid winner remains canonical; reopening must reject the chain before it can count.

### EE-02: WARNING — The aggregate reader has no positive retained-evidence fixture

**Files:** `scripts/v1-38-factory-execution-evidence.test.ts:1-24`, `scripts/v1-38-factory-execution-evidence.ts:45-81`

The focused tests cover negative admission witness derivation, shared-source clone counting, and attempt-count rejection, but never call `readFactoryExecutionEvidence()` with a complete canonical retained manifest/review/teacher/training/audit/witness chain. The reader has several independently rerooted joins; without one fixture it is not demonstrated that legitimate data can pass, nor that a tampered review commit, outcome root, selected outcome, training record, audit root, or negative witness root fails at the intended join.

**Fix:** Add one data-only, fake retained full-chain fixture (no provider, runtime, guest, or Match) and negative re-root tests for each major join. It should verify only source-level mechanics, not claim empirical approval.

### Positive bounded observations

The negative witness is rooted from the actual packet/source binding and mutates bytes only; it does not execute emitted source. The source audit retains only roots, counts, normalized structural bodies, and a candid `syntactic-clone-screen-not-semantic-proof` limitation; it does not publish source text. The model-author fake raw-record integration exercises the winning V2 raw request/response/usage binding. These properties remain useful but do not remedy EE-01.

**Focused verification:**

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-source-audit.test.ts scripts/author-v1-38-factory-model-source.test.ts`

Result: **3 files passed, 14 tests passed.** This used fake local process data only; no live handshake, inference, guest, runtime, Match, or generated source execution occurred.

## Assessor Early Source Review at `ef66bd00`

### AS-01: BLOCKER — Actual workload completion can exceed its retained 120-second cap and still affirm

**File:** `scripts/assess-v1-38-factory-independence.ts:116-118`

The assessor checks only that completion is not before the start and that it is no more than 90 minutes after the first start. It never requires `actualUsage.completedAtMs - startedAtMs <= accounting.maxLifetimeMs`. A completed cell may therefore run for 120001 ms (or longer, while still inside the aggregate window), contribute its traces to numeric controls, and allow an affirmative result despite the frozen per-workload ceiling.

**Fix:** Before reading observations, reject or add an unresolved failure reason when the actual elapsed duration exceeds the exact retained `accounting.maxLifetimeMs` (and keep the existing aggregate-window check). Add a retained-record tamper regression with a 120001-ms completed cell.

### AS-02: BLOCKER — Total observed invocations are not bounded by the fixed 256-invocation cap

**File:** `scripts/assess-v1-38-factory-independence.ts:114-120`

`usage.totalInvocations` is checked against the number of accounting records, and candidate traces are capped at 256, but the total accounting-record count itself is never required to be at most `accounting.maxInvocations`. Extra non-trace invocations can consequently be retained, included in a completed workload, and still leave a candidate eligible for threshold fitting.

**Fix:** Require `usage.totalInvocations <= accounting.maxInvocations` (which is already pinned to 256 at line 91) before using the cell. Add a 257-total-invocation regression, including the case where traces remain at or below 256.

### AS-03: BLOCKER — Passed review commit is not bound to the implementation bytes that can affirm

**Files:** `scripts/assess-v1-38-factory-independence.ts:69-70,180,191`; `scripts/v1-38-factory-execution-evidence.ts:45-55`

The assessment records a useful current-filesystem `implementationRoot`, but the execution evidence accepts a passed source-review record only by its source-commit string and report text. No assertion connects that reviewed artifact to the implementation bytes used to produce the threshold and assessment. A changed assessor, observations helper, audit helper, or numeric comparator can therefore run after review and publish a self-consistent new assessment with an old passed review artifact. A later reopen detects a subsequent byte change, but the initial unreviewed run is not rejected.

**Fix:** Retain an exact reviewed-implementation root/manifest in the passed review artifact and require it to equal the assessor's derived `implementationRoot` before threshold publication or affirmation. Add a regression changing one reviewed implementation byte while keeping all prior retained roots, and require rejection or unresolved disposition.

### Bounded positive observations

The assessor does conservatively keep missing/failed cells, pair failures, missing candidate publications, bad ground-truth predicates, threshold-fit failures, and detected clone sharing unresolved. It computes all numeric values from parsed source and retained supervision records; it does not execute emitted source, call a provider, open a guest, or claim competitive authority.

The existing two pure decision tests exercise only the final decision helper. They do not cover the retained ledger/receipt/clock paths above; the owner is adding those data-only integration regressions separately. This is an early source review, not a Plan 08 completion or empirical release decision.

## Repair Recheck at `a9b01570`

**EE-01: RESOLVED.** `decodeChargedAuthorTranscript()` now reopens *every* charged attempt's JSONL `thread/start` and turn sequence, requiring the attempt-specific absolute cwd, `approvalPolicy: "never"`, `readOnly`/network-disabled sandbox, empty instruction sources, exact model/provider, exact disabled-feature argv, and token usage. The new policy root preserves packet/model/settings/context/recipes and launch policy across corrections while intentionally allowing fresh isolated cwd and state paths; each raw transcript remains bound to its own retained request. The added fake two-attempt route supplies a concrete correction-path regression.

**EE-02: RESOLVED.** The committed execution-evidence fixture and rerooted-join tests now exercise a complete retained private chain rather than only individual witness helpers. It remains source/data-only and does not execute generated source or call a provider.

**AS-01 and AS-02: RESOLVED.** `factoryWorkloadResourceViolations()` rejects invalid numeric measurements, actual elapsed time above the retained `maxLifetimeMs`, and total accounting invocations above the pinned 256 cap before those records can contribute observations or threshold fitting. The resource-cap regressions are data-only retained-record checks.

**AS-03: STILL BLOCKING — Reviewed implementation inventory is incomplete.** `scripts/v1-38-factory-implementation.ts:5-19` adds a fixed reviewed-byte inventory and `readFactoryExecutionEvidence()` now compares the retained review root to it, which is the correct repair direction. However, the inventory omits direct semantic dependencies used by the assessor: at minimum `packages/strategy-lab/src/factory/ledger.ts` and `packages/strategy-lab/src/factory/contracts.ts` (assessor imports at lines 9-10). A change to either can alter start/terminal validation or candidate admission while `factoryAssessmentImplementationRoot()` stays equal to the passed review artifact. Include every direct decision dependency (and the fixed required dependency closure, including `identity.ts` where its root construction is consumed) in this reviewed inventory, then add a byte-mutation rejection regression for an omitted dependency.

### Narrow parser allowance recheck

`check-v1-38-factory-boundaries.ts:16,140-145,192-197` and the shared legacy pass allow unresolved `typescript` only for the exact reviewed `packages/strategy-lab/src/factory/numeric-calibration.ts` / `fingerprint.ts` parser collectors (plus the existing emitter paths). The factory-boundary regression rejects an arbitrary factory TypeScript consumer. This is a narrow inert AST-parser allowance, not a general factory/oracle dependency exception, and no existing strategic boundary was relaxed.

### Verification note

I ran the focused fake-only review suite. The active, uncommitted full-retained assessor test failed/ran beyond the 30-second tool yield at `scripts/assess-v1-38-factory-independence.test.ts` (test: `reopens a full source-bound but unrun allocation as unresolved, without inventing cells`), so I do not record a clean combined test result for this recheck. The implementation owner was notified; this active test result is not itself classified as a committed-source finding.
