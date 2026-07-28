---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "02"
subsystem: canonical-json-corpus
tags: [canonical-json, raw-bytes, expected-red, typescript, go]
requires:
  - phase: 258-01
    provides: Exact canonical JSON ceilings, typed failure ownership, and length-framed SHA-256 identity convention
provides:
  - Deterministic 70-vector raw-byte canonical JSON v1.1 corpus
  - Literal malformed, duplicate-key, Unicode, numeric, limit, and hostile-allocation fixtures
  - Named TypeScript and Go consumers that enumerate one identical corpus identity
  - Exact three-stage RED verifier and deterministic both-missing receipt
affects: [258-03, 258-04, 258-05, 258-11, 258-13, 259]
tech-stack:
  added: []
  patterns:
    - Domain-separated unsigned-64-bit length framing over ordered IDs and literal raw bytes
    - Expected RED accepted only after complete cross-language corpus enumeration
    - Source and subprocess guards reject disabled tests and infrastructure counterfeits
key-files:
  created:
    - scripts/generate-canonical-json-v1-1-corpus.ts
    - scripts/generate-canonical-json-v1-1-corpus.test.ts
    - packages/spec/src/fixtures/canonical-json-v1-1-vectors.json
    - packages/spec/src/fixtures/canonical-json-v1-1-raw
    - packages/spec/src/canonical-json-corpus.test.ts
    - apps/go-backend/canonical_json_corpus_test.go
    - scripts/check-canonical-json-v1-1-red.ts
    - scripts/check-canonical-json-v1-1-red.test.ts
    - .planning/artifacts/v1.37-canonical-json-red.json
  modified: []
key-decisions:
  - "The v1.1 corpus contains 70 deterministically ordered vectors under root f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0."
  - "TypeScript and Go both enumerate identity 0a70be7877b11ffa3d1147c3efaa7ad38fc114fca1c3ee2028900baf786e8ef7 before their exact missing-codec sentinel."
  - "Plan 02 remains both-missing; Plan 04 owns TypeScript green, and Plan 11 owns full TypeScript/Go green retirement."
patterns-established:
  - "Malformed UTF-8 and duplicate-key inputs remain literal files and are hashed before any host JSON conversion."
  - "Discovery, import, compile, configuration, timeout, generic nonzero, empty enumeration, wrong root, wrong sentinel, and disabled-test modes never qualify as expected RED."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-06, RABI-08]
coverage:
  - id: D1
    description: "One generated language-neutral manifest fixes literal input bytes, exact limits and contexts, canonical success bytes, and typed error code/path/offset/owner for every required category and boundary."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: "scripts/generate-canonical-json-v1-1-corpus.test.ts (6/6)"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/generate-canonical-json-v1-1-corpus.ts --write --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "Named TypeScript and Go consumers independently verify all 70 IDs, raw hashes, canonical hashes, error expectation shapes, and one identical length-framed root before missing-codec RED."
    requirement: RABI-02
    verification:
      - kind: unit
        ref: "scripts/check-canonical-json-v1-1-red.test.ts (16/16)"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-canonical-json-v1-1-red.ts --stage both-missing --write --check"
        status: pass
    human_judgment: false
  - id: D3
    description: "The outer verifier records only exact qualified TypeScript/Go RED after identical complete enumeration and rejects infrastructure, empty-test, and counterfeit-sentinel outcomes."
    requirement: RABI-08
    verification:
      - kind: other
        ref: ".planning/artifacts/v1.37-canonical-json-red.json"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-13
status: complete
---

# Phase 258 Plan 02: Canonical JSON Raw Corpus and Qualified RED Summary

**A single 70-vector literal-byte corpus now fixes canonical JSON v1.1 expectations for both languages, while an exact outer verifier keeps the absent TypeScript and Go codecs honestly RED.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-13T23:46:00-04:00
- **Completed:** 2026-07-13T23:57:18-04:00
- **Tasks:** 2 TDD tasks
- **Files created:** 89, including 81 generated raw/canonical byte fixtures

