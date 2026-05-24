---
phase: 108-no-typescript-backend-topology-and-monitor-gate
reviewed: 2026-05-24T23:07:25Z
depth: deep
files_reviewed: 6
files_reviewed_list:
  - scripts/check-local-topology.ts
  - scripts/check-local-topology.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - .planning/artifacts/v1.16-no-typescript-backend-topology.json
  - .planning/artifacts/v1.16-no-typescript-backend-topology.md
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 108: Code Review Report

**Reviewed:** 2026-05-24T23:07:25Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Re-reviewed fix commit `d1a4813` against the prior blockers:

- CR-01 is resolved in implementation: `checkTopologyDiagnostics()` now derives live mode from `parseTopologyOptions(["--require-v1-16-no-typescript-backend"])`, preserving strict defaults for representative page smoke, selected Go page smoke, Go, web, and runtime-service checks.
- CR-02 is resolved in implementation: strict web health now rejects `service: "cowards-web"` and `backendAuthority: "frontend-only"` before accepting `cowards-service`.
- CR-03 is resolved in implementation/artifacts: the JSON validator now pins monitor mode and page-smoke contract fields, reads the markdown artifact, checks it for public-safe text, and asserts required topology/failure-drill text.

Verification run:

- `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts` passed, 24 tests.
- `pnpm topology:check -- --require-v1-16-no-typescript-backend --json` passed.
- `COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm boundary:monitors` passed.
- `COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm exec vitest run scripts/check-boundary-monitors.test.ts -t "passes the live repository monitor checks"` failed because the test fixture does not exercise the documented strict live path correctly.

## Warnings

### WR-01: WARNING - Boundary Monitor Regression Test Does Not Exercise Strict Live Mode

**File:** `scripts/check-boundary-monitors.test.ts:761`

**Issue:** The test named `passes the live repository monitor checks` calls `runBoundaryMonitorChecks()` without setting `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`, so it only exercises the optional topology-monitor path. When rerun with `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`, the same test fails at `scripts/check-boundary-monitors.test.ts:865` because the mocked page responses do not include all text required by strict representative and selected Go page smoke. This leaves CR-01's strict live boundary monitor behavior covered by the real command, but not by a stable regression test.

**Fix:** Set and restore `process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY = "1"` inside this test or add a separate strict-live test. Update the mocked page responses so `/auth/sign-in`, `/auth/sign-up`, `/workshop/evidence`, and `/strategies/strategy%3Ago-parity%3Asentinel` include the same expected text required by `checkWebPageLoads()`, then assert the topology monitor detail contains `required live v1.16 no-TypeScript-backend topology diagnostics checked`.

---

_Reviewed: 2026-05-24T23:07:25Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
