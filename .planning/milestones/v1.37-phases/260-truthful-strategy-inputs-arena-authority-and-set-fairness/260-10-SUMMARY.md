---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "10"
subsystem: runtime
tags: [runtime-abi, canonical-json, typescript, python, rust, zig, wasm-wasi, runtime-service]

requires:
  - phase: 260-03
    provides: Kernel-owned v1.19 initiative and activation-slot Advance observations bound into successor effect requests
  - phase: 260-17
    provides: Selector-backed exact v1.19 public schemas beside unchanged Phase-259 current aliases
provides:
  - Exact canonical v1.19 observation admission and transport before provider startup
  - Real TypeScript, Python, Rust, and Zig provider probes for both Strategy methods
  - Explicit runtime-service candidate dispatch beside a generated Phase-259 current/default route
affects: [260-14, 260-18, 260-19, 260-21, runtime-service, runtime-providers]

tech-stack:
  added: []
  patterns: [signed-byte transport gate, candidate-only provider dispatch, generated-current selector]

key-files:
  created:
    - packages/runtime-js/src/revision-v1-19.ts
    - packages/runtime-js/src/revision-v1-19.test.ts
    - packages/runtime-python/src/revision-v1-19.test.ts
    - packages/runtime-wasm-wasi/src/revision-v1-19.test.ts
    - apps/runtime-service/src/execute-match-v1-19.test.ts
  modified:
    - packages/runtime-js/src/index.ts
    - apps/runtime-service/src/execute-match.ts
    - apps/runtime-service/src/production-runtime-config.ts

key-decisions:
  - "Admit exact canonical kernel input bytes once, validate the complete v1.19 method schema and entrant context, then pass those same bytes and facts to the selected provider without deriving initiative, Round parity, or Advance state."
  - "Treat an omitted candidate envelope as the existing Phase-259 current/default route; runtime-v1.19 remains reachable only through an explicit inactive-candidate request before Plan 14."
  - "Preserve the existing success, player-violation, and redacted system-failure ownership model across the candidate transport and runtime-service provider boundary."

patterns-established:
  - "Candidate observation transport: signed canonical bytes are hash-checked and schema/context-admitted before any guest starts."
  - "Service dispatch: absence of an explicit candidate envelope invokes the unchanged current callback; a complete candidate envelope is the only successor route."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]

coverage:
  - id: D1
    description: "TypeScript, Python, Rust, and Zig real provider lanes consume all four initiative facts for selection and the scheduler-owned Advance fact for SoldierBrain."
    requirement: STRAT-01
    verification:
      - kind: integration
        ref: "pnpm exec vitest run packages/runtime-js/src/revision-v1-19.test.ts packages/runtime-python/src/revision-v1-19.test.ts packages/runtime-wasm-wasi/src/revision-v1-19.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Missing, extra, contradictory, stale, and mixed-version observations fail before guest execution while signed canonical bytes remain unchanged."
    requirement: STRAT-02
    verification:
      - kind: unit
        ref: "packages/runtime-js/src/revision-v1-19.test.ts#rejects observation input before guest execution"
        status: pass
      - kind: unit
        ref: "apps/runtime-service/src/execute-match-v1-19.test.ts#rejects mixed or stale binding before provider startup"
        status: pass
    human_judgment: false
  - id: D3
    description: "Runtime-service explicitly dispatches admitted v1.19 observations to candidate providers with byte equality and preserves the existing three-way failure and privacy model."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "pnpm exec vitest run apps/runtime-service/src/execute-match-v1-19.test.ts"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/runtime-service typecheck"
        status: pass
    human_judgment: false
  - id: D4
    description: "Generated Phase-259 runtime-v1.17 remains the production current/default selection and no Strategy execution moved into web, API, or Go."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "apps/runtime-service/src/execute-match-v1-19.test.ts#keeps default execution and production configuration on generated Phase 259"
        status: pass
      - kind: other
        ref: "git diff --name-status dcd798414e3055aef5888b11cec9a4c376accd45..855f8a4"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 10: Exact v1.19 Observation Transport Summary

**Exact signed v1.19 observation facts now cross all four real provider lanes and an explicit runtime-service candidate boundary while generated Phase-259 current selection remains unchanged.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-17T04:46:52Z
- **Completed:** 2026-07-17T05:10:24Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 8

## Accomplishments

- Added one inactive v1.19 transport gate that canonicalizes and hashes kernel input, rejects malformed schemas, contradictory initiative facts, invalid entrant context, stale bytes, and mixed authority before provider startup, then transports the admitted bytes without deriving semantic facts.
- Proved both Strategy methods through the real TypeScript subprocess, Python candidate host, and compiled Rust/Zig WASM/WASI lanes, consuming the four initiative fields and scheduler-owned `hasAdvancedThisActivation` field.
- Added runtime-service provider dispatch that selects v1.19 only from an explicit candidate envelope, preserves provider failure ownership and public redaction, and otherwise invokes the unchanged Phase-259 route.
- Bound production runtime configuration to the generated current semantic authority projection, which remains `runtime-v1.17` / `strategy-runtime-abi-v1.17` until Plan 14.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: four-language observation transport probes** - `a586237` (test)
2. **Task 1 GREEN: exact canonical provider transport** - `5e4f8e8` (feat)
3. **Task 2 RED: runtime-service dispatch and no-start probes** - `9207db2` (test)
4. **Task 2 GREEN: selector-backed service provider dispatch** - `855f8a4` (feat)

