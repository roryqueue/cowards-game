---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "20"
subsystem: structural-audit-convergence
tags: [typescript-ast, audit, semantic-receipt, historical-compatibility, privacy]

requires:
  - phase: 257-19
    provides: Activated 922a current tuple, one transition kernel, current Chronicle/replay path, and immutable v1.4 history
provides:
  - Permanent AST and call-graph negatives for duplicate scheduling authority, stale lifecycle surfaces, forbidden dependency edges, and unsafe current completion
  - Deterministic Phase-257 current-result JSON and Markdown, separate from immutable Phase-256 and pre-refactor baselines
  - Exact bindings to both activation-review correction cycles, the v1.16 wire-byte semantic receipt, TypeScript-to-Go golden, and receipt migration
  - Zero-finding current executable-reference, event, tuple, historical, privacy, and aggregate boundary gates
affects: [257-21, 257-22, 258, 259, integrity-monitors, runtime-service, go-backend]

tech-stack:
  added: []
  patterns:
    - Immutable historical baseline plus separately generated current result
    - Exact executable identifiers and dependency edges checked with AST/call-graph analysis rather than substrings
    - Compact audit observations bound to independent lifecycle, event, tuple, inventory, Go-AST, receipt, and historical evidence hashes

key-files:
  created:
    - .planning/artifacts/v1.37-phase-257-core-rules-result.json
    - .planning/artifacts/v1.37-phase-257-core-rules-result.md
  modified:
    - scripts/check-v1-37-integrity-boundaries.ts
    - scripts/check-v1-37-integrity-boundaries.test.ts
    - apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts
    - .planning/artifacts/v1.16-typescript-backend-inventory.json

key-decisions:
  - "Phase-256 and pre-refactor baseline bytes remain immutable; current HEAD is recorded only in a separate deterministic result artifact."
  - "D-09, D-10, D-11, invalid-arena admission, and D-13 through D-15 are approved deltas; D-12 RIGHT is preserved; deep JSON and legacy-boundary observations remain owned by Phases 258 and 259."
  - "A current semantic receipt is evidence only when TypeScript and Go agree on exact schema-normalized JSON wire bytes, lowercase signature form, fixed claims, and persisted receipt identity."
  - "No production conformance or counted lane is inferred from documentation, result artifacts, fixture trust, or gate names."

patterns-established:
  - "Two-snapshot audit: byte-pin immutable history, reproduce current behavior, and reject any unapproved delta without rebaselining."
  - "One-authority structural proof: exactly one production kernel-step consumer, no stale public lifecycle routes, no replay scheduler, and no service/persistence bypass."
  - "Recursive public-result privacy: normalized key variants, host paths, credentials, raw state/events, diagnostics, memory, objectives, and security evidence are rejected."

requirements-completed: [KERN-01, KERN-02, KERN-03, KERN-04, KERN-05, KERN-06, KERN-07, KERN-08, KERN-09, KERN-10, KERN-11]

coverage:
  - id: D1
    description: "One current transition authority remains and every stale executable lifecycle/reference path is absent."
    requirement: KERN-01
    verification:
      - kind: unit
        ref: "pnpm exec vitest run scripts/check-v1-37-integrity-boundaries.test.ts scripts/check-v1-37-executable-reference-inventory.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-executable-reference-inventory.ts --current"
        status: pass
    human_judgment: false
  - id: D2
    description: "The seven-probe current result contains only approved repairs, D-12 preservation, and unchanged Phase-258/259 observations."
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
        status: pass
      - kind: other
        ref: "pnpm v1.37:integrity-boundaries:check"
        status: pass
    human_judgment: false
  - id: D3
    description: "Current event vocabulary, exact tuple, inactive candidate provenance, and historical v1.4 evidence remain independently closed."
    requirement: KERN-09
    verification:
      - kind: other
        ref: "pnpm exec tsx scripts/generate-v1-37-event-coverage.ts --current --check"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The v1.16 TypeScript/Go semantic receipt is bound to exact JSON wire bytes, its cross-language golden, and the immutable persistence migration."
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "pnpm go:parity"
        status: pass
      - kind: other
        ref: "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json"
        status: pass
    human_judgment: false

duration: 113min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 20: Structural and Audit Convergence Summary

**Phase 257 now has an executable one-authority policy and a deterministic, privacy-safe current audit result without rewriting any historical evidence.**

## Performance

- **Duration:** 113 min across review/fix checkpoints
- **Started:** 2026-07-13T17:59:17-04:00
- **Completed:** 2026-07-13T19:51:56-04:00
- **Tasks:** 1
- **Files modified:** 6 implementation/result/boundary files

## Accomplishments

