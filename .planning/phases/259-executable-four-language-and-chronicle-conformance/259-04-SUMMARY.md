---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "04"
subsystem: conformance-trace-governance
tags: [conformance, candidate-generation, semantic-diff, compatibility, golden]

requires:
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "01"
    provides: Immutable reviewed v1.37 corpus identity and mandatory case inventory
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "02"
    provides: Canonical kernel recording contract and deterministic transition roots
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "03"
    provides: Language-neutral full-trace projector, roots, and restricted comparator
provides:
  - Candidate-only exact trace generation from canonical kernel recordings
  - Read-only candidate and semantic-diff integrity checking
  - Independent protected-category review with fail-closed compatibility status
affects: [259-27, language-runners, lane-certification, conformance-promotion]

tech-stack:
  added: []
  patterns:
    - New-version candidate directories with active-golden path refusal
    - Independent review that recomputes roots rather than accepting generator disposition
    - Zero protected delta permits continuation while any protected delta suspends

key-files:
  created:
    - scripts/generate-v1-37-conformance-traces.ts
    - scripts/generate-v1-37-conformance-traces.test.ts
    - scripts/check-v1-37-conformance-traces.ts
    - scripts/check-v1-37-conformance-traces.test.ts
    - scripts/review-v1-37-conformance-trace-diff.ts
    - scripts/review-v1-37-conformance-trace-diff.test.ts
    - .planning/artifacts/v1.37-conformance-trace-independent-review.json
  modified: []

key-decisions:
  - "Candidate traces are projected from the canonical kernel/recorder contract and never from a live language-lane oracle."
  - "The generator cannot classify its own output; a separate reviewer independently recomputes candidate, diff, trace, and protected-category roots."
  - "Only exact zero change across all seven protected v1.4 categories yields `no_semantic_delta`; every nonzero change yields `suspended_pending_approval`."
  - "Active golden fixtures, the registry, and Plan 27 promotion authority remain untouched."

patterns-established:
  - "D-03 immutable promotion input: every expected-trace candidate has a new version, persisted semantic diff, and reproducible exact bytes."
  - "D-05 non-oracular generation: reviewed expectations derive from the transition authority and recorder, not a counted runtime lane."
  - "Compatibility stop: state, legality, event order, outcome, terminal, Strategy-observation, or historical deltas cannot be normalized as expected."

requirements-completed: [CONF-02, CONF-03]

coverage:
  - id: D1
    description: "Candidate generation is exact, reproducible, versioned, kernel-recorded, and unable to overwrite active golden bytes."
    requirement: CONF-02
    verification:
      - kind: integration
        ref: "scripts/generate-v1-37-conformance-traces.test.ts"
        status: pass
      - kind: integration
        ref: "scripts/check-v1-37-conformance-traces.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "The independent reviewer rejects self-approval and suspends every protected v1.4 semantic delta."
    requirement: CONF-03
    verification:
      - kind: integration
        ref: "scripts/review-v1-37-conformance-trace-diff.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The persisted 16-case review independently proves zero change across all protected categories."
    requirement: CONF-03
    verification:
      - kind: other
        ref: ".planning/artifacts/v1.37-conformance-trace-independent-review.json#status=no_semantic_delta"
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 04: Trace Candidate Review Summary

**Canonical kernel recordings now produce immutable versioned trace candidates with a persisted restricted diff and an independent fail-closed v1.4 compatibility review.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-07-16T15:07:23Z
- **Completed:** 2026-07-16T15:28:46Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added exact 16-case candidate generation into a caller-specified new review directory, with refusal of active fixture paths, reused versions, existing destinations, changed corpus identity, and live-lane oracle arguments.
- Added a read-only checker that validates exact manifest, case ordering, case roots, corpus/semantic identity, and persisted semantic-diff evidence without an update or promotion path.
- Added a separate reviewer that independently recomputes all roots and admits only `no_semantic_delta` or `suspended_pending_approval`.
- Persisted a `no_semantic_delta` review: all seven protected categories have zero changes, with candidate root `sha256:e22fc0cf69acedc35723e1253c060332e389b3e4993c3fc2a87cf904a1e5f50f`.
- Proved reproducibility across two independent review directories while leaving active v1.37 golden fixtures byte-unchanged.

## Task Commits

1. **RED: Specify trace candidate review gates** — `e5418af` (test)
2. **GREEN: Generate and check trace candidates** — `ae5f2ca` (feat)
3. **GREEN: Independently review trace semantics** — `fcccd95` (feat)
4. **Hardening: Bound deterministic trace review execution** — `016c93b` (fix)

