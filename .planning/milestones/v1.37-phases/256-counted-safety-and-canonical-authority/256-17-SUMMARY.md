---
phase: 256-counted-safety-and-canonical-authority
plan: "17"
subsystem: runtime-authority
tags: [ed25519, authority-bundle, anti-rollback, reference-only, cross-language]
requires:
  - phase: 256-01
    provides: canonical six-component semantic tuple identity
  - phase: 256-02
    provides: exact executable lane and certificate evidence contracts
  - phase: 256-03
    provides: ordered execution evidence request and persisted Match identity
provides:
  - bounded exact-byte Ed25519 authority envelope and strict closed payload graph
  - deployment-pin and durable high-water anti-rollback contract
  - reference-only runtime request identity separated from resolved persisted evidence
  - deterministic Node/Go fixture, failure, replacement, and restart vectors
affects: [runtime-service, go-backend, authority-publisher, phase-259-conformance]
tech-stack:
  added: []
  patterns: [platform-crypto verification callback, exact signed bytes, two-stage durable activation, fixture trust-domain isolation]
key-files:
  created:
    - packages/spec/src/runtime-evidence-authority-bundle.ts
    - packages/spec/src/runtime-evidence-authority-bundle.test.ts
    - packages/spec/artifacts/v1.37-runtime-evidence-authority-vectors.json
    - scripts/generate-v1-37-runtime-evidence-authority-vectors.ts
  modified:
    - packages/spec/src/runtime-execution-service.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/index.ts
    - packages/spec/src/match-execution-contract.ts
    - packages/spec/src/spec.test.ts
    - apps/runtime-service/src/runtime-execution-evidence.test-support.ts
    - packages/spec/artifacts/runtime-execution-service-request.v1.15.json
key-decisions:
  - "The signed unit is the exact decoded payload byte string; consumers supply independent Ed25519 verification through platform-crypto callbacks."
  - "A newer authority generation is non-executable until its high-water record has been durably installed; same-generation hash forks always reject."
  - "Runtime requests carry only bundle, tuple, lane, entrant, revision, and certificate references; resolved certificate bodies remain a separate persisted/internal contract."
patterns-established:
  - "Authority activation: validate exact bytes and signature, compare deployment pin and durable anchor, install the new anchor, then re-evaluate before execution."
  - "Fixture isolation: the committed fixture key validates only the fixture trust domain and cannot grant production conformance."
requirements-completed: [SAFE-01, SAFE-02, AUTH-01, AUTH-03]
coverage:
  - id: D1
    description: "Bounded exact-byte authority envelopes reject invalid signatures, hashes, keys, trust domains, freshness, and open evidence graphs"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-authority-bundle.test.ts#runtime evidence authority bundle"
        status: pass
    human_judgment: false
  - id: D2
    description: "Deployment pins and durable high-water anchors prevent bootstrap, restart, rollback, and same-generation fork bypasses"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-authority-bundle.test.ts#requires exact bootstrap pins and durable monotonic high-water anchors"
        status: pass
    human_judgment: false
  - id: D3
    description: "Runtime requests are strict reference-only authority snapshots and deterministic cross-language vectors remain current"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-authority-bundle.test.ts#allows execution requests to carry authority references but no trusted bodies"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/generate-v1-37-runtime-evidence-authority-vectors.ts --check"
        status: pass
    human_judgment: false
duration: 19min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 17: Signed Runtime Evidence Authority Summary

**Exact-byte Ed25519 authority bundles now have closed evidence graphs, restart-safe anti-rollback activation, reference-only transport, and byte-stable Node/Go vectors.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-07-13T03:08:00Z
- **Completed:** 2026-07-13T03:27:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added a size-capped strict envelope and payload contract with exact SHA-256 bytes, Ed25519 verification callbacks, freshness checks, closed imports, revocations, supersessions, lane disables, and production/fixture trust separation.
- Added exact deployment bootstrap pins, corruption-rejecting durable high-water records, rollback/fork rejection, and a two-stage rule that keeps newer authority non-executable until the anchor is durably installed.
- Removed certificate-shaped request trust in favor of ordered bundle, tuple, entrant, revision, lane-hash, and certificate ID/hash references, with deterministic failure and restart vectors for independent Node and Go implementations.

## Task Commits

1. **Task 1 RED: authority bundle contract tests** - `f663efb` (test)
2. **Task 1 GREEN: signed bundle and anti-rollback contract** - `9e410e2` (feat)
3. **Task 2 RED: reference-only request test** - `5334294` (test)
4. **Task 2 GREEN: request migration and deterministic vectors** - `2b94026` (feat)
5. **Task 2 vector correction: length-preserving bad signature** - `32389b8` (fix)

