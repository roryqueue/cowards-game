---
phase: 265
plan: "01"
subsystem: strategy-lab-league
tags: [private-offline, immutable-contracts, content-addressing, canonical-payoff]
dependency_graph:
  requires: [phase-264-factory-candidates, runtime-bridge]
  provides: [league-contracts, league-identity-spine]
  affects: [league-matrix, league-connected-runner, league-solver, league-psro, league-selection, league-red-team, league-report]
tech_stack:
  added: []
  patterns: [canonical-json-boundaries, self-root-omitting-hashes, frozen-values, host-issued-admission]
key_files:
  created:
    - packages/strategy-lab/src/league/contracts.ts
    - packages/strategy-lab/src/league/contracts.test.ts
    - packages/strategy-lab/src/league/identity.ts
    - packages/strategy-lab/src/league/identity.test.ts
  modified: []
decisions:
  - "Factory candidates enter the league only after canonical factory revalidation, charged accepted terminal binding, and a trusted-host issuing seam."
  - "Solver payoffs are rooted entrant-relative integer half points derived from the completed canonical outcome and terminal result events."
  - "Chunk roots retain complete snapshot-scale evidence without placing a full 528-cell manifest in one canonical object."
metrics:
  duration: "~12 minutes"
  completed_date: "2026-09-15"
status: complete
---

# Phase 265 Plan 01: Private League Contracts and Identities Summary

Strict private, content-addressed league evidence now binds verified factory candidates and canonical kernel outcomes to immutable solver-ready identities without creating league results or dispatching Matches.

## Completed Tasks

1. Established private league contracts for population, cells, terminals, snapshots, solver/round/response artifacts, allocations, attempts, mixtures, portfolios, finalist dispositions, and reports.
2. Added domain-separated identity derivation and revalidation for every downstream league artifact family.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/contracts.test.ts packages/strategy-lab/src/league/identity.test.ts` — 2 files, 6 tests passed.
- `./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false` — passed.

## Decisions Made

- Admission requires re-parsed Phase 264 candidate data, exact accepted charge terminal evidence, and a host-owned verification seam; a serializable `issued` flag is rejected.
- The only payoff projection reads a completed `LabMatchExecution`, validates its final `MATCH_ENDED` payload/result-event root, and gives the entrant 2/1/0 half points for win/draw/loss.
- Pair identity ignores labels, completion order, and operational metadata, normalizing solely by immutable candidate roots.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Next Phase Readiness

Plan 265-02 can enumerate semantic cells and admit complete snapshots using the exported private contracts, payoff projection, and root derivation helpers. The actual trusted-host provider handoff remains intentionally deferred to Plan 265-03; this plan exposes only the nonserializable issuer seam and does not claim live candidate or league evidence.

## Self-Check: PASSED

- All four owned source/test files exist.
- Commits `363e993a`, `1859684e`, `774992be`, and `4a688812` exist; none deletes tracked files.
