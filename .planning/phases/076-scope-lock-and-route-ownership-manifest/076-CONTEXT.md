# Phase 76: Scope Lock and Route Ownership Manifest - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 76 locks the v1.12 ownership and evidence decision surface before implementation. It must produce the route ownership matrix, structured manifest shape, candidate scorecard, baseline evidence bundle, promotion/no-go criteria, and explicit non-goals that later phases consume. It must not implement the Go switch, promote traffic, add a live Go data provider, or move any write/runtime/source/replay-private behavior.

</domain>

<decisions>
## Implementation Decisions

### Ownership Matrix Shape
- **D-01:** Produce both a human-readable ownership matrix for review and a small structured route ownership manifest that later phases and monitors can consume.
- **D-02:** Keep the structured manifest narrow and policy-oriented, not a broad runtime configuration system.
- **D-03:** Include fields such as `routeId`, `method`, `path`, `currentOwner`, `eligibleForGoPromotion`, `selectedCandidate`, `privacyClass`, `fallbackPolicy`, `rollbackOwner`, `promotionStatus`, `blockedReasons`, and `disallowedScopes`.

### Route Scorecard Bar
- **D-04:** Use an all-or-nothing promotion gate, plus explicit blocker lists.
- **D-05:** Avoid weighted scoring because the important failures are binary: privacy leak, silent fallback, fixture-only data, more than one route, or rollback not proven.
- **D-06:** Classify routes as `eligible`, `candidate-only`, `blocked`, or `evidence-only`.
- **D-07:** `getPublicStrategyPage` can advance only if every required criterion passes; otherwise it remains `candidate-only` or `blocked`.

### Baseline Evidence Bundle
- **D-08:** Capture a baseline evidence bundle with exact command outputs or summarized JSON, but no sensitive payloads.
- **D-09:** Include `pnpm boundary:imports` showing `strict_offenses=0` and `report_only_offenses=29`.
- **D-10:** Include the current known broad web report-only offense list or a generated summary.
- **D-11:** Include the current Go route manifest snapshot with five GET-only entries.
- **D-12:** Include `pnpm go:parity` status or most recent route/parity state if full command execution is deferred to Phase 79.
- **D-13:** Include `pnpm topology:check -- --require-go --json` behavior if Go is already running, but do not block Phase 76 context/planning on starting a live Go server.
- **D-14:** Include the v1.11 proof that required Go topology fails loudly when Go is stopped.
- **D-15:** Include the v1.11 local preflight caveat: migrations applied, development MatchSet smoke returned worker idle, replay smoke passed.
- **D-16:** Include the private marker list that public/service/Go/topology/monitor outputs must never expose.

### No-Go Decision Format
- **D-17:** Treat `promote-none-yet` as a first-class decision record, not a failed promotion.
- **D-18:** Define two valid final outcomes for v1.12: `promote-one-route` and `promote-none-yet`.
- **D-19:** `promote-one-route` records route id, owner state, evidence paths, rollback proof, and post-promotion triggers.
- **D-20:** `promote-none-yet` records failed criteria, blocker owners, evidence needed to unblock, and which future milestone should revisit the decision.
- **D-21:** Use "readiness decision" language in downstream planning rather than "promotion attempt" language, so no-go does not look like incomplete work.

### the agent's Discretion
Planner may choose exact artifact filenames and JSON schema details, provided the artifacts are small, reviewable, privacy-safe, and usable by later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active Milestone
- `.planning/PROJECT.md` — Current v1.12 milestone posture and non-goals.
- `.planning/REQUIREMENTS.md` — Active v1.12 requirements and traceability.
- `.planning/ROADMAP.md` — Phase 76 scope, success criteria, and phase dependencies.
- `.planning/STATE.md` — Current workflow state and v1.11 caveats.
- `.planning/research/SUMMARY.md` — v1.12 research synthesis and route recommendation.

### Source Specs and Prior Evidence
- `AGENTS.md` — Project non-negotiables and GSD expectations.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and deterministic rules constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture constraints and runtime/web boundaries.
- `.planning/milestones/v1.11-REQUIREMENTS.md` — Prior milestone requirements, deferred items, and v1.11 evidence context.
- `.planning/milestones/v1.11-MILESTONE-AUDIT.md` — v1.11 audit result and preflight caveat.
- `.planning/artifacts/v1.11-live-go-readiness-evidence.md` — Prior live Go evidence and no-fallback proof.

### Route and Boundary Sources
- `packages/spec/src/service.ts` — Canonical `SERVICE_API_ROUTES` metadata.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` — Current five-entry GET-only Go route manifest.
- `scripts/generate-go-parity-fixtures.ts` — TypeScript-service-generated Go fixture and route manifest source.
- `scripts/check-service-boundary-imports.ts` — Strict/report-only web boundary import baseline.
- `scripts/check-boundary-monitors.ts` — Boundary monitor layers and Go manifest checks.
- `scripts/check-local-topology.ts` — Local topology diagnostics and required-Go behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-service-boundary-imports.ts`: exposes the known report-only offense baseline and strict import analysis used for the Phase 76 ownership matrix.
- `scripts/generate-go-parity-fixtures.ts`: defines the current Go route manifest entries and fixture generation source.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json`: concrete manifest snapshot to use as Phase 76 baseline input.
- `.planning/research/SUMMARY.md`: already identifies `getPublicStrategyPage` as the only plausible v1.12 candidate and documents no-go criteria.

### Established Patterns
- Current migrated web reads are strict-gated through service boundary modules and adapters; broad web persistence imports remain report-only debt.
- Go backend route inventory is currently GET-only and fixture-backed. Production promotion requires more evidence than fixture parity.
- Public privacy checks consistently reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, and private runtime internals.

### Integration Points
- Phase 76 artifacts should feed Phase 77's switch registry/contract and Phase 79's monitor updates.
- The structured manifest should align with `SERVICE_API_ROUTES` and the Go route manifest, without becoming a second broad route registry.

</code_context>

<specifics>
## Specific Ideas

Use the terms `promote-one-route` and `promote-none-yet` consistently. Treat the milestone as a readiness decision, not a promotion attempt.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 76-Scope Lock and Route Ownership Manifest*
*Context gathered: 2026-05-23*
