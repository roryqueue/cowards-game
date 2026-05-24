# Phase 94: Go Artifact Consumption and Fork Parity - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 94 promotes Go consumption of generated Strategy Artifact manifests so users can fork Starter and Advanced Strategies through Go-owned routes with TypeScript-oracle parity.

This phase should not make Go a Strategy runtime. Go must not execute Strategy source, import TypeScript, call Node, use Node `vm`, claim jobs, run Matches, build Chronicles, or classify runtime failures.

## Approved Decisions

### D-01 Manifest-Only Go Consumption

Go owns Starter/Advanced fork routes only by consuming the generated Strategy Artifact manifest from Phase 91 as data.

The generated manifest is the contract input. Go must not import TypeScript modules or derive source facts by executing Strategy source.

### D-02 Runtime Non-Ownership

Go fork routes must not:

- Execute Strategy source.
- Import TypeScript.
- Call Node.
- Use Node `vm`.
- Claim jobs.
- Run Matches.
- Build Chronicles.
- Classify runtime failures.

### D-03 TypeScript-Oracle Fork Parity

Starter and Advanced forks through Go must match the TypeScript oracle for:

- Source.
- Source hash.
- Source bytes.
- Validation status and validation report shape.
- Runtime metadata.
- Engine compatibility.
- Tags.
- Label/name.
- Notes/description.
- Starter/Advanced lineage.
- Strategy ID and revision ID behavior.
- Account list DTO behavior.

### D-04 Lineage-Preserving Account Saves

Go account revision saves should preserve Starter, Advanced, or template lineage only when submitted source hash and selected artifact metadata match a manifest entry.

If the submitted source does not match a manifest entry, Go must save it as ordinary owner account source without forged lineage.

### D-05 Fail-Closed Conditions

Fork routes should fail closed for:

- Missing manifest.
- Stale manifest.
- Unknown artifact ID.
- Invalid source/hash metadata.
- Invalid validation metadata.
- Unauthorized session.
- Duplicate or storage failure.
- Schema failure.
- Privacy failure.
- Topology failure.
- No-fallback violations.

Silent TypeScript fallback is not allowed for selected Go-owned fork routes.

### D-06 Promotion Gates

Promotion requires:

- Route ownership manifest updates.
- Web selection flag updates.
- Topology checks.
- Rollback evidence.
- TypeScript-oracle parity tests.
- No-fallback evidence.

### D-07 Source-Free Public Responses

Public and normal account-list responses from Go must remain source-free.

The already-private authenticated source endpoint remains the only account source-returning exception.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/091-generated-strategy-artifact-manifest/091-CONTEXT.md`
- `.planning/phases/093-js-runtime-adapter-conformance/093-CONTEXT.md`
- `.planning/artifacts/v1.13-route-ownership-manifest.json`
- `.planning/artifacts/v1.13-route-ownership-matrix.md`
- `packages/persistence/src/account-revisions.ts`
- `packages/persistence/src/starter-strategies.ts`
- `packages/persistence/src/advanced-strategies.ts`
- `apps/web/app/competitive/server.ts`
- `apps/web/app/api/account/starter-forks/route.ts`
- `apps/web/app/api/account/advanced-forks/route.ts`
- `apps/web/lib/account-service-adapter.ts`
- `apps/web/lib/account-service-boundary.ts`
- `apps/go-backend/live_backend.go`
- `apps/go-backend/main.go`
- `apps/go-backend/main_test.go`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-local-topology.ts`

## Codebase Context

Current TypeScript oracle behavior:

- `forkStarterStrategyToAccount` loads a Starter registry entry, validates it, saves source, label, notes, tags, strategy name, and `starterLineage`.
- `forkAdvancedStrategyToAccount` does the same for Advanced entries plus archetype lineage.
- `saveAccountRevision` preserves Starter/Advanced lineage only when submitted source exactly matches the selected TypeScript registry source.

Current Go behavior:

- Go registers `/account/starter-forks` and `/account/advanced-forks`.
- Both currently return `UPSTREAM_UNAVAILABLE` through `forkUnavailable` with a message saying Go-owned library fork routes require a generated library source manifest.
- Go account revision creation accepts starter/advanced IDs in the request body but currently passes nil metadata and does not preserve lineage.
- Go account revision summaries already copy `starterLineage` and `advancedLineage` metadata when present.

Design pressure:

- v1.13 selected Go account routes but deferred Starter/Advanced fork ownership because Go lacked parity-safe library source access.
- Phase 94 should unblock that by consuming generated artifacts from Phase 91 without moving runtime execution or TypeScript registry logic into Go.

## Planning Notes

Planning should cover:

- Go manifest loader location and schema validation strategy.
- Exact fork route handlers and response DTOs.
- How Go computes or verifies revision IDs against TypeScript oracle behavior.
- How lineage metadata is built from manifest entries.
- How account saves match submitted source hash and artifact metadata.
- Parity fixture generation and comparison strategy.
- Selected-owner routing flags and no-fallback behavior.
- Failure tests for manifest, auth, storage, schema, privacy, topology, and stale data.

## Deferred To Later Phases

- Phase 95 owns final privacy, board realism, topology, no-fallback, and promotion/defer evidence.
- Future milestones own Go runtime execution, job claiming/completion, Match execution, Chronicle assembly, Go migrations, and Workshop runtime ownership.
