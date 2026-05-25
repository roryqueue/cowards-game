# Phase 137: Degraded-State UX and Public-Safe Reliability Evidence - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 137 improves the user-facing reliability evidence for non-counted exhibition MatchSets and replays. It enhances the existing MatchSet and replay evidence panels with public-safe running, slow, degraded, timeout, strategy-failed, and system-failed wording, without creating new ownership surfaces or leaking private runtime data.

</domain>

<decisions>
## Implementation Decisions

### UX Surface
- **D-01:** Enhance existing MatchSet and replay evidence panels rather than adding a new reliability details page or modal.
- **D-02:** Keep the UI compact and evidence-oriented, following the v1.19 trust-cue pattern.
- **D-03:** Public-facing copy should explain state and evidence limits without using internal private field names.

### States To Explain
- **D-04:** Users should understand queued, running, slow, completed, degraded, timed out, strategy-failed, and system-failed exhibition states.
- **D-05:** Retry/no-retry wording must distinguish player-caused Strategy errors from retryable system/runtime-service/container failures.
- **D-06:** Evidence should include runtime labels, non-counted exhibition beta status, timeout budget cues, candidate lane evidence, and evidence limits where applicable.

### Privacy And Replay
- **D-07:** Result/replay public evidence must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, env values, host paths, package paths, raw streams, stderr, stack traces, tokens, DB DSNs, or private runtime internals.
- **D-08:** Replay evidence should preserve plausible in-bounds board state checks and not block normal replay comprehension.

### the agent's Discretion
The agent may choose exact copy and layout, but must keep evidence panels scannable and avoid in-app tutorial text or overlarge marketing-style explanation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Inputs
- `.planning/phases/135-timeout-latency-and-reliability-budget-model/135-CONTEXT.md`
- `.planning/phases/136-exhibition-execution-stabilization-and-retry-semantics/136-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### UI And Public Evidence Code
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result evidence panel.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Replay evidence panel.
- `apps/web/lib/public-go-read-client.ts` - Public Go read DTO access.
- `packages/persistence/src/matchset-status.ts` - Status derivation.
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts` - Existing proof assertions and private marker scan.

### Prior Trust Cue Context
- `.planning/milestones/v1.19-phases/129-matchset-result-and-replay-trust-cues/129-CONTEXT.md`
- `.planning/milestones/v1.19-phases/130-signed-in-end-to-end-proof-and-js-ts-regression-gate/130-CONTEXT.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MatchSet page already has `data-testid="matchset-evidence-panel"`.
- Replay page already has `data-testid="replay-evidence-panel"`.
- v1.19 proof already scans for private markers and asserts evidence labels.
- MatchSet status can already become degraded when system failures exist.

### Known Gaps
- Current copy does not explain reliability budgets, slow/running/timeout states, or retry/no-retry behavior in enough detail for repeated signed-in use.
- Candidate lane evidence is not yet visible in public-safe proof surfaces.

</code_context>

<specifics>
## Specific Ideas

Use short evidence rows, not a new explainer page. Example categories: "status", "retry policy", "runtime evidence", "candidate lane", "proof limits", and "privacy".

</specifics>

<deferred>
## Deferred Ideas

- Full runtime diagnostics UI.
- Owner-only debug expansion.
- Public source/runtime internals disclosure.

</deferred>

---

*Phase: 137-degraded-state-ux-and-public-safe-reliability-evidence*
*Context gathered: 2026-05-25*
