---
phase: 103-typescript-backend-inventory-and-retirement-contract
reviewed: 2026-05-24T17:20:01Z
re_reviewed: 2026-05-24T17:26:15Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - scripts/generate-typescript-backend-inventory.ts
  - scripts/generate-typescript-backend-inventory.test.ts
  - package.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.json
  - .planning/artifacts/v1.16-typescript-backend-inventory.md
  - .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md
  - .planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
original_findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: clean
re_review_status: clean
---

# Phase 103: Code Review Report

**Reviewed:** 2026-05-24T17:20:01Z
**Re-reviewed:** 2026-05-24T17:26:15Z
**Depth:** deep
**Files Reviewed:** 7
**Status:** clean

## Summary

Original review identified four issues in the Phase 103 scanner, tests, package scripts, generated inventory artifacts, validation notes, and summary. Scoped re-review on 2026-05-24 found all four prior findings resolved, with no new obvious regression in the reviewed inventory script, test, package script wiring, or generated artifacts. Original findings are retained below for historical context.

## Re-review

**Status:** clean

### Prior Findings

- **BL-01 resolved:** `apps/web/lib/workshop-analytics-service-adapter.ts` and `apps/web/lib/workshop-read-service-adapter.ts` now render as `deferred` in `.planning/artifacts/v1.16-typescript-backend-inventory.md:216` and `:218`, and the JSON records `usesDatabase: true`, one persistence import, and one service import for each adapter.
- **BL-02 resolved:** `extractRouteMethods` now reads named `ExportDeclaration` route methods, and the generated matrix captures `POST`, `GET`, and `POST` for `apps/web/app/api/workshop/submit/route.ts`, `apps/web/app/api/workshop/test/[matchSetId]/route.ts`, and `apps/web/app/api/workshop/test/route.ts` at `.planning/artifacts/v1.16-typescript-backend-inventory.md:75-77`.
- **BL-03 resolved:** `103-SUMMARY.md:94` now uses `COWARDS_GO_BACKEND_OWNER_TOKENS=<redacted>`, and the Phase 103 token-value scan did not find token assignments with unredacted values.
- **WR-01 resolved:** `package.json:26` now wires `pnpm typescript-backend:inventory:check` into `boundary:monitors`.

### Verification

- `pnpm exec vitest run scripts/generate-typescript-backend-inventory.test.ts` passed: 1 file, 7 tests.
- `pnpm typescript-backend:inventory:check` passed: TypeScript backend inventory artifacts are current.

## Original Blockers (Resolved In Re-review)

### BL-01: DB-backed Workshop adapters are accepted as `frontend-only`

**File:** `scripts/generate-typescript-backend-inventory.ts:585`

**Issue:** `classifyRole` returns `frontend-only` for every `*service-adapter.ts` unless the v1.15 seed already says `deferred`. That misclassifies `apps/web/lib/workshop-analytics-service-adapter.ts` and `apps/web/lib/workshop-read-service-adapter.ts`, which directly import `@cowards/persistence/db` and `@cowards/service` at lines 1-2 of each source file. The generated matrix then records both DB-backed adapters as `frontend-only` with `go_backend` ownership at `.planning/artifacts/v1.16-typescript-backend-inventory.md:216` and `:218`, even though the JSON records `usesDatabase: true` for those same rows. This violates BASE-04 and can let a normal TypeScript backend path survive as a frontend adapter.

**Fix:** Classify any surface with `persistenceImports`, `serviceImports`, `usesDatabase`, or backend local import chains as `deferred`, `rollback-only`, `parity-only`, or `quarantined` unless it is explicitly test/fixture/runtime. Add validation that rejects `frontend-only` rows with DB/service imports or `usesDatabase: true`, and add tests for the two Workshop service adapters.

### BL-02: Re-exported API route methods are missing from the manifest

**File:** `scripts/generate-typescript-backend-inventory.ts:342`

**Issue:** `extractRouteMethods` only recognizes exported function declarations and exported variable statements. It ignores `export { POST } from ...` / `export { GET } from ...`, so three live Next route files have empty `routeMethods` in the generated artifacts: `.planning/artifacts/v1.16-typescript-backend-inventory.md:75`, `:76`, and `:77`. The source routes do export methods at `apps/web/app/api/workshop/submit/route.ts:1`, `apps/web/app/api/workshop/test/route.ts:1`, and `apps/web/app/api/workshop/test/[matchSetId]/route.ts:1`. BASE-01 requires route files and exported HTTP methods, so the inventory is incomplete.

**Fix:** Extend `extractRouteMethods` to inspect `ExportDeclaration` named exports and include HTTP method identifiers, resolving re-export targets where needed. Add a fixture route using `export { POST } from "../target/route.js"` and assert the generated route methods include `POST`.

### BL-03: Phase summary leaks a token value

**File:** `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md:94`

**Issue:** The summary records `COWARDS_GO_BACKEND_OWNER_TOKENS=<redacted-token-value>`. Phase 103's privacy contract says artifacts must keep token material out of public/planning outputs, and the inventory denylist explicitly includes tokens. Even if this is a local fixture token, committing token-shaped values into phase artifacts trains downstream evidence to preserve secret-bearing diagnostics.

**Fix:** Replace the value with a placeholder, for example `COWARDS_GO_BACKEND_OWNER_TOKENS=<redacted>`, or omit the command. Add a privacy scan over Phase 103 artifacts that fails on token/session env assignments such as `TOKEN(S)?=.*`.

## Original Warnings (Resolved In Re-review)

### WR-01: Stale inventory check is not wired into the normal monitor gate

**File:** `package.json:26`

**Issue:** `package.json` adds `typescript-backend:inventory:check` at line 19, but `boundary:monitors` at line 26 does not run it. That means the normal boundary monitor gate can pass while the v1.16 inventory artifacts are stale, even though Phase 103 makes the JSON manifest the future monitor/topology source of truth. This weakens the stale-output guarantee until someone remembers to run the new command separately.

**Fix:** Include `pnpm typescript-backend:inventory:check` in `boundary:monitors` or another required verification script that downstream phases already run.

---

_Reviewed: 2026-05-24T17:20:01Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
