# Phase 108: No-TypeScript-Backend Topology and Monitor Gate - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 108 turns the v1.16 retirement contracts into strict topology and monitor gates. It must prove normal product topology works as `web frontend -> Go backend -> isolated JS/TS Strategy runtime service`, with TypeScript service/backend disabled or absent except for frontend and the runtime service.

This phase does not add new product behavior. It enforces that the Phase 103-107 inventories, labels, runtime contract, web/API cutover, worker quarantine, privacy rules, route manifests, and representative page-load smoke stay synchronized and fail fast on drift.

</domain>

<decisions>
## Implementation Decisions

### Strict Topology Mode
- **D-01:** Add a v1.16 no-TypeScript-backend topology mode, for example `pnpm topology:check -- --require-v1-16-no-typescript-backend --json`.
- **D-02:** The v1.16 strict topology mode should include all v1.15 lifecycle and representative page-smoke checks plus stronger v1.16 no-TypeScript-backend assertions.

### Allowed TypeScript Processes
- **D-03:** Strict mode allows the web frontend and isolated JS/TS runtime service only.
- **D-04:** Strict mode must fail on normal TypeScript service/backend, TypeScript worker, direct web persistence access, or `@cowards/service` fallback for selected normal paths.

### Representative Page Smoke
- **D-05:** Preserve the v1.15 representative page-load smoke pattern.
- **D-06:** Extend page smoke where needed so every major page type still loads under strict topology.
- **D-07:** The milestone cannot be declared complete if any major page type fails to load under strict topology.

### Boundary Monitors
- **D-08:** `pnpm boundary:monitors` must consume v1.16 manifests, labels, runtime contracts, and topology evidence.
- **D-09:** Boundary monitors must fail on route manifest drift, label drift, monitor drift, runtime ABI drift, unsafe fallback, unexpected Strategy execution outside the runtime service, and public-output leaks.

### Failure Drills
- **D-10:** Stopped-Go and stopped-runtime-service drills must fail closed or classify failures explicitly.
- **D-11:** Failure drills must never recover by hitting retired TypeScript backend behavior.

### Privacy Denylist
- **D-12:** Monitors must fail on public/default leaks of Strategy source, StrategyMemory, SoldierMemory, objective payload, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.

### Evidence Artifacts
- **D-13:** Produce v1.16 topology, monitor, route/label sync, and failure-drill artifacts.
- **D-14:** Evidence artifacts must be audit-ready for Phase 109 without requiring archaeology through old phase notes.

### the agent's Discretion
The agent may choose exact topology flag name, artifact filenames, page smoke selection, and monitor implementation details, provided the final commands are clear and v1.16 strict mode proves no TypeScript backend fallback for selected normal runtime.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - Inventory and strict TypeScript role taxonomy.
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-CONTEXT.md` - Broker-ready runtime boundary and no-backend authority.
- `.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md` - Selected Go-only route cutover.
- `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md` - Worker/persistence quarantine requirements.
- `.planning/phases/107-deferred-surface-relabeling-and-privacy-preservation/107-CONTEXT.md` - Deferred surface labels and privacy floor.
- `.planning/REQUIREMENTS.md` - GATE-01 through GATE-09.
- `.planning/ROADMAP.md` - Phase 108 boundary and success criteria.

### Topology And Monitors
- `scripts/check-local-topology.ts` - Local topology checker and v1.15 lifecycle/page-smoke strict mode.
- `scripts/check-boundary-monitors.ts` - Boundary monitor closure gate.
- `scripts/check-service-boundary-imports.ts` - Web/service import boundary scanner.
- `package.json` - `topology:check` and `boundary:monitors` script definitions.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Go route manifest for sync checks.
- `.planning/artifacts/v1.15-live-web-go-runtime-topology.json` - v1.15 topology evidence baseline.
- `.planning/artifacts/v1.15-failure-drills.json` - Existing failure drill baseline.
- `.planning/artifacts/v1.15-typescript-surface-labels.json` - Existing TypeScript surface labels baseline.
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - Existing lifecycle ownership manifest baseline.

### Runtime And Privacy
- `packages/spec/src/runtime-execution-service.ts` - Runtime execution service contract.
- `packages/spec/src/runtime.ts` - Strategy runtime ABI.
- `packages/spec/src/public-output-privacy.ts` - Public-output privacy checks.
- `apps/runtime-service/src/execute-match.ts` - Runtime service execution boundary.
- `apps/go-backend/runtime_service_client.go` - Go runtime service invocation boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `--require-v1-15-lifecycle` in `scripts/check-local-topology.ts` already requires web, Go, runtime service, web-through-Go public Strategy read, and representative page smoke.
- `pnpm boundary:monitors` already composes contract checks, import boundary checks, Go parity, sandbox evaluation, topology, and custom boundary monitor checks.
- v1.15 artifacts already encode no-silent-TypeScript-backend-fallback and public-output privacy expectations.

### Established Patterns
- Topology checks should produce JSON evidence suitable for milestone artifacts.
- Boundary monitor failures should be deterministic and explicit, not report-only for v1.16 closure criteria.
- Route manifests, fixture manifests, runtime contracts, topology artifacts, TypeScript surface labels, and monitors must stay synchronized after route/runtime/ownership changes.

### Integration Points
- Phase 108 should update `scripts/check-local-topology.ts`, `scripts/check-boundary-monitors.ts`, and related tests.
- Page smoke must remain representative across major page types and verify load failures, not merely HTTP liveness.
- Failure drills need stopped-Go and stopped-runtime-service behavior classified without fallback.

</code_context>

<specifics>
## Specific Ideas

The user confirmed Phase 108 should be the milestone's enforcement phase with strict no-TypeScript-backend topology, monitor closure, failure drills, page smoke, and audit-ready evidence artifacts.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 108-No-TypeScript-Backend Topology and Monitor Gate*
*Context gathered: 2026-05-24*
