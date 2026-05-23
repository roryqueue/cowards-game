# Phase 84: Public Read Ownership Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 84-Public Read Ownership Cutover
**Areas discussed:** Cutover slice, Default routing, Replay scope, Failure behavior, Route switches

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Cutover slice | Decide whether selected public reads move together as a route family or one at a time. | ✓ |
| Default routing | Decide whether selected v1.13 public reads default to Go or TypeScript. | ✓ |
| Replay scope | Decide whether Phase 84 includes only public replay metadata or broader replay projection. | ✓ |
| Failure behavior | Decide how selected-Go public read failures behave. | ✓ |
| Route switches | Decide whether to extend the single public Strategy switch or replace it with multi-route ownership. | ✓ |

**User's choice:** approved recommended checkpoint.
**Notes:** User approved all recommended Phase 84 decisions.

---

## Cutover Slice

| Option | Description | Selected |
|--------|-------------|----------|
| Public route family | Promote public Strategy, player, ladder, MatchSet summary, and replay metadata together after Phase 83 gates pass. | ✓ |
| Single-route increments only | Continue route-by-route single switch promotion. | |

**User's choice:** approved recommended decision.
**Notes:** Evidence must still identify individual routes that block or roll back.

---

## Default Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Go default for selected topology | Selected v1.13 public reads use Go by default; TypeScript is explicit rollback/reference only. | ✓ |
| TypeScript default with optional Go | Keep production/default public reads on TypeScript unless manually switched per route. | |

**User's choice:** approved recommended decision.
**Notes:** Silent per-request TypeScript fallback remains prohibited for Go-selected evidence paths.

---

## Replay Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata only | Include public replay metadata and keep full/private replay projection out of scope. | ✓ |
| Full replay migration | Move replay projection and owner-debug/private replay assembly to Go. | |

**User's choice:** approved recommended decision.
**Notes:** Replay privacy remains too sensitive to broaden during public read cutover.

---

## Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed, public-safe | Go unavailable, timeout, invalid JSON, schema/privacy failure, divergence, unsafe links, and malformed IDs fail closed. | ✓ |
| Best-effort fallback | Use TypeScript fallback when Go-selected public reads fail. | |

**User's choice:** approved recommended decision.
**Notes:** Stopped-Go drills must prove no silent fallback.

---

## Route Switches

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-route ownership mechanism | Replace the single public Strategy switch with route-family or manifest-backed ownership. | ✓ |
| Extend current single flag only | Add more one-off flags modeled on `COWARDS_GO_PUBLIC_STRATEGY_READS`. | |

**User's choice:** approved recommended decision.
**Notes:** Monitors need structured selected-owner visibility across the public read family.

## the agent's Discretion

- Exact env var names, adapter shape, and monitor artifact structure may be chosen during planning.
- Multi-route, Go-default, schema/privacy-validated, parity-tested, fail-closed behavior is locked.

## Deferred Ideas

- Full replay projection and owner-debug replay migration.
- Auth/session and account routes.
- Account write/fork/source routes.
- Exhibition creation, worker/runtime, Strategy execution, migrations, and engine changes.
