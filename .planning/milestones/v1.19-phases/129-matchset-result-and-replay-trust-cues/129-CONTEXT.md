# Phase 129: MatchSet Result and Replay Trust Cues - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 129 improves public-safe MatchSet result and replay trust cues for Python non-counted exhibition beta. It adds compact evidence panels that explain non-counted status, language/runtime labels, broker/runtime path, and privacy exclusions without exposing private Strategy or runtime internals.

</domain>

<decisions>
## Implementation Decisions

### Evidence Panel
- **D-01:** Add compact public-safe evidence panels to MatchSet result and replay surfaces.
- **D-02:** Evidence panel should show non-counted status, language/runtime labels, broker/runtime path, and privacy exclusion cues.
- **D-03:** Result/replay trust uses an Evidence panel, not inline repetition everywhere and not provenance-only hiding.

### Privacy And Layout
- **D-04:** Do not expose Strategy source, memory, objectives, stderr, stack, host paths, package paths, or private runtime internals.
- **D-05:** Preserve owner-source privacy: owner source links remain owner-scoped and never embedded in public proof output.
- **D-06:** Replay trust cues must not obscure the board, timeline, or existing replay controls.

### the agent's Discretion
The agent may choose exact panel placement and wording, provided the panel is visible, compact, public-safe, and consistent with existing app styling.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Result And Replay Surfaces
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result page and entrant/replay evidence display.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Replay UI shell and metadata areas.
- `apps/web/app/matches/replay-ready.ts` - Replay-ready DTO and public/owner data assembly.
- `packages/spec/src/public-output-privacy.ts` - Privacy deny-list and public-output assertions.
- `apps/go-backend/main_test.go` - Public replay evidence and privacy tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MatchSet result page already shows counted status, public explanation, entrants, replay links, and provenance.
- Replay client already has a metadata rail, status chip, focus banner, board, timeline, and event inspector.
- Public-output privacy helpers and Go tests already guard replay evidence leaks.

### Established Patterns
- Public pages should expose safe evidence and provenance, not private internals.
- Replay UX must keep the board and timeline legible.
- Owner source access is an explicit owner-scoped link, not embedded public data.

### Integration Points
- Phase 128 supplies label wording.
- Phase 130 validates result/replay evidence panels in the signed-in proof.

</code_context>

<specifics>
## Specific Ideas

Use a compact evidence panel with plain facts rather than a scary warning: non-counted exhibition beta, runtime path, language/runtime labels, and a short "private fields excluded" statement.

</specifics>

<deferred>
## Deferred Ideas

- Full public runtime transparency dashboard.
- Owner-debug replay migration.
- Additional replay visualization redesign.

</deferred>

---

*Phase: 129-matchset-result-and-replay-trust-cues*
*Context gathered: 2026-05-25*
