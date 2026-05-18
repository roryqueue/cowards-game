---
phase: "02-pure-rules-engine"
status: fixed
depth: standard
reviewed_at: 2026-05-17T15:14:00-04:00
fixed_at: 2026-05-17T19:20:24.000Z
scope: "Phase 2 pure rules engine source/config changes through the current workspace"
files_reviewed: 28
files_reviewed_list:
  - .prettierignore
  - README.md
  - eslint.config.mjs
  - packages/engine/package.json
  - packages/engine/src/activation.test.ts
  - packages/engine/src/activation.ts
  - packages/engine/src/backstab.test.ts
  - packages/engine/src/backstab.ts
  - packages/engine/src/contraction.test.ts
  - packages/engine/src/contraction.ts
  - packages/engine/src/index.ts
  - packages/engine/src/invariants.test.ts
  - packages/engine/src/match.test.ts
  - packages/engine/src/match.ts
  - packages/engine/src/movement.test.ts
  - packages/engine/src/movement.ts
  - packages/engine/src/outcome.ts
  - packages/engine/src/purity.test.ts
  - packages/engine/src/runtime-inputs.ts
  - packages/engine/src/selectors.ts
  - packages/engine/src/state.test.ts
  - packages/engine/src/state.ts
  - packages/engine/src/test/fake-runtime.ts
  - packages/engine/src/types.ts
  - packages/engine/tsconfig.json
  - packages/test-utils/package.json
  - packages/test-utils/src/engine-scenarios.ts
  - packages/test-utils/src/index.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
fixed_findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-17T15:14:00-04:00
**Depth:** standard
**Files Reviewed:** 28
**Status:** fixed

## Summary

Reviewed the Phase 2 engine implementation and test/config changes for deterministic rule correctness, purity constraints, runtime boundary behavior, and edge-case coverage. The main rule loop is structured cleanly, and the existing engine test suite passes, but one active collision rule defect remains: same-direction collisions are resolved as pushes even though the canonical Side Push rule only allows pushes when the target faces neither the move direction nor its opposite.

Verification run during review:

```sh
pnpm --filter @cowards/engine test
```

Result: 8 test files passed, 37 tests passed.

## Critical Issues

### CR-01: Same-Direction Active Collisions Illegally Resolve As Pushes

**Severity:** BLOCKER
**File:** `packages/engine/src/movement.ts:88`
**Status:** fixed
**Issue:** `resolveActiveCollision` only special-cases head-to-head collisions where `target.facing === oppositeDirection(direction)`. Every other ACTIVE target falls through to the push path at lines 103-155. The spec defines Side Push more narrowly: a push is attempted only when the target is approached from the side, meaning the target's facing is neither the MOVE direction nor the opposite direction. With the current code, a Soldier moving into an ACTIVE Soldier who is facing the same direction can push that Soldier forward. That is not a side approach and changes canonical game outcomes, especially for friendly same-direction stacks where activation-start Backstab does not remove the target.

**Resolution:** Added an explicit same-direction active-collision block before Side Push resolution and covered it with a regression test in `packages/engine/src/movement.test.ts`.

---

_Reviewed: 2026-05-17T15:14:00-04:00_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
