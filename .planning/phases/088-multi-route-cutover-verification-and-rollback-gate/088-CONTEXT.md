# Phase 88: Multi-Route Cutover Verification and Rollback Gate - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 88 is the v1.13 verification and ownership decision gate. It proves route ownership, topology, privacy, no-fallback behavior, rollback behavior, boundary monitor coverage, and final promote/rollback/defer decisions across the selected route families. It may make small monitor/topology/evidence fixes, but it should not become a hidden implementation phase for missing route-family behavior. Missing behavior should be marked `rolled_back`, `deferred`, or `blocked` with evidence and v1.14 follow-up.

</domain>

<decisions>
## Implementation Decisions

### Gate Posture

- **D-01:** Phase 88 is an evidence and decision gate, not a new implementation phase.
- **D-02:** Small fixes to monitors, topology scripts, evidence formatting, privacy scans, and rollback documentation are allowed when needed to complete the gate.
- **D-03:** Missing or unsafe route-family implementation must be recorded as `rolled_back`, `deferred`, or `blocked` rather than quietly built during Phase 88.
- **D-04:** The gate should preserve TypeScript as explicit rollback/reference and prohibit silent fallback in Go-selected evidence paths.

### Evidence Matrix

- **D-05:** The final evidence matrix must cover selected route families: public reads, auth/session/account reads, account source/write/fork, and exhibition creation.
- **D-06:** Required drills include direct Go, web-through-Go, TypeScript rollback/reference, stopped-Go no-fallback, bad body, timeout, schema/privacy failure, divergence, and rollback behavior.
- **D-07:** Evidence should be route-family aware and route-specific enough to identify individual `go_primary`, `rolled_back`, `deferred`, or `blocked` routes.
- **D-08:** Evidence should include positive success paths and negative failure paths for each selected family where applicable.

### Privacy Sweep

- **D-09:** Final evidence must scan public, service, Go, topology, monitor, log, and generated evidence artifacts for prohibited private output.
- **D-10:** Prohibited output includes Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, cookies, host paths, DB DSNs, SQL details, password hashes, and private runtime internals.
- **D-11:** Privacy violations block `go_primary` promotion for the affected route family until fixed or rolled back.

### Boundary Baseline

- **D-12:** `pnpm boundary:imports` must remain `strict_offenses=0`.
- **D-13:** Broad report-only direct persistence offenses must not exceed 29 unless a documented ownership rebaseline explicitly explains the delta.
- **D-14:** Boundary monitors must validate the v1.13 route ownership manifest, selected owners, privacy classes, fallback/no-fallback policy, rollback owners, disallowed scopes, and final evidence artifacts.

### Final Decision Artifact

- **D-15:** Produce one final v1.13 ownership decision artifact listing every selected route as `go_primary`, `rolled_back`, `deferred`, or `blocked`.
- **D-16:** Each route decision must include evidence links, failure/rollback notes when relevant, explicit rollback instructions, and v1.14 leftovers.
- **D-17:** The final artifact must explicitly preserve deferred worker/runtime, Strategy execution, Go-owned migrations, full/private replay projection, production sandbox promotion, and counted non-JS play boundaries.

### the agent's Discretion

Downstream agents may choose exact artifact filenames, matrix layout, drill script flags, and evidence grouping, but Phase 88 must stay a gate: prove, record, roll back, or defer rather than silently expanding scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 goal and hard boundaries.
- `.planning/REQUIREMENTS.md` - GATE-01 through GATE-07 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 88 goal, success criteria, and dependencies.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership registry, promotion states, baseline evidence, and no-fallback decisions.
- `.planning/phases/083-go-persistence-and-live-dto-foundation/083-CONTEXT.md` - Live DB, schema/privacy, parity, and sanitized error decisions.
- `.planning/phases/084-public-read-ownership-cutover/084-CONTEXT.md` - Public read route family cutover and replay metadata scope.
- `.planning/phases/085-auth-session-and-account-read-ownership/085-CONTEXT.md` - Auth/session/account read cutover and token-safe evidence.
- `.planning/phases/086-account-strategy-revision-source-and-write-ownership/086-CONTEXT.md` - Owner-private source/write/fork cutover and no-execution boundary.
- `.planning/phases/087-exhibition-creation-ownership-and-worker-handoff/087-CONTEXT.md` - Exhibition creation, transactional parity, and worker handoff boundary.

### Existing Evidence and Monitors

- `.planning/artifacts/v1.13-cutover-scope-decision.md` - Aggressive cutover decision and selected/deferred families.
- `.planning/artifacts/v1.12-route-ownership-manifest.json` - Prior manifest to evolve from.
- `.planning/artifacts/v1.12-promotion-decision.md` - Prior `promote-none-yet` rationale.
- `.planning/artifacts/v1.12-live-web-go-topology.json` - Prior topology proof format.
- `scripts/check-boundary-monitors.ts` - Boundary monitor implementation to extend for v1.13.
- `scripts/check-local-topology.ts` - Topology and stopped-Go evidence pattern.
- `scripts/check-service-boundary-imports.ts` - Strict/report-only import baseline.

### Route and Service Contracts

- `packages/spec/src/service.ts` - Canonical route ids, schemas, auth scopes, privacy classes, and service error shapes.
- `packages/service/src/index.ts` - TypeScript service parity oracle and rollback/reference behavior.
- `apps/go-backend/main.go` - Go route implementation and diagnostics surface.
- `apps/web/lib/public-service-adapter.ts` - Existing selected-owner/no-fallback public read pattern.
- `apps/web/lib/account-service-adapter.ts` - Existing account read adapter pattern.
- `apps/web/app/competitive/server.ts` - Current auth/account/exhibition TypeScript behavior and rollback reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Boundary monitor scripts already check route ownership, privacy-safe fixture outputs, topology diagnostics, and import offense counts.
- Topology scripts already model direct Go, web-through-Go, stopped-Go, and public Strategy sentinel behavior.
- Phase 82-87 contexts define selected route families, route ownership states, no-fallback expectations, and deferred runtime boundaries.
- v1.12 final artifacts provide a proven format for topology and promotion decision records.

### Established Patterns

- Evidence artifacts must be public-safe and monitor-readable.
- TypeScript service is the parity oracle and explicit rollback/reference.
- Selected-Go paths fail closed when Go is unavailable, unsafe, divergent, or invalid.
- Worker/runtime, Strategy execution, Go-owned migrations, full/private replay projection, production sandbox promotion, and counted non-JS play remain deferred unless a future milestone explicitly promotes them.

### Integration Points

- Phase 88 should update and validate the Phase 82 ownership manifest rather than creating a disconnected final route list.
- Final decision artifacts should feed milestone audit/completion and v1.14 planning.
- Boundary monitors should enforce the final state so future changes cannot silently drift route ownership or privacy guarantees.

</code_context>

<specifics>
## Specific Ideas

Make the final artifact route-family aware but route-specific. Treat `go_primary` as earned by evidence, not assumed by implementation. Treat rollback instructions as first-class output for every selected route family, even when the intended rollback is code/config revert rather than runtime fallback.

</specifics>

<deferred>
## Deferred Ideas

- Implementing missing route-family behavior inside Phase 88 beyond small monitor/topology/evidence fixes.
- Worker/runtime ownership, Match execution, Chronicle generation, scoring completion, and runtime failure classification in Go.
- Strategy execution, Workshop tests, production sandbox promotion, counted non-JS play, Go-owned migrations, and engine/rules changes.

</deferred>

---

*Phase: 88-Multi-Route Cutover Verification and Rollback Gate*
*Context gathered: 2026-05-23*
