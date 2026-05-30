# Phase 194: Result Page State Model and Evidence Readability Pass - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 194 refactors and improves public MatchSet result page state modeling and evidence readability. It should make every fixture scenario render through a contract-derived result view model with clear public workbench sections. It does not change `match-execution-app-v1`, add live execution dependency, or move lifecycle/rules decisions into React components.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Use one canonical artifact/context where practical.
- **D-02:** Maintain strict boundary taxonomy and treat result UI dependencies outside frozen app-facing DTOs or public service projections as findings.
- **D-03:** Include browser/visual evidence for user-facing result UI touched by this phase.
- **D-04:** Fixture mode remains explicit, non-production gated, and fail-closed.

### View-Model Boundary
- **D-05:** Add or extend a dedicated non-React result view-model helper for MatchSet result state modeling.
- **D-06:** The helper should transform `match-execution-app-v1` DTOs or public service projections into page sections, badges, evidence rows, match ledger rows, empty states, and public-safe copy decisions.
- **D-07:** React components should render the view model rather than infer lifecycle, retry, availability, or failure meaning directly in JSX.
- **D-08:** Tests should assert all v1.25 fixture scenarios through the same view-model helper used by the page.

### Evidence Layout
- **D-09:** Organize public MatchSet evidence into workbench sections.
- **D-10:** Required sections should include lifecycle, availability/retry, Match ledger, runtime eligibility, provenance, and privacy.
- **D-11:** The layout should feel like a serious autonomous Match inspection workbench while avoiding runtime-internal timeline implications.
- **D-12:** Keep standings, entrants, Match ledger, replay links, and no-result states coherent even when fixtures lack standings or replay evidence.

### Copy Tone
- **D-13:** Use plain operational language for public failure, pending, degraded, retry, and unavailable states.
- **D-14:** Copy should be short, specific, and scannable, for example "Runtime unavailable; no public Match evidence yet."
- **D-15:** Avoid dramatic language, tutorial-like clutter, raw diagnostic phrasing, stack traces, host/env/token/DB/package details, and private runtime labels.

### the agent's Discretion
- The agent may decide exact helper filename, section component names, and copy strings, as long as they remain contract-derived, public-safe, and testable across fixtures.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/workstreams/v1-27-result-replay-workbench/phases/192-v1-25-app-contract-baseline-and-result-replay-ux-inventory/192-CONTEXT.md` — Carry-forward artifact/taxonomy/visual-proof defaults.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/193-fixture-catalog-browser-or-developer-fixture-switcher/193-CONTEXT.md` — Fixture catalog route and metadata decisions that will feed result-page proof.

### Milestone Planning
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — RES-01 through RES-06 define Phase 194 requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — Phase 194 scope and success criteria.
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md` — Result page findings and watch-outs.

### Result Page Source
- `packages/spec/src/match-execution-contract.ts` — Frozen lifecycle/result/replay/failure/runtime/privacy fields and fixtures.
- `apps/web/lib/public-service-boundary.ts` — Public MatchSet result DTO projection and current contract conversion.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — Current result page rendering and candidate integration point.
- `apps/web/app/matchsets/evidence-copy.ts` — Existing evidence copy and current model/copy coupling.
- `apps/web/app/matchsets/evidence-copy.test.ts` — Existing public evidence copy tests.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` — Existing all-fixture result-page proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PublicReadMatchSetResultDto` in `apps/web/lib/public-service-boundary.ts` already carries `contract` and `lifecycle` from the frozen app-facing contract.
- `matchSetEvidenceRows` in `apps/web/app/matchsets/evidence-copy.ts` already centralizes some evidence rows but should not become an unbounded React/model/copy bucket.
- Current result page already renders status strip, evidence panel, standings, entrants, Match ledger, replay links, and provenance.

### Established Patterns
- Result page data is fetched server-side through `getPublicMatchSetResult`.
- Entrant owner source links are server/current-user aware and must stay out of public default output for non-owners.
- Status chips use `statusChipClass`, but richer lifecycle/failure meaning should come from the view model.

### Integration Points
- New view-model helper should sit near `apps/web/app/matchsets/` or `apps/web/lib/` depending on local import patterns.
- The page component should become a renderer of model sections rather than a lifecycle decision point.
- Tests should cover all fixture IDs listed by `MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1` or equivalent exported fixture catalog.

</code_context>

<specifics>
## Specific Ideas

- Workbench sections should make evidence easy to scan rather than forcing users to decode a single dense details grid.
- Public copy should sound operational and calm.
- The page should not imply access to execution internals or raw runtime diagnostics.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 194-Result Page State Model and Evidence Readability Pass*
*Context gathered: 2026-05-30*
