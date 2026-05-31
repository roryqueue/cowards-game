# Phase 230: Result, Replay, Public Evidence, and Docs Language Pass - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 230 unifies result, replay, public evidence, and Learn/docs language presentation for all four supported languages. It does not add new runtime capability; it projects provider evidence safely and explains it honestly.

</domain>

<decisions>
## Implementation Decisions

### Public Evidence
- **D-01:** Result and replay pages may expose provider-derived public language labels and evidence status, but not private runtime details.
- **D-02:** Public evidence DTOs, fixtures, proof artifacts, and rendered pages must pass privacy scans across all four languages.
- **D-03:** Replay board realism checks remain required where replay or Match creation proof is touched.

### Docs
- **D-04:** Learn/docs must explain supported languages, provider boundaries, counted eligibility, ABI decision, deterministic restrictions, source/artifact policy, package policy, privacy rules, and no-fallback behavior.
- **D-05:** Do not overclaim production sandbox certification. Counted support and sandbox certification are separate claims.

### The Agent's Discretion
- Choose exact doc placement and page copy, but preserve canonical terminology and public-safe language.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `EVID-01..EVID-05`.
- `.planning/ROADMAP.md` - Phase 230 success criteria.
- `.planning/phases/229-workshop-account-and-competition-entry-unification/229-CONTEXT.md`

### Code
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result page.
- `apps/web/app/matchsets/result-view-model.ts` - Result page view model and labels.
- `apps/web/app/matchsets/evidence-copy.ts` - Public evidence copy.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Replay page.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Replay evidence UI.
- `apps/web/app/matches/[matchId]/replay/replay-board.tsx` - Replay board rendering.
- `apps/web/app/learn/page.tsx` - Learn/docs surface.
- `packages/spec/src/public-output-privacy.ts` - Public privacy denylist/scans.
- `packages/spec/src/match-execution-contract.ts` - App-facing result/replay DTOs.

### Evidence
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` - Public result/replay trust proof.
- `.planning/artifacts/v1.30-match-intelligence-workbench-proof.md` - Result/replay evidence proof.
- `.planning/artifacts/v1.31-public-site-spine-proof.md` - Public discovery proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing result/replay trust panels already distinguish public evidence from private internals.
- Existing privacy scans can be extended to four-language provider evidence.

### Established Patterns
- Use public-safe projections and fixtures for normal UI proof.
- Avoid exposing owner/test-only debug by default.

### Integration Points
- MatchSet result model, replay server/client, public discovery reads, Learn page, privacy scanners, proof artifacts, and Playwright visual checks.

</code_context>

<specifics>
## Specific Ideas

The docs should be frank: four supported languages can be counted only through provider proof, and runtime failures fail closed. Avoid marketing gloss.

</specifics>

<deferred>
## Deferred Ideas

AI coaching, rich analytics explanations, and strategy source explanations are outside this phase unless public-safe projections already exist.

</deferred>

---

*Phase: 230-Result, Replay, Public Evidence, and Docs Language Pass*
*Context gathered: 2026-05-31*
