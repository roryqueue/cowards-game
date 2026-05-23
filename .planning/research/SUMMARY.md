# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.13 Go Backend Ownership Cutover
**Domain:** Go backend API ownership, live persistence-backed DTO assembly, route cutover, session/account mutations, exhibition creation, privacy-safe diagnostics
**Researched:** 2026-05-23
**Confidence:** HIGH for repo-local route inventory, service boundaries, privacy gates, and v1.12 blockers; MEDIUM for mutation cutover until implementation proves auth/session and Strategy Revision parity.

## Executive Summary

v1.13 should be a decisive Go backend ownership cutover, not another one-route readiness exercise. v1.12 proved a route-scoped switch, raw privacy scans, no-fallback behavior, rollback evidence, live topology hooks, and a route ownership manifest. It intentionally ended `promote-none-yet` because Go still served public Strategy reads from committed parity fixtures rather than live data.

The essential unlock for v1.13 is Go persistence access. Once Go can read and write the same PostgreSQL-backed product state as the TypeScript service, the milestone can move substantially beyond fixture-backed public reads. Because there is no live usage, broad cutover risk is acceptable, but the non-negotiables remain: no public private-data leaks, no Strategy execution in web/API or Go, canonical schema validation, deterministic engine boundaries, immutable submitted Strategy Revisions, and fail-closed route ownership.

The user selected the aggressive scope: auth/session mutation, Strategy Revision writes/forks/source route, and exhibition creation are primary scope rather than stretch. The roadmap should still put Go DB/public reads first, because those are prerequisites for mutation confidence.

## Recommended Stack

- Preserve TypeScript web UI, TypeScript worker/runtime, canonical `@cowards/spec` service contracts, and TypeScript service behavior as the parity oracle.
- Add Go PostgreSQL access in `apps/go-backend`, likely `pgx/v5` with pooled connections and explicit query functions.
- Extend the v1.12 route switch into a multi-route Go ownership registry covering public, owner/session, and mutation routes.
- Add parity evidence that compares Go live DTOs against TypeScript service/reference behavior for seeded local data.
- Extend topology and monitors from one route to the selected v1.13 route families.

## Selected v1.13 Cutover Slice

### Primary Scope

- Go DB/persistence foundation and live DTO assembly.
- Go-owned public reads:
  - public Strategy page
  - public player page
  - public ladder page
  - public MatchSet summary
  - public replay metadata
- Go-owned owner/session reads:
  - auth session read
  - account Strategy Revision list
- Go-owned account/session/product mutations:
  - sign up
  - sign in
  - sign out
  - account Strategy Revision save/create
  - Starter Strategy fork
  - Advanced Strategy fork
  - owner-private Strategy Revision source retrieval
  - exhibition MatchSet creation

### Explicit Boundaries

- Go must not execute Strategy code, and web/API must not execute Strategy code.
- Go may create exhibition MatchSet/job records only if job claiming, Match execution, Chronicle generation, and runtime failure handling remain TypeScript worker-owned.
- Public outputs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals by default.
- Owner-private source retrieval can return Strategy source only through authenticated owner routes with private/no-store response behavior and no inclusion in public or monitor artifacts.

## Architecture Findings

- `apps/go-backend` currently has five GET fixture-backed routes and no DB dependency.
- `@cowards/service` already defines the canonical behavior for public Strategy/player/ladder/MatchSet/replay reads and account read DTOs.
- Auth/session reads are not purely read-only today because `getSession` updates `last_seen_at`; Go ownership must model or explicitly preserve that mutation.
- Strategy Revision creation currently uses TypeScript runtime validation/source hashing. Go must preserve immutable revision semantics and validation without executing Strategy code in web/API.
- Exhibition creation touches ownership validation, rate limits, duplicate active checks, revision locking, MatchSet rows, Match rows, job records, and audit events. It can move before worker ownership only if job execution remains TypeScript-owned and evidence proves the handoff.

## Validation Expectations

Minimum v1.13 gates:

- `pnpm boundary:imports`
- `pnpm boundary:monitors`
- `pnpm contract:check`
- `pnpm contract:lint`
- `pnpm go:parity`
- `cd apps/go-backend && go test ./...`
- package tests for `@cowards/spec`, `@cowards/service`, web adapters/routes, persistence parity, and selected mutation behavior
- live topology with Go selected for every promoted route family
- stopped-Go, timeout, bad JSON/body, schema/privacy failure, divergence, and rollback drills

## Key Risks

- Go route ownership is broadened before live persistence and parity are stable.
- Mutation routes leak tokens, source, stack traces, DB errors, or private runtime details.
- Strategy Revision save/fork accidentally runs Strategy code in Go or web/API.
- Exhibition creation moves job execution or Chronicle construction indirectly.
- Boundary monitors retain v1.12 assumptions and miss a multi-route cutover regression.

## Proposed Phase Structure

1. Phase 82: Ownership baseline and aggressive cutover registry.
2. Phase 83: Go persistence foundation and live DTO spine.
3. Phase 84: Public read ownership cutover.
4. Phase 85: Auth/session and account read ownership.
5. Phase 86: Account Strategy Revision source/write/fork ownership.
6. Phase 87: Exhibition creation ownership and worker handoff guardrails.
7. Phase 88: Multi-route topology, rollback, privacy, monitor, and milestone verification.
