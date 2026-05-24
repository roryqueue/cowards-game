# Phase 99: Go Match Completion and Chronicle Persistence - Validation

**Validated:** 2026-05-24
**Nyquist status:** Partial-to-complete for Go completion ownership

## Test Infrastructure

| Layer | Tool | Command |
| --- | --- | --- |
| Go unit/default | Go test | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` |
| Go DB integration | Go test + local Postgres | `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...` |
| TypeScript oracle | Vitest | `pnpm exec vitest run packages/persistence/src/complete-match.test.ts packages/persistence/src/chronicle-store.test.ts packages/replay/src/project.test.ts` |
| Patch hygiene | Git | `git diff --check` |

## Requirement Coverage

| Requirement | Automated/Artifact Coverage | Status |
| --- | --- | --- |
| COMP-01 | DB integration validates running lease before completion, rejects wrong lease, and rejects a valid lease for a different Match. | COVERED |
| COMP-02 | DB integration verifies duplicate compatible completion returns the existing Chronicle; code compares the full stored Chronicle metadata row. | COVERED |
| COMP-03 | Go unit test checks parity formula and survivor fields. | COVERED |
| COMP-04 | Go metadata tests cover terminal outcome, ids, counts, normalized hash/id, event sequence, board shape, and private marker rejection. | COVERED |
| COMP-05 | DB integration observes Chronicle, Match, job, and attempt updates committed together. | COVERED |
| COMP-06 | Go tests cover invalid lease, wrong-job lease, outcome drift, invalid Chronicle, missing terminal outcome, and private marker failure. | COVERED |
| COMP-07 | Existing TS replay/projection tests pass against current Chronicle shape. | COVERED |
| COMP-08 | Go DB tests and TypeScript oracle tests cover the main success/failure paths. | COVERED |

## Manual-Only Items

Full browser replay realism is deferred until Phase 101/102 when public evidence routes and local topology are wired through Go.