## Files Created/Modified

- `packages/spec/src/runtime-evidence-authority-bundle.ts` - Strict envelope/payload parsing, graph closure, exact hashing, signature callback, refresh contract, and anti-rollback decisions.
- `packages/spec/src/runtime-evidence-authority-bundle.test.ts` - Trust, graph, freshness, request-echo, replacement, bootstrap, restart, and vector coverage.
- `scripts/generate-v1-37-runtime-evidence-authority-vectors.ts` - Deterministic fixture-only Ed25519 vector generator and drift check.
- `packages/spec/artifacts/v1.37-runtime-evidence-authority-vectors.json` - Exact cross-language envelopes plus negative, replacement, and anti-rollback cases.
- `packages/spec/src/runtime-execution-service.ts` and `packages/spec/src/schemas.ts` - Reference-only execution request contract alongside separately resolved evidence.
- Runtime-service fixtures and the shared v1.15 request artifact now use strict bundle hashes, canonical generations, and reference-only entrants.

## Decisions Made

- Kept signature verification outside the shared parser: Go and Node receive the same exact bytes, key ID, algorithm, and signature but configure and invoke their own platform cryptography.
- Kept resolved/persisted evidence separate from transport references so request-echoed certificate data cannot become authority while immutable Match evidence retains its complete internal snapshot.
- Hard-disabled production conformance certificates in this bundle schema until Phase 259 supplies executable four-language evidence; the committed fixture key is never production-trusted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Preserved complete persisted evidence while removing request-echo trust**
- **Found during:** Task 2 request-schema migration
- **Issue:** The original request schema was also reused by exact persisted Match evidence; replacing it in place would have discarded immutable resolved identity needed by persistence and replay.
- **Fix:** Split the resolved evidence schema from the reference-only transport schema and migrated only runtime request builders and their shared artifact.
- **Files modified:** `packages/spec/src/schemas.ts`, `packages/spec/src/match-execution-contract.ts`, runtime-service fixtures
- **Verification:** Full spec suite, runtime-service typecheck, and focused runtime execution tests passed.
- **Committed in:** `2b94026`

**2. [Rule 1 - Bug] Kept the bad-signature vector structurally valid**
- **Found during:** Final vector self-check
- **Issue:** Replacing base64 padding made the negative signature decode to 66 bytes, so consumers could reject its length before exercising Ed25519 verification.
- **Fix:** Mutated one base64 character while preserving the canonical 64-byte signature shape and asserted the decoded length.
- **Files modified:** vector generator, committed vector artifact, authority bundle test
- **Verification:** Deterministic generation/check, focused authority tests, and spec typecheck passed.
- **Committed in:** `32389b8`

---

**Total deviations:** 2 auto-fixed (1 missing critical integrity separation, 1 vector bug).
**Impact on plan:** The split closes request-echo authority without weakening complete persisted Match evidence or changing gameplay semantics.

## Issues Encountered

- Importing the root vector generator into a package-local TypeScript test crossed the spec package `rootDir`. The test now reads the committed artifact while generator determinism and drift are verified by the generator's own `--write`/`--check` command.

## User Setup Required

None - no external service or production key is configured by this plan.

## Verification

- Deterministic vector `--write` followed by `--check` passed.
- Focused authority and execution-identity run passed: 8 tests passed, 44 unrelated tests skipped.
- Full `@cowards/spec` suite passed: 72/72.
- `@cowards/spec` typecheck passed.
- `@cowards/runtime-service` typecheck passed; focused execution/parity suite previously passed 23/23 after fixture migration.
- `git diff --check` passed.

## Next Phase Readiness

- Runtime-service and Go can independently load, verify, anchor, and resolve the same bundle and vectors in their owning plans without a database or a request-trusted certificate path.
- Production containment publication may populate exact closed records, but production conformance remains impossible until Phase 259 introduces executable evidence and a separately reviewed authority version.
- No Match state, Action legality, event order, outcome, terminal semantics, Strategy observation, or v1.4 historical bytes changed.

## Self-Check: PASSED

- All four TDD commits exist in RED/GREEN order and all created artifacts exist.
- Exact payload bytes/hash, trust-domain rejection, graph closure, freshness, atomic replacement, bootstrap, durable high-water, rollback, fork, and request-reference behaviors are automated.
- The dirty consolidated spec and `.planning/config.json` remain untouched and unstaged.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
