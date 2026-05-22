# Phase 39: Saved Gauntlet Profiles - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 39 implements saved gauntlet profile persistence and run management. It lets users save, list, view, rename, annotate, rerun, and compare deterministic gauntlet profiles using immutable Strategy Revision ids and existing MatchSet/job infrastructure. It does not build matchup heatmaps, full evidence explorer UI, replay deep-link targeting, or export endpoints; later phases consume the saved profile/run model.

</domain>

<decisions>

## Implementation Decisions

### Profile Save Shape

- **D-01:** Profile name and notes are editable; test-defining fields are immutable after save.
- **D-02:** Test-defining fields include candidates, opponents, preset, seeds, scoring policy, mirror policy, rule version, Chronicle version, runtime adapter/version, matrix expansion order, and compatibility/profile schema version.
- **D-03:** Changing any test-defining field requires creating a new saved profile rather than editing the existing one.
- **D-04:** Candidate and opponent records store immutable Strategy Revision ids plus safe display snapshots.
- **D-05:** Display snapshots include safe labels, source hashes, tier, lineage, and archetype tags. They must not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals.
- **D-06:** Snapshot labels/tags are interpretive history, not compatibility inputs.
- **D-07:** Users can create profiles both before execution from the current Workshop selection and after execution from a completed/ad hoc run.
- **D-08:** Save-before-run profiles may exist with no runs yet; this empty state is valid.
- **D-09:** Save-from-run must preserve the run's exact original inputs, not the user's current UI selections.
- **D-10:** Saved profiles support both real account owners and the existing local Workshop owner (`user:local`).
- **D-11:** Profile DTOs must carry owner identity, such as `ownerUserId`, so export/privacy enforcement in Phase 43 can authorize both account-owned and local Workshop profiles.

### Rerun Behavior

- **D-12:** Each rerun creates a new immutable profile run under the same immutable saved profile.
- **D-13:** Runs are append-only history. Reruns never replace prior runs.
- **D-14:** Runs record `runId`, profile id, status, MatchSet ids, timestamps, compatibility key/hash, profile schema version, and summary state.
- **D-15:** Preflight validation blocks missing, invalid, unauthorized, or incompatible candidate/opponent revisions before creating a run or MatchSet jobs.
- **D-16:** There are no partial reruns in Phase 39. If users want changed inputs, they create a new profile.
- **D-17:** A blocked rerun may appear as a UI/preflight result, but it is not part of run comparison history.
- **D-18:** A profile can have at most one active run at a time. Active means queued or running.
- **D-19:** Duplicate-active prevention is enforced at the service level, not only by disabled UI.
- **D-20:** Duplicate-active responses identify the active run and offer status/refresh affordances.
- **D-21:** One profile run owns one or more MatchSets; the run summary aggregates all owned MatchSets deterministically.
- **D-22:** Do not bypass existing MatchSet/job infrastructure. Profile runs map deterministic matrix cells to MatchSet ids and Match ids where available.
- **D-23:** Profile schema version participates in run compatibility. Old and new runs are incompatible when analytics/profile schema changes affect expansion or comparison unless an explicit migration says otherwise.

### Comparison Experience

- **D-24:** Default comparison uses the two most recent compatible completed runs for the profile.
- **D-25:** Manual run selectors support other run comparisons and should show compatibility state before comparison.
- **D-26:** Only terminal runs with usable summaries are default comparison candidates. Incomplete, blocked, or currently running runs may appear in history but not as default targets.
- **D-27:** Run ordering is deterministic by completed timestamp, then run id.
- **D-28:** Phase 39 comparison provides profile-run summary deltas only.
- **D-29:** Summary deltas include total W-L-D, points, Strategy-failed counts, degraded/non-counted counts, system-failed counts, replay availability, run status, and aggregate evidence-band changes.
- **D-30:** Per-opponent, heatmap, and matrix deltas are intentionally left to Phases 40 and 41.
- **D-31:** Blocked comparisons show a structured mismatch checklist and no misleading delta.
- **D-32:** Mismatch checklist rows use typed reason codes from Phase 38 and include safe baseline/comparison values where available.
- **D-33:** The UI should guide users to create or rerun a compatible profile rather than offering an override.
- **D-34:** Runs have immutable generated labels plus optional owner notes/annotations. Run notes do not affect compatibility.
- **D-35:** Generated run labels should be deterministic and plain, such as timestamp/status/run ordinal.

### Failure and Status Semantics

