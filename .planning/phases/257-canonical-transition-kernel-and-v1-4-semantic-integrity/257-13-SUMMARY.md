---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "13"
subsystem: replay-semantic-integrity
tags: [replay, reconstruction, chronicle, semantic-validation, historical-v1-4]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: candidate transition kernel with exact state and machine evidence
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: transition-stream Chronicle recorder and boundary anchors
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: frozen v1.4 compatibility corpus and executable-reference inventory
provides:
  - Three explicit replay routes for frozen historical v1.4, active old-current, and inactive candidate evidence
  - Candidate-only bounded semantic validation result with exact six-component tuple admission
  - Every-transition reconstruction equivalence without runtime or scheduling authority
  - Exact terminal state, state-hash, outcome, event, snapshot, and no-post-terminal proof
affects: [257-14, 257-15, 257-16, 257-19, replay, persistence, runtime-service]
tech-stack:
  added: []
  patterns: [version-routed validation, recorded-transition reconstruction, bounded system-integrity failure]
key-files:
  created: []
  modified:
    - packages/replay/src/validate.ts
    - packages/replay/src/validate.test.ts
    - packages/replay/src/replay-transition.ts
    - packages/replay/src/replay-transition.test.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/semantic-integrity.test.ts
key-decisions:
  - "Historical v1.4 uses a frozen literal version comparator; active old-current keeps its existing permissive legacy grammar until Plan 19; the inactive candidate uses an exact tuple and current event contract without becoming current or publishable."
  - "Candidate validation owns a bounded CandidateReplaySemanticValidationResult and never casts candidate semantic findings into ChronicleValidationError."
  - "Replay applies only recorded events between recorded before/after projections; it imports no runtime, scheduler, reducer, or next-action authority."
  - "CONTRACTION snapshots retain the established v1.4 omission of outcome while final MATCH_END and TERMINAL evidence remain exact and mandatory."
patterns-established:
  - "Candidate admission: validate route and exact tuple, Chronicle shape/version/event/grammar, initial semantics, every boundary/hash/anchor, reconstruction, then terminal equivalence."
  - "Evidence-chain continuity: recorder boundaries, transition sequence, initial/final projections, flattened public events, and execution result must all agree exactly."
