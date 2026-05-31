# Phase 201: v1.30 Result/Replay Intelligence Signal Inventory - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 201 inventories the frozen public result/replay DTOs, fixture scenarios, replay-ready DTOs, public Chronicle projection fields, app view-model surfaces, v1.29 trust-polish fixtures, and proof artifacts that can support deterministic public-safe Match intelligence. It produces the baseline signal map for later v1.30 phases. It must not change `match-execution-app-v1`, add public DTO fields, depend on execution internals, or implement the intelligence UI.

</domain>

<decisions>
## Implementation Decisions

### Inventory Shape
- **D-01:** Use a full signal matrix rather than prose-only notes.
- **D-02:** The matrix should include source path, field or signal, public/gated/internal classification, supported intelligence use, privacy risk, fixture coverage, and downstream phase relevance.
- **D-03:** The inventory should explicitly distinguish public DTO/projection signals from owner/test-only diagnostics, owner Chronicle private sections, Go orchestration internals, runtime-service internals, persistence internals, raw diagnostics, and intentionally unstable surfaces.

### v1.29 Baseline
- **D-04:** Treat v1.29 as the latest shipped baseline for Phase 201.
- **D-05:** Include v1.29 app-only missing-Chronicle/no-result fixtures, replay trust cues, board realism proof, public page proof, and privacy/contract monitors as first-class inventory inputs.
- **D-06:** Preserve v1.29's contract stance: no public execution DTO expansion, no contract version bump, no Go/runtime-service/retry/recovery/quarantine/job lifecycle/scoring/Chronicle persistence changes, and no Strategy execution in web/API/Go.

### Fixture Capability Bands
- **D-07:** Classify every frozen public fixture and app-only v1.29 trust fixture into capability bands.
- **D-08:** Initial bands are `tactical-ready`, `summary-only`, `pending`, `unavailable`, `failed`, `missing-replay`, and `invalid-or-stale`.
- **D-09:** A fixture can support limited intelligence without supporting tactical replay analysis; the inventory must say "not enough public evidence" where appropriate instead of forcing insight.

### Contract Stance
- **D-10:** Phase 201 should decide that v1.30 planning proceeds without public DTO expansion.
- **D-11:** Any discovered signal gap should be recorded as a future contract-evolution note, not solved by changing `match-execution-app-v1` during Phase 201.
- **D-12:** The inventory should be useful to boundary monitors later, but monitor implementation belongs to Phase 209.

### Output Artifact
- **D-13:** Produce a Markdown inventory artifact as the canonical human-readable output.
- **D-14:** Add a small machine-readable JSON signal catalog only if it is cheap and clearly useful for later tests/monitors.
- **D-15:** The JSON catalog, if added, should mirror the Markdown decisions and not become a new public contract.

### the agent's Discretion
- The agent may choose the exact inventory artifact filename, table columns, and whether to include the optional JSON catalog, provided the artifact covers v1.29 baseline inputs and all Phase 201 requirements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v1.30 Milestone
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — BASE-01 through BASE-06 define Phase 201 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 201 scope and success criteria.
- `.planning/research/v1.30-SUMMARY.md` — v1.30 research baseline, uncertainties, public signals, watch-outs, and recommended phase shape.

### Latest Shipped Baseline
- `.planning/research/v1.29-SUMMARY.md` — v1.29 public result/replay trust-polish research and verification baseline.
- `.planning/milestones/v1.29-REQUIREMENTS.md` — v1.29 completed requirements and contract boundary.
- `.planning/milestones/v1.29-ROADMAP.md` — v1.29 delivered public result/replay trust-polish shape.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 proof artifact for public page proof, privacy scans, board realism, and contract compatibility.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/AUDIT.md` — v1.29 audit detail.

### Frozen Contract and Prior App Workbench
- `.planning/artifacts/v1.25-interface-freeze-decision.md` — Frozen `match-execution-app-v1` decision and intentionally unstable internals.
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md` — App-facing DTOs, public consumers, fixture catalog, and adapter gates.
- `.planning/artifacts/v1.25-match-execution-proof.md` — Fixture-mode and signed-in proof baseline.
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md` — v1.27 result/replay workbench requirements.
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md` — v1.27 result/replay workbench phase scope.
- `.planning/workstreams/v1-27-result-replay-workbench/VERIFY-WORK.md` — v1.27 fixture-backed verification and live compatibility note.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/198-desktop-mobile-visual-proof-across-all-fixtures/198-CONTEXT.md` — Desktop/tablet/mobile proof decisions.
- `.planning/workstreams/v1-27-result-replay-workbench/phases/199-live-signed-in-compatibility-proof-without-execution-internal-ui-coupling/199-CONTEXT.md` — Live compatibility and monitor strictness decisions.

### Source Surfaces
- `packages/spec/src/match-execution-contract.ts` — Frozen app-facing result/replay DTOs, lifecycle vocabulary, failure categories, fixture contract, privacy fields, and fixture catalog transforms.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture adapter gate and public fixture reads.
- `apps/web/lib/public-service-boundary.ts` — Public service DTO to app contract projection for result pages.
- `apps/web/app/matchsets/result-view-model.ts` — Existing result workbench view model and public state copy.
- `apps/web/app/matches/types.ts` — Replay-ready DTO, replay timeline entry, replay state, focus, and unavailable replay types.
- `apps/web/app/matches/replay-ready.ts` — Public replay projection, timeline creation, focus moments, and board realism validation.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts` — Replay timeline grouping and inspector helpers.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — Replay workbench public UI and gated owner debug surface.
- `apps/web/app/matches/[matchId]/replay/replay-unavailable.tsx` — Missing/invalid replay states.
- `packages/replay/src/project.ts` — Public vs owner Chronicle projection and privacy sanitization.
- `scripts/check-boundary-monitors.ts` — Existing boundary monitor source to inform later Phase 209 drift checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MATCH_EXECUTION_CONTRACT_FIXTURES_V1` in `packages/spec/src/match-execution-contract.ts` gives the frozen fixture catalog and app/service DTO shapes.
- v1.29 adds app-only missing-Chronicle/no-result trust fixtures and proof artifacts that should be inventoried without changing the frozen contract catalog.
- `ReplayReadyDto` already exposes public timeline entries, public board states, focus data, projection data, and owner-debug separation.
- `replay-ready.ts` already contains public event labels, supported focus moments, canonical start checks, in-bounds board validation, and projection failure paths.

### Established Patterns
- Public work must consume frozen DTOs or existing public service projections, not execution internals.
- Fixture mode is allowed for local/test proof only and must fail closed outside explicit gates.
- Public copy should say what public evidence supports and what is unavailable without naming private field internals.
- Browser proof and privacy scans are required for user-facing result/replay changes.

### Integration Points
- Phase 201 should add planning/artifact files only; implementation hooks begin in Phase 202.
- Later phases will likely connect to `result-view-model.ts`, replay-ready DTOs, replay timeline state helpers, fixture adapter tests, and boundary monitors.
- The inventory should prepare Phase 202's adapter inputs and Phase 209's monitor/audit targets.

</code_context>

<specifics>
## Specific Ideas

- Use capability bands: `tactical-ready`, `summary-only`, `pending`, `unavailable`, `failed`, `missing-replay`, and `invalid-or-stale`.
- Include v1.29 missing-Chronicle/no-result fixtures as first-class signal inventory inputs.
- Treat JSON output as optional and monitor-oriented, not as public API.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 201-v1.30 Result/Replay Intelligence Signal Inventory*
*Context gathered: 2026-05-31*
