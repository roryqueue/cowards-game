# Phase 18: Abuse and Fairness Guardrails - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the v1.2 competitive trust loop with server-side guardrails: per-user create rate limits, active duplicate MatchSet prevention, deterministic strategy failure penalties, system failure classification, strict valid-result criteria, public penalty visibility, and golden privacy leak tests. It should not build moderation tooling, ranked anti-abuse systems, account recovery, or broad operational dashboards.

</domain>

<decisions>
## Implementation Decisions

### Rate Limiting
- **D-01:** Use per-user exhibition create rate limits with a small alpha-friendly burst.
- **D-02:** User-based limits are preferred over IP-only limits because v1.2 has stable signed-in User identity.
- **D-03:** Exact numeric limits may be chosen in planning/config, but must allow reasonable local alpha testing.

### Strategy Failure Penalties
- **D-04:** Runtime strategy violations penalize the affected entrant for the affected Match.
- **D-05:** Covered strategy-side failures include timeout, thrown exception, invalid output, forbidden capability, memory/output violations, and similar runtime violations.
- **D-06:** A strategy-side failure should not automatically disqualify the revision from the whole MatchSet unless future planning finds a narrow deterministic reason.

### System Failure Handling
- **D-07:** System failures degrade or invalidate evidence; they never count as player losses.
- **D-08:** Worker crash, orchestration failure, malformed internal IPC, Chronicle storage failure, or replay validation failure should be classified separately from strategy failure.
- **D-09:** Retries may exist internally, but public scoring must preserve the system-vs-strategy distinction.

### Valid Competitive Result Criteria
- **D-10:** Use a strict valid-result gate.
- **D-11:** A valid result requires locked entrants, known preset/scoring policy versions, complete or explicitly degraded scoring inputs, public replay projections that pass privacy gates, and no unresolved system failures affecting standings.
- **D-12:** Degraded evidence may be public if explicitly labeled; do not pretend degraded results are clean.

### Active Duplicate Policy
- **D-13:** Block active duplicate MatchSets with the same creator, preset, and selected revision-id set while one is queued/running.
- **D-14:** Allow intentional reruns after completion, degradation, or failure.
- **D-15:** Duplicate comparison should normalize revision-id set order so selection order cannot bypass the guardrail.

### Public Penalty Visibility
- **D-16:** Public penalties appear in standings and Match ledger.
- **D-17:** Public penalty detail uses public reason categories only and must not expose private runtime internals.

### Privacy Test Coverage
- **D-18:** Add golden public-result leak tests for public MatchSet/result/replay DTOs.
- **D-19:** Tests must assert absence of Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, owner debug, private runtime details, and private error text.

### the agent's Discretion
The planner may choose exact rate-limit numbers, retry count/config, penalty point value, public reason enum names, and test fixture construction, as long as the policy decisions above remain locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — competitive integrity and privacy constraints.
- `.planning/REQUIREMENTS.md` — Phase 18 requirements FAIR-01 through FAIR-06.
- `.planning/ROADMAP.md` — Phase 18 goal, success criteria, and notes.
- `.planning/phases/14-competitive-ownership-and-sessions/14-CONTEXT.md` — User/session ownership for rate limits and authorization.
- `.planning/phases/15-matchset-competition-model/15-CONTEXT.md` — scoring, tie-breaker, publication, and strategy failure penalty support.
- `.planning/phases/16-exhibition-queue-and-entry/16-CONTEXT.md` — 2-8 owner-only manual exhibitions and distinct revision id policy.
- `.planning/phases/17-result-pages-and-replay-evidence/17-CONTEXT.md` — public penalty/result visibility and privacy surface.
- `.planning/research/SUMMARY.md` — fairness guardrail direction and watch-outs.

### Primary Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — canonical Match/Chronicle/privacy terminology.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — runtime isolation and trust boundaries.

### Existing Code
- `packages/runtime-js/src/validation.ts`, `packages/runtime-js/src/executor.ts`, and runtime tests — Strategy validation/runtime violation taxonomy.
- `packages/persistence/src/jobs.ts` and `packages/persistence/src/complete-match.ts` — worker job retries, completion, and system failure pathways.
- `packages/persistence/src/matchset-status.ts` — degraded/complete MatchSet status aggregation.
- `packages/persistence/src/scoring.ts` and `packages/persistence/src/scoring.test.ts` — current scoring and ranking behavior.
- `packages/replay/src/project.ts`, `packages/replay/src/validate.ts`, and `packages/replay/src/grammar.ts` — public projection and Chronicle validation gates.
- `apps/web/e2e/workshop-to-replay.spec.ts` and `apps/web/e2e/replay.fixture.spec.ts` — existing privacy/replay E2E patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Runtime-js already distinguishes validation/runtime failure types such as timeout, invalid output, thrown exception, forbidden patterns, and hostile capability attempts.
- Persistence already tracks `failed_system`, `degraded`, job attempts, and failure category/message fields.
- Replay and E2E tests already assert public privacy boundaries for replay DTOs.

### Established Patterns
- Public projection tests should assert absence of private strings, not just expected shape.
- Worker/system failures are retried and recorded separately from Strategy runtime violations.
- Scoring currently counts `failedSystemMatches` but does not treat them as wins/losses.

### Integration Points
- Add rate-limit persistence/checks to competitive create endpoint.
- Add active duplicate query keyed by creator, preset, normalized revision-id set, and queued/running status.
- Extend scoring/failure DTOs with public penalty categories.
- Add golden leak fixtures that cover public MatchSet result DTOs and linked replay DTOs.

</code_context>

<specifics>
## Specific Ideas

- Public penalty rows should be auditable but boring: reason category, affected Match, point impact.
- Active duplicate guard should prevent accidental spam but allow reruns after the previous exhibition completes.
- Valid-result criteria should be strict but allow explicitly degraded public evidence.

</specifics>

<deferred>
## Deferred Ideas

- Ranked ladder abuse controls.
- Account moderation/admin tooling.
- IP/device fingerprinting.
- Preset-weighted rate limits unless planning finds it trivial.
- Public operational dashboards.

</deferred>

---

*Phase: 18-Abuse and Fairness Guardrails*
*Context gathered: 2026-05-19*
