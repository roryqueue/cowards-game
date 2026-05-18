# Phase 13: Close Gap: Persisted Owner Replay Debug Authorization - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the v1.1 audit gap for persisted Match replay owner debugging. It must connect real persisted Match replay pages to a trusted owner-debug authorization path, expose owner-only Soldier inactivity explanations only to authorized owner views, keep public replay privacy intact, and produce formal verification artifacts required by the milestone audit.

Out of scope: ranked ladders, production authentication, public tournament surfaces, generalized permission systems, and new replay/debug features beyond closing the persisted owner replay debug gap.

</domain>

<decisions>
## Implementation Decisions

### Owner Trust Source
- **D-01:** The planner may choose the smallest safe owner-trust source that fits the current no-auth app, but query parameters alone must never establish trust.
- **D-02:** Any persisted owner-debug request must be verified server-side against Match ownership or an equivalent trusted server-side owner source before owner data is returned.
- **D-03:** Development/test shortcuts are acceptable only when explicitly scoped to development/test and still constrained to Match participants.

### Persisted Replay Debug UX
- **D-04:** Workshop Match results should provide the primary user path to owner-debug replay links for persisted Matches when replay data exists.
- **D-05:** Public replay URLs must remain public by default; owner-debug links may request owner debug, but server-side verification decides whether trusted owner data is returned.
- **D-06:** The replay client should continue using the existing opt-in owner debug toggle pattern; do not make owner explanations visible by default.

### Failure-Mode E2E Proof
- **D-07:** Phase 13 must plan a service-backed Workshop failure-mode proof as the must-have end-to-end test: failure sample -> submit/run through worker -> persisted Chronicle -> owner replay link -> Soldier inactivity explanation.
- **D-08:** Lower-level persisted fixture or server tests are welcome as supporting coverage when they reduce flakiness or isolate authorization/projection behavior.
- **D-09:** Public privacy must be asserted alongside owner-debug success so the test proves both availability to owners and non-leakage to public viewers.

### Verification Artifact Closure
- **D-10:** Generate formal `*-VERIFICATION.md` files so the milestone audit contract is satisfied exactly.
- **D-11:** Phase 13 should include its own `13-VERIFICATION.md` and should add/refresh formal verification files for phases 8-12 from existing validation evidence rather than inventing new claims.

### Compatibility Alias Cleanup
- **D-12:** Do not remove orphaned Workshop compatibility API aliases in this phase.
- **D-13:** Document the aliases as compatibility surfaces with no current UI consumer, preserving them unless a later cleanup phase explicitly removes them.

### Carry-Forward Privacy Constraints
- **D-14:** Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, private runtime details, or owner debug DTOs by default.
- **D-15:** Owner debug overlays must be generated from replay/engine-derived DTOs rather than React rule inference.
- **D-16:** Strategy source must stay out of web/API processes; service-backed tests must execute Strategy code through the worker/runtime boundary.

### the agent's Discretion
- The planner may choose exact helper names, query parameter names, owner-link DTO shape, server dependency seams, and verification-file template structure as long as D-01 through D-16 remain true.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit and Gap Definition
- `.planning/v1.1-MILESTONE-AUDIT.md` — Defines the v1.1 audit gap, affected requirements, and required closure outcomes.
- `.planning/v1.1-INTEGRATION-CHECK.md` — Details the persisted owner-debug integration blocker, affected files, and partial service-backed failure flow.

### Project and Milestone Context
- `.planning/PROJECT.md` — Project goals and non-negotiables.
- `.planning/REQUIREMENTS.md` — DEBUG-04 and DEBUG-05 remain partial and are assigned to Phase 11 + Phase 13.
- `.planning/ROADMAP.md` — Phase 13 goal, success criteria, and scope boundary.
- `.planning/STATE.md` — Current v1.1 state and audit history.