## Files Created/Modified

- `packages/runtime-js/src/revision-v1-19.ts` - Defines inactive candidate identity, canonical byte/hash binding, strict per-method admission, and three-way provider invocation.
- `packages/runtime-js/src/revision-v1-19.test.ts` - Proves TypeScript delivery, exact bytes, mutation rejection, and no guest start on mismatch.
- `packages/runtime-js/src/index.ts` - Exposes the additive candidate transport API to runtime-service.
- `packages/runtime-python/src/revision-v1-19.test.ts` - Executes both methods through the real isolated Python candidate host.
- `packages/runtime-wasm-wasi/src/revision-v1-19.test.ts` - Compiles and executes both methods in real Rust and Zig WASM/WASI artifacts.
- `apps/runtime-service/src/execute-match.ts` - Adds explicit candidate-only provider dispatch beside the existing current callback.
- `apps/runtime-service/src/execute-match-v1-19.test.ts` - Proves byte equality, no-start mismatch behavior, current preservation, failure ownership, and privacy.
- `apps/runtime-service/src/production-runtime-config.ts` - Resolves production current selection from the generated Phase-259 authority record.

## Decisions Made

- Runtime adapters remain transport-only. The kernel owns initiative and slot-Advance truth; provider lanes receive those facts but never reconstruct them from seeds, parity, events, or positions.
- Released current ABI wrappers remain untouched and continue rejecting v1.19 fields. Candidate probes use the existing raw/supervisor provider boundaries, preserving released adapter bytes and current behavior.
- Candidate dispatch is explicit by envelope presence. There is no environment flag, fallback, generic tuple registration, or default route that can select v1.19 before Plan 14.
- System failures remain generic public envelopes with retryability and no input, source, stack, path, or raw diagnostics.

## Deviations from Plan

### Auto-fixed Issues

**1. Rule 2 - Public package boundary for the candidate gate**
- **Found during:** Task 1
- **Issue:** Runtime-service depends on `@cowards/runtime-js`; importing the new gate by a cross-package source path would bypass package ownership and TypeScript project boundaries.
- **Fix:** Added the new additive transport symbols to `packages/runtime-js/src/index.ts`.
- **Files modified:** `packages/runtime-js/src/index.ts`
- **Verification:** runtime-js and runtime-service typechecks pass.
- **Committed in:** `5e4f8e8`

---

**Total deviations:** 1 auto-fixed (1 missing package-boundary export)
**Impact on plan:** The export is additive and required for the planned runtime-service consumer; it changes no selector, provider implementation, or released ABI behavior.

## Issues Encountered

- The selected v1.17 high-level runtime wrappers correctly rejected the new v1.19 fields. The candidate conformance probes therefore use each language's established raw/supervisor execution boundary, leaving released wrappers unchanged.
- SoldierBrain fixtures initially used an incomplete awareness grid. They were corrected to the exact 5x5 contract before GREEN verification.

## User Setup Required

None - no external service configuration is required.

## Automated Evidence

- Four-language focused suite: 7/7 tests passed.
- Runtime-service focused suite: 4/4 tests passed.
- Existing execute-match regression suite plus v1.19 service suite: 39/39 tests passed.
- Typechecks passed for runtime-js, runtime-python, runtime-wasm-wasi, and runtime-service.
- Lint passed for all changed runtime packages and runtime-service.
- Protected `.planning/config.json` hash remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`.
- Protected `CowardsGameSpec_Full_Consolidated_v1.md` hash remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`.
- Their combined working diff remains `1892b7112ff4cf07fd88c395f17e2db1c1c3420073525bf0d5d6caab0f69a126`.

## TDD Gate Compliance

- Task 1 RED `a586237` failed because no v1.19 transport module existed; GREEN `5e4f8e8` passes exact byte admission, mutation/no-start checks, and four real provider lanes.
- Task 2 RED `9207db2` failed because runtime-service had no candidate observation dispatcher or generated-current production resolver; GREEN `855f8a4` passes explicit candidate, mismatch/no-start, current/default, failure, and privacy checks.

## Next Phase Readiness

- Plans 260-18 and 260-19 can use one exact provider transport for SDK/Workshop examples and fresh real-language execution inventory.
- Plan 260-21 can include the signed byte/no-start and Phase-259-preservation tests in preactivation proof.
- Plan 260-14 remains the sole activation owner; this plan added no current selector, default, web/API/Go execution, gameplay rule, or public diagnostic route.
- The protected user modifications remain untouched and uncommitted.

## Self-Check: PASSED

- All eight implementation/test files exist and all four RED/GREEN commits are present.
- Focused tests, regression tests, typechecks, lint, byte-equality, no-start, privacy, protected-baseline, and changed-path checks pass.
- Released lane adapters, current selectors, signed kernel bytes, gameplay rules, and protected user files remain unchanged.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
