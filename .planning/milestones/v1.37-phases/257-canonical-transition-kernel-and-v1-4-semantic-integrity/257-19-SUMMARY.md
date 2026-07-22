---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "19"
subsystem: transition-kernel-activation
tags: [transition-kernel, semantic-integrity, replay, postgres, go, atomic-activation]

requires:
  - phase: 257-05-through-18
    provides: Prepared semantic validators, transition driver, recorder, replay, runtime-service, persistence, compatibility evidence, and activation callers
provides:
  - Exact current semantic tuple 922a activated across TypeScript, Go, artifacts, contracts, and fixtures
  - One engine transition authority with recorder-only Chronicle and replay consumers
  - Current semantic admission at engine, runtime-service, replay, TypeScript persistence, and Go completion boundaries
  - Disposable PostgreSQL publication/install/restart/rollback proof selecting only exact-current evidence
  - Current event vocabulary without PUSH_ATTEMPTED and immutable historical v1.4 decoding with PUSH retained
affects: [257-20, 257-21, 257-22, 258, replay, runtime-service, persistence, go-backend]

tech-stack:
  added: []
  patterns:
    - One resumable transition kernel; callers record, validate, reconstruct, or persist without scheduling gameplay
    - Exact semantic tuple admission with historical, partial, and mixed identities rejected before mutation
    - Disposable signed-authority publication and durable high-water proof before activation commit

key-files:
  created:
    - packages/spec/artifacts/v1.37-current-event-coverage.json
    - scripts/prove-v1-37-atomic-activation.ts
    - scripts/prove-v1-37-atomic-activation.test.ts
  modified:
    - packages/engine/src/match.ts
    - packages/engine/src/kernel/driver.ts
    - packages/engine/src/kernel/step.ts
    - packages/replay/src/validate.ts
    - apps/runtime-service/src/execute-match.ts
    - packages/persistence/src/complete-match.ts
    - apps/go-backend/semantic_integrity.go
    - packages/spec/artifacts/v1.37-integrity-authority.json

key-decisions:
  - "Currentness is established by exact authority status and tuple ID; the already-proved candidate-era component strings remain byte-for-byte unchanged."
  - "The historical v1.4 tuple, event grammar, reconstruction meaning, and evidence stay literal and immutable rather than being upgraded to the current tuple."
  - "Every terminal closeSlot path performs canonical outcome detection; this preserves closure semantics while preventing a zero-active nonterminal state after cycle exhaustion."
  - "Production authority remains empty: the activation proof uses fixture trust in a disposable schema and mints zero production receipts."

patterns-established:
  - "Atomic current activation: handwritten identity changes, generated artifacts, Go fixtures, callers, and retired definitions land in one source commit."
  - "Failure-safe terminal closure: SOLDIER_STONED -> ACTIVATION_ENDED -> MATCH_ENDED, with semantic validation on the resulting state."
  - "Deployment proof: exact source selection, signed install, generation advance, restart, rollback rejection, and production-receipt absence are one executable check."

requirements-completed: [KERN-01, KERN-02, KERN-03, KERN-04, KERN-05, KERN-06, KERN-07, KERN-08, KERN-09, KERN-10, KERN-11]

