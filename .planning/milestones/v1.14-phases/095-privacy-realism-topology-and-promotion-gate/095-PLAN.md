# Phase 95: Privacy, Realism, Topology, and Promotion Gate - Plan

**Status:** Ready for execution  
**Mode:** Standard  
**Research:** Captured in `095-CONTEXT.md`

## Goal

Prove v1.14 artifact, ABI, Go fork, public-output, replay realism, topology, no-fallback, and monitor evidence before recording final promotion/defer decisions.

## Tasks

1. Centralize forbidden public-field contract.
   - Reuse the spec-owned contract across service, Go, replay, analytics/export, OpenAPI, topology, monitors, and browser-visible checks.

2. Verify public-output privacy.
   - Ensure public/service/Go/topology/monitor outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
   - Keep owner-private source as the only source-returning exception.

3. Expand board realism verification.
   - Validate bounds, canonical starting positions, in-bounds terrain, in-bounds visible Soldiers, and replay canvas nonblank/non-clipped behavior for affected flows.

4. Record topology and promotion evidence.
   - Include web-through-Go, TypeScript worker handoff, replay metadata, no-fallback, and privacy-safe output evidence.

5. Produce final promotion/defer decision.
   - Cover artifact manifests, ABI conformance, Go fork routes, privacy gates, replay realism, topology evidence, and deferred surfaces.
   - Preserve `strict_offenses=0` and `report_only_offenses=29` unless explicitly rebaselined.

## Verification

- Run boundary monitors.
- Run service/spec/Go/replay/privacy tests.
- Run browser or Playwright replay checks if frontend replay behavior changed.
- Inspect final promotion artifact for private data.

## Exit Criteria

- Final v1.14 promotion decision exists.
- Privacy, realism, topology, and no-fallback evidence passes.
- Remaining deferred surfaces are explicit.