## Accomplishments

- Generated 70 ordered vectors spanning valid and malformed UTF-8, Unicode scalars and non-normalization, escaped-equivalent duplicate keys, code-point key ordering, binary64 and invalid numeric grammar, all six N-1/N/N+1 limits, and hostile depth/allocation probes.
- Bound the ordered IDs and literal bytes to root `f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0`; every raw and canonical file has an indexed length and SHA-256 digest.
- Added TypeScript and Go consumers that independently enumerate all 70 vectors, validate raw/canonical identities and error expectation shapes, and agree on enumeration digest `0a70be7877b11ffa3d1147c3efaa7ad38fc114fca1c3ee2028900baf786e8ef7`.
- Added `both-missing`, `go-missing`, and `green` outer stages; the committed receipt qualifies only the exact two current missing-codec sentinels and records future owner plans.

## Task Commits

1. **Task 1 RED: Add failing canonical JSON corpus gates** — `5dd8fde` (test)
2. **Task 1 GREEN: Generate the literal raw-byte corpus** — `23ae3a2` (feat)
3. **Task 2 RED: Add failing cross-language corpus consumers** — `99a4699` (test)
4. **Task 2 GREEN: Qualify cross-language codec RED** — `8a32b7c` (feat)
5. **Review fix: Reject disabled consumer sources** — `9ac72a6` (fix)

## Verification

- Generator tests passed 6/6 and deterministic `--write --check` reproduced all 70 vectors and 81 byte files.
- RED-verifier tests passed 16/16, including wrong-root, empty enumeration, generic nonzero, wrong sentinel, sentinel-before-enumeration, discovery/import/compile, timeout, and disabled-test counterfeits.
- The real TypeScript and Go commands each exited exactly 1 after the same complete enumeration, then emitted only their respective named missing-codec sentinel; the outer `both-missing --write --check` gate passed.
- Spec typecheck passed. The phase diff contains only Plan-02 allowlisted files; protected config/spec byte and binary-diff hashes remained exactly unchanged.

## Decisions Made

- Corpus identity hashes literal bytes before parsing, so a host parser cannot erase malformed UTF-8, duplicates, numeric lexical form, or key order.
- The receipt is deterministic and contains commands, exit codes, exact result/sentinel, complete vector identity, enumeration identity, and owner plans, with no timestamp.
- No production codec, runtime path, current ABI constant, serializer, Go service behavior, or v1.16 artifact changed in this plan.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Correctness] Initial corpus root used serialized manifest metadata rather than literal bytes.**
   - **Found during:** Task 1 implementation review
   - **Issue:** The plan requires the ordered index root to be domain-hashed from length-delimited raw bytes.
   - **Fix:** Root framing now covers the fixed domain, each ordered vector ID, and each literal raw fixture.
   - **Files modified:** `scripts/generate-canonical-json-v1-1-corpus.ts`
   - **Verification:** Generator 6/6 and deterministic write/check passed at the committed root.
   - **Committed in:** `23ae3a2`

2. **[Rule 1 - Correctness] Disabled-test rejection initially covered output but not consumer source.**
   - **Found during:** Post-task diff review
   - **Issue:** A future runner configuration could conceal `.skip`, `.todo`, pending, or pass-with-no-tests source edits before subprocess classification.
   - **Fix:** Added explicit source inspection for both named consumers plus focused counterfeit tests.
   - **Files modified:** `scripts/check-canonical-json-v1-1-red.ts`, `scripts/check-canonical-json-v1-1-red.test.ts`
   - **Verification:** Verifier 16/16 and the real both-missing gate passed.
   - **Committed in:** `9ac72a6`

**Total deviations:** 2 auto-fixed (2 correctness). **Impact:** Stronger byte identity and RED integrity with no production activation or scope expansion.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-03 can implement the bounded TypeScript scanner/parser directly against fixed bytes, exact limits, and typed error expectations. It must preserve the TypeScript missing-codec sentinel until Plan 258-04 completes the full codec; Go remains missing until Plan 258-11.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-13*
