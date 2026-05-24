# Phase 96: Boundary Baseline and Go Ownership Contract - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 96 creates the source-of-truth v1.15 ownership baseline before implementation. It should record current Go route ownership, remaining TypeScript job/runtime/replay/scoring ownership, report-only web persistence offenses, topology and monitor gaps, explicit non-goals, and the ownership vocabulary downstream phases must use.

</domain>

<decisions>
## Implementation Decisions

### Ownership Manifest Shape

- **D-01:** Create a new v1.15 lifecycle ownership manifest rather than merely extending the v1.14 route manifest.
- **D-02:** The manifest should cover routes plus job claim/lease, runtime execution handoff, Chronicle persistence, Match completion, MatchSet scoring, public evidence, topology, monitors, fallback policy, and rollback owners.
- **D-03:** The v1.14 route ownership manifest remains canonical prior art, but v1.15 needs a broader lifecycle model because normal backend ownership now crosses non-route surfaces.

### TypeScript Role Labels

- **D-04:** Use strict labels for remaining TypeScript surfaces: `parity_only`, `rollback_only`, `test_only`, `runtime_only`, `deferred`, and `frontend`.
- **D-05:** Reserve `runtime_only` for the isolated JS/TS Strategy execution service or worker.
- **D-06:** A `runtime_only` surface must not own normal DB job claiming, Match completion, Chronicle persistence, MatchSet scoring, or product API fallback behavior.

### No-Fallback And Rollback Semantics

- **D-07:** Every selected Go surface must declare fallback policy, rollback owner, stopped-Go behavior, and stopped-runtime behavior when applicable.
- **D-08:** The default policy is no silent TypeScript backend fallback when Go is selected.
- **D-09:** The manifest must explicitly forbid mixed DB-completing owners for normal product queues. Go and TypeScript workers must not claim or complete the same normal jobs concurrently.
- **D-10:** Rollback is an explicit operator action: stop Go orchestration, switch ownership back to the documented TypeScript rollback owner, and start the legacy TypeScript DB-owning worker only in that rollback mode.

### Baseline Evidence Package

- **D-11:** Phase 96 should produce both a human-readable baseline artifact and a machine-readable v1.15 lifecycle ownership manifest.
- **D-12:** The baseline artifact should record report-only offense count, route ownership, TypeScript job/completion/scoring/replay code references, topology gaps, current monitor gaps, v1.14 artifact links, and exact deferred scopes.
- **D-13:** All baseline and manifest outputs must be public-safe by default: no Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals.

### the agent's Discretion

The agent may choose the exact JSON schema names and Markdown artifact layout, provided the manifest is machine-readable, the baseline is human-auditable, and all fields preserve the labels and no-fallback semantics above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, core value, and active constraints.
- `.planning/REQUIREMENTS.md` — BASE-01 through BASE-06 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 96 goal, success criteria, and phase sequencing.
- `.planning/STATE.md` — Active milestone state and deferred-scope warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended ownership flow.

### Prior Ownership Evidence

- `.planning/artifacts/v1.14-route-ownership-manifest.json` — Prior route-family manifest and runtime boundary fields to supersede with v1.15 lifecycle ownership.
- `.planning/artifacts/v1.14-promotion-decision.md` — Promoted v1.14 artifact/runtime decisions and deferred backend/runtime surfaces.
- `.planning/artifacts/v1.14-live-web-go-topology.json` — Current topology evidence shape and limitations.
- `.planning/artifacts/v1.14-boundary-baseline.md` — Prior strict/report-only offense baseline and v1.14 boundary findings.
- `.planning/milestones/v1.14-MILESTONE-AUDIT.md` — Audit-passed constraints and remaining deferred scope.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Original architecture boundaries and backend/runtime/replay roles.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/check-boundary-monitors.ts`: Existing monitor entry point with v1.14 route ownership parsing, runtime boundary checks, and known report-only offense baseline.
- `scripts/check-service-boundary-imports.ts`: Source of strict/report-only direct persistence offense accounting.
- `.planning/artifacts/v1.14-route-ownership-manifest.json`: Prior manifest schema and field vocabulary for route owner, selected owner, fallback policy, rollback owner, evidence required, and disallowed scopes.
- `apps/web/lib/public-service-adapter.ts` and `apps/web/lib/account-service-adapter.ts`: Existing Go-selection and fail-closed patterns for selected route families.

### Established Patterns

- Route ownership manifests are JSON artifacts under `.planning/artifacts/` and are checked by boundary monitors.
- Promotion decisions are recorded as Markdown artifacts with explicit promoted/deferred/evidence/privacy sections.
- Selected Go paths use `no_fallback_when_go_selected` and require `COWARDS_GO_BACKEND_URL`.
- Report-only direct persistence offenses remain visible in monitors rather than hidden.

### Integration Points

- Phase 96 should add a v1.15 lifecycle manifest artifact under `.planning/artifacts/`.
- Phase 96 should extend or prepare `scripts/check-boundary-monitors.ts` to understand lifecycle surfaces, not just route families.
- Phase 96 should reference TypeScript-owned lifecycle code in `apps/worker/src/runner.ts`, `packages/persistence/src/jobs.ts`, `packages/persistence/src/complete-match.ts`, `packages/persistence/src/chronicle-store.ts`, `packages/persistence/src/matchset-status.ts`, and `packages/persistence/src/scoring.ts`.

</code_context>

<specifics>
## Specific Ideas

The phase should be crisp and contract-heavy. It is not an implementation phase for Go job claiming yet; it should make later phases hard to misunderstand by naming owners, fallback, rollback, and disallowed scopes exactly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 96-Boundary Baseline and Go Ownership Contract*
*Context gathered: 2026-05-24*
