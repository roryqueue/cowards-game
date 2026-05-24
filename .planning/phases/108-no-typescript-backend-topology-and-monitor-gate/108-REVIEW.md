---
phase: 108-no-typescript-backend-topology-and-monitor-gate
reviewed: 2026-05-24T22:58:33Z
depth: deep
files_reviewed: 8
files_reviewed_list:
  - scripts/check-local-topology.ts
  - scripts/check-local-topology.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - .planning/artifacts/v1.16-no-typescript-backend-topology.json
  - .planning/artifacts/v1.16-no-typescript-backend-topology.md
  - .planning/phases/108-no-typescript-backend-topology-and-monitor-gate/108-PLAN.md
  - .planning/phases/108-no-typescript-backend-topology-and-monitor-gate/108-RESEARCH.md
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 108: Code Review Report

**Reviewed:** 2026-05-24T22:58:33Z
**Depth:** deep
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the Phase 108 strict topology gate, boundary monitor wiring, tests, and topology artifacts against GATE-01 through GATE-09. The standalone strict topology command passed locally, and the focused Vitest suite passed, but the live boundary monitor command documented by the artifact failed. More importantly, the monitor path and strict page-smoke checks still have false negatives for the no-TypeScript-backend claim and artifact privacy/drift coverage.

Verification run:

- `pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts` passed, 23 tests.
- `pnpm topology:check -- --require-v1-16-no-typescript-backend --json` passed.
- `COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm boundary:monitors` failed at `v1.16 selected Go page smoke`.

## Critical Issues

### CR-01: BLOCKER - Live Boundary Monitor Does Not Use The Strict Topology Defaults

**File:** `scripts/check-boundary-monitors.ts:2579`

**Issue:** `checkTopologyDiagnostics()` builds `TopologyOptions` by hand from environment variables instead of going through `parseTopologyOptions(["--require-v1-16-no-typescript-backend"])`. That misses the strict parser defaults and implied flags. In live mode it sets `requireV116SelectedGoPages` and `requireV116NoTypeScriptBackend`, but leaves `requireWebPageSmoke` unset and leaves `runtimeServiceUrl` as `null` unless `COWARDS_RUNTIME_SERVICE_URL` is provided. The documented artifact command, `COWARDS_REQUIRE_LIVE_TOPOLOGY=1 pnpm boundary:monitors`, therefore failed locally even with the default runtime service available, and it can also skip representative page smoke once the URL issue is patched.

**Fix:**

```ts
const strictOptions = parseTopologyOptions([
  "--require-v1-16-no-typescript-backend",
])
const checks = await evaluateLocalTopology({
  ...strictOptions,
  webUrl: process.env.COWARDS_WEB_URL ?? strictOptions.webUrl,
  goUrl: process.env.COWARDS_GO_BACKEND_URL ?? strictOptions.goUrl,
  runtimeServiceUrl:
    process.env.COWARDS_RUNTIME_SERVICE_URL ?? strictOptions.runtimeServiceUrl,
  json: false,
})
```

Add a boundary monitor test that asserts live mode produces required `representative page loads`, required `v1.16 selected Go page smoke`, and default runtime-service URL coverage without extra env vars.

### CR-02: BLOCKER - Strict Topology Can Pass Without Proving The Web Process Disabled TypeScript Backend Fallback

**File:** `scripts/check-local-topology.ts:1538`

**Issue:** The strict gate checks that `/api/service/health` returns a public-safe payload, but it does not assert that the web process is running in `COWARDS_NO_TYPESCRIPT_BACKEND=1` / Go-owner mode. A web process that returns the fallback frontend-only health body can still satisfy the health check. The selected page smoke at `scripts/check-local-topology.ts:1581` only checks page text plus direct Go replay evidence; it does not prove account/session pages and selected normal pages are using Go-owned adapters rather than TypeScript backend reads. Cross-file impact: `apps/web/lib/account-service-adapter.ts:116` still uses the local TypeScript service when strict Go ownership is not selected.

**Fix:** In `evaluateLocalTopology`, when `requireV116NoTypeScriptBackend` is true, parse the web health response and reject `service: "cowards-web"` / `backendAuthority: "frontend-only"`. Require a Go-backed health body or an explicit fail-closed Go backend classification. Add a negative test where mocked web health returns the frontend-only body and selected page HTML contains the expected text; strict mode must fail.

### CR-03: BLOCKER - Topology Artifact Privacy And Drift Checks Ignore The Markdown Artifact And Key Contract Fields

**File:** `scripts/check-local-topology.ts:861`

**Issue:** `validateV116NoTypeScriptBackendTopologyArtifact()` validates only the JSON artifact and calls `checkPublicPayload(artifact)` at `scripts/check-local-topology.ts:1017`. It never reads `.planning/artifacts/v1.16-no-typescript-backend-topology.md`, even though that public artifact is part of the Phase 108 deliverable and operator evidence. It also does not validate `monitorMode` or `pageSmoke` fields from the JSON artifact. A stale markdown command, a missing live monitor requirement, or leaked token/host/source material in the markdown artifact would pass boundary monitors.

**Fix:** Add a markdown artifact path constant and validate it with `checkPublicText()`. Assert the JSON `monitorMode.command`, `monitorMode.requiredLiveTopology`, `pageSmoke.representativeMajorPageTypesRequired`, `pageSmoke.selectedGoPagesRequired`, `pageSmoke.replayRealismRequired`, and `pageSmoke.workshopTreatment` values. Add tests that mutate each field and add a private marker to the markdown artifact path/content.

---

_Reviewed: 2026-05-24T22:58:33Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
