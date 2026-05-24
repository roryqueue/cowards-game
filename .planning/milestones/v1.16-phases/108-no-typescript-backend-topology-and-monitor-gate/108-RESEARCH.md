# Phase 108 Research: No-TypeScript-Backend Topology and Monitor Gate

**Researched:** 2026-05-24

## Goal

Phase 108 is the executable enforcement pass for the v1.16 retirement contract. It should prove the normal product topology is:

```text
web frontend -> Go backend -> isolated JS/TS Strategy runtime service
```

TypeScript may remain only as frontend code and the isolated JS/TS Strategy runtime service. Normal TypeScript service/backend, normal TypeScript worker lifecycle, direct web persistence fallback for selected routes, and unexpected Strategy execution outside the runtime service must fail topology or monitor checks.

## Current Implementation Surface

- `scripts/check-local-topology.ts` already supports live web, Go, runtime-service, representative page smoke, selected Go page smoke, and v1.15 lifecycle evidence through separate flags.
- `--require-v1-15-lifecycle` currently composes web, Go, runtime service, selected Go page smoke, representative page smoke, web-through-Go public Strategy reads, v1.15 topology artifacts, v1.15 failure drills, and v1.15 promotion evidence.
- `scripts/check-boundary-monitors.ts` already consumes v1.16 runtime-service boundary, v1.16 selected Go route manifest, v1.16 TypeScript worker quarantine, and v1.16 final TypeScript surface labels.
- Phase 107 strengthened the final surface-label monitor so path-level semantic drift and privacy enum drift are rejected, not merely regenerated correctly.

## Recommended Shape

Add a single v1.16 strict topology flag:

```bash
pnpm topology:check -- --require-v1-16-no-typescript-backend --json
```

The flag should imply:

- required web health
- required representative page-load smoke
- required Go health and public read smoke
- required web-through-Go public Strategy read
- required runtime-service health
- required selected Go page smoke and replay realism
- required v1.15 lifecycle evidence
- required v1.16 no-TypeScript-backend retirement checks

Boundary monitors should run the same v1.16 strict topology path when `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`, and should always validate a committed v1.16 topology/failure-drill artifact so non-live monitor runs still catch drift in the contract.

## Evidence Artifact

Create `.planning/artifacts/v1.16-no-typescript-backend-topology.json` plus markdown. The artifact should be audit-ready for Phase 109 and include:

- schema/version and milestone
- normal topology statement
- allowed TypeScript roles/processes
- disallowed backend roles/processes
- strict topology command
- monitor command
- failure drill expectations for stopped Go and stopped runtime service
- page smoke expectations across major page types
- privacy denylist
- links to the selected Go route manifest, runtime-service boundary, worker quarantine, and final TypeScript surface labels

## Monitor Needs

`pnpm boundary:monitors` should fail on:

- artifact schema/phase drift
- allowed TypeScript process broadening beyond frontend and runtime service
- missing strict command or page-smoke requirement
- missing no-fallback failure drill semantics
- missing privacy denylist items
- selected route manifest drift
- final TypeScript surface labels that reintroduce normal backend authority
- runtime service boundary drift or ABI drift
- unexpected Strategy execution outside runtime boundary

## Tests To Add

- topology parser test for `--require-v1-16-no-typescript-backend`
- topology static test proving the strict flag requires web, Go, runtime service, page smoke, selected Go pages, web-through-Go read, and v1.15 lifecycle
- monitor test for the v1.16 no-TypeScript-backend topology artifact
- monitor test proving live topology monitor uses the v1.16 strict flag when live topology is required

## Out Of Scope

- migrating Workshop, ladder, or governance/admin deferred surfaces
- replacing JS/TS Strategy execution support
- promoting container/WASM/WASI as the production hostile-code sandbox
- requiring a live local service stack during default `pnpm boundary:monitors`
