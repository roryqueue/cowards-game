# Phase 121: Signed-In Multi-Language Exhibition Proof - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 121 is the user-facing acceptance test: create/sign into a local account, save JS/TS and Python Strategy Revisions, create a non-counted exhibition MatchSet using Python, execute through Go -> Runtime Broker -> runtime implementation, and open replay evidence.

</domain>

<decisions>
## Implementation Decisions

### Proof Strictness
- **D-01:** A live signed-in local proof is required for v1.18 completion.
- **D-02:** Service/runtime-only proof is not enough unless the user explicitly revises this gate later.
- **D-03:** The proof must include a JS/TS revision and a Python revision.

### Match Flow
- **D-04:** Python may face JS/TS or another Python Strategy through the same broker/runtime ABI.
- **D-05:** The MatchSet must be explicitly non-counted.
- **D-06:** Runtime-service or Python-runtime stoppage must fail visibly and must not silently fallback.

### Replay Evidence
- **D-07:** Replay evidence must be openable from the MatchSet result.
- **D-08:** Board realism checks must confirm visible Soldiers and terrain stay inside declared board bounds.
- **D-09:** Public outputs must be scanned for private-data leaks.

### the agent's Discretion
The agent may choose the exact local account credentials and sample Strategy sources, provided no secrets are committed and the flow is repeatable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Exhibition Proof
- `.planning/REQUIREMENTS.md` - PROOF requirements.
- `.planning/ROADMAP.md` - Phase 121 scope and success criteria.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` - Exhibition creation UX.
- `apps/web/app/api/exhibitions/route.ts` - Exhibition API route boundary.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service client.
- `apps/runtime-service/src/execute-match.ts` - Runtime broker execution path.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result and replay evidence entry.
- `AGENTS.md` - Replay privacy and board realism requirements.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing account/session and Strategy Revision flows should be used for the proof.
- Existing exhibition UI includes counted/unranked mode work from v1.17.
- Existing replay and public evidence surfaces already enforce many privacy constraints.

### Established Patterns
- v1.17 audit explicitly deferred browser-authenticated exhibition submission.
- v1.15/v1.16 established Go as normal Match orchestration and public evidence owner.
- Replay board realism is mandatory for Match/replay creation changes.

### Integration Points
- Phase 122 should make this proof monitorable and regression-safe.
- Phase 123 should include this proof in final evidence.

</code_context>

<specifics>
## Specific Ideas

The proof is not optional. It should exercise the actual signed-in user flow rather than only package-level runtime tests.

</specifics>

<deferred>
## Deferred Ideas

- Production user onboarding polish.
- Durable beta account fixtures.
- Official Python competition.

</deferred>

---

*Phase: 121-signed-in-multi-language-exhibition-proof*
*Context gathered: 2026-05-25*
