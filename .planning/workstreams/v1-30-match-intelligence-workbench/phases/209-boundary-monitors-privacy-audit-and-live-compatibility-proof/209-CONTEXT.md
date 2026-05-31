# Phase 209: Boundary Monitors, Privacy Audit, and Live Compatibility Proof - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 209 turns v1.30's public-only intelligence boundaries into hard monitor, privacy audit, and compatibility proof gates. It should protect the frozen contract, fixture gates, privacy surface, ownership boundaries, and non-claims. It may run signed-in live result/replay compatibility proof where local services are available, but fixture-backed proof remains the normal UI proof. It must not claim runtime readiness, promotion, sandbox certification, ABI migration, counted non-JS support, or live execution coverage beyond compatibility.

</domain>

<decisions>
## Implementation Decisions

### Carry-Forward Defaults
- **D-01:** Monitors should hard-block contract drift, private leakage, fixture fallback, and ownership creep.
- **D-02:** Live proof is compatibility evidence, not readiness or promotion evidence.
- **D-03:** Fixture proof remains the normal UI proof.

### Monitor Scope
- **D-04:** Hard-block contract/version drift.
- **D-05:** Hard-block fixture coverage gaps and production fixture fallback.
- **D-06:** Hard-block private marker leakage and owner/test-only leakage.
- **D-07:** Hard-block private/internal imports and execution ownership creep.
- **D-08:** Hard-block runtime promotion claims, production sandbox certification claims, direct-export or Component Model/WIT ABI migration claims, counted non-JS claims, and Strategy execution in web/API/Go.

### Import Boundaries
- **D-09:** Monitors should fail on intelligence/result/replay imports from runtime-service internals.
- **D-10:** Monitors should fail on imports from Go orchestration internals, persistence internals, owner Chronicle private sections, private debug payloads, quarantine/recovery/operator internals, and raw diagnostics.
- **D-11:** Public intelligence should consume only app/public DTOs, public service projections, replay-ready public data, and fixture-gated public reads.

### Privacy Audit Targets
- **D-12:** Audit schema artifacts, fixture JSON, intelligence model outputs, rendered result pages, rendered replay pages, gated diagnostics, proof artifacts, and Markdown docs.
- **D-13:** Audit should scan for Strategy source, StrategyMemory, SoldierMemory, objective payloads, awareness-grid private data, raw diagnostics, stacks, host paths, env values, tokens, DB details, package paths, runtime internals, quarantine details, recovery details, and operator details.
- **D-14:** Markdown docs should be scanned enough to prevent proof/audit artifacts from becoming leak paths.

### Live Compatibility
- **D-15:** Run signed-in result/replay open proof where local services exist.
- **D-16:** If local services or env vars are unavailable, record fail-loud environment absence and do not claim live proof.
- **D-17:** Live compatibility should consume frozen/public DTOs only and scan result/replay pages for private markers.
- **D-18:** Do not broaden live proof into runtime promotion, sandbox, ABI, or counted non-JS proof.

### Proof Language
- **D-19:** Preferred wording: "Opened live result/replay pages through frozen/public DTOs; no runtime promotion, sandbox certification, ABI migration, counted non-JS, or execution-internal UI dependency claimed."
- **D-20:** Avoid "ready for live use", "production intelligence certified", "runtime-safe", or similar overclaims.
- **D-21:** Proof artifacts should list what was proven, what was fixture-backed, what was live compatibility, and what was not claimed.

### Fixture Fallback
- **D-22:** Use both monitor checks and dynamic proof for fixture mode fallback.
- **D-23:** Static source checks alone are not enough.
- **D-24:** Dynamic proof should simulate disabled or production-like fixture gates and verify fixture routes/reads fail closed.