- **D-36:** Profile status and run status are separate. Profiles are definitions; runs are executions.
- **D-37:** Profile status covers definition lifecycle, such as active/archived and whether an active run exists.
- **D-38:** Run status uses lifecycle status plus evidence flags, not one overloaded enum.
- **D-39:** Core run lifecycle states are `queued`, `running`, `complete`, and `blocked_preflight`.
- **D-40:** Evidence flags/rollups include degraded, Strategy-failed count, system-failed count, non-counted count, and replay-unavailable count.
- **D-41:** A run can be lifecycle `complete` while evidence flags indicate degraded/system/non-counted/replay issues.
- **D-42:** Strategy failures count as Strategy evidence and may affect run summary deltas and matchup evidence for the failing Strategy.
- **D-43:** System failures are platform evidence and must stay separate from Strategy quality.
- **D-44:** Public summaries can expose safe failure categories/counts, but not stack traces or private runtime internals.
- **D-45:** Replay-unavailable is an evidence flag, not a failed run.
- **D-46:** Replay-unavailable should appear in profile run summaries and comparison deltas, should not count as Strategy failure, and should reduce evidence confidence only where replay-backed evidence is required.
- **D-47:** v1.6 supports archive only, not hard delete. Archived profiles disappear from default lists but retain runs, comparisons, history, and future exports.
- **D-48:** Archived profiles should not be rerunnable unless restored.

### the agent's Discretion

- The user asked the agent to auto-lock decisions across v1.6 when they are obvious continuations of immutability, deterministic history, privacy, strict compatibility, existing failure taxonomy, or runtime isolation.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — v1.6 milestone goals, project constraints, and privacy/runtime boundaries.
- `.planning/REQUIREMENTS.md` — Phase 39 requirements SGP-01 through SGP-08.
- `.planning/ROADMAP.md` — Phase 39 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 research direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Locked analytics contracts, compatibility keys, evidence bands, and replay-reference decisions consumed by Phase 39.

### Existing Workshop and Persistence Code

- `packages/persistence/src/workshop.ts` — Current Workshop revision, opponent, preset, test MatchSet, and summary service patterns.
- `apps/web/app/workshop/server.ts` — Web/server boundary for Workshop actions; must continue delegating to persistence and never execute Strategy code.
- `apps/web/app/workshop/workshop-client.tsx` — Current Workshop UI patterns for selecting revisions/opponents/presets and launching tests.
- `packages/persistence/src/matchset-service.ts` — Existing MatchSet creation and preset matrix generation infrastructure.
- `packages/persistence/src/matchset-status.ts` — MatchSet status/scoring summary and replay availability patterns.
- `packages/persistence/src/repositories.ts` — Existing repository boundaries for Strategy Revisions, MatchSets, and persistence operations.
- `packages/persistence/src/scoring.ts` — Existing scoring and failure-count model that profile run summaries aggregate.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `WORKSHOP_USER_ID` and `WORKSHOP_PLAYER_ID` in `packages/persistence/src/workshop.ts` support the local Workshop owner path.
- `createWorkshopTestMatchSet` already validates a Workshop revision, resolves an opponent, and creates a MatchSet through existing infrastructure.
- `generatePresetMatrix` and `createMatchSetService(...).createFromPreset(...)` are the right execution spine for profile reruns.
- `refreshMatchSetStatus` and `listMatchStatusesForSet` provide the ingredients for run lifecycle and evidence flags.
- Existing scoring rankings already separate failed-system counts and Strategy score components.

### Established Patterns

- Web server modules delegate persistence work to `packages/persistence` and use a database pool wrapper.
- Workshop tests use immutable Strategy Revision ids and existing MatchSet/job infrastructure.
- Public/privacy-safe data is built in service DTOs; React components should not be trusted as privacy boundaries.
- MatchSet and scoring summaries use deterministic ordering and stable ids.

### Integration Points

- Add saved profile/profile run persistence in `packages/persistence` with migrations and service functions.
- Add Workshop server methods for save/list/view/rename/archive/rerun/compare profile operations.
- Add Workshop client surfaces for saved profile creation, run history, rerun status, and summary comparison.
- Validate outward DTOs against Phase 38 `packages/spec` analytics schemas at service/API/export boundaries.
- Add service-level guards for preflight blockers and duplicate active runs.

</code_context>

<specifics>

## Specific Ideas

- The saved profile is a stable deterministic definition; runs are execution history.
- The local Workshop owner is allowed for local demo and development, but is not a public sharing model.
- Saved profile run comparison in Phase 39 should stay summary-level and leave heatmap/explorer details to later phases.
- Archive-only preserves evidence history and avoids dangling references.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 39-Saved Gauntlet Profiles*
*Context gathered: 2026-05-22*