- Replaced temporary duplicate-loop debt fingerprints with AST/call-graph guards for exact stale identifiers, aliases, re-exports, namespace/computed access, reducer/recursive loops, forbidden engine/replay/service/persistence edges, and the sole production kernel-step consumer.
- Persisted a separately generated current result that binds activation `3642493`, F-01–F-05 correction/closure `bd38bf2`/`aefb289`, W-01–W-03 correction/closure `34491b2`/`f5741fb`, and exact current tuple `sha256:922a6857…`.
- Recorded the exact approved semantic delta: D-09, D-10, D-11, and invalid overlapping-arena admission repaired; D-13 through D-15 structurally/version activated; D-12 successful-push history remains `RIGHT`.
- Kept Phase 258 deep JSON exactly `threw:RangeError` and Phase 259 legacy boundary exactly accepted, with no premature expectation change.
- Bound v1.16 completion evidence to schema-normalized JSON wire bytes, the TypeScript-issued/Go-verified wire golden, strict lowercase receipt signatures, fixed receipt identity, and migration `0017_runtime_semantic_receipts.sql`.
- Removed one unnecessary test-only broad web import instead of widening the historical boundary baseline; report-only offenses decreased from 20 to 19 and the 247-surface inventory was regenerated.

## Task Commits

1. **Install current structural guards** — `06eaaa8` (test)
2. **Stage deterministic current-result writer/checker** — `064dfda` (test)
3. **Persist final current audit and close aggregate boundary drift** — `239e473` (test)

Activation review corrections are separately attributable to `bd38bf2` and `34491b2`; their closure records are `aefb289` and `f5741fb`.

## Verification

- Focused integrity and executable-reference monitors: 2 files / 59 tests passed.
- Current executable inventory: 0 executable stale references; 11 classified non-executable mentions.
- Current event coverage and integrity-authority artifacts are exact; the seven audit probes reproduce the persisted result.
- Focused Go no-scheduler/semantic suite passed; full Go parity passed in the aggregate boundary chain.
- Historical proof passed with 8 artifacts and 11 archived sources.
- `v1.37:integrity-boundaries:check` reports zero findings across 307 inventoried files.
- Service import boundary remains `strict_offenses=0`; direct aggregate boundary evaluation passes all categories with 19/24 known report-only broad-web offenses remaining baseline-gated.
- The full serialized `pnpm boundary:monitors` chain passed after the test-only boundary repair and inventory regeneration.
- Immutable hashes remained exact: Phase-256 JSON `f069de59…`, Phase-256 Markdown `4ebee5c0…`, and Phase-257 RED baseline `bd2a7575…`.

## Decisions Made

- Historical and pre-refactor artifacts are verification inputs, never writable expectations for current HEAD.
- The compact seven probes do not independently prove event ordering; the result binds them to lifecycle tests, event coverage, tuple authority, executable inventory, Go AST, historical proof, and semantic receipt evidence.
- Receipt interoperability is byte-level, not semantic-object equivalence: a Go rewrite of a semantically equivalent TypeScript response is correctly rejected.
- The boundary mismatch was repaired at the unnecessary import site. No baseline allowance was added and no runtime route changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Security/Correctness] Activation success evidence was not fully interoperable or byte-bound**

- **Found during:** Post-activation structural review triggered by Plan 20.
- **Issue:** The first receipt revision did not bind exact wire bytes, admitted two forbidden current Chronicle fields, accepted uppercase signature hex, and derived persisted identity from an overly broad structure.
- **Fix:** Corrections `bd38bf2` and `34491b2` established typed Go success admission, exact TypeScript/Go wire-byte hashes, strict Chronicle shape, lowercase signature form, explicit persisted receipt projection, transaction recheck, and cross-language golden evidence.
- **Verification:** Full spec/runtime/persistence/Go review closure suites and permanent Plan-20 evidence bindings passed.
- **Committed in:** `bd38bf2`, `34491b2`

**2. [Rule 3 - Blocking] Full boundary aggregate rejected a new test-only broad type import**

- **Found during:** Final `boundary:monitors` execution.
- **Issue:** A namespace type import used only to type `vi.importOriginal` was outside the known report-only baseline.
- **Fix:** Replaced it with the minimal local mock shape and regenerated the TypeScript backend inventory; no baseline or runtime code changed.
- **Verification:** Route test 8/8, ESLint, imports (`strict_offenses=0`), inventory check, and aggregate boundary evaluation passed.
- **Committed in:** `239e473`

---

**Total deviations:** 2 auto-fixed (1 security/correctness review family, 1 blocking boundary cleanup)
**Impact on plan:** Both strengthened the intended fail-closed and drift-proof result. Neither changes gameplay, current tuple identity, historical semantics, counted authority, or public output scope.

## Issues Encountered

- Two proof-building Vitest cases exceeded the default five-second timeout because each independently reproduces the seven probes and evidence graph. Their explicit timeout is 15 seconds; assertions and production behavior were unchanged.
- The deep-JSON probe remains a deliberate Phase-258 failure and the legacy-boundary probe remains a deliberate Phase-259 acceptance. Plan 20 records rather than fixes either.

## Protected Working Bytes

- `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retained their exact starting file and diff hashes and were never staged.
- No immutable Phase-256, pre-refactor, candidate, or historical artifact was regenerated.

## User Setup Required

None. No production evidence, receipt, authority publication, or counted lane was created.

## Next Phase Readiness

- Plan 21 can use the current result and sole transition authority for browser board realism, terminal agreement, and public privacy proof.
- Plan 22 can serialize Phase-257 proof into the default boundary chain without carrying structural or audit debt.
- Phase 258 and Phase 259 retain their exact deferred probes and ownership.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
