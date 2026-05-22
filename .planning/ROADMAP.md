# Roadmap: Coward's Game

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, shipped 2026-05-18. See `.planning/milestones/v1.1-ROADMAP.md`.
- ✅ **v1.2 Competitive Alpha** — Phases 14-18, shipped 2026-05-19. See `.planning/milestones/v1.2-ROADMAP.md`.
- ✅ **v1.3 Competition Trust Beta** — Phases 19-24, shipped 2026-05-20. See `.planning/milestones/v1.3-ROADMAP.md`.
- ✅ **v1.4 Cycle-Interleaved Rules Correction** — Phases 25-29, shipped 2026-05-20. See `.planning/milestones/v1.4-ROADMAP.md`.
- ✅ **v1.5 Strategy Workshop Power Tools and Advanced Strategy Library** — Phases 30-37, shipped 2026-05-21. See `.planning/milestones/v1.5-ROADMAP.md`.
- ✅ **v1.6 Workshop Analytics and Evidence Explorer** — Phases 38-44, shipped 2026-05-22. See `.planning/milestones/v1.6-ROADMAP.md`.
- ◆ **v1.7 Runtime and Backend Boundary Stabilization** — Phases 45-50, planning.

## Current Milestone: v1.7 Runtime and Backend Boundary Stabilization

**Status:** Planning
**Phases:** 45-50
**Total Plans:** TBD
**Requirements:** 32/32 mapped

## Overview

v1.7 makes Coward's Game ready for a future Go backend and multi-language Strategy runtimes without prematurely rewriting either system. The milestone freezes typed service and runtime contracts, proves behavior with golden parity fixtures, adds adapter/language metadata as a first-class compatibility concern, then runs one experimental non-JS runtime spike and one minimal read-only Go backend spike against those boundaries.

## Phases

### Phase 45: Service Boundary Contract

**Goal:** Define the backend API and typed service/client layer the web app needs while preserving existing persistence behavior.
**Requirements:** SVC-01 through SVC-06
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `packages/spec/src/schemas.ts`, `apps/web/app/workshop/server.ts`, `apps/web/app/competitive/server.ts`

Success criteria:

1. Typed service/API contracts cover auth/session, Strategy revisions, MatchSets, replay DTOs, analytics profiles/runs, exports, ladders, public pages, and health.
2. Next route handlers and server-facing page loaders begin moving behind a typed client/service layer instead of direct persistence workflow imports.
3. Public, owner-authorized, and internal DTO boundaries remain explicit and schema-validated.
4. Tests prove service-layer indirection preserves current web-visible DTO behavior and privacy guarantees.

### Phase 46: Strategy Runtime ABI

**Goal:** Define a language-neutral Strategy execution protocol for current JS/TS and future Go/Python/Rust adapters.
**Requirements:** ABI-01 through ABI-06
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`, `packages/runtime-js/src/adapter.ts`, `packages/runtime-js/src/subprocess-ipc.ts`, `packages/spec/src/types.ts`

Success criteria:

1. Runtime ABI schemas define request/response envelopes for `selectActivations` and `soldierBrain`.
2. ABI contracts cover source/package metadata, memory/objective/output limits, timeouts, runtime violations, system failures, version negotiation, and deterministic capability restrictions.
3. Runtime violations remain distinguishable from system failures and public-safe by default.
4. Existing JS/TS runtime behavior can be expressed through the ABI without weakening current isolation boundaries.

### Phase 47: Golden Parity Harness

**Goal:** Create fixtures proving unchanged behavior across service, engine, replay, analytics, export, runtime failure, privacy, and ordering boundaries.
**Requirements:** PAR-01 through PAR-06
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/PITFALLS.md`, `packages/test-utils/src/replay-scenarios.ts`, `packages/replay/src/project.ts`, `packages/spec/src/analytics.ts`

Success criteria:

1. Golden fixtures cover engine outcomes, Chronicle projection, scoring, MatchSet summaries, analytics summaries, replay deep links, exports, runtime failures, privacy redaction, and deterministic ordering.
2. Fixtures are consumable by TypeScript and future Go/non-JS runtime tests without depending on private implementation details.
3. Parity assertions compare canonical parsed values by default and reserve raw/hash comparisons for explicit serialization contracts.
4. Existing v1.6 analytics, replay, export, and privacy behavior remains unchanged under the fixture suite.

