# Phase 38: Analytics Evidence Model - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 38 defines the shared analytics evidence contracts for v1.6: gauntlet profiles, profile runs, MatchSet summaries, matchup records, evidence bands, compatibility metadata, archetype/tag snapshots, and compact replay references. It does not build saved-profile persistence, heatmap UI, explorer UI, replay viewer behavior, exports, or demo data; later phases consume the contracts defined here.

</domain>

<decisions>

## Implementation Decisions

### Contract Ownership

- **D-01:** Analytics evidence contracts live in `packages/spec` as first-class shared contracts.
- **D-02:** Phase 38 defines TypeScript DTOs plus Zod schemas for all outward analytics shapes.
- **D-03:** Spec schemas validate every boundary crossing: persistence outputs, web/API responses, export builders, and tests.
- **D-04:** Contracts should be organized in a dedicated analytics module, e.g. `packages/spec/src/analytics.ts`, with schema exports wired through `packages/spec/src/schemas.ts` and public exports from `packages/spec/src/index.ts`.

### Evidence Band Rules

- **D-05:** Strong evidence requires a strict counted, completed, replay-backed threshold.
- **D-06:** Mirrored side coverage is required for strong evidence when the profile includes mirrored side coverage.
- **D-07:** Degraded/non-counted evidence is its own overriding band; a matchup with degraded or non-counted MatchSets cannot be labeled strong.
- **D-08:** System-failed evidence overrides every other band so platform failure cannot masquerade as Strategy quality.
- **D-09:** Thin evidence means any counted, completed, replay-backed evidence below the strong threshold.
- **D-10:** Phase 38 should define named threshold constants with defaults and tests, such as `MIN_STRONG_MATCHES_STANDARD` and `REQUIRES_MIRRORED_SIDE_COVERAGE`, instead of vague configuration or anonymous magic numbers.

### Compatibility Keys

- **D-11:** Profile run comparison uses strict deterministic identity. Candidates, opponents, preset, seed set/order, mirror policy, scoring policy, rule version, Chronicle version, runtime adapter/version, and matrix expansion order are hard blockers when they differ.
- **D-12:** Display metadata never affects compatibility. Names, descriptions, notes, labels, and annotation text may change without changing the comparison key.
- **D-13:** Archetype tags do not affect compatibility, but tag snapshots are stored for interpretation and audit.
- **D-14:** Mismatch reasons are structured typed codes, not only display strings.
- **D-15:** Store both component compatibility fields and a canonical deterministic compatibility hash. The hash supports fast equality and grouping; component fields support explainable mismatch reasons.

### Replay Reference Shape

- **D-16:** Replay references are compact public moment references containing `matchId`, `momentType`, `sequence`, `label`, `side`, and fallback state.
- **D-17:** Replay references are generated from public projection data by default, not raw Chronicle private/owner events.
- **D-18:** Phase 38 defines a fixed v1.6 moment enum: `BACKSTAB`, `CONTRACTION`, `NO_ADVANCE_CLEANUP`, `FALL`, `DECISIVE_PUSH`, and `LATE_CYCLE_STABILIZATION`.
- **D-19:** Replay references include explicit typed fallback state, such as `TARGET_AVAILABLE`, `TARGET_UNAVAILABLE`, `MATCH_REPLAY_UNAVAILABLE`, or `TARGET_PRIVATE_OR_INCOMPATIBLE`.
- **D-20:** Replay references do not duplicate opponent/archetype/profile context. Surrounding matchup/export records carry that context.
- **D-21:** `sequence` is the stable public replay target for v1.6. Future phases may add richer moment ids if needed.
- **D-22:** If a target is unavailable, links may degrade to Match start only when a public replay exists and the fallback state explains the degradation.

### the agent's Discretion

- The user approved locking follow-on recommendations when they are strongly implied by prior locked decisions. Downstream planning can treat implied recommendations in this context as intentional decisions, not guesses.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Current milestone goals, core value, privacy constraints, and validated prior decisions.
- `.planning/REQUIREMENTS.md` — Phase 38 requirements AEM-01 through AEM-08 and milestone-wide privacy/runtime boundaries.
- `.planning/ROADMAP.md` — Phase 38 boundary, success criteria, and requirement mapping.
- `.planning/research/SUMMARY.md` — v1.6 research summary and prescriptive direction.

### Spec Contracts

- `packages/spec/src/types.ts` — Existing shared type style, Strategy/Chronicle/replay privacy types, runtime compatibility vocabulary, and canonical game terminology.
- `packages/spec/src/schemas.ts` — Existing Zod schema style and boundary-validation patterns.
- `packages/spec/src/index.ts` — Public spec package export surface.

### Evidence and Replay Inputs

- `packages/persistence/src/scoring.ts` — Existing MatchSet scoring, ranking, failed-system tracking, and deterministic ordering pattern.
- `packages/persistence/src/matchset-status.ts` — Existing MatchSet status summaries, replay availability flag, and degraded status handling.
- `packages/persistence/src/workshop.ts` — Existing Workshop snapshot/test summary shapes and current gauntlet creation boundary.
- `apps/web/app/matches/replay-ready.ts` — Public/owner replay projection and timeline construction used by compact replay references.
- `apps/web/app/matches/types.ts` — Replay page DTOs and timeline entry shape.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `packages/spec/src/schemas.ts`: Established Zod patterns for runtime validation and privacy-sensitive contracts.
- `packages/spec/src/types.ts`: Existing canonical ids, compatibility versions, Chronicle event types, privacy levels, and Strategy Revision metadata.
- `packages/persistence/src/scoring.ts`: Existing deterministic score aggregation and tie-break ordering can inform matchup records.
- `packages/persistence/src/matchset-status.ts`: Existing MatchSet status summaries already expose match status, side/player ids, outcome, winner, and replay availability.
- `apps/web/app/matches/replay-ready.ts`: Existing public projection and timeline builder can support public-sequence replay references.

### Established Patterns

- Shared contracts live in `packages/spec`; persistence and web import the shared types rather than inventing local public DTO semantics.
- Runtime validation uses Zod schemas in `packages/spec/src/schemas.ts`; new analytics schemas should match this pattern.
- Public privacy is enforced by DTO/projection shape, not by trusting React components to hide private fields.
- Determinism is expressed through stable ids, canonical ordering, explicit version fields, and deterministic sorting.
- Strategy code execution remains outside web/API; analytics contracts may describe runs and evidence, but not create any new runtime execution path.

### Integration Points

- `packages/spec/src/analytics.ts` should define the analytics DTO/type vocabulary.
- `packages/spec/src/schemas.ts` should export matching schemas and validation helpers for boundary crossing.
- `packages/spec/src/index.ts` should re-export analytics types/schemas for persistence and web consumers.
- Later persistence work should validate analytics summary outputs before returning them across service/API boundaries.
- Later replay work should generate compact references from public projection/timeline entries rather than raw private Chronicle events.

</code_context>

<specifics>

## Specific Ideas

- Strong evidence should be intentionally conservative so v1.6 heatmaps do not overstate weak samples.
- Compatibility should prioritize deterministic truth over convenience; blocked comparisons should explain precise mismatch causes.
- Replay references should stay compact; surrounding records should carry context.
- The user prefers full tradeoff framing for decisions with multiple valid options, but allows the agent to lock follow-ons that are strongly implied by prior decisions.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 38-Analytics Evidence Model*
*Context gathered: 2026-05-22*