### the agent's Discretion
- The agent may choose exact monitor markers, proof script names, artifact filenames, and local-service detection approach, provided hard-block scope and non-claim language are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior v1.30 Context
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/201-v1-30-result-replay-intelligence-signal-inventory/201-CONTEXT.md` — Signal inventory and fixture bands.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/202-fixture-backed-intelligence-derivation-adapter/202-CONTEXT.md` — Adapter input/output boundary and forbidden private inputs.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/203-result-page-tactical-summary-and-comparison-model/203-CONTEXT.md` — Result-page public intelligence behavior.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/204-replay-timeline-annotation-and-jump-target-workbench/204-CONTEXT.md` — Replay annotation public-only boundary.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/205-soldier-status-board-control-terrain-stone-and-action-mix-panels/205-CONTEXT.md` — Tactical panels and board-control public-only boundary.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/206-degraded-unavailable-queued-running-failed-and-missing-chronicle-intelligence-states/206-CONTEXT.md` — State-specific public-safe intelligence copy.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/207-owner-test-only-gated-deeper-analysis-review/207-CONTEXT.md` — Gated diagnostics allowed/forbidden content and gate model.
- `.planning/workstreams/v1-30-match-intelligence-workbench/phases/208-desktop-mobile-visual-proof-across-fixtures/208-CONTEXT.md` — Visual proof, dynamic fixture fail-closed, and artifact stance.
- `.planning/workstreams/v1-30-match-intelligence-workbench/REQUIREMENTS.md` — MON-01 through LIVE-03 define Phase 209 requirements.
- `.planning/workstreams/v1-30-match-intelligence-workbench/ROADMAP.md` — Phase 209 scope and success criteria.

### Monitor and Proof Baseline
- `.planning/workstreams/v1-27-result-replay-workbench/phases/199-live-signed-in-compatibility-proof-without-execution-internal-ui-coupling/199-CONTEXT.md` — Compatibility-only live proof and monitor strictness decisions.
- `.planning/artifacts/v1.29-replay-result-trust-proof.md` — v1.29 public proof, privacy scans, board realism, contract compatibility, and non-claims.
- `scripts/check-boundary-monitors.ts` — Existing boundary monitor implementation to extend.
- `scripts/check-boundary-monitors.test.ts` — Monitor tests.
- `package.json` — Existing monitor/proof scripts.
- `playwright.config.ts` — Browser proof setup and fixture-mode web server context.

### Boundary Source
- `packages/spec/src/match-execution-contract.ts` — Frozen contract version, public DTOs, privacy fields, and fixture catalog.
- `apps/web/lib/match-execution-fixture-adapter.ts` — Fixture gate source.
- `apps/web/lib/public-service-boundary.ts` — Public DTO projection path.
- `apps/web/app/matches/replay-ready.ts` — Public replay projection and validation path.
- `packages/replay/src/project.ts` — Public vs owner Chronicle projection.
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts` — Existing owner-debug gate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-boundary-monitors.ts` already contains v1.25/v1.26/v1.28/v1.29 contract, privacy, ownership, and non-claim checks.
- Existing monitor tests can be extended for v1.30 intelligence-specific markers.
- Existing Playwright/fixture proof setup can support live compatibility or fail-loud absence reporting.

### Established Patterns
- Monitor failures should be hard errors, not advisory notes.
- Live proof artifacts should distinguish fixture-backed proof from live compatibility proof.
- Local service absence should fail loudly or be recorded as absence, never silently passed as live proof.

### Integration Points
- Phase 209 validates and hardens code from Phases 202-208.
- Phase 210 consumes Phase 209 proof and monitor outputs for final audit/archive.

</code_context>

<specifics>
## Specific Ideas

- Preferred proof language: "Opened live result/replay pages through frozen/public DTOs; no runtime promotion, sandbox certification, ABI migration, counted non-JS, or execution-internal UI dependency claimed."
- Use both static monitors and dynamic fixture fail-closed proof.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 209-Boundary Monitors, Privacy Audit, and Live Compatibility Proof*
*Context gathered: 2026-05-31*
