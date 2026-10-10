# Two-Match supplement independent plan check v1

## ISSUES FOUND

Scope: existing Plan16 two-Match feasibility supplement only, not complete Phase265/LEAG. Independent static check; no application, compile, test, prepare, allocation, capacity observation, provider, Strategy, Match, empirical reader or historical materialization ran. Only this fresh report is owned/changed. Commands closed; ownership released on delivery.

Result: **1 BLOCKER**, no additional warning. Three serial tasks/six source-test paths are proportionate. No broader league-coverage requirement is imposed on this explicitly partial approved supplement.

## BLOCKER — retained replay producer/reader contract is not implementation-ready

Task2 promises a read-only verifier that uses existing pure reconstruction APIs, but specifies only bounded redacted `replayFrames` plus compact roots and unspecified “evidence sufficient for integrity verification.” The actual native `runLeanBaselineMatch` stream (`scripts/lib/v1-38-lean-baseline-match.ts`, replayFrames near187) emits recursively redacted final-state and transitions only. `compactExecution` retains roots/counts, not reconstruction material.

The actual API `validateCurrentReplayReconstruction` (`packages/replay/src/reconstruct.ts:618`) requires a `Chronicle` and completed `ChronicleRecorderExecution`; its implementation requires `recorderMaterial.boundaries` equal to transitions, `recorderMaterial.finalState`, complete before/after states whose hashes are recomputed, and semantic admission. Candidate reconstruction additionally requires candidate Match/reproducibility authority. Simply stripping source/memory/objective/input/output fields from native transitions and retaining producer-computed roots does not specify a valid input to these APIs. Roots alone cannot reconstruct missing material, and the reader must not recreate it by engine/Strategy execution.

Fix within existing ownership: name the exact pure reconstruction API and define the exact bounded privacy-safe retained schema and producer→reader transformation it consumes, including Chronicle/recorder/semantic authority material if that API requires it. Explain which fields may be projected and how their integrity remains independently checked; do not retain forbidden raw private payloads or widen execution scope. Add an inert connected positive producer→retained-reader fixture plus missing/redacted-field and valid-recomputed-root tamper rejection. If full-state reconstruction is incompatible with the approved privacy projection, specify a compatible existing public/replay reconstruction path and narrowly qualify what it proves; do not claim full execution reconstruction from roots alone.

```yaml
issues:
  - plan: "265-16-two-match-private-feasibility-v1"
    dimension: cross_plan_data_contracts
    severity: BLOCKER
    task: 2
    description: "Retained redacted replay frames have no specified compatible transformation to the required existing pure replay reconstruction API input. Independent integrity verification cannot be implemented as written without inventing a contract or retaining prohibited fields."
    fix_hint: "Specify exact API, bounded privacy-safe retained material and producer-reader mapping; require connected positive reconstruction and missing-field/recomputed-root tamper fixtures inside existing six source/test paths."
```

## Checks that passed

- Approval/STATE authority: fresh22:06:36UTC..00:06:36UTC; paired frontier23:15:36UTC; carry322054903/cap329254903;31-minute reserve plus two600000ms ceilings. All work counts; forty historical charges and failed/successful non-Match costs remain immutable, unknown historical peaks remain unknown.
- At most two fixed tactical-0/cold-opponent slots, Smoke/base seed fixed, seats reversed, absolute bottom initiative; no standalone probes/retries/third Match/source generation/training/formation/holdout/public/counting/production.
- Dedicated HOST runner, separate exact-key prospective allocation/capacity/admission/debit/seat APIs; actual existing `issued` WeakMap and ordered V8 claims reused. No fake legacy ledger/attempt5/scalar capacity/callable issuer override; legacy probe/baseline/default/window bodies explicitly preserved.
- Actual `runLeanBaselineMatch` signature requires legacy ledger/charge/slot; plan correctly proposes a private shared composer and new opaque wrapper rather than passing the new allocation to that signature. `compactExecution(actual, elapsed, cleanup, bottom, undefined, guard)` is supported; no legacy allocation coercion planned.
- Source-root discovery is bounded metadata-only and explicitly excludes compiler-invoking `readLeanBaselineSource`; full roots cannot be guessed. Later prepare validates source closure only after source gates.
- Debit is durable before both providers; source/HEAD held through one ROOT entry/terminal and one independent O_RDONLY reader. Second slot denied after failure/unknown cleanup/cap; partial evidence stays failed, no retry.
- Task fields, serial dependency order, automated commands and six-path ownership are explicit. Strict diagnostics baseline/final identity comparison, zero new owned diagnostics, focused installed tests/types/boundary check and independent review/source verification precede prepare. Inherited strict/cleanup/global coverage gaps remain unwaived.
- Requirements frontmatter claims safety prerequisites only: the explicit coverage table leaves every LEAG requirement, baseline/freeze/Phase265 incomplete. Not phase-completion verification.
- AGENTS deterministic engine, supervised hostile-source execution, canonical terminology and privacy constraints preserved. Pure reconstruction and canonical start/bounds are requested; no UI/public route exists in this scope.
- PATTERNS shared canonical roots, publish-once/charge-before-work, supervised full kernel and private data-only reopening apply and are represented. Its original league-file classification does not map these six supplement files.
- Architectural tier map: SKIPPED for the supplied supplement research (no responsibility map). Nyquist: all three tasks have automated commands; phase VALIDATION exists; supplied supplement research has no Validation Architecture, so formal phase Nyquist table not applicable. No unresolved Open Questions section.

Recommendation: revise only Task2's replay evidence contract before source execution; preserve all budgets and gates. This finding does not authorize another reader, runtime probe, Match or expanded framework.

Memory quick-pass used only to preserve partial/inconclusive experimental scope; all current authority claims above were checked against supplied approval/STATE/plan/source.

<oai-mem-citation>
<citation_entries>
MEMORY.md:92-95|note=[keep scoped experimental planning distinct from unadopted reset]
</citation_entries>
<rollout_ids>
01a05548-40a1-7b32-b84e-39b15d18c048
</rollout_ids>
</oai-mem-citation>