coverage:
  - id: D1
    description: "Direct Match execution, runtime-service, Chronicle recording, and replay now share one current transition stream with no legacy builder or contiguous Activation entrypoint."
    requirement: KERN-01
    verification:
      - kind: integration
        ref: "pnpm --filter @cowards/engine test && pnpm --filter @cowards/replay test && pnpm --filter @cowards/runtime-service test"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-executable-reference-inventory.ts --current"
        status: pass
    human_judgment: false
  - id: D2
    description: "Semantic state, Chronicle, tuple, failure, and completion admission is current and rollback-safe across TypeScript and Go."
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence test"
        status: pass
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1"
        status: pass
    human_judgment: false
  - id: D3
    description: "The current event vocabulary is producer/consumer complete without PUSH_ATTEMPTED while the literal historical route retains original v1.4 semantics."
    requirement: KERN-09
    verification:
      - kind: integration
        ref: "pnpm exec vitest run scripts/generate-v1-37-event-coverage.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Only exact-current evidence publishes and installs; historical, partial, mixed, rollback, and wrong-pin states fail closed without production receipts."
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run scripts/prove-v1-37-atomic-activation.test.ts"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec tsx scripts/prove-v1-37-atomic-activation.ts --write --check"
        status: pass
    human_judgment: false
  - id: D5
    description: "No-Advance, Cycle-end Backstab, excess-order precedence, constants, and all locked valid-v1.4 rulings remain executable and exact."
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
        status: pass
      - kind: unit
        ref: "packages/engine/src/kernel/lifecycle-repairs.test.ts#closes a no-Advance cycle exhaustion before evaluating the immediate outcome"
        status: pass
    human_judgment: false

duration: 101min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 19: Atomic Current Activation Summary

**Tuple `sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae` is now the one current, replayable, semantically validated transition contract across engine, service, replay, persistence, Go, and generated artifacts.**

## Performance

- **Duration:** 101 min
- **Started:** 2026-07-13T19:58:40Z
- **Completed:** 2026-07-13T21:39:52Z
- **Tasks:** 1
- **Files modified:** 93 source/artifact files, plus one docs-only allowlist amendment

## Accomplishments

- Promoted the sole engine driver to current `runMatch`, removed the duplicate Match/Chronicle/replay scheduling authorities and stale contiguous-Activation surface, and preserved three-way runtime success/player-violation/system-failure ownership.
- Activated exact tuple 922a through current schemas, authority owners, Strategy/runtime manifests, Go fixtures, service contracts, persistence, and public replay consumers while keeping the proved component strings unchanged.
- Added current event coverage for every declared producer/consumer/validator disposition, removed `PUSH_ATTEMPTED` from current, and retained the literal PUSH-inclusive historical grammar and reconstruction boundary.
- Proved signed exact-current publication, generation 1-to-2 installation, restart at generation 2, rollback rejection, wrong-pin rejection, exclusion of historical/partial/mixed certificates, and zero production receipts in a disposable PostgreSQL schema.
- Kept the retained candidate artifacts byte-identical (`4234567b...`, `6af19cb7...`, `84055ef9...`) and the historical D12 corpus identity at `sha256:5438251b...`.

## Task Commits

1. **Task 1: Atomically activate current tuple contracts, artifacts, receipts, and callers** — `3642493` (feat)

Supporting allowlist-only metadata was committed before activation as `651f5db`.

## Verification

- Six package typechecks passed: spec, engine, replay, runtime-service, persistence, and web.
- Spec: 5 files / 72 tests; engine: 15 / 116; replay: 13 / 162; runtime-service: 7 / 57; PostgreSQL persistence: 19 / 212.
- Go parity and full DSN-backed Go suite passed; full Go completed in 5.895 seconds.
- Generator/inventory/proof group passed 4 files / 21 tests when the DB proof was enabled; standalone atomic proof returned generations `1 -> 2`, restart `2`, rollback `ROLLBACK`, and production receipt count `0`.
- Historical proof passed with 8 artifacts and 11 sources; current inventory reported 0 executable references and 11 non-executable guard/provenance mentions.
- Authority, event, Strategy (26 artifacts), Go parity, OpenAPI generation/check, Redocly lint, boundary imports (`strict_offenses=0`), public discovery, 14-package build, and 14-package lint passed.

## Decisions Made

- Candidate-era names in component strings are not status flags. Currentness is the exact registered tuple and authority status, so changing those already-proved strings would create a different unproved contract.
- Historical evidence uses its original v1.4 tuple and semantics at an immutable comparator boundary. It is never rewritten, backfilled, or treated as current.
- The disposable proof deliberately uses fixture trust and asserts zero production receipts. Production conformance remains empty until Phase 259 supplies executable four-language proof.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cycle exhaustion could stone the final active Soldier without producing an outcome**

