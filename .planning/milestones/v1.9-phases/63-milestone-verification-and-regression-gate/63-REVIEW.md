---
phase: 63-milestone-verification-and-regression-gate
reviewed: 2026-05-23T00:26:08Z
depth: deep
files_reviewed: 27
files_reviewed_list:
  - apps/web/app/players/[handle]/page.tsx
  - apps/web/app/account/page.tsx
  - apps/web/app/api/account/revisions/route.ts
  - apps/web/app/api/auth/session/route.ts
  - apps/web/app/exhibitions/new/exhibition-client.tsx
  - apps/web/app/exhibitions/new/page.tsx
  - apps/web/app/ladder/[seasonId]/page.tsx
  - apps/web/lib/account-service-adapter.ts
  - apps/web/lib/account-service-boundary.ts
  - apps/web/lib/public-service-boundary.ts
  - apps/web/e2e/replay.fixture.spec.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/service.ts
  - packages/spec/src/runtime.ts
  - packages/spec/src/spec.test.ts
  - packages/runtime-js/src/sandbox-evaluation.ts
  - packages/runtime-js/src/sandbox-evaluation.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-local-topology.ts
  - scripts/check-local-topology.test.ts
  - scripts/evaluate-runtime-sandbox.ts
  - scripts/check-service-boundary-imports.ts
  - scripts/check-service-boundary-imports.test.ts
findings:
  critical: 0
  high: 1
  medium: 0
  low: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 63: Code Review Report

**Reviewed:** 2026-05-23T00:26:08Z
**Depth:** deep
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Reviewed the v1.9 milestone implementation scope with emphasis on service privacy boundaries, counted-runtime eligibility, non-JS guardrails, Go read-only posture, topology diagnostics, and replay privacy. The main proven regression is in the runtime isolation boundary: the container subprocess adapter is explicitly described as evidence-only/not promoted, but its spec registry still marks it eligible for normal counted play, and the monitor enforces that incorrect state.

## Findings

### High

#### HIGH-01 / BLOCKER: Evidence-only container runtime is counted-play eligible

**File:** `packages/spec/src/runtime.ts:444`

**Issue:** The `runtime-js-container-subprocess` adapter is labeled `readiness: "production-candidate"` and `isolationPromotionState: "evidence-only"`, but lines 449-450 set `enabledForNormalPlay: true` and `countedResultsAllowed: true`. That makes `evaluateStrategyRuntimeCountedEligibility()` return `ok: true` for container runtime metadata even though Phase 61/63 guardrails say no runtime candidate is promoted by default and required container evidence must fail loudly rather than fall back. The counted exhibition and ladder gates call this eligibility function, so a Strategy Revision carrying container metadata can be treated as counted eligible before the isolation boundary is promoted.

**Related monitor gap:** `scripts/check-boundary-monitors.ts:380` currently requires every JS/TS runtime bridge, including `runtime-js-container-subprocess`, to remain enabled and counted. This locks in the regression instead of detecting it. The semantics check at `scripts/check-boundary-monitors.ts:406` also expects the container metadata to be counted eligible.

**Fix:**

```ts
// packages/spec/src/runtime.ts
{
  id: "runtime-js-container-subprocess",
  readiness: "production-candidate",
  enabledForNormalPlay: false,
  countedResultsAllowed: false,
  isolationPromotionState: "evidence-only",
  // ...
}
```

Then update the monitor to allow only currently promoted JS/TS defaults to be counted. For production candidates, assert `isolationPromotionState === "evidence-only"` implies `countedResultsAllowed === false`, or make `evaluateStrategyRuntimeCountedEligibility()` reject adapters whose `isolationPromotionState` is not `"production-counted"`.

## Tests Reviewed

- `packages/spec/src/spec.test.ts`: Covers Python as non-counted and all adapters as evidence-only, but does not assert that evidence-only container metadata is non-counted.
- `packages/runtime-js/src/sandbox-evaluation.test.ts`: Covers no-promotion posture and required-container fail-loud behavior, but not the spec eligibility function used by counted entry gates.
- `scripts/check-boundary-monitors.test.ts`: Covers runtime bridge drift, but the current monitor enforces counted eligibility for the container candidate.
- `scripts/check-local-topology.test.ts`: Covers required runtime container evidence failing loudly when skipped.
- `packages/service/src/service.test.ts`: Covers account/session DTO privacy and public service DTO privacy for player/ladder/strategy/replay reads.
- `apps/web/e2e/replay.fixture.spec.ts`: Covers public replay privacy and owner-debug opt-in behavior for the fixture route.

## Residual Risks

The review was interrupted after the primary deep trace. I did not complete a full call-chain pass through every persistence mapper or all replay authorization paths outside the requested source list. Remaining risk is concentrated around privacy-sensitive DTO producers that feed the reviewed service schemas and around tests that may assert current behavior without proving the intended v1.9 boundary invariant.

---

_Reviewed: 2026-05-23T00:26:08Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