requirements-completed: [KERN-02, KERN-03, KERN-09, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Historical, active old-current, and inactive candidate evidence dispatch to separate explicit validators without relabeling candidate evidence as current.
    requirement: KERN-09
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts#routes exact inactive candidate evidence without making it current or publishable"
        status: pass
      - kind: historical
        ref: "scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Initial, intermediate, and final candidate state, arena, tuple, event, hash, and anchor drift fail closed with bounded system-integrity findings.
    requirement: KERN-03
    verification:
      - kind: unit
        ref: "packages/replay/src/validate.test.ts and packages/replay/src/semantic-integrity.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Every transition reconstructs from recorded events to the exact recorded after-state, and completion requires one final MATCH_ENDED with exact final projection/hash/outcome and no later event.
    requirement: KERN-02
    verification:
      - kind: unit
        ref: "packages/replay/src/replay-transition.test.ts#candidate replay reconstruction equivalence"
        status: pass
    human_judgment: false
  - id: D4
    description: Locked v1.4 full-observation behavior and immutable historical proof remain unchanged.
    requirement: KERN-10
    verification:
      - kind: compatibility
        ref: "packages/engine/src/compatibility-fixtures.test.ts"
        status: pass
    human_judgment: false
duration: 28min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 13: Semantic Replay Validation and Reconstruction Summary

**Replay now validates every candidate semantic boundary and reconstructs exact terminal truth from recorded transitions without becoming a second Match engine.**

## Accomplishments

- Added three explicit replay routes: frozen literal historical v1.4, unchanged active old-current, and the exact inactive v1.37 candidate tuple. Candidate evidence remains `current: false` and `publishable: false`.
- Added a candidate-only bounded result contract whose failures are system-integrity evidence, not player violations and not repurposed current Chronicle errors.
- Validates exact route shape, tuple id plus all six tuple fields, v1.4 Chronicle version material, candidate event vocabulary, grammar, hashes, snapshots, anchors, initial arena/state, every before/after state, transition-chain continuity, execution/recorder agreement, and final outcome.
- Reconstructs each transition from its recorded before-state by applying only its recorded events, then compares the reconstructed board/outcome to the recorded after-state. Replay never imports runtime, scheduling, resolution, or next-action code.
- Requires one final `MATCH_ENDED`, no post-terminal event, exact final full-state projection, exact terminal state hash, exact outcome payload, exact terminal snapshot, and execution-result equality.
- Preserves the v1.4 `activationId` representation and keeps legacy `PUSH_ATTEMPTED` permissiveness only on the explicit historical and staged active-old routes; the candidate route rejects it.

## Task Commits

1. **Task 1 RED: Define candidate semantic replay routes** — `f7ee90d`
2. **Task 1 GREEN: Validate inactive candidate replay semantics** — `0067123`
3. **Task 2 RED: Require candidate reconstruction equivalence** — `c7c35aa`
4. **Task 2 GREEN: Reconstruct every candidate boundary and terminal result** — `f9d6f15`

## Files Modified

- `packages/replay/src/validate.ts` — Explicit route dispatch, literal historical comparator, exact candidate admission, bounded semantic results, and evidence-chain validation.
- `packages/replay/src/validate.test.ts` — One-run/one-record candidate route, all-six-field tuple drift, bounded state rejection, historical tail routing, and active-current regression proof.
- `packages/replay/src/replay-transition.ts` — Recorded-event transition reconstruction and exact terminal equivalence consumer.
- `packages/replay/src/replay-transition.test.ts` — Exact reconstruction, intermediate tamper rejection, and post-terminal rejection.
- `packages/replay/src/reconstruct.ts` — Candidate replay creation after candidate semantic admission, reusing read-only state lookup and iteration.
- `packages/replay/src/semantic-integrity.test.ts` — One-run/one-record invalid-intermediate-state regression.

## Decisions Made

- Candidate routing is checked before generic compatibility resolution so a malformed candidate tuple still receives the candidate-only bounded failure shape rather than a current `ChronicleValidationError`.
- String and metadata ordering use Unicode code-point comparison, matching the recorder and avoiding locale-dependent canonical bytes.
- Full private recorder events are compared to the safe public execution stream through their exact public projection; transition events still equal the execution result exactly. This preserves private evidence ownership without weakening event correspondence.
- Historical and active-old validation retain their existing legacy event tails only on their named routes. Candidate vocabulary is emitted-or-removed strict.
- A `CONTRACTION` snapshot intentionally omits outcome under established v1.4 recording semantics. Candidate validation accepts that omission only for this boundary kind; final `MATCH_END` and `TERMINAL` evidence must carry the exact outcome.

## Deviations from Plan

### Auto-fixed Issues

**1. Candidate failures initially escaped through the generic current error type**

- **Found during:** Task 2 route review
- **Issue:** A candidate profile with tuple drift failed compatibility resolution before reaching the candidate validator, returning the old current Chronicle result shape.
- **Fix:** Dispatch the named candidate profile directly into exact candidate semantic admission and added all-six-field unified-route assertions.
- **Verification:** Candidate tuple drift returns only `CANDIDATE_TUPLE_INVALID`, bounded and system-owned.

**2. Canonical ordering used locale-sensitive and UTF-16 comparisons**

- **Found during:** Task 2 deterministic-byte review
- **Issue:** Metadata and projected ids did not use the recorder's language-neutral code-point comparator.
- **Fix:** Reused the recorder's Unicode code-point ordering semantics for projected players, Soldiers, and bounded metadata.
- **Verification:** Replay typecheck, focused semantic suite, and full replay suite pass.

**3. Established Contraction snapshots omit outcome**

- **Found during:** Boundary-anchor review
- **Issue:** A blanket snapshot/outcome equality rule would reject a valid Match that becomes terminal during Contraction because the established Contraction snapshot intentionally omits outcome before terminal snapshots.
- **Fix:** Preserve the omission only for `CONTRACTION`; require exact outcome everywhere it is canonically recorded and at both terminal snapshots.
- **Verification:** Snapshot/current regressions and exact terminal reconstruction pass with no v1.4 fixture delta.

---

**Total deviations:** 3 auto-fixed correctness issues
**Impact on plan:** All changes tighten deterministic candidate admission or preserve established v1.4 evidence; none changes gameplay, activates the candidate, or grants replay scheduling authority.

## Issues Encountered

- A concurrent Plan-18 caller migration completed before the final inventory run, so `--replay-core-ready` correctly reports **36 exact references**, not the Plan-13 preflight estimate of 52. The mode passes, all Plan-13-owned builder references are gone, and the additional reduction belongs to the already-committed Plan-18 migration.
- The post-implementation integrity review briefly made the locked compatibility corpus fail by applying arena-derivation checks to immutable isolated v1.4 Activation fixtures. Follow-up commit `065a811` narrowly preserved only those non-counted historical fixture derivation diagnostics while keeping the strict canonical validator and hostile-state rejection intact. The locked 20-fixture bytes and hashes remain unchanged; no compatibility ruling or golden update was needed.
- Recorder-integrity hardening landed concurrently in `cb0b934` and final failure/coordinate binding review landed in `97d6356`. Plan 13 was rerun after both settled commits, including typecheck, the full replay suite, and the compatibility corpus.

## Verification

- Candidate semantic/reconstruction focus: **46/46 passed**.
- Terminal/reconstruction/historical focus: **5/5 passed** with 40 unrelated tests skipped.
- Full replay package: **152/152 passed** across 13 files after final recorder review.
- Locked v1.4 compatibility corpus: **14/14 passed**; fixture bytes/hashes unchanged.
- v1.36 historical proof: passed with **8 artifacts and 11 sources**.
- Replay TypeScript project build: passed.
- Replay-core executable inventory: passed with **36 exact references and 13 non-executable mentions** after the already-completed Plan-18 migration.
- Targeted ESLint, Prettier, forbidden runtime/scheduler import scan, and `git diff --check`: passed.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff remains `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff remains `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
- Neither protected file, `STATE.md`, nor `ROADMAP.md` was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Plan 14 can migrate the remaining general replay fixtures to the one-run/one-record candidate route using this semantic admission and reconstruction contract.
- Plans 15 and 16 can require the same exact candidate validation at runtime-service and persistence boundaries.
- Plan 19 remains the sole owner of making the candidate tuple current and removing the staged active-old replay/builder definitions. This plan does not activate or publish it.

## Self-Check: PASSED

- All six planned replay files and all four task commits exist.
- Candidate, active-old, and historical routes are explicit and tested.
- Replay imports no runtime, scheduler, resolver, or next-action authority.
- Full replay, compatibility, historical, inventory, typecheck, lint, format, and protected-byte gates pass.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