- **Found during:** Full PostgreSQL persistence suite, in the v1.4 Starter Strategy smoke gauntlet (`corner-lurker` versus `center-turtle`).
- **Issue:** The twelfth no-Advance cycle closed as `CYCLE_EXHAUSTED` and stoned the actor, but only the `INVALID_MOVE` closure branch ran immediate terminal detection. Semantic validation correctly rejected the resulting nonterminal 1-0 active-count state as `OUTCOME_ACTIVE_COUNT_INCOHERENT`.
- **Fix:** Run canonical outcome detection after every terminal `closeSlot`, preserving exact `SOLDIER_STONED -> ACTIVATION_ENDED -> MATCH_ENDED` order, and add a focused final-Soldier cycle-exhaustion regression.
- **Files modified:** `packages/engine/src/kernel/step.ts`, `packages/engine/src/kernel/lifecycle-repairs.test.ts`
- **Verification:** Focused lifecycle 17/17, full engine 116/116, Workshop 22/22, and full persistence 212/212 passed.
- **Committed in:** `3642493`

**2. [Rule 3 - Blocking] Disposable proof seed used a noncanonical lane hash and a nonexistent loader error name**

- **Found during:** First DB-backed atomic proof execution.
- **Issue:** The seed hashed JSON text instead of the canonical executable-lane expansion; the wrong same-generation deployment hash was expected as `DEPLOYMENT_HASH` although the loader contract emits `PIN_FORK`.
- **Fix:** Use `hashExecutableLaneIdentity` and assert the existing exact `PIN_FORK` code.
- **Verification:** DB test 2/2 and standalone proof both passed twice with zero production receipts.
- **Committed in:** `3642493`

**3. [Rule 3 - Blocking] Deleted branches left stale imports and a preactivation inventory assertion**

- **Found during:** Root lint and generator/inventory gate.
- **Issue:** Runtime-service and persistence retained imports from deleted candidate branches, and the repository-level inventory test still required the old 51-reference baseline.
- **Fix:** Remove only unused imports/variables and make the final repository assertion require current mode with zero executable legacy references; staged migration-mode unit cases remain intact.
- **Verification:** Runtime-service typecheck/test/lint, persistence test/lint, current inventory, and full root lint passed.
- **Committed in:** `3642493`

---

**Total deviations:** 3 auto-fixed (1 correctness bug, 2 blocking verification defects)
**Impact on plan:** All fixes were necessary to satisfy the planned current contract and fail-closed gates; none changes an approved valid-v1.4 ruling or expands production authority.

## Issues Encountered

- One deterministic engine test exceeded its 5-second timeout only while four heavy package suites ran concurrently. It passed in 1.99 seconds when rerun alone, and the isolated full engine suite passed in 4.70 seconds; no timeout or product change was needed.
- The permanent `deepValidation` audit probe still reports `RangeError` for a 3,000-level runtime JSON value. Phase 257 research explicitly preserves that observation: bounded iterative canonical JSON is Phase 258 (`RABI-01`/`RABI-02`) and is not claimed here.
- `boundary:imports` continues to report 20 known report-only web imports but has zero strict offenses. Full aggregate `boundary:monitors` remains Plan 20-owned.

## Protected Working Bytes

- `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retained their exact starting file and diff hashes and were never staged.
- The source activation cache contained 93 declared files and zero undeclared paths.

## User Setup Required

None. No production authority was published or installed.

## Next Phase Readiness

- Plan 20 can replace preactivation debt monitors with exact structural negatives and persist the final audit delta over the now-current authority.
- Plan 21 can exercise the current board/replay path in the browser without any candidate route.
- Phase 258 retains the explicit deep-JSON failure observation and owns bounded canonical JSON/failure-envelope work.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
