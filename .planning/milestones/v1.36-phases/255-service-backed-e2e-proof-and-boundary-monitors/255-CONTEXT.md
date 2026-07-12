# Phase 255: Service-Backed E2E Proof and Boundary Monitors - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Source:** v1.36 milestone brief and approved autonomous continuation

<domain>
## Phase Boundary

Close v1.36 only after executable proof covers the counted competition path, eligibility negatives, governance exclusions/restoration, public privacy, runtime ownership, and replay/result board realism. This phase adds proof and fixes defects found by proof; it does not add new product scope.
</domain>

<decisions>
## Implementation Decisions

### proof layers
- Use focused spec/persistence/service tests for deterministic matrices and a real configured PostgreSQL/Go service path when the established test database environment is available.
- Keep database/service-backed tests explicit and fail-loud when strict proof is requested; local default runs may skip only with a recorded environment limitation.
- Browser proof covers public competition, Season/standings, result, replay, player, Strategy, fair-play, and recovery surfaces at desktop and mobile widths.

### scenario coverage
- Positive flow: counted entry -> scheduled MatchSet -> execution evidence -> counted result -> standings -> replay.
- Negative eligibility: stale/missing/mismatched provider proof, unsupported provider/language, hidden TinyGo, invalid provenance, unavailable lane, package violation, same-user counted entry, and mid-season replacement.
- Governance: degraded, non-counted, under-review/disputed, invalid, invalidated, and counted restoration only with complete evidence.

### privacy and ownership
- Scan APIs, pages, fixtures, screenshots/proof metadata, and generated artifacts for every v1.36 forbidden private field/marker.
- Re-run runtime-service / Runtime Broker / provider, package/TinyGo/sandbox-claim, Node `vm`, React-rule, TypeScript quarantine, and Go ownership monitors.
- Replay realism requires visible Soldier/STONE/terrain positions inside board bounds and plausible canonical starts, including mobile framing.

### the agent's Discretion
- Exact proof artifact names, Playwright spec split, and whether a scenario reuses existing seeded fixtures or creates dedicated v1.36 fixtures.
</decisions>

<deferred>
## Deferred Ideas

- Durable ratings, staffed moderation/recovery, sandbox certification, package ecosystems, TinyGo production support, and game-rule changes remain future milestones.
</deferred>

---

*Phase: 255-service-backed-e2e-proof-and-boundary-monitors*
*Context gathered: 2026-07-11 via approved autonomous flow*
