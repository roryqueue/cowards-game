---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "01"
subsystem: executable-conformance-corpus
tags: [conformance, golden-corpus, four-language, immutable-evidence]
requires:
  - phase: 258-canonical-json-failure-semantics-and-artifact-identity
    provides: canonical JSON v1.1, exact runtime identity domains, and failure ownership
provides:
  - immutable v1.37 executable conformance corpus for TypeScript, Python, Rust, and Zig
  - exact mandatory case and capability inventory with no skip or unsupported success path
  - candidate-only generation with semantic diffs and a read-only active-golden checker
affects:
  - 259-02-full-trace-oracle
  - 259-language-lane-runners
  - 259-certificate-authority
tech-stack:
  added: []
  patterns:
    - unsigned-64-bit framed corpus and run identities
    - immutable version directory selected by an exact registry
    - candidate generation separated from read-only verification
key-files:
  created:
    - packages/golden/src/v1-37-conformance-corpus.ts
    - packages/golden/src/v1-37-conformance-corpus.test.ts
    - packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json
    - packages/golden/src/fixtures/v1-37-conformance-corpus/v1/corpus.json
    - scripts/generate-v1-37-conformance-corpus.ts
    - scripts/generate-v1-37-conformance-corpus.test.ts
    - scripts/check-v1-37-conformance-corpus.ts
    - scripts/check-v1-37-conformance-corpus.test.ts
  modified: []
key-decisions:
  - "The active corpus is 16 ordered cases across four exact fixture sources and fourteen mandatory capability categories; every case is required for every lane."
  - "Raw-envelope probes remain separate execution modes while still participating in the same mandatory lane-by-case inventory."
  - "The active registry binds version, semantic root, exact corpus-file bytes, and immutable versioned path; candidate generation cannot write into that authority."
patterns-established:
  - "Corpus governance: governed input changes require a new version/root and persisted semantic diff."
  - "Certification input: skipped, unsupported, missing, duplicate, reordered, or source-substituted results cannot produce a run root."
requirements-completed: [CONF-01, CONF-03]
coverage:
  - id: D1
    description: "One immutable hash-addressed corpus binds audited TypeScript, Python, Rust, and Zig fixtures to a complete mandatory case inventory."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-corpus.test.ts"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/golden typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Boundary, seeded/property, mutation, positive/negative failure, and raw-envelope cases are mandatory on every lane with no skip or unsupported success state."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-corpus.test.ts#rejects missing duplicate reordered skipped unsupported and substituted results"
        status: pass
    human_judgment: false
  - id: D3
    description: "Candidate generation writes only new versions and semantic diffs while normal checks are exact-byte read-only operations."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-corpus.test.ts"
        status: pass
      - kind: unit
        ref: "scripts/check-v1-37-conformance-corpus.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-conformance-corpus.ts --check"
        status: pass
    human_judgment: false
duration: 13min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 01: Mandatory Executable Corpus Summary

**A 16-case immutable four-language corpus now fails closed on omitted capability, source substitution, golden drift, and self-approved regeneration.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-16T10:00:09Z
- **Completed:** 2026-07-16T10:13:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Froze readable TypeScript, Python, Rust, and Zig fixture source bytes under one behavior manifest and exact invocation script.
- Covered every required normative, JSON, numeric, Unicode, depth, malformed-output, timeout, resource, stale-artifact, transport, repeat, differential, property, mutation, and failure category without skip semantics.
- Added candidate-only version generation with persisted semantic diffs and a pure exact-byte active-corpus check.

## Task Commits

1. **Task 1 RED: Closed corpus contract** - `78198bd` (test)
2. **Task 1 GREEN: Mandatory immutable corpus** - `56afe3f` (feat)
3. **Task 2 RED: Corpus governance contract** - `aec3b54` (test)
4. **Task 2 GREEN: Candidate/check separation** - `87b7fb6` (feat)

## Files Created/Modified

- `packages/golden/src/v1-37-conformance-corpus.ts` - Closed corpus types, exact validation, identity roots, and complete run inventory.
- `packages/golden/src/v1-37-conformance-corpus.test.ts` - D-01 through D-04 corpus, source, mutation, registry, and no-skip proof.
- `packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json` - Exact active version, semantic root, file bytes, and path.
- `packages/golden/src/fixtures/v1-37-conformance-corpus/v1/corpus.json` - Immutable first reviewed corpus version.
- `scripts/generate-v1-37-conformance-corpus.ts` - New-version candidate and semantic-diff writer.
- `scripts/generate-v1-37-conformance-corpus.test.ts` - Candidate isolation and governed-input root tests.
- `scripts/check-v1-37-conformance-corpus.ts` - Read-only exact committed-byte/root guard.
- `scripts/check-v1-37-conformance-corpus.test.ts` - No-write and overwrite-argument rejection tests.

## Decisions Made

- A lane result is complete only in canonical case-major, language-minor order and only when every status is `passed`.
- Unsupported capability is represented only as a failed certification input; it cannot be skipped or synthesized.
- Current invocation fixture IDs remain exact in the reviewed v1 corpus, while a new candidate version may deliberately change them and receive a new root.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed an accidental candidate-governance contradiction**
- **Found during:** Task 2 candidate mutation tests
- **Issue:** The first validator draft hard-coded current invocation fixture IDs, which would have prevented D-03 from expressing a reviewed invocation-script change in a new candidate version.
- **Fix:** Kept invocation count, order, and methods closed while validating candidate fixture IDs as bounded canonical identifiers; the active v1 test still freezes its exact current script.
- **Files modified:** `packages/golden/src/v1-37-conformance-corpus.ts`
- **Verification:** All candidate mutation and active-corpus tests pass.
- **Committed in:** `87b7fb6`

**Total deviations:** 1 auto-fixed bug. **Impact:** Candidate governance now matches D-03 without weakening the active v1 corpus.

## Issues Encountered

- pnpm rejected a temporary cross-worktree `node_modules` symlink before test discovery. A frozen offline workspace install restored the normal dependency layout; no dependency or lockfile changed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 259-02 can bind ordered case IDs and `V1_37_CONFORMANCE_CORPUS_ROOT` into canonical trace identity.
- Language runners can consume the exact fixture bytes and must return the complete canonical lane-by-case result sequence.
- No gameplay, Match-state, Action-legality, event-order, outcome, or Strategy-observation behavior changed.

## Self-Check: PASSED

- All eight planned implementation/test/fixture files exist.
- All four task commits exist in order.
- Focused corpus and governance tests pass: 3 files, 12 tests.
- Golden package typecheck, focused lint, Prettier check, and the read-only corpus CLI pass.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
