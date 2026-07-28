---
phase: 252-counted-state-classifier-and-standings-recompute
plan: 03
subsystem: public-service-parity
tags: [result, go, parity, openapi, boundaries]
requires: [252-02]
provides:
  - Typed counted-state projection on public MatchSet results
  - Go and TypeScript classifier and standings parity
  - Mutation-free selected public reads
  - Refreshed OpenAPI, Go fixtures, and backend inventories
affects: [253, 254, 255]
requirements-completed: [RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06]
completed: 2026-07-11
---

# Phase 252 Plan 03 Summary

## Accomplishments

- Replaced legacy untyped public result metadata with the canonical typed `competition.countedState` projection.
- Made TypeScript public MatchSet result reads mutation-free and classified exhibition evidence as non-competitive.
- Mirrored all ten classifier states, precedence, evidence requirements, public copy, and standings evidence summaries in Go.
- Removed public-read lifecycle refreshes from selected Go ladder/result paths and added deterministic evidence counts and sorted links.
- Regenerated OpenAPI, Go parity fixtures, TypeScript backend inventory, and final surface labels.
- Repaired the public-discovery boundary fixture to consume the locked v1.36 posture projection.

## Commits

1. `586a0dc` - Project canonical counted state on TypeScript public results.
2. `a40ea17` - Refresh public service contracts and inventories.
3. `61f49de` - Align service and web counted-state fixtures.
4. `c1a5590` - Refresh final TypeScript surface inventory.
5. `6ce1c5e` - Align Go counted-state and standings parity.
6. `51f5e04` - Refresh Go parity fixtures.
7. `10167e1` - Align the public-discovery posture monitor fixture.

## Verification

- All four TypeScript package typechecks passed.
- Focused spec, persistence, service, and web tests passed.
- Full Go test suite passed.
- OpenAPI lint, TypeScript inventory, Go parity, public discovery, and runtime/replay boundary checks passed through the repaired monitor point.
- Database-backed Go assertions were skipped because `COWARDS_GO_BACKEND_TEST_DATABASE_URL` is not configured; deterministic unit/service parity remains covered.

## Boundaries

No game rules, Strategy execution ownership, scoring values, runtime claims, package policy, TinyGo visibility, durable rating promise, or private evidence exposure changed.
