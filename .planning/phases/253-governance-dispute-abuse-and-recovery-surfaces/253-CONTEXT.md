# Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Source:** v1.36 milestone brief and approved autonomous continuation

<domain>
## Phase Boundary

Add minimal signed-in competition reporting/dispute behavior, auditable governance mutations, coarse public governance projections, and honest abuse/account-recovery policy surfaces. This phase does not build a staffed moderation console, automated sanctions, appeal SLAs, public enforcement history, or full account recovery.
</domain>

<decisions>
## Implementation Decisions

### reports and disputes
- Reports target a public competition MatchSet and use a small product-facing category vocabulary plus optional bounded private detail.
- A dispute is a report subtype available only to an entrant owner; general abuse or integrity reports remain available to any signed-in Player.
- Reporter identity, private detail, duplicate/rate-limit metadata, and operator workflow data never enter public/default DTOs.
- Duplicate open submissions should be idempotent or rejected with calm public-safe feedback rather than creating unbounded records.

### governance mutations
- Existing admin authorization remains the authority boundary; this phase does not invent public self-service governance powers.
- The existing quarantined TypeScript persistence/Next route remains the mutation owner for this narrow v1.36 surface as an explicit temporary exception. Go remains the selected public-read owner; moving these mutations to the selected backend is future ownership work.
- Governance can set canonical counted states supported by the milestone and records immutable before/after audit evidence with actor and reason.
- Public explanations come from constrained safe categories/copy. Operator notes and raw evidence remain private.
- Governance state changes trigger deterministic standings recomputation through canonical read inputs, not manual rank edits.

### public projection
- Public output exposes only coarse status, safe reason category, safe explanation, applicable timestamp, standings effect, and replay availability.
- Public output does not expose reporter identity, report counts, operator identity/notes, raw diagnostics, dispute detail, recovery evidence, or private runtime/Strategy data.
- Replay availability remains evidence-derived and independent from whether a result currently counts.

### abuse and recovery expectations
- Publish concise fair-play/reporting and account-recovery expectations describing current product behavior and explicit limitations.
- Do not promise automatic punishment, continuous monitoring, public sanction history, appeal or response SLAs, permanent rating repair, ownership transfer, or full recovery.
- Account recovery remains an honest policy/support expectation surface only; no sensitive recovery-payload intake is added in v1.36.

### the agent's Discretion
- Exact safe category names, route placement, bounded private-detail limit, deduplication window, migration names, and whether public governance projection is nested under existing competition metadata or shared as a standalone type.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 253 goal and success criteria.
- `.planning/REQUIREMENTS.md` - GOV-01 through GOV-06.
- `packages/spec/src/competition-counted-state.ts` - canonical state and public copy authority.
- `packages/persistence/src/governance.ts` - existing governance mutation/audit behavior.
- `apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts` - existing admin transport.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - current governance storage baseline.
</canonical_refs>

<deferred>
## Deferred Ideas

- Final trust-surface page composition remains Phase 254.
- Service-backed governance and privacy proof remains Phase 255.
- Full moderation queues, sanctions, appeals, staffed commitments, automated abuse detection, and full account recovery remain future milestones.
</deferred>

---

*Phase: 253-governance-dispute-abuse-and-recovery-surfaces*
*Context gathered: 2026-07-11 via approved autonomous flow*
