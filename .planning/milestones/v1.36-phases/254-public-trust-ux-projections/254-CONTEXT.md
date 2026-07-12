# Phase 254: Public Trust UX Projections - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Source:** v1.36 milestone brief and approved autonomous continuation

<domain>
## Phase Boundary

Render the authoritative eligibility, Season, counted-state, standings evidence, governance, replay, and resettable public-beta projections across existing public and signed-in competition surfaces. This phase composes product UI; it does not create new scoring, eligibility, governance, game-rule, or runtime authority.
</domain>

<decisions>
## Implementation Decisions

### trust hierarchy
- Lead with the product-facing state and the action/effect that matters; keep provenance and privacy detail secondary but discoverable.
- Use shared spec copy and typed DTO fields directly. Remove legacy metadata parsing and route-local trust wording where authoritative projections now exist.
- Keep resettable Season-scoped standings and no durable permanent rating promise visible near entry and standings, not as alarming global warnings.

### surface coverage
- Competition index/detail and entry show public-beta posture, Season/entry status, counted eligibility, and exhibition separation.
- Season/standings show lifecycle, counted/excluded evidence totals, evidence availability, tie-break inputs, and stable result/replay links.
- Result/replay show counted/governance status and public evidence independently while preserving all private data exclusions.
- Player/Strategy pages distinguish counted trial evidence from exhibition, study, self-play, and other excluded evidence.

### interaction and presentation
- Use compact status strips, tables, ordinary links, and existing design-system controls; avoid marketing composition or nested cards.
- Copy stays calm and literal about resets, degraded Matches, disputes, invalidations, and limited recovery/moderation maturity.
- Responsive layouts must remain readable without overlap at mobile and desktop widths.

### the agent's Discretion
- Exact component boundaries, status-chip colors within the existing palette, and whether repeated trust rows become shared components or remain local when duplication is small.
</decisions>

<canonical_refs>
## Canonical References

- `packages/spec/src/competition-policy-v1-36.ts` - posture and forbidden claims.
- `packages/spec/src/competition-entry-eligibility.ts` - eligibility projection copy.
- `packages/spec/src/competition-season-policy.ts` - lifecycle/window/outcome/link projection.
- `packages/spec/src/competition-counted-state.ts` - counted-state projection.
- `packages/spec/src/competition-governance.ts` - governance, fair-play, and recovery projection.
- `packages/persistence/src/standings-recompute.ts` - public standing evidence summary.
</canonical_refs>

<deferred>
## Deferred Ideas

- New competition authority, game rules, ratings, moderation console, recovery intake, and Strategy execution remain out of scope.
- Service-backed/browser proof and final boundary artifacts remain Phase 255.
</deferred>

---

*Phase: 254-public-trust-ux-projections*
*Context gathered: 2026-07-11 via approved autonomous flow*
