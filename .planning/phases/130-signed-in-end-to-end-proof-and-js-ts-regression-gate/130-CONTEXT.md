# Phase 130: Signed-In End-to-End Proof and JS/TS Regression Gate - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 130 is the realistic signed-in proof for v1.19. It must create or sign into a local account, save one JS/TS Strategy Revision and two Python Strategy Revisions, create non-counted exhibitions using Python, execute through Go -> Runtime Broker/runtime-service -> isolated runtime implementation, open MatchSet result and replay evidence, and verify private-data safety plus JS/TS regression safety.

</domain>

<decisions>
## Implementation Decisions

### Proof Shape
- **D-01:** Proof must create/sign into a local account.
- **D-02:** Proof must save one JS/TS Strategy Revision and two Python Strategy Revisions.
- **D-03:** Proof must create a non-counted exhibition using Python against JS/TS and Python-vs-Python where supported.
- **D-04:** Proof must execute through Go -> Runtime Broker/runtime-service -> isolated runtime implementation.

### Evidence Assertions
- **D-05:** Proof must open MatchSet result and replay evidence, assert compact beta labels and evidence panels, and scan for private leak markers.
- **D-06:** Proof must assert no silent fallback, no runtime ownership drift, and JS/TS support still works.
- **D-07:** Public output scans should include source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid, stderr, stacks, host paths, package paths, tokens, DB DSNs, sessions, and private runtime internals.

### the agent's Discretion
The agent may choose account credentials, sample Strategy labels, and exact proof IDs dynamically, provided no secrets are committed and the proof is repeatable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Signed-In Proof
- `apps/web/e2e/v1-18-exhibition-proof.spec.ts` - Existing signed-in Python exhibition proof.
- `apps/web/app/api/exhibitions/route.ts` - Exhibition API route boundary.
- `apps/go-backend/runtime_service_client.go` - Go runtime-service client boundary.
- `apps/runtime-service/src/execute-match.ts` - Runtime Broker execution path.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - MatchSet result evidence surface.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` - Replay evidence surface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.18 Playwright proof already signs up, saves JS/TS and Python revisions, creates a non-counted exhibition, runs Go jobs, opens result/replay, and scans private markers.
- Go internal run-once endpoint can drive local queued Match execution when given the internal token.
- Current proof can be extended to add a second Python revision and stronger evidence panel assertions.

### Established Patterns
- Live proof is gated by env vars because it requires web, Go backend, runtime-service, Postgres, Redis, and an internal Go token.
- Proof data should use dynamic local account ids and not commit credentials.
- Browser proof complements package tests and monitor checks.

### Integration Points
- Phase 128 supplies credible Python sample Strategies.
- Phase 129 supplies evidence panels to assert.
- Phase 131 consumes the proof artifact and command as final evidence.

</code_context>

<specifics>
## Specific Ideas

Use one JS/TS revision plus two Python revisions so the proof covers Python-vs-JS/TS and Python-vs-Python where supported, while keeping the MatchSet explicitly non-counted.

</specifics>

<deferred>
## Deferred Ideas

- Counted/ranked Python proof.
- Broad beta user onboarding.
- Persisted shared proof accounts.

</deferred>

---

*Phase: 130-signed-in-end-to-end-proof-and-js-ts-regression-gate*
*Context gathered: 2026-05-25*
