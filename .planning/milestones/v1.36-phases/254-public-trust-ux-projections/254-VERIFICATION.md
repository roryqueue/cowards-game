---
phase: 254-public-trust-ux-projections
verified: 2026-07-12T01:58:33Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed:
    - "Competition detail standings now carry policy-backed competitionEvidence through schema/service and render counted/excluded evidence plus result/replay links."
    - "Replay DTOs now carry counted/governance competition context and render it independently from Chronicle lifecycle evidence."
    - "Result view model no longer infers counted entrant summaries from legacy result.metadata.countedStatus."
  gaps_remaining: []
  regressions: []
---

# Phase 254: Public Trust UX Projections Verification Report

**Phase Goal:** Public and signed-in users can understand eligibility, counted status, Season state, evidence availability, privacy boundaries, and resettable public beta posture from authoritative public projections.
**Verified:** 2026-07-12T01:58:33Z
**Status:** PASS - passed
**Re-verification:** Yes - after closure fixes

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | TRUST-01: Competition index/detail, Season, standings, entry, result, replay, player, and Strategy pages render eligibility, counted status, Season state, evidence availability, and resettable/no-durable-rating posture from policy-backed public DTOs. | VERIFIED | Competition detail is no longer hollow: `packages/spec/src/public-discovery.ts:169-184` includes optional `competitionEvidence` with counted/excluded counts, availability, and result/replay links; `apps/web/lib/public-discovery-service.ts:447-455` carries `standing.competitionEvidence`; `apps/web/app/competitions/[competitionId]/page.tsx:143-166` renders counts, availability, and links. Season/result/replay/player/Strategy evidence remains wired through the Phase 254 files below. |
| 2 | TRUST-02: Public player and Strategy pages distinguish counted trial evidence from exhibition, study, self-play, and other non-counted evidence without exposing private Strategy data. | VERIFIED | `packages/persistence/src/profiles.ts:72-84` skips non-counted records and `:211-239` builds public counted-state/governance projections; player page labels Trial Season vs Exhibition at `apps/web/app/players/[handle]/page.tsx:90-95`; Strategy page states counted trial scope and excludes exhibition/study/self-play at `apps/web/app/strategies/[strategyId]/page.tsx:104-108`. |
| 3 | TRUST-03: Replay and result pages preserve source, memory, objective, dispute, recovery, and private-runtime privacy while showing public Chronicle/replay evidence and counted-state explanations. | VERIFIED | Result page renders typed counted/governance copy from `result.competition` at `apps/web/app/matchsets/[matchSetId]/page.tsx:74-139`. Replay now has `ReplayReadyDto.competition` and unavailable replay competition rows in `apps/web/app/matches/types.ts:79-115`; server attaches context from fixture or public MatchSet summary in `apps/web/app/matches/server.ts:283-330` and `:361-457`; replay evidence rows render counted status, standings effect, evidence availability, and governance in `apps/web/app/matchsets/evidence-copy.ts:241-293`; replay client displays the counted chip and evidence rows at `apps/web/app/matches/[matchId]/replay/replay-client.tsx:87-88` and `:151-185`. |
| 4 | TRUST-04: Public trust copy is calm, product-facing, and honest about resets, degraded Matches, disputes, invalidations, and limited recovery/moderation maturity. | VERIFIED | Competition pages use `COMPETITION_POLICY_V1_36_POSTURE`; fair-play/recovery browser proof checks calm public beta copy in `apps/web/e2e/v1-36-competition-trust-proof.spec.ts:29-56`; result/replay evidence copy uses product-facing public rows in `apps/web/app/matchsets/evidence-copy.ts:76-117` and `:139-198`. |
| 5 | TRUST-05: Public UI renders authoritative projections only and does not implement game rules, scoring truth, entry eligibility truth, or Strategy execution. | VERIFIED | The prior legacy inference is removed: `apps/web/app/matchsets/result-view-model.ts:228-253` uses `result.competition?.countedState.state`, not `result.metadata.countedStatus`. Regression tests cover the conflict case in `apps/web/app/matchsets/result-view-model.test.ts:151-179`; source ownership tests assert result page and result view model do not contain `result.metadata` at `apps/web/app/competition-trust-projections.test.ts:43-50`. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/app/ladder/[seasonId]/page.tsx` | Counted/excluded evidence and result/replay links | VERIFIED | Existing Season standings evidence wiring retained; source ownership test asserts `competitionEvidence.countedMatchSetCount` and `matchSet.countedState.publicLabel`. |
| `apps/web/app/competition-trust-projections.test.ts` | Source ownership and projection-copy regression tests | VERIFIED | Now checks competition detail evidence fields/result/replay link mapping and result-view-model absence of `result.metadata`. |
| `packages/persistence/src/profiles.ts` | Canonical counted-only Strategy records and public result classifications | VERIFIED | Uses `classifyCompetitionCountedState`, skips non-counted rows when building records, and leak-safety guard remains before return. |
| `apps/web/app/matchsets/[matchSetId]/page.tsx` | Typed counted/governance result explanations and report affordance | VERIFIED | Reads `result.competition?.countedState` and `result.competition?.governance`; no legacy `result.metadata` rendering found. |
| `apps/web/e2e/v1-36-competition-trust-proof.spec.ts` | Responsive public trust and replay realism browser proof | VERIFIED | Spec covers public competition trust pages and replay canvas framing/private-marker checks across configured desktop/tablet/mobile projects. Current `.last-run.json` failure is from unrelated `v1-36-competition-service-proof.spec.ts`, not this proof. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Competition detail page | Public competition detail DTO/service | `getPublicCompetitionDetail` -> `detail.standings[].competitionEvidence` | WIRED | Schema, service, and page all carry/render counted/excluded evidence and result/replay links. |
| Replay page | Public MatchSet result competition projection | `resolveReplayCompetitionContext` -> `ReplayReadyDto.competition` -> `replayEvidenceRows` | WIRED | Server resolves fixture or public MatchSet summary context and attaches it to ready and unavailable replay responses. |
| Result page/view model | Typed competition projection | `result.competition?.countedState` | WIRED | UI and view model use typed counted/governance projection; legacy metadata conflict test proves metadata is ignored. |
| Player/Strategy pages | Public profile/card DTOs | `buildPublicPlayerProfileDto`, `listPublicStrategyCardsForUser` | WIRED | Public records distinguish counted trial evidence from exhibition/non-counted evidence without private Strategy data. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| Competition detail | `standing.competitionEvidence` | Ladder public DTO via `getPublicCompetitionDetail` | Yes | FLOWING - service test covers authoritative ladder evidence carry-through. |
| Replay page | `data.competition` / `evidenceRows` | Fixture/public MatchSet summary through `resolveReplayCompetitionContext` | Yes | FLOWING - server test proves counted/governance projection is threaded into replay data. |
| Result view model | `result.competition?.countedState.state` | Public MatchSet result DTO | Yes | FLOWING - regression test supplies conflicting metadata and typed projection wins. |
| Player/Strategy pages | `profile.results`, `strategy.record` | Public profile persistence queries and counted-state classifier | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Focused Phase 254 regression tests | `pnpm exec vitest run apps/web/app/competition-trust-projections.test.ts apps/web/app/matchsets/result-view-model.test.ts apps/web/app/matchsets/evidence-copy.test.ts 'apps/web/app/matches/[matchId]/replay/replay-client.test.tsx' apps/web/app/matches/server.test.ts apps/web/lib/public-discovery-service.test.ts packages/spec/src/public-discovery.test.ts` | 7 files passed, 69 tests passed | PASS |
| Web package typecheck | `pnpm --filter @cowards/web typecheck` | `tsc --noEmit` passed | PASS |
| Spec package typecheck | `pnpm --filter @cowards/spec typecheck` | `tsc --noEmit` passed | PASS |
| Browser proof freshness | `cat test-results/.last-run.json`; inspect `test-results/.../error-context.md` | Last Playwright failure is unrelated service proof: `v1-36-competition-service-proof.spec.ts`, not Phase 254 trust proof | OBSERVED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| TRUST-01 | 254-01, 254-02, 254-03 | Named public/signed-in surfaces render eligibility/counting/Season/evidence/posture from DTOs. | SATISFIED | Competition detail evidence blocker is closed; replay counted context is now present; index/entry/Season/result/player/Strategy evidence remains wired. |
| TRUST-02 | 254-02 | Player/Strategy pages separate counted trial evidence from exhibition/study/self-play. | SATISFIED | `profiles.ts`, player page, and Strategy page evidence above. |
| TRUST-03 | 254-02, 254-03 | Result/replay preserve privacy while showing Chronicle/replay evidence and counted-state explanations. | SATISFIED | Replay DTO/server/evidence rows now carry counted/governance context; result page remains typed and public-safe. |
| TRUST-04 | 254-01, 254-02, 254-03 | Calm honest product copy. | SATISFIED | Policy-owned posture and public evidence copy are wired; browser proof covers fair-play/recovery posture copy. |
| TRUST-05 | 254-01, 254-02, 254-03 | UI renders projections only, no rules/scoring/eligibility/execution authority. | SATISFIED | No Phase 254 UI source path uses `result.metadata` for counted inference; no game-rule or Strategy execution ownership found in checked files. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| None blocking | - | - | - | Prior `Public standings` hardcode and `result.metadata.countedStatus` UI inference are removed. Remaining `return null` matches are legitimate nullable read fallbacks, not stubs. |

### Human Verification Required

None. Focused automated tests and source inspection cover the prior blockers. Full final service-backed proof remains Phase 255 scope.

### Gaps Summary

No blocking gaps remain for Phase 254. The three previous blockers were resolved in current source: competition detail projects evidence and links, replay carries counted/governance context, and result UI no longer infers counted summaries from legacy metadata.

---

_Verified: 2026-07-12T01:58:33Z_
_Verifier: the agent (gsd-verifier)_
