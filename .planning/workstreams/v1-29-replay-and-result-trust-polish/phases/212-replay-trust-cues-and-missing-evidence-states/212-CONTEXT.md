# Phase 212: Replay Trust Cues and Missing Evidence States - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 212 improves public ready replay and replay-unavailable trust cues. It explains public Chronicle projection, public replay evidence, missing Chronicle, invalid Chronicle, missing public evidence, stale evidence, and no-result states using existing data and public-safe copy. It must not expose owner debug data or private Strategy/runtime internals.

</domain>

<decisions>
## Implementation Decisions

### Replay Trust
- **D-01:** Public ready replay should explicitly say playback comes from public Chronicle projection or public replay evidence, not Strategy source, private memory, or objective payloads.
- **D-02:** Use existing metadata/evidence fields where available: Chronicle hash, schema version, event count, snapshot count, arena, lifecycle, replay availability, and privacy exclusions.
- **D-03:** Preserve canonical terms in replay copy: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.

### Unavailable States
- **D-04:** Replay unavailable states should be more informative but still public-safe. Explain missing Chronicle, invalid Chronicle, missing public evidence, stale evidence, and no-result as evidence availability states, not internal errors.
- **D-05:** Do not surface raw validation errors if they contain private/internal wording. Use sanitized, public-facing messages.

### Owner Debug Boundary
- **D-06:** Public replay must not expose owner debug controls, owner-private projection, Awareness Grid data, StrategyMemory, SoldierMemory, objective payloads, or source.
- **D-07:** Owner debug may remain test/owner-gated; this phase only clarifies public separation.

### the agent's Discretion
The agent may decide whether to implement trust cues as rows, compact bands, empty-state sections, or helper copy functions, provided layout remains clear and tests cover public safety.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `REPLAY-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 212 success criteria.
- `.planning/research/v1.29-SUMMARY.md` - Replay UX findings.

### Replay UX
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Ready replay page and evidence panel.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` - Replay unavailable state.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` - Inspector, timeline, and public/owner state helpers.
- `apps/web/app/matches/replay-ready.ts` - Public projection and board realism validation.
- `apps/web/app/matches/types.ts` - Replay ready/unavailable DTOs.
- `apps/web/app/matchsets/evidence-copy.ts` - Existing replay evidence copy.

### Contracts and Proof
- `packages/spec/src/match-execution-contract.ts` - Replay availability and privacy vocabulary.
- `packages/replay/src/project.ts` - Public/owner Chronicle projection behavior.
- `apps/web/app/matches/server.ts` - Public evidence, fixture, and stored Chronicle replay resolution.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Existing public-safe replay proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReplayUnavailable` already centralizes unavailable replay rendering.
- `replayEvidenceRows(data)` already generates ready replay evidence rows.
- `buildReadyReplayFromPublicEvidence` and `buildReadyReplayFromStoredChronicle` already validate board realism before rendering.

### Established Patterns
- Public replay data can include `contract` when built from Go public evidence.
- Owner debug controls are gated by mode/options and should stay non-public.
- Invalid Chronicle states return `ReplayUnavailableDto` with sanitized status.

### Integration Points
- Tests should cover `ReplayUnavailable`, `replayEvidenceRows`, and server data resolution paths.
- E2E fixture proof may need additional fixture scenarios for missing/no-result replay states.

</code_context>

<specifics>
## Specific Ideas

Replay unavailable should feel like a trustworthy evidence state, not a broken page. Prefer wording such as "No public Chronicle is available for this Match yet" over internal diagnostics.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 212-Replay Trust Cues and Missing Evidence States*
*Context gathered: 2026-05-31*
