# Phase 95: Privacy, Realism, Topology, and Promotion Gate - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 95 is the final v1.14 evidence and promotion/defer gate. It proves artifact, ABI, Go fork, public-output, replay realism, topology, no-fallback, and monitor behavior before recording final promotion decisions.

This phase should not silently rebaseline privacy or boundary drift. If any gate fails, the final decision should defer the unsafe surface with explicit evidence and follow-up ownership.

## Approved Decisions

### D-01 Central Forbidden-Field Contract

Centralize the forbidden public-field contract in spec and reuse it across:

- Service examples.
- Go tests.
- Replay projection tests.
- Analytics/export checks.
- OpenAPI artifacts.
- Topology checks.
- Boundary monitors.
- Browser-visible public replay checks.

### D-02 Public Output Privacy

Public/service/Go/topology/monitor outputs must omit these by default:

- Strategy source.
- StrategyMemory.
- SoldierMemory.
- Objective payloads.
- Owner debug.
- Raw Awareness Grid.
- Stack traces.
- Stderr.
- Sessions.
- Tokens.
- Host paths.
- DB DSNs.
- Private runtime internals.

### D-03 Source-Returning Exception

Authenticated owner-private source retrieval remains the only source-returning exception.

It must require ownership and private/no-store behavior.

### D-04 Live Web-Through-Go Topology Evidence

Require repeatable live topology evidence for web-through-Go:

- Create a Go-owned exhibition.
- Run the TypeScript worker.
- Fetch replay metadata.
- Record privacy-safe output.

### D-05 Board Realism Verification

Expand board realism checks for replay/match creation changes:

- Valid bounds.
- Canonical starting positions.
- Terrain in bounds.
- Visible Soldiers in bounds.
- Browser replay canvas nonblank and not clipped.

### D-06 Boundary Monitor Failure Modes

Boundary monitors should fail on:

- ABI drift.
- Artifact manifest drift.
- Adapter metadata drift.
- Privacy deny-list drift.
- Unexpected Strategy execution in Go/web/API.
- Unsafe fallback.
- Report-only offense increases.
- Runtime ownership creep.

### D-07 Offense Baseline

Preserve:

- `strict_offenses=0`
- `report_only_offenses=29`

Any rebaseline must be explicit.

### D-08 Final Promotion Decision

End with a final v1.14 promotion decision covering:

- Artifact manifests.
- ABI conformance.
- Go fork routes.
- Privacy gates.
- Replay realism.
- Topology and no-fallback evidence.
- Remaining deferred surfaces.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/089-boundary-baseline-and-scope-lock/089-CONTEXT.md`
- `.planning/phases/091-generated-strategy-artifact-manifest/091-CONTEXT.md`
- `.planning/phases/092-runtime-abi-v1-14-contract/092-CONTEXT.md`
- `.planning/phases/093-js-runtime-adapter-conformance/093-CONTEXT.md`
- `.planning/phases/094-go-artifact-consumption-and-fork-parity/094-CONTEXT.md`
- `.planning/artifacts/v1.13-route-ownership-manifest.json`
- `.planning/artifacts/v1.13-live-web-go-topology.json`
- `.planning/artifacts/v1.13-promotion-decision.md`
- `packages/spec/src/service.ts`
- `packages/spec/src/schemas.ts`
- `apps/go-backend/main.go`
- `apps/go-backend/main_test.go`
- `apps/web/app/matches/replay-ready.ts`
- `apps/web/app/matches/server.test.ts`
- `apps/web/app/matches/[matchId]/replay/replay-board.test.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-local-topology.ts`

## Codebase Context

Current privacy surfaces:

- `assertPublicServiceDtoLeakSafe` in spec already rejects forbidden private keys in public DTOs.
- Go fixture loading and tests validate public fixture privacy.
- Boundary monitors scan public OpenAPI artifacts, Go fixtures, route ownership manifests, and runtime adapter metadata.
- Replay tests already check that public replay metadata omits private Chronicle fields such as objective payloads.
- Owner debug replay data is opt-in and owner-gated.

Current replay realism surfaces:

- `replay-ready.ts` verifies replay projected states keep Soldiers and terrain within board bounds.
- Replay board tests verify browser-facing board rendering behavior.
- Phase 95 should extend this to match creation and canonical starting positions where v1.14 changes affect replay/match creation.

Current topology surfaces:

- `scripts/check-local-topology.ts` validates service/API/runtime layers, redacts sensitive diagnostics, and checks public payload privacy.
- v1.13 topology artifacts recorded live web-through-Go evidence for selected route ownership.
- Phase 95 should add final v1.14 evidence that includes artifact/fork promotion and worker handoff, not just static route reads.

Design pressure:

- v1.14 touches source artifacts, runtime ABI, Go fork promotion, and public replay outputs.
- Final promotion must prove those surfaces together rather than treating each phase as isolated success.

## Planning Notes

Planning should cover:

- Where the canonical forbidden-field contract lives and how other packages import or mirror it.
- How to avoid false positives for private authenticated owner source routes.
- Which topology command records live evidence and where the artifact is stored.
- How browser replay canvas verification is run and whether it requires Playwright.
- How no-fallback and selected Go ownership evidence is recorded.
- How final promotion/defer decision artifacts are named and structured.
- How report-only offense counts are preserved or explicitly rebaselined.

## Deferred To Future Milestones

- Go-owned job claiming/completion, Match execution, and Chronicle assembly.
- Production hostile-code sandbox promotion.
- Counted non-JS play.
- Go migrations/schema ownership.
- Workshop runtime ownership.
- Full replay projection and owner-debug replay migration beyond approved v1.14 gates.
