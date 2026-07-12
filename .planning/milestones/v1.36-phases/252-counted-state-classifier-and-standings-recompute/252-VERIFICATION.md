---
phase: 252-counted-state-classifier-and-standings-recompute
verified: 2026-07-11T20:53:00-04:00
status: passed
score: 6/6 requirements verified
gaps: []
human_verification: []
---

# Phase 252 Verification

## Result

**PASS.** Phase 252 achieves the ROADMAP goal: public MatchSet and result projections use a public-safe counted-state contract, and Season standings are derived from Season-scoped canonical evidence rather than UI state or stored rank rows. No blocking implementation, contract, privacy, or boundary gap was found.

## Requirements

| Requirement | Status | Evidence |
|---|---|---|
| RESULT-01 | VERIFIED | `packages/spec/src/competition-counted-state.ts` defines the ten locked states, governance precedence, evidence availability, public reasons, and public copy. `packages/spec/src/competition-counted-state.test.ts` covers every state, precedence, stored-counted distrust, determinism, and the public leak guard. The repeatable `0010_competition_counted_states.sql` constraints contain the same state/reason vocabulary. Go mirrors the matrix in `live_backend.go` and `counted_state_test.go`. |
| RESULT-02 | VERIFIED | `PublicLadderMatchSetSummaryDto` and `PublicMatchSetResultDto.competition.countedState` expose label, explanation, standings effect, evidence availability, and safe reason. TypeScript `buildPublicMatchSetResultDto` and Go `publicMatchSetResult` derive that projection from canonical evidence rather than legacy free-form metadata. |
| RESULT-03 | VERIFIED | TypeScript `buildTrialLadderSeasonDto` reads one Season's MatchSets, classifies each with the spec classifier, and calls the pure `recomputeSeasonStandings` reducer. Only classified `counted` scoring is accumulated. Go applies the same evidence gates before adding scores. Neither path reads or edits manually persisted rank rows. |
| RESULT-04 | VERIFIED | The reducer's table test proves pending, retrying, degraded system failure, non-counted, non-competitive, under-review, disputed, invalid, and invalidated MatchSets contribute zero points while remaining visible as excluded evidence. Both classifiers give governance/exclusion states precedence over otherwise complete evidence. |
| RESULT-05 | VERIFIED | `PublicStandingDto` and its Zod/OpenAPI projection expose counted/excluded MatchSet counts, aggregate evidence availability, tie-breaker inputs, and sorted result/replay links. TypeScript uses sorted sets and stable MatchSet ordering; Go sorts evidence links and uses the same tie-break sequence. |
| RESULT-06 | VERIFIED | TypeScript tests prove byte-equivalent output across repeated recomputation and permuted entrant/MatchSet input, stable tie-breaks, exclusion behavior, and omission of out-of-Season inputs. The ladder query is explicitly scoped by `where ms.ladder_season_id = $1`. Go tests prove repeated deterministic evidence output and stable sorted links; full Go tests pass. |

## Implementation Evidence

- TypeScript and Go require all of: complete execution, a positive expected Match count, Chronicle count equal to expected Match count, and available scoring before returning `counted`. A stored `counted` value cannot bypass these gates.
- Governance precedence is aligned in both implementations: invalidated, invalid, disputed, under review, non-competitive, then non-counted; review state and origin follow the stored governance state.
- TypeScript public Season/result readers contain no `refreshMatchSetStatus` or MatchSet lifecycle write. Go source guards cover `ladderMatchSetsAndStandings` and `publicMatchSetResult` and reject refresh/update/insert/delete operations.
- TypeScript standings reduction sorts entrants, MatchSets, penalties, result links, and replay links. Go sorts rankings by the same points/wins/surviving-Soldiers/survival-turns/revision-id order and sorts public evidence links.
- DTOs, Zod schemas, generated OpenAPI, Go parity fixtures, TypeScript backend inventory, and final surface labels contain the counted-state and competition-evidence fields.
- Public projections pass `assertPublicOutputLeakSafe`; the boundary chain passed privacy scans covering public examples and Go fixtures, replay/result trust, public discovery, runtime ownership, and private memory/objective/runtime markers.

## Commands And Results

- `pnpm exec vitest run packages/spec/src/competition-counted-state.test.ts packages/spec/src/spec.test.ts packages/persistence/src/standings-recompute.test.ts packages/persistence/src/ladder.test.ts packages/persistence/src/competition.test.ts packages/spec/src/service-contract.test.ts packages/service/src/service.test.ts apps/web/lib/public-go-read-client.test.ts` -> **PASS**, 8 files and 156 tests.
- `pnpm --filter @cowards/spec typecheck && pnpm --filter @cowards/persistence typecheck && pnpm --filter @cowards/service typecheck && pnpm --filter @cowards/web typecheck` -> **PASS**, all four TypeScript package checks.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1` -> **PASS** (`ok github.com/cowards-game/go-backend`, 3.177s).
- `pnpm --filter @cowards/spec contract:check && pnpm typescript-backend:inventory:check && pnpm typescript-surface-labels:check && pnpm v1.36:competition-policy:check` -> **PASS**, all generated artifacts current.
- `pnpm boundary:monitors` -> **PASS**, including OpenAPI lint, public-output privacy checks, Go parity, replay/result trust, public discovery, runtime ownership, topology diagnostics, v1.35 proof checks, and v1.36 competition policy. The import boundary reported 17 known report-only offenses and zero strict offenses.

## Residual Risks

- Database-backed Go assertions were not exercised because `COWARDS_GO_BACKEND_TEST_DATABASE_URL` is not configured. Unit, source-guard, fixture-parity, and full non-database Go coverage passed.
- Season isolation is enforced by the explicit Season predicate and by passing only that query result into the pure reducer. The focused test proves the predicate and out-of-input exclusion, but does not execute a live two-Season database recomputation.
- TypeScript and Go intentionally duplicate classifier code. Their current matrices, copy, precedence, and tests agree, but future policy edits must keep the parity fixtures and both test tables current.

## Boundary Conclusion

Phase 252 changes classification, public trust projection, and standings derivation only. It does not change deterministic game rules, scoring values, Strategy execution ownership, runtime or sandbox claims, durable rating policy, or expose Strategy source, artifact bytes, raw diagnostics, host/environment/package details, tokens, database details, StrategyMemory, SoldierMemory, objectives, or private runtime/governance payloads.