## Files Created/Modified

- `scripts/generate-v1-37-conformance-traces.ts` — Generates new exact candidates from canonical kernel recordings.
- `scripts/generate-v1-37-conformance-traces.test.ts` — Covers exact generation, refusal boundaries, and corpus binding.
- `scripts/check-v1-37-conformance-traces.ts` — Performs read-only candidate and diff integrity checks.
- `scripts/check-v1-37-conformance-traces.test.ts` — Covers missing, extra, reordered, substituted, and mutated evidence.
- `scripts/review-v1-37-conformance-trace-diff.ts` — Independently recomputes roots and protected-category dispositions.
- `scripts/review-v1-37-conformance-trace-diff.test.ts` — Covers checker independence, self-approval rejection, and all protected deltas.
- `.planning/artifacts/v1.37-conformance-trace-independent-review.json` — Persists exact review identity and zero-delta status.
- `259-04-SUMMARY.md` — Records execution, proof, and Plan 27 handoff.

## Decisions Made

- Candidate generation uses the canonical engine transition kernel, replay recorder, and Plan 03 projector. It has no runtime-lane oracle input.
- A single canonical Match recording may be reprojected for each corpus case because the reviewed distinction is the exact invocation-owned case envelope; this preserves deterministic per-case identity without repeating equivalent expensive execution.
- The independent reviewer owns compatibility disposition and recognizes no generic reviewed, approved, or compatible label.
- Plan 27 alone may install exact independently reviewed bytes. This plan neither promotes candidates nor edits the active registry.

## Deviations from Plan

### Auto-fixed Issues

**1. Performance — bounded repeated canonical execution**

- **Found during:** Joined candidate and review tests.
- **Issue:** Re-running the same complete canonical Match for every case exceeded default test budgets without adding distinct transition evidence.
- **Fix:** Cache one deterministic kernel recording and reproject it through each exact case envelope; expanded explicit budgets for the complete 16-case integration checks.
- **Files modified:** Generator, checker, reviewer, and their tests.
- **Verification:** Joined 5-file suite passes all 43 tests.
- **Committed in:** `016c93b`

**2. Environment — preserve the committed lockfile offline**

- **Found during:** Dependency preparation in the isolated worktree.
- **Issue:** The offline resolver could not satisfy a stale package request, while a non-frozen command attempted to amend the lockfile.
- **Fix:** Restored the exact lockfile and reused an already installed dependency tree from another isolated phase worktree. No dependency or lockfile change remains.
- **Verification:** Package/scoped typechecks, lint, format, and tests use the unchanged committed dependency contract.

---

**Total deviations:** 2 auto-fixed (performance and isolated environment)
**Impact on plan:** Both changes preserve the planned authority, candidate identity, compatibility stop, and active-golden immutability boundaries.

## Issues Encountered

- Root workspace typecheck in the copied offline dependency tree could not resolve the unrelated `pixi.js` declaration used by `apps/web`. Engine, replay, and golden package typechecks plus strict scoped checks for all six new scripts pass; no web or dependency files were changed.

## User Setup Required

None.

## Next Phase Readiness

- Plan 27 has an exact independently reviewed `no_semantic_delta` input if and when its explicit promotion scope runs.
- Candidate manifest SHA-256 is `76a941f7dcc50dc973d540948202c4e7de4d0652a8bfd6f5d9738bae0c06c582`; semantic-diff file SHA-256 is `188e8e45a4a09d6132d7b43d50d535f30aaca8e6631f68a89bd6716466d36fc1`.
- No gameplay state, Action legality, event order, outcome, terminal timing/reason, Strategy observation, or historical v1.4 interpretation changed.
- Active goldens, production trust, lane counting, registry promotion, and protected planning files remain unchanged.

## Self-Check: PASSED

- Joined generator, checker, reviewer, golden trace, and replay recorder suite passes: 5 files, 43 tests.
- Focused package and new-script TypeScript checks pass.
- Focused ESLint, Prettier, and `git diff --check` pass.
- Independent review status is `no_semantic_delta`, with zero changes in all seven protected categories.
- Candidate review directories were removed after proof; the persisted independent artifact remains.
- `pnpm-lock.yaml`, active fixtures, registry, ROADMAP, STATE, REQUIREMENTS, and protected specifications are unchanged.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
