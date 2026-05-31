# Phase 211: Result-State Explanation Polish - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 211 improves the public MatchSet result page explanation for existing lifecycle, failure, result availability, replay availability, retry disposition, Match ledger, entrant, and provenance data. It may change public copy, layout, tests, and fixture-backed page proof. It must not add public DTO fields or change execution behavior.

</domain>

<decisions>
## Implementation Decisions

### State Explanation
- **D-01:** Use existing `match-execution-app-v1` lifecycle/failure/availability fields as the source of truth for public copy.
- **D-02:** Explain target states in player language, but preserve canonical terms where relevant: Soldier, Match, Chronicle, STONE, FALLEN, etc.
- **D-03:** Include missing-Chronicle and no-result public explanations even if they require fixture/test coverage to become visible.

### Retry and Failure Copy
- **D-04:** Retryability must be public-level only: explain retryable/non-retryable meaning without retry counts, internal job attempts, operator actions, quarantine details, raw diagnostics, or recovery payloads.
- **D-05:** Strategy-caused failures, malformed runtime result, stale artifact, unavailable runtime, timeout, system failure, missing Chronicle, and no-result should remain distinct in copy.

### Layout
- **D-06:** Keep the result page utilitarian and scan-friendly. Prefer compact evidence rows, status strips, and ledger clarity over marketing-style cards.
- **D-07:** Long ids and long public messages must not break mobile or desktop layouts.

### the agent's Discretion
The agent may choose exact copy and component structure if it stays public-safe, concise, and consistent with existing app styles.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `STATE-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 211 success criteria.
- `.planning/research/v1.29-SUMMARY.md` - Current result UX findings.

### Result UX
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result page layout and Match ledger.
- `apps/web/app/matchsets/evidence-copy.ts` - Central result evidence copy.
- `apps/web/app/matchsets/evidence-copy.test.ts` - Current copy tests.
- `apps/web/app/globals.css` - Existing result/evidence layout classes.

### Contract and Fixtures
- `packages/spec/src/match-execution-contract.ts` - Lifecycle/failure/availability vocabulary.
- `packages/spec/src/match-execution-contract.test.ts` - Frozen fixture expectations.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Fixture read path.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Existing result page proof.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `matchSetEvidenceRows(result, entrantRuntimeLabels)` is the central place for result evidence copy.
- `statusChipClass` is the current status-to-chip mapping.
- The result page already has sections for Evidence, Standings, Entrants, Replay evidence, and Provenance.

### Established Patterns
- Result page is server-rendered and consumes public DTOs via `getPublicMatchSetResult`.
- Runtime labels use `runtimeExhibitionStatusLabel`.
- Existing UI uses `app-panel`, `status-strip`, `details-grid`, `evidence-panel`, and `match-ledger-table`.

### Integration Points
- Update copy tests before or alongside UI changes.
- Extend fixture E2E proof if new states become visible through fixture catalog.

</code_context>

<specifics>
## Specific Ideas

Add a compact "what this means" row or section that translates lifecycle + failure + availability into public player guidance without leaking internal diagnostics.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 211-Result-State Explanation Polish*
*Context gathered: 2026-05-31*
