# Phase 203: Result Page Tactical Summary and Comparison Model - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 203 adds result-page Match Intelligence summaries, comparison panels, turning-point previews, replay jump links, and low-signal intelligence states using the Phase 202 app-side intelligence view model. It should improve the existing MatchSet result page, not create a separate destination, change public DTOs, infer hidden Strategy intent, or implement replay timeline/board tactical panels that belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Use the Phase 202 app-side intelligence view model as the result-page input.
- **D-02:** Public DTO/projection inputs only; no execution internals, owner-private data, raw diagnostics, or hidden Strategy data.
- **D-03:** Unsupported intelligence appears as explicit limitations.
- **D-04:** No `match-execution-app-v1` changes, no AI coach language, and no hidden-intent claims.

### Result Page Placement
- **D-05:** Add Match Intelligence as a scannable section on the existing MatchSet result page.
- **D-06:** Place it near the current lifecycle/availability evidence so it reads as post-Match evidence, not a detached report.
- **D-07:** Do not create a separate intelligence page in Phase 203.

### Panel Structure
- **D-08:** Use compact operational panels rather than marketing cards.
- **D-09:** Initial panels are `Intelligence Summary`, `Evidence Confidence`, `Turning Points`, `Match Comparison`, and `Limitations`.
- **D-10:** Panels should be dense, scan-friendly, and aligned with the existing result workbench tone.

### Comparison Grain
- **D-11:** Compare per Match first.
- **D-12:** Add entrant-level summary only when public Match rows and replay-backed evidence support it.
- **D-13:** If entrant-level comparison is low-confidence, show the limitation instead of synthesizing a winner narrative.

### Replay Links and Turning Points
- **D-14:** Turning-point previews should deep-link to replay focus or jump targets when available.
- **D-15:** When a replay link or focus target is unavailable, show a disabled/limited state with a public-safe reason.
- **D-16:** Turning-point previews should reference public evidence sequences/categories rather than hidden Strategy behavior.

### Low-Signal Result States
- **D-17:** Keep the intelligence section visible for queued, running, unavailable, failed, no-result, missing-Chronicle, and other low-signal result states.
- **D-18:** Low-signal states should render useful explanation and limitations rather than hiding the section.
- **D-19:** Every frozen fixture and v1.29 public trust fixture should have a meaningful result-page intelligence state.

### Copy Tone
- **D-20:** Use terse tactical inspection language.
- **D-21:** Avoid "AI insight", coaching, speculation, Strategy intent, or anthropomorphic claims.
- **D-22:** Copy should say what public evidence supports and what cannot be known.

### the agent's Discretion
- The agent may choose exact component names, section order within the result page, responsive layout details, and whether the panels reuse existing result workbench types or add adjacent app-only types, provided the decisions above hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Inventory shape, v1.29 baseline, fixture capability bands, and no DTO expansion stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Adapter location, public-only input boundary, output model, momentum style, limitations, and tests.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — RES-01 through RES-07 define Phase 203 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 203 scope and success criteria.

### Latest Shipped Baseline
- `.planning/research/v1.29-SUMMARY.md` — v1.29 result/replay trust polish research baseline.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 result/replay public page proof, privacy scans, board realism, and contract compatibility.
- `.planning/milestones/v1.29-REQUIREMENTS.md` — v1.29 completed public state coverage and contract boundary.

### Result Page Source
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Existing MatchSet result page integration point.
- `apps/web/app/matchsets/result-view-model.ts` — Existing result workbench state model and evidence sections.
- `apps/web/app/matchsets/evidence-copy.ts` — Existing public-safe evidence and privacy copy.
- `apps/web/lib/public-service-boundary.ts` — Public DTO projection path for result pages.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture-backed result/replay reads for local/test proof.
- `packages/spec/src/match-execution-contract.ts` — Frozen lifecycle, result/replay DTOs, fixture catalog, and privacy fields.

### Replay Link Source
- `apps/web/app/matches/types.ts` — Replay focus request/response types and replay-ready structures.
- `apps/web/app/matches/replay-ready.ts` — Existing focus moments and fallback behavior that Phase 203 can link toward.
- `apps/web/app/matches/[matchId]/replay/page.tsx` — Replay route query handling for focus moments/sequences.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The existing result view model already groups lifecycle, availability, failure/retry evidence, runtime eligibility, proof/privacy, and Match rows.
- Result page evidence copy already has public-safe language for lifecycle/failure states and privacy provenance.
- Replay focus mechanics already support moment/sequence query behavior that turning-point previews can deep-link into.

### Established Patterns
- Result page UI should stay dense and operational, matching the v1.27/v1.29 workbench feel.
- Fixture-backed proof should render every scenario without live execution services.
- Public copy should avoid internal field names and private implementation details.

### Integration Points
- Phase 203 consumes Phase 202's intelligence model and prepares replay links for Phase 204's annotation workbench.
- Phase 203 tests should likely extend result page fixture rendering tests and result view-model tests.
- Later Phase 208 visual proof will screenshot representative result intelligence states.

</code_context>

<specifics>
## Specific Ideas

- Panels: `Intelligence Summary`, `Evidence Confidence`, `Turning Points`, `Match Comparison`, `Limitations`.
- Compare per Match first; entrant-level summary only when public evidence supports it.
- Keep intelligence visible but limited for low-signal states so every fixture has a useful result.

</specifics>

<deferred>
## Deferred Ideas

- A separate intelligence report page is deferred; Phase 203 enhances the existing MatchSet result page.

</deferred>

---

*Phase: 203-Result Page Tactical Summary and Comparison Model*
*Context gathered: 2026-05-31*
