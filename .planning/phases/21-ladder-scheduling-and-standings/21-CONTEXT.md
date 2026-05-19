# Phase 21: Ladder Scheduling and Standings - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 21 turns eligible trial ladder season entries into deterministic MatchSets and standings. It owns pod scheduling, scheduling trigger/cadence, counted/non-counted policy, standings projection, tie-breakers, retry behavior, and public degraded/non-counted visibility.

This phase does not define season entry rules, public profiles, rich Strategy cards, dispute governance, result invalidation workflow, or runtime sandbox production selection.

</domain>

<decisions>
## Implementation Decisions

### Scheduling Shape
- **D-01:** Use small deterministic round-robin pods as the default scheduling shape.
- **D-02:** Target 4-player pods for v1.3, while leaving future flexibility for variable pod sizes.
- **D-03:** Leftover entries that do not fill a 4-player pod wait for the next scheduling run and show visible pending status.
- **D-04:** Pod assignment uses season seed plus stable entry identifiers and/or snapshot hashes. Do not rely on database row order or wall-clock timing.

### Scheduling Trigger and Cadence
- **D-05:** Use a hybrid trigger model: operators can trigger scheduling manually in v1.3, and a periodic job can later call the same deterministic scheduler.
- **D-06:** Build one deterministic scheduler function and expose it first as an operator action.
- **D-07:** The periodic path should assume a daily beta cadence for product copy/state, even while manual triggering is primary.
- **D-08:** Each scheduling run creates as many full 4-player pods as possible, leaving unmatched leftovers pending.
- **D-09:** Scheduling runs are idempotent no-ops when no new eligible full pods exist and should return a clear "no eligible full pods" result.

### Counted Result Policy
- **D-10:** A ladder MatchSet counts only when it is complete, valid, and evidence-backed.
- **D-11:** Counted MatchSets require all required Matches complete, scoring valid, replay/provenance evidence present, and no unresolved system failure remaining.
- **D-12:** Non-counted MatchSets remain visible but excluded from standings, with a clear public non-counted reason.
- **D-13:** Strategy runtime failures count as player penalties when classified as Strategy failures.
- **D-14:** System failures never become player losses.
- **D-15:** A MatchSet with unresolved exhausted system failure is non-counted/degraded. Do not count partial Matches, use ad hoc operator decisions, or convert missing evidence into draws.

### Standings Projection and Tie-breakers
- **D-16:** Standings are a recomputed projection from counted MatchSets and scoring evidence, with optional cache for display.
- **D-17:** Cached standings are not source of truth and must be rebuildable.
- **D-18:** Use the existing v1.2 points policy as the primary standings score: win/draw/loss points plus Strategy failure penalties.
- **D-19:** Use existing deterministic tie-breaker order: points, wins, surviving Soldiers, survival turns, then stable Strategy/entry id.
- **D-20:** Do not add head-to-head or strength-of-schedule tie-breakers in v1.3.
- **D-21:** Public standings should show compact visible breakdown: points, record, penalties, tie-breaker fields, and counted MatchSet evidence links.

### Retry and Degraded Handling
- **D-22:** Retries happen before counted/non-counted classification.
- **D-23:** System/orchestration failures retry up to policy limits before a MatchSet is classified for standings.
- **D-24:** Retry state is public but not noisy: season/MatchSet pages can show "retrying" or "delayed by system retry"; worker internals remain private.
- **D-25:** Use a small public non-counted/degraded reason taxonomy: system failure, incomplete evidence, invalid result, governance hold, and non-counted.
- **D-26:** Do not expose internal failure codes publicly.
- **D-27:** After retries are exhausted, classify the MatchSet as degraded/non-counted with a public reason and preserve available evidence.
- **D-28:** Do not update standings until valid complete counted evidence exists.

### the agent's Discretion
- The planner may choose exact public reason enum names if they preserve the locked taxonomy.
- The planner may choose the scheduler result object shape, provided it is deterministic and testable.
- The planner may choose whether standings cache is implemented in Phase 21 or deferred if recomputation is cheap enough.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — v1.3 trust constraints.
- `.planning/REQUIREMENTS.md` — SCHED-01 through SCHED-09 define Phase 21 requirements.
- `.planning/ROADMAP.md` — Phase 21 goal and success criteria.
- `.planning/research/SUMMARY.md` — v1.3 scheduling and standings direction.
- `.planning/phases/20-trial-ladder-season-model/20-CONTEXT.md` — locked season/entry lifecycle, withdrawal, and stale revision decisions.

### Existing Competition and Scoring
- `packages/spec/src/competition.ts` — existing public standing, Match evidence, MatchSet result DTO, scoring policy, and leak-safe result contracts.
- `packages/persistence/src/competition.ts` — existing pairwise MatchSet generation and public result mapping.
- `packages/persistence/src/scoring.ts` — existing points and deterministic tie-breakers to reuse.
- `packages/persistence/src/matchset-service.ts` — existing MatchSet creation from presets.
- `packages/persistence/src/matchset-status.ts` — existing MatchSet completion/degraded status aggregation.
- `apps/worker/src/runner.ts` — existing Match execution and failure classification path.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `generateCompetitionPairwiseMatrix()` can inform round-robin pod MatchSet generation.
- `scoreMatchSet()` already uses points, wins, surviving Soldiers, survival turns, and stable ids.
- `refreshMatchSetStatus()` already aggregates complete/degraded status and scoring.
- Public `PublicStandingDto` and `PublicMatchEvidenceDto` can inform season standings DTOs.

### Established Patterns
- v1.2 distinguishes Strategy failure from system failure and prevents system failure from becoming player losses.
- Public result DTOs already include provenance and privacy-safe publication metadata.
- Existing scoring is deterministic and independent of wall-clock time or database row order.

### Integration Points
- Add season scheduler service that reads eligible Phase 20 entries, groups full 4-player pods deterministically, and creates MatchSets.
- Add season standings service that projects counted MatchSets and exposes compact public standings.
- Add retry/degraded reason mapping for season pages without leaking worker internals.

</code_context>

<specifics>
## Specific Ideas

- Use "waiting for enough eligible entries" for leftover entry pending state.
- Use "daily scheduling window" copy for the future periodic path.
- Use "retrying" or "delayed by system retry" without public worker detail.

</specifics>

<deferred>
## Deferred Ideas

- Variable pod sizes.
- Swiss-style scheduling.
- Head-to-head and strength-of-schedule tie-breakers.
- Full periodic automation as the primary trigger.
- Governance invalidation workflow, handled in Phase 23.

</deferred>

---

*Phase: 21-Ladder Scheduling and Standings*
*Context gathered: 2026-05-19*