### Prior Phase Decisions
- `.planning/phases/10-runtime-isolation-hardening/10-CONTEXT.md` — Runtime boundary and failure taxonomy constraints.
- `.planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md` — Owner-only debug overlay, inactivity explanation, sample Strategy, and privacy decisions.
- `.planning/phases/12-local-and-ci-reliability/12-CONTEXT.md` — Service-backed E2E, preflight, Docker/no-Docker, and CI reliability decisions.
- `.planning/phases/11-doctrine-debugging-ux/11-VALIDATION.md` — Existing DEBUG-04/05/06 validation evidence that must be extended into persisted replay flow coverage.
- `.planning/phases/12-local-and-ci-reliability/12-VALIDATION.md` — Existing service-backed E2E and reliability evidence.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical Match, Chronicle, Strategy, Soldier, STONE/FALLEN, and replay terminology.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Web/API, worker, persistence, and replay architecture boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts`: parses owner-debug query parameters and currently returns `requestedOwnerPlayerId` without establishing trust.
- `apps/web/app/matches/replay-ready.ts`: contains `trustedOwnerReplayOptions`, `buildReadyReplayFromChronicle`, and `buildReadyReplayFromStoredChronicle`; stored Chronicles currently call `trustedOwnerReplayOptions(metadata, options)` without an authorized owner list.
- `apps/web/app/matches/server.ts`: persisted replay loader seam where stored Chronicle access and server-side owner authorization can be connected before building replay DTOs.
- `apps/web/app/matches/replay-fixture.ts`: existing fixture path demonstrates passing an authorized owner list into `trustedOwnerReplayOptions`.
- `apps/web/app/workshop/workshop-client-state.ts` and `apps/web/app/workshop/workshop-client.tsx`: existing Workshop helpers/UI for replay availability and sample grouping.
- `apps/web/e2e/workshop-to-replay.spec.ts`: service-backed happy-path E2E that should be extended or paralleled for failure-mode owner debug proof.

### Established Patterns
- Replay owner debug is environment-gated and opt-in through query parameters, but trusted owner mode must be established server-side.
- Public and owner replay DTOs share `buildReadyReplayFromChronicle`; persisted and fixture paths should converge on this shared helper without adding game rules to React.
- Worker execution for service-backed flows goes through `/api/test-support/run-worker-once`, which runs the worker package path in a child process.
- Failure-mode samples already exist in the Workshop sample catalog and are grouped with `sampleKind: "failure-mode"`.
- Public privacy is tested at projection, server DTO, route, and browser fixture layers; Phase 13 should preserve this layered style.

### Integration Points
- Persisted replay route: `apps/web/app/matches/[matchId]/replay/page.tsx` -> `resolveOwnerDebugReplayOptions` -> `getMatchReplay` -> `buildReadyReplayFromStoredChronicle`.
- Owner debug DTO path: `buildSoldierInactivityExplanations` -> `ReplayReadyDto.ownerDebug.soldierInactivityExplanations` -> `ReplayClient` owner debug toggle.
- Service-backed closure path: Workshop failure-mode sample -> submit revision -> launch test -> worker execution -> persisted Chronicle -> owner replay link -> replay client owner debug explanation.
- Verification artifact path: existing `*-VALIDATION.md` and summary evidence for Phases 8-12 should feed formal `*-VERIFICATION.md` files.

</code_context>

<specifics>
## Specific Ideas

- Prefer Workshop-generated owner replay links over hidden test hooks for the main UX path.
- Treat service-backed failure-mode owner debugging as the main proof, with lower-level persisted tests added where useful.
- Keep compatibility alias API routes, but document that they are compatibility surfaces with no current in-repo UI consumer.
- The safest likely shape is: query requests owner debug, Workshop provides participant owner id in the link, server verifies the requested owner id belongs to the persisted Match, and only then returns owner replay data.

</specifics>

<deferred>
## Deferred Ideas

- Production authentication and account/session ownership are deferred to a later milestone.
- Removing orphaned Workshop compatibility aliases is deferred; Phase 13 should document them only.
- Ranked ladders, tournaments, public doctrine pages, and Strategy marketplace surfaces remain out of scope for v1.1.

</deferred>

---

*Phase: 13-Close Gap: Persisted Owner Replay Debug Authorization*
*Context gathered: 2026-05-18*
