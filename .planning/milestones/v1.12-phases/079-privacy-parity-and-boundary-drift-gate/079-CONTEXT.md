# Phase 79: Privacy, Parity, and Boundary Drift Gate - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 79 makes the selected route decision mechanically hard to drift. It should test, monitor, and scan whatever Phase 78 produced, whether that is `promote-none-yet` or a candidate Go-owned path. It must not add new route ownership, reduce the parity/privacy bar, expand the Go manifest by surprise, or turn this cutover-readiness milestone into another web boundary burn-down.

</domain>

<decisions>
## Implementation Decisions

### Gate Strictness
- **D-01:** Fail hard on any selected-route privacy, parity, manifest, switch, or production-promotion guardrail drift.
- **D-02:** Warnings are acceptable only for unrelated evidence-only routes when they are clearly non-production and cannot affect the selected route.
- **D-03:** Production promotion blockers must remain binary gates, not advisory findings.

### Artifact Scanning Scope
- **D-04:** Privacy scans must cover every public or artifact-like output, not only HTTP responses.
- **D-05:** Scan responses, logs, topology JSON, monitor output, evidence artifacts, diagnostics, and route owner status artifacts.
- **D-06:** The forbidden marker set includes Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, response body excerpts, and private runtime internals.

### Manifest Drift Policy
- **D-07:** Keep the Go manifest exactly at the existing five GET-only entries during Phase 79 unless a later approved phase explicitly revises the ownership manifest.
- **D-08:** Do not allow surprise manifest expansion in Phase 79.
- **D-09:** New evidence-only GET entries are not part of Phase 79 unless explicitly marked non-production in an updated ownership manifest from an approved prior change.

### Boundary Count Policy
- **D-10:** `report_only_offenses` may remain at 29.
- **D-11:** `report_only_offenses` must not increase above 29.
- **D-12:** `strict_offenses` must remain 0.
- **D-13:** Phase 79 is a cutover-readiness gate, not a service-boundary debt burn-down phase.

### the agent's Discretion
Planner may choose exact scanner implementation and monitor wiring, provided all public/artifact-like outputs are covered and the selected-route production guardrails fail hard.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/076-scope-lock-and-route-ownership-manifest/076-CONTEXT.md` — Ownership manifest, all-or-nothing gate, baseline evidence, and no-go record decisions.
- `.planning/phases/077-production-read-switch-contract/077-CONTEXT.md` — Switch contract, failure classes, client boundary, and diagnostics privacy split.
- `.planning/phases/078-conditional-public-strategy-go-read-path/078-CONTEXT.md` — Live-data threshold, no-go behavior, full parity cases, and page behavior decisions.

### Active Milestone
- `.planning/PROJECT.md` — Current v1.12 milestone posture and non-goals.
- `.planning/REQUIREMENTS.md` — GATE requirements and traceability.
- `.planning/ROADMAP.md` — Phase 79 scope and dependencies.
- `.planning/research/SUMMARY.md` — Privacy, parity, route manifest, and boundary monitor recommendations.

### Code References
- `scripts/check-boundary-monitors.ts` — Existing monitor composition and Go route manifest checks.
- `scripts/check-local-topology.ts` — Existing topology diagnostics and sanitization.
- `scripts/check-service-boundary-imports.ts` — Strict/report-only boundary offense policy.
- `scripts/generate-go-parity-fixtures.ts` — Go parity fixture and manifest generation.
- `packages/spec/src/service.ts` — `assertPublicServiceDtoLeakSafe` and canonical route metadata.
- `packages/spec/src/schemas.ts` — Canonical service DTO and error schemas.
- `packages/service/src/service.test.ts` — Existing public DTO privacy and public Strategy tests.
- `apps/go-backend/main_test.go` — Existing Go route privacy, manifest, and fixture tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `runBoundaryMonitorChecks` in `scripts/check-boundary-monitors.ts`: existing aggregate monitor runner to extend for selected-route cutover guardrails.
- `assertPublicServiceDtoLeakSafe` in `packages/spec/src/service.ts`: canonical DTO privacy guard.
- `safeDetail` and `sanitizeDiagnosticUrl` in `scripts/check-local-topology.ts`: existing diagnostic sanitization patterns.
- `knownReportOnlyBoundaryOffenses` in `scripts/check-boundary-monitors.ts`: current report-only debt baseline.

### Established Patterns
- Go route manifest checks already require known route ids, GET methods, alignment with `SERVICE_API_ROUTES`, and bearer-token marking for owner routes.
- Topology output and monitor details are already treated as public-safe diagnostic artifacts.
- Spec-owned privacy guards are preferred over route-specific ad hoc string checks.

### Integration Points
- Phase 79 should consume the ownership manifest and switch/failure outputs from Phases 76-78.
- Phase 79 outputs feed Phase 80 rollback/failure drills and Phase 81 final verification.

</code_context>

<specifics>
## Specific Ideas

Keep Phase 79 focused on non-regression and production-readiness gates. Do not require another reduction in broad web report-only offenses.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 79-Privacy, Parity, and Boundary Drift Gate*
*Context gathered: 2026-05-23*