### Phase 48: Runtime Adapter Registry

**Goal:** Add first-class language/runtime adapter metadata and compatibility checks while keeping JS/TS fully enabled.
**Requirements:** REG-01 through REG-05
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/ARCHITECTURE.md`, `packages/runtime-js/src/adapter.ts`, `packages/runtime-js/src/revision.ts`, `packages/spec/src/types.ts`

Success criteria:

1. Registry exposes supported Strategy languages and runtime adapters with ids, versions, capabilities, limits, readiness, and isolation notes.
2. Strategy Revisions carry immutable language/runtime adapter metadata without breaking existing JS/TS revisions.
3. MatchSet, analytics, and gauntlet compatibility keys include behavior-significant adapter/language metadata.
4. Compatibility failures explain adapter/language mismatches clearly and fail closed.

### Phase 49: One Non-JS Runtime Spike

**Goal:** Add one deliberately small experimental non-JS runtime adapter through the same ABI.
**Requirements:** SPIKE-01 through SPIKE-04
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `packages/runtime-js/src/subprocess-adapter.ts`, `packages/runtime-js/src/subprocess-ipc.ts`

Success criteria:

1. One experimental non-JS runtime adapter executes through the same ABI as JS/TS subprocess-style execution.
2. Tiny fixture tests cover valid output, invalid output, timeout, thrown exception, stdout/stderr caps, and metadata.
3. The adapter is clearly marked experimental and not production hostile-code isolation.
4. Runtime failure projection remains public-safe and private internals stay out of public outputs by default.

### Phase 50: Go Backend Spike

**Goal:** Build a minimal read-only Go service against the frozen API shape and integrate one narrow web path.
**Requirements:** GO-01 through GO-05
**Status:** Pending
**Canonical refs:** `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/REQUIREMENTS.md`

Success criteria:

1. Go service implements health and at least one read-only endpoint from the service contract.
2. Go tests consume the same golden DTO fixtures or schema-compatible JSON as the TypeScript service boundary.
3. The web app can exercise one narrow read-only Go-backed path without moving orchestration, writes, jobs, or Strategy execution.
4. Documentation states what the spike proves and what remains TypeScript-owned.

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| SVC-01 through SVC-06 | Phase 45 | 6 |
| ABI-01 through ABI-06 | Phase 46 | 6 |
| PAR-01 through PAR-06 | Phase 47 | 6 |
| REG-01 through REG-05 | Phase 48 | 5 |
| SPIKE-01 through SPIKE-04 | Phase 49 | 4 |
| GO-01 through GO-05 | Phase 50 | 5 |

**Coverage:** 32/32 requirements mapped.

## Next Up

**Phase 45: Service Boundary Contract** — Define the typed service/API contract and start moving web routes toward that boundary.

Recommended next command:

`$gsd-discuss-phase 45`

## Recent Shipped Scope

<details>
<summary>✅ v1.6 Workshop Analytics and Evidence Explorer (Phases 38-44) — SHIPPED 2026-05-22</summary>

- [x] Phase 38: Analytics Evidence Model — stable analytics summaries, compatibility metadata, evidence bands, and privacy-safe DTO/schema guards.
- [x] Phase 39: Saved Gauntlet Profiles — saved, rerunnable, compatibility-equivalent gauntlet profiles without Strategy execution in web/API.
- [x] Phase 40: Matchup Heatmaps — Workshop heatmaps for matchup W-L-D, points, failures, side bias, evidence counts, and replay availability.
- [x] Phase 41: Evidence Explorer UX — sortable/filterable evidence drilldowns from Strategy to opponent to MatchSet to replay.
- [x] Phase 42: Replay Deep Links — deterministic public-safe links to meaningful replay moments.
- [x] Phase 43: Owner Export and Privacy — owner-only JSON/CSV gauntlet exports with privacy guards.
- [x] Phase 44: Demo, Docs, Verification — local v1.6 analytics demo, browser verification, docs, and no-open-finding milestone audit.

</details>

---
*Roadmap created: 2026-05-22*
*Last updated: 2026-05-22 after v1.7 milestone roadmap creation*
