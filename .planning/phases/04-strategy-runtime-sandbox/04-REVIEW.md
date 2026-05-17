---
phase: 04-strategy-runtime-sandbox
status: fixed
depth: standard
reviewed_at: 2026-05-17T19:14:11Z
fixed_at: 2026-05-17T19:20:24.000Z
scope: "git diff 1356708^..d786e40, excluding planning artifacts, lockfiles, dist, and build outputs"
files_reviewed: 25
files_reviewed_list:
  - .prettierignore
  - apps/worker/package.json
  - apps/worker/src/index.ts
  - apps/worker/tsconfig.json
  - eslint.config.mjs
  - packages/runtime-js/README.md
  - packages/runtime-js/package.json
  - packages/runtime-js/src/executor.test.ts
  - packages/runtime-js/src/executor.ts
  - packages/runtime-js/src/guards.ts
  - packages/runtime-js/src/hash.ts
  - packages/runtime-js/src/index.ts
  - packages/runtime-js/src/integration.test.ts
  - packages/runtime-js/src/revision.test.ts
  - packages/runtime-js/src/revision.ts
  - packages/runtime-js/src/transpile.test.ts
  - packages/runtime-js/src/transpile.ts
  - packages/runtime-js/src/validation.test.ts
  - packages/runtime-js/src/validation.ts
  - packages/runtime-js/src/worker-bridge.ts
  - packages/runtime-js/src/worker-harness.ts
  - packages/runtime-js/src/worker.ts
  - packages/runtime-js/tsconfig.json
  - packages/spec/src/schemas.ts
  - packages/spec/src/spec.test.ts
  - packages/spec/src/types.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
fixed_findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-17T19:14:11Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** fixed

## Summary

Reviewed the Phase 4 Strategy Runtime Sandbox implementation at standard depth, including runtime-js contracts, validation, revision construction, worker execution, integration tests, and package boundary config. The main risk is that the current worker-thread harness is not enforcing the promised hostile-code boundary: strategy source can recover the real global object, and common valid source forms are accepted by validation but fail at runtime.

## Critical Issues

### CR-01: Worker Harness Can Be Escaped Through Function Constructor Recovery

**File:** `packages/runtime-js/src/worker-harness.ts:42`
**Status:** fixed

**Issue:** Strategy code is executed with `Function(...blockedNames, body)(...blockedValues)` and forbidden globals are only shadowed as local parameters. Any strategy can recover the real `Function` constructor through ordinary intrinsics, for example `(() => {}).constructor(...)`, then evaluate in the worker global scope outside those shadowed parameters. The static scanner in `packages/runtime-js/src/validation.ts:21` only blocks literal `Function(` and misses constructor/property obfuscation. This bypass exposes `globalThis`, `process`, environment variables, and other Node capabilities, violating the Phase 4 non-negotiable runtime boundary.

**Resolution:** Strategy source is now transpiled to CommonJS and executed in a `vm` context with string/WASM code generation disabled, rather than compiled with raw `Function(...)`. Constructor recovery attempts are statically rejected and also return `FORBIDDEN_CAPABILITY` at runtime when forced through a forged revision.

### CR-02: Valid Sources With Leading Comments Fail During Execution

**File:** `packages/runtime-js/src/worker-harness.ts:42`
**Status:** fixed

**Issue:** `compileStrategy` only rewrites `export default` when it appears at the very start of the transpiled source after `trim()`. TypeScript preserves leading comments, so a normal strategy like `// note\nexport default { ... }` validates successfully but reaches the worker as `// note\nexport default ...`, causing `Function(...)` to throw `Unexpected token 'export'`. This makes valid Strategy Revisions fail at match runtime.

**Resolution:** `transpileStrategySource` now emits CommonJS and the worker reads `module.exports.default`, so leading comments no longer affect default-export execution. Added a regression test for a valid strategy with a leading comment.

### CR-03: Source Validation Does Not Check Syntax Or Transpilation

**File:** `packages/runtime-js/src/validation.ts:108`
**Status:** fixed

**Issue:** `validateStrategySource` reports `valid: true` based on byte size, forbidden-token regexes, `export default`, and method-name substrings, but it never calls `transpileStrategySource` or otherwise parses the submitted JS/TS. A syntactically invalid source containing those substrings can be wrapped into a Strategy Revision with `validation.valid === true`, then fail later as a runtime exception. That breaks the contract that users can validate a JS/TS Strategy Revision before submitting it.

**Resolution:** `validateStrategySource` now calls `transpileStrategySource` and emits `TRANSPILE_FAILED` for syntax/transpile errors. Added validation coverage for syntactically invalid source.

---

_Reviewed: 2026-05-17T19:14:11Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
