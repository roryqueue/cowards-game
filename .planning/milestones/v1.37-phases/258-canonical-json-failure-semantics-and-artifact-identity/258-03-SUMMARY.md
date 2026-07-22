---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "03"
subsystem: canonical-json-parser
tags: [canonical-json, iterative-scanner, utf8, bounded-materialization, expected-red]
requires:
  - phase: 258-01
    provides: Frozen canonical JSON v1 ceilings and ownership registry
  - phase: 258-02
    provides: 70-vector literal-byte corpus and exact TypeScript/Go RED verifier
provides:
  - Iterative raw-byte UTF-8, grammar, duplicate, numeric, ordering, and ceiling scanner
  - SHA-256-bound scan receipt with bounded materialization tokens
  - Iterative null-prototype JSON value materializer with system-owned receipt mismatch
  - Depth-3,000 typed rejection without recursion or host parsing
affects: [258-04, 258-05, 258-06, 258-08, 258-11]
tech-stack:
  added: []
  patterns:
    - Whole-input non-allocating UTF-8 preflight after raw-byte limit precedence
    - Explicit container state stack before any object or array construction
    - Materialization permitted only from an exact byte/hash-bound scanner receipt
key-files:
  created:
    - packages/spec/src/canonical-json-scan.ts
    - packages/spec/src/canonical-json-scan.test.ts
    - packages/spec/src/canonical-json-parse.ts
    - packages/spec/src/canonical-json-parse.test.ts
  modified: []
key-decisions:
  - "All 67 raw-parse corpus vectors are scanner-owned: 40 scan successes and 27 exact typed failures; three host-encode number vectors remain encoder-owned."
  - "The scanner retains decoded value/key tokens but retains error paths only on the active container stack, avoiding O(nodes x depth) token metadata."
  - "Plan 03 does not retire either missing-codec sentinel; the committed receipt remains exactly both-missing until Plan 04 completes the encoder."
patterns-established:
  - "Raw length, UTF-8/scalars, grammar, nodes/depth, strings, duplicates/order, and collection ceilings are resolved before materialization."
  - "Receipt drift and impossible token disagreement are system failures, never player violations."
requirements-completed: [RABI-01, RABI-02, RABI-03]
coverage:
  - id: D1
    description: "The scanner matches all 67 raw corpus vectors with exact code, path, byte offset, owner, limit profile, and content identity while never using recursion or a host JSON parser."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: "packages/spec/src/canonical-json-scan.test.ts (6/6)"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Depth 3,000 and oversized hostile inputs return one deterministic typed limit error, while depth 64 and exact ceilings remain admissible without recursive allocation."
    requirement: RABI-02
    verification:
      - kind: unit
        ref: "canonical-json-scan.test.ts#returns one typed depth error for depth 3,000 without throwing"
        status: pass
      - kind: unit
        ref: "canonical-json-parse.test.ts#materializes depth 64 iteratively and rejects depth 3,000 without throwing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The materializer accepts only scanner-approved bytes, normalizes negative zero, preserves string normalization, constructs safe objects, and keeps full-codec status exact RED."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "packages/spec/src/canonical-json-parse.test.ts (6/6)"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-canonical-json-v1-1-red.ts --stage both-missing --write --check"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 03: Iterative Canonical JSON Scanner and Parser Summary

**Untrusted JSON bytes now pass through one iterative, ceiling-bounded scanner before an exact-receipt materializer can construct any host value, while the absent encoder remains honestly RED.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-14T00:00:00-04:00
- **Completed:** 2026-07-14T00:15:13-04:00
- **Tasks:** 2 TDD tasks
- **Files created:** 4

## Accomplishments

- Implemented a whole-byte UTF-8/scalar preflight and explicit array/object state machine that checks raw bytes, depth, nodes, decoded strings, collection entries, numeric grammar/range, duplicate decoded keys, and canonical UTF-8 key order before object construction.
- Matched all 67 applicable corpus vectors: 40 successes and 27 exact error code/path/offset/owner results, including every N-1/N/N+1 ceiling and both hostile allocation probes.
- Added a bounded token receipt tied to exact input SHA-256, byte length, profile, context, operation, limits, node count, and maximum depth.
- Materialized approved tokens iteratively, normalized negative zero, preserved NFC/NFD distinctions and Unicode scalars, used null-prototype objects, and classified receipt/token disagreement only as system failure.

## Task Commits

1. **Task 1 RED: Add failing raw scanner corpus gates** — `0b11d53` (test)
2. **Task 1 GREEN: Implement iterative raw JSON scanner** — `63d0206` (feat)
3. **Task 2 RED: Add failing bounded materializer gates** — `338959b` (test)
4. **Task 2 GREEN: Materialize scanner-approved values** — `cbcbced` (feat)
5. **Review fix: Preflight UTF-8 before grammar** — `6ce09ad` (fix)
6. **Review fix: Bound retained scanner token state** — `6f85537` (fix)

## Verification

- Scanner tests passed 6/6 across all 67 raw-parse vectors; parser tests passed 6/6 across 28 non-boundary approved values, all 27 scanner errors, receipt drift, Unicode/number semantics, safe objects, and deep inputs.
- The explicit depth-3,000 scanner and parser probes returned `MAX_DEPTH_EXCEEDED` at byte 64 as a system failure without throwing.
- Focused lint for all four Plan-03 files and spec typecheck passed; the existing spec regression suite remained 73/73.
- RED-verifier tests passed 16/16, and the real `both-missing --write --check` gate retained the exact 70-vector TypeScript/Go receipt.
- The implementation diff contains only four Plan-03 allowlisted files. Protected config/spec bytes and binary diffs remained exactly unchanged.

## Decisions Made

- Raw-byte overflow wins before UTF-8 classification; otherwise malformed UTF-8 wins before JSON grammar, including invalid bytes outside string tokens.
- Decoded duplicate-key equality is checked before host object creation, and canonical input mode compares decoded keys by unsigned UTF-8 bytes.
- The scanner does not catch programming/configuration errors as player failures. The materializer may convert impossible post-scan disagreement only to a system-owned failure.
- This plan implements no canonical encoder, changes no runtime path, and does not advance the RED receipt to `go-missing`.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Correctness] Initial malformed UTF-8 classification covered strings but not grammar positions.**
   - **Found during:** Post-task security review
   - **Issue:** An invalid byte outside a string could be classified as grammar before UTF-8 validity.
   - **Fix:** Added a non-allocating whole-input UTF-8 preflight after the raw-byte ceiling check.
   - **Files modified:** `canonical-json-scan.ts`, `canonical-json-scan.test.ts`
   - **Verification:** Full 67-vector scanner gate plus the explicit outside-string invalid-byte probe passed.
   - **Committed in:** `6ce09ad`

2. **[Rule 1 - Correctness] Value tokens retained paths not needed for materialization.**
   - **Found during:** Post-task allocation review
   - **Issue:** Retaining a path on every token could grow metadata toward O(nodes x depth), despite paths only being needed for active error reporting.
   - **Fix:** Removed token paths and retained path state only on the explicit active container stack.
   - **Files modified:** `canonical-json-scan.ts`
   - **Verification:** Combined scanner/parser 12/12, focused lint, and typecheck passed.
   - **Committed in:** `6f85537`

**Total deviations:** 2 auto-fixed (2 correctness). **Impact:** Complete UTF-8 precedence and tighter bounded memory retention without scope expansion.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-04 can build the iterative canonical encoder over approved bounded values, compare exact canonical bytes/hashes for all success vectors, and then advance only TypeScript from missing to green while Go remains exact expected RED.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
