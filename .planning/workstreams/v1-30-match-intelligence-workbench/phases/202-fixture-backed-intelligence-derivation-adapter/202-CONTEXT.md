# Phase 202: Fixture-Backed Intelligence Derivation Adapter - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 202 builds the deterministic app-side Match intelligence derivation adapter. It should consume only public result/replay DTOs, replay-ready public projections, public board states, public timeline entries, and fixture-backed public reads. It should not add UI panels yet, change `match-execution-app-v1`, create a shared public contract, depend on execution internals, or infer hidden Strategy intent.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Public DTOs and public replay projections are the only intelligence inputs.
- **D-02:** No `match-execution-app-v1` changes are allowed in this phase.
- **D-03:** v1.29 missing-Chronicle/no-result and trust-polish fixtures are part of the baseline.
- **D-04:** Low-signal states must say what cannot be known instead of inventing insight.

### Adapter Location
- **D-05:** Keep the intelligence adapter in `apps/web` for v1.30.
- **D-06:** Do not promote the adapter into a shared package during Phase 202 unless planning discovers real reuse that outweighs the risk of making app-only intelligence look like a public contract surface.
- **D-07:** The adapter should remain an app implementation detail, not a new service, runtime, execution, or DTO boundary.

### Input Boundary
- **D-08:** Accepted inputs are public result DTO/view-model data, replay metadata/evidence DTOs, `ReplayReadyDto`, public timeline entries, public board states, and fixture adapter outputs.
- **D-09:** The adapter must not consume owner Chronicle private sections, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, Go orchestration internals, runtime-service internals, persistence internals, private debug payloads, or operator/recovery details.
- **D-10:** The adapter should treat fixture data and live public DTO data the same after DTO projection so normal app proof remains fixture-backed.

### Output Model
- **D-11:** Return a single deterministic intelligence view model rather than a loose collection of helpers.
- **D-12:** The view model should include `evidenceBand`, `confidence`, `summary`, `turningPoints`, `timelineAnnotations`, `soldierProgression`, `boardControl`, `terrainStoneOccupancy`, `actionMix`, `engagements`, and `limitations`.
- **D-13:** Unsupported sections should be represented as empty-with-reason through `limitations`, not omitted mysteriously.
- **D-14:** Output should be stable enough for deterministic tests and later UI rendering.

### Momentum and Turning Points
- **D-15:** Use richer but copy-limited momentum scoring.
- **D-16:** The score may combine public event spikes, Soldier status changes, occupancy, contraction pressure, and engagement events.
- **D-17:** Labels and summaries must avoid claims about hidden Strategy intent, private objectives, private memory, or what a Strategy "wanted" to do.
- **D-18:** Momentum output should point to public evidence sequences and confidence bands so replay UI can make jump targets later.

### Low-Signal Behavior
- **D-19:** Every intelligence output should include explicit `limitations`.
- **D-20:** Queued, running, unavailable, failed, missing-replay, invalid-or-stale, missing-Chronicle, and no-result inputs should produce useful state-specific limitations.
- **D-21:** Completed replay-ready inputs may still be low-signal if the public projection lacks enough tactical events; that should be surfaced honestly.

### Test Stance
- **D-22:** Use fixture-backed unit tests across all frozen public fixture scenarios and v1.29 app-only public trust scenarios.
- **D-23:** Add deterministic snapshot-style checks for representative replay-ready data, but avoid brittle full-object snapshots if focused assertions give better signal.
- **D-24:** Tests must cover privacy denylist markers, deterministic output stability, unsupported section reasons, and no execution-internal imports.

### the agent's Discretion
- The agent may choose exact filenames, type names, helper decomposition, confidence scale, and whether snapshot-style tests are inline or fixture-backed, provided the app-side/public-only boundary and output shape are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Locks Phase 201 inventory shape, v1.29 baseline, fixture bands, and no-DTO-expansion stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — INTEL-01 through INTEL-08 define Phase 202 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 202 scope and success criteria.
- `.planning/research/v1.30-SUMMARY.md` — Public signals, candidate intelligence outputs, and watch-outs.

### Latest Shipped Baseline
- `.planning/research/v1.29-SUMMARY.md` — v1.29 public result/replay trust-polish research and verification baseline.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 proof artifact for public page proof, privacy scans, board realism, and contract compatibility.
- `.planning/milestones/v1.29-REQUIREMENTS.md` — v1.29 completed requirement groups and contract boundary.

### Source Surfaces
- `packages/spec/src/match-execution-contract.ts` — Frozen public result/replay DTOs, lifecycle/failure vocabulary, privacy fields, and fixture catalog.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture-backed app/test adapter and fail-closed gates.
- `apps/web/lib/public-service-boundary.ts` — Public DTO projection path used by result pages.
- `apps/web/app/matchsets/result-view-model.ts` — Existing result workbench view model to feed or sit beside intelligence view model.
- `apps/web/app/matches/types.ts` — `ReplayReadyDto`, timeline, board state, focus, and unavailable replay types.
- `apps/web/app/matches/replay-ready.ts` — Public replay projection, timeline construction, focus moments, and board realism validation.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Existing replay grouping and inspector helpers.
- `packages/replay/src/project.ts` — Public Chronicle projection sanitization and owner/private separation.
- `scripts/check-boundary-monitors.ts` — Existing monitor source for later no-internal-import checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `ReplayReadyDto` already packages the public replay projection, timeline, states, initial focus sequence, and optional owner debug separation.
- Existing replay focus moments in `replay-ready.ts` cover backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
- Existing result view model already groups lifecycle, availability, failure/retry, runtime, proof, privacy, and Match rows.
- Fixture adapter and v1.29 app-only fixtures provide local/test proof inputs without live execution services.

### Established Patterns
- Public pages consume frozen app-facing DTOs or public service DTO projections.
- Public projection code strips private payload keys and runs privacy leak checks.
- Board realism validation already enforces in-bounds Soldiers/terrain, no visible FALLEN occupants, no overlaps, and canonical starts where applicable.
- Workbench data should be deterministic and serializable so tests and proof artifacts can compare it.

### Integration Points
- Phase 202 should produce an adapter/model consumed by Phase 203 result panels and Phase 204/205 replay panels.
- Phase 209 can later monitor this adapter for forbidden imports and private-marker output.
- The adapter should likely live near existing result/replay app code until reuse pressure proves otherwise.

</code_context>

<specifics>
## Specific Ideas

- View model top-level fields: `evidenceBand`, `confidence`, `summary`, `turningPoints`, `timelineAnnotations`, `soldierProgression`, `boardControl`, `terrainStoneOccupancy`, `actionMix`, `engagements`, `limitations`.
- Momentum can be richer than simple event counts, but copy must read like public evidence interpretation, not an AI coach or hidden-intent analysis.

</specifics>

<deferred>
## Deferred Ideas

- Promoting the intelligence adapter to a shared package is deferred unless later phases prove real reuse.

</deferred>

---

*Phase: 202-Fixture-Backed Intelligence Derivation Adapter*
*Context gathered: 2026-05-31*
