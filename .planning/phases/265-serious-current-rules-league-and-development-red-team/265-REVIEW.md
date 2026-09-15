---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-15T07:55:14Z
depth: deep
reviewed_head: bd6f3ccc3fe97ad9616e73f8c3560d37dcf47d9e
reviewed_source: 9394176caed71cfef4f9ceb4a3a81456baf356c7
diff_base: 98e4392e
files_reviewed: 46
files_reviewed_list:
  - .github/workflows/ci.yml
  - packages/strategy-lab/src/factory/fingerprint.test.ts
  - packages/strategy-lab/src/factory/fingerprint.ts
  - packages/strategy-lab/src/factory/repository.test.ts
  - packages/strategy-lab/src/factory/repository.ts
  - packages/strategy-lab/src/index.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/connected-runner.test.ts
  - packages/strategy-lab/src/league/connected-runner.ts
  - packages/strategy-lab/src/league/contracts.test.ts
  - packages/strategy-lab/src/league/contracts.ts
  - packages/strategy-lab/src/league/fixtures.test.ts
  - packages/strategy-lab/src/league/fixtures.ts
  - packages/strategy-lab/src/league/identity.test.ts
  - packages/strategy-lab/src/league/identity.ts
  - packages/strategy-lab/src/league/integration.test.ts
  - packages/strategy-lab/src/league/matrix.test.ts
  - packages/strategy-lab/src/league/matrix.ts
  - packages/strategy-lab/src/league/psro.test.ts
  - packages/strategy-lab/src/league/psro.ts
  - packages/strategy-lab/src/league/red-team.test.ts
  - packages/strategy-lab/src/league/red-team.ts
  - packages/strategy-lab/src/league/report.test.ts
  - packages/strategy-lab/src/league/report.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/selection.test.ts
  - packages/strategy-lab/src/league/selection.ts
  - packages/strategy-lab/src/league/solver.test.ts
  - packages/strategy-lab/src/league/solver.ts
  - scripts/assess-v1-38-factory-independence.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/check-v1-38-lab-boundaries.test.ts
  - scripts/check-v1-38-serious-league-boundaries.test.ts
  - scripts/check-v1-38-serious-league-boundaries.ts
  - scripts/lib/v1-38-league-authoring.test.ts
  - scripts/lib/v1-38-league-authoring.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/v1-38-factory-assessment-correction.test.ts
  - scripts/v1-38-factory-assessment-correction.ts
  - scripts/v1-38-factory-execution-evidence.test.ts
  - scripts/v1-38-factory-execution-evidence.ts
findings:
  critical: 6
  warning: 0
  info: 0
  total: 6
status: issues_found
---

# Phase 265: Source Code Review

## Narrative Findings (AI reviewer)

### Summary and source-qualified status

Six BLOCKER findings remain at the frozen source above. They concern connected behavior and contracts, not the absence of an empirical result. The review traced allocation → historical candidate import → current host issuance → complete matrix → exact solver → response production/comparison → retained graph → selection/report, including the applicable factory and kernel boundaries. The exact review scope is the 46 paths from `git diff --name-only 98e4392e..HEAD -- packages scripts .github/workflows/ci.yml`; referenced unchanged dependencies are supporting evidence, not expanded implementation scope.

This is source-only review before Plan 07 Tasks 2–3. No actual historical store was reopened, no Strategy was executed, and no author, model, provider handshake, teacher search, or empirical Match was dispatched. The full 29-suite gate was not repeated. The numerical and budget observations below came from safe in-memory diagnostics against the current modules; the other findings are direct reachable call-chain proofs. Existing passing focused tests do not exercise these connected conditions.

The hard-coded `empiricalRequirementsComplete: false` return field is not independently classified as a defect: successful command mechanics do not certify the strength, independence, or phase-completion gates. Similarly, the 16-group fixture index is an index of source tests, not itself empirical/assertion evidence. No automatic certification, threshold reduction, historical metadata rewrite, new rule, or additional empirical authority is recommended.

## Critical Issues

### CR-01: Ordinary success terminals consume the emergency cleanup reserve

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:47-55`

**Related:** `packages/strategy-lab/src/league/repository.ts:81`; `packages/strategy-lab/src/factory/repository.ts:42`; `packages/strategy-lab/src/league/allocation.ts:44-46`.

**Issue:** `beforePublication` treats every filename ending in `.terminal.json` as emergency-reserve work. Both repositories use that suffix for ordinary successful terminals as well as failures. Before every subsequent `.started.json`, the budget then demands that the *entire* six-envelope/24-record emergency reserve is still available. An allocation with the explicitly permitted minimum reserve can therefore start its first Match, retain its successful terminal, and fail before the second start despite having ample regular-work capacity. Larger reserves merely postpone this deterministic exhaustion by charging normal terminals to the wrong pool.

**Evidence/reproduction:** An in-memory empirical allocation with 12 unique initial publication roots, sufficient Match/work ceilings, `terminalReserveBytes: 1572864` and `terminalReserveRecords: 24` was accepted by `createLeagueExecutionAllocation`. Against its `LeagueRetentionBudget`, the following hook sequence requires no filesystem or runtime work:

```ts
budget.beforePublication({ target: "/synthetic/first.started.json", byteLength: 100, terminal: false })
budget.beforePublication({ target: "/synthetic/first.terminal.json", byteLength: 100, terminal: true })
budget.beforePublication({ target: "/synthetic/second.started.json", byteLength: 100, terminal: false })
```

Observed result: `SERIOUS_LEAGUE_TERMINAL_RETENTION_BUDGET`, with usage `{workBytes:100, workRecords:1, terminalBytes:100, terminalRecords:1, exhausted:false}`. The second start demands `terminalBytes + 1572864 <= 1572864` and `terminalRecords + 24 <= 24`, both now false. The existing retention test exercises exhaustion followed by a failure terminal, not normal successful terminals followed by another start.

**Fix:** Account ordinary started/successful-terminal journal publication in regular-work capacity. Reserve emergency capacity for an explicit failure/cleanup state, not a filename that also denotes normal completion. Preflight the normal journal/retention budget for the allocated scope while retaining untouched emergency headroom before dispatch. Test two and many successful starts/terminals at the minimum reserve, then real work exhaustion and emergency cleanup, across both fresh repositories. Do not solve this by asking the operator for a larger emergency reserve.

### CR-02: The connected consecutive-iteration strength gate is mathematically unreachable

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:309-313`

**Related:** `scripts/run-v1-38-serious-league.ts:220-231`; `packages/strategy-lab/src/league/selection.ts:100-113`; `packages/strategy-lab/src/league/solver.ts:101-108,319-328`.

**Issue:** The CLI calculates every candidate's iteration score against the exact equilibrium mixture of the *same snapshot that already contains that candidate*. `consecutiveIterations` requires each such score to be strictly greater than 55%. The solver constructs an antisymmetric, centered zero-sum payoff matrix with zero diagonal; its exact security mixture gives every resident pure candidate an expected centered payoff at most zero, equivalently an uncentered score at most 50%. Thus no candidate emitted by this connected path can satisfy even one iteration, much less the required genuinely consecutive iterations. This is not a potentially disappointing empirical result: it is an impossible predicate induced by choosing the wrong target snapshot.

**Evidence/reproduction:** A safe in-memory three-policy snapshot with eight cells per pair and centered payoff units

```text
       a   b   c
a      0   8  -4
b     -8   0   2
c      4  -2   0
```

produced exact weights `a=1/7, b=2/7, c=4/7`. Each resident policy's score against this mixture is exactly `1/2`. The same upper bound follows from the solver's exact security condition for every admitted snapshot, not just this example. Selection fixtures directly supply synthetic `56/100` iteration rows; they do not derive those rows through the CLI's contemporaneous solver-mixture calculation.

**Fix:** Bind iteration measurements to the intended preceding, frozen pre-response targets and the actual retained responses/measurements for that iteration, rather than recomputing a resident candidate's score against its contemporaneous equilibrium. Preserve the frozen strict threshold and independent-validation/probe roles. Preserve distinct actual consecutive response iterations: do not duplicate one job, relabel seeds, or reuse a single measurement as two iterations. Add a connected synthetic trace that can pass the genuine preceding-target gate and a contemporaneous-target regression that cannot.

### CR-03: A legitimately retained failed Match cannot reopen as a process-invalid result

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:464-469`

**Related:** `scripts/run-v1-38-serious-league.ts:194-204,409-415,421-422,461,499`.

**Issue:** `LeagueConnectedSession.execute` persists `cell-result` for an actual execution and its terminal, including a player/system failure, *before* throwing `PROCESS_INVALID`. The outer handler then retains `run-failure`. On read-only verification, all retained `cell-result` nodes are unconditionally passed through a successful-completion-only kernel replay and payoff projection. `replayRetainedKernel` rejects a noncompleted execution or any unsuccessful invocation, and the following check separately requires a success terminal. The intended `run-failure → process_invalid` return at line 499 is after these checks, so an honest failed run containing its failed cell cannot reach it. This breaks the required retained failure branch without any tampering.

**Evidence:** Reachable sequence: `runLeagueCell` returns a failure terminal and supplies `actual`; line 196 appends that cell; line 198 throws; line 414 appends `run-failure`; line 467 invokes `replayRetainedKernel`; line 422 throws `SERIOUS_LEAGUE_RETAINED_EXECUTION`. A failed run after an accepted counter also restores only the initial candidates at line 461, so any retained expanded `complete-matrix` can separately fail `RETAINED_POPULATION` before the same failure return. The current connected tests prove successful/no-finalist reopen and early argument rejection, not this failed execution graph.

**Fix:** Reopen terminal dispositions explicitly. Revalidate successful cells through full canonical replay and payoff joins; revalidate failed cells through their corresponding execution/failure, charge, invocation, and cleanup evidence, retaining them as non-scorable failures. Restore the authenticated population evolution that actually occurred before failure. Only then return a truthful process-invalid result. Do not bypass graph integrity merely because the head says failure. Add player failure, system failure, and failure-after-counter-growth read-only reopen regressions.

### CR-04: A valid 16-entrant complete matrix always exceeds the solver transport limit

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/solver.ts:41,89`

**Related:** `packages/strategy-lab/src/league/matrix.ts:376-392`; `packages/strategy-lab/src/league/allocation.ts:42,74`; `scripts/run-v1-38-serious-league.ts:370-373`.

**Issue:** The complete matrix serializes every projection into one canonical `solverPayoffBytes` array, while the solver rejects that whole transport above 262144 bytes. The allocation accepts a population of 16 or more and can prospectively allocate four accepted responses from the required 12 initial candidates. Each valid projection has fixed-width roots, so the first 16-entrant snapshot necessarily exceeds the transport guard even though its matrix is complete and its resources are allocated. This fails at the matrix-to-solver boundary, independently of the bounded general solver's numerical capability.

**Evidence/reproduction:** Safe in-memory canonical all-draw snapshots used unique rooted candidates/projections and exactly eight projections per unordered pair; their `solverPayoffRoot` was computed from canonical projection order. The current solver returned:

| Entrants | Cells | Canonical transport bytes | Result |
| --- | ---: | ---: | --- |
| 12 | 528 | 159985 | solved |
| 13 | 624 | 189073 | solved |
| 14 | 728 | 220585 | solved |
| 15 | 840 | 254521 | solved |
| 16 | 960 | 290881 | `PAYOFF_TRANSPORT_INVALID` |

No Strategy, repository, or empirical execution was involved. The current 12/13-policy tests do not cross this boundary.

**Fix:** Make the solver input a bounded, authenticated chunk/stream composition with aggregate allocation limits, retaining the individual artifact cap and canonical completeness/order/root checks. Carry that representation through matrix retention and verify-retained. Test at least 16 entrants and the actual prospectively supported expansion boundary. Any implementation capacity that remains must be visible in preflight before expenditure; do not silently shrink the intended growth protocol or raise unrelated per-artifact/runtime limits.

### CR-05: Authentic imported controls abort portfolio derivation instead of remaining nonqualified

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/selection.ts:43-47`

**Related:** `packages/strategy-lab/src/league/selection.ts:28-33,56,66-72`; `scripts/run-v1-38-serious-league.ts:301`; unchanged `scripts/run-v1-38-factory-calibration.ts:245,295-307`; unchanged `scripts/v1-38-factory-fresh-evidence.ts:40-49`; `packages/strategy-lab/src/league/contracts.test.ts:37-38`.

**Issue:** The import contract intentionally distinguishes assessed `base_distinct` candidates from `control_or_unresolved` candidates. Portfolio admission nevertheless requires *every* imported candidate to have `evidenceClass: real_producer` and a non-null rooted producer artifact before it reaches the control-rejection branch. Authentic Phase 264 controls have a `calibration_only` ingestion; the retained fingerprint producer path records them as `mechanics_only` with `producerArtifactRoot: null`. Thus the real 3-base + 9-control initial population reaches `FINGERPRINT_BINDING`, aborting the run at selection instead of retaining the nine controls as ineligible and allowing fresh produced candidates to supply actual diversity.

**Evidence:** The existing frozen factory authoring validator permits real producers only for S01/S03/S05 and requires `materializeFactoryCalibrationControl`/`calibration_only` for the remaining nine slots. The calibration writer turns `selectedRealPath === false` into exactly the mechanics/null fingerprint shape. `deriveLeaguePortfolio` maps *all* candidates through `admitBoundCandidate` before filtering `correlationFree === false`. Its apparent control regression uses `importedCandidateFixture(2)`, but that fixture fabricates real-producer tactical ingestion/fingerprint metadata for every slot, so it does not test the authentic control shape. This proof uses current source contracts/writers, not an actual historical-store read.

**Fix:** Validate a historical control's immutable evidence against its assessed publication using the proper retained evidence class, then preserve an explicit nonqualified/rejection record before applying real-producer-only qualifications. Keep all historical/current reader identities and original bytes intact. Do not relabel controls as real producers, independent families, or independent cores. Test the actual 3-base + 9-control publication/receipt shapes through import and selection, then demonstrate qualified inventory growth only from genuinely fresh independent produced responses.

### CR-06: A final-round accepted counter is reported complete without satisfying the declared closure rule

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:370-375,406-407`

**Related:** `packages/strategy-lab/src/league/psro.ts:98-120`; `scripts/run-v1-38-serious-league.ts:344-347,397,540-542`; Plan 04 Task 3 and Context D-15.

**Issue:** If the last scheduled round accepts a counter, the coordinator creates its expanded complete matrices and calls `advanceLeagueRound` with `requestClosure: false`. The state machine returns `fresh_snapshot_required`, explicitly not `closed`. The schedule then ends and the coordinator proceeds to independent evaluation, reporting `bounded_league_complete`/`run-complete` without another declared/probed response round or a closed transition. The red-team close check only demands targets from already-declared blocks, so it does not include the just-expanded final population. Retained verification recomputes each advance individually but never requires a terminal `closed` state. A successful late counter can therefore end the declared `bounded-no-accepted-counter-v1` loop in a state that explicitly requires its next response branch.

**Evidence:** The accepted branch at lines 370–373 is unconditional with respect to the last ordinal. Only the *no accepted counter* branch at line 374 can request closure on the last round. `advanceLeagueRound` lines 103–115 forbids closure after acceptance and returns `fresh_snapshot_required`; nevertheless lines 406–407 always report completion after the schedule. The connected positive-response test accepts in the first round and supplies a second empty round, so it does not exercise last-round acceptance.

**Fix:** Require the coordinator and retained verifier to validate a complete terminal state-machine path under the frozen closure rule. Prospectively allocate the required continuation/closure branch, or retain an explicit budget-exhausted/nonclosed outcome when no authorized branch remains; never silently dispatch extra work or call a fresh-snapshot-required state complete. Preserve the counter, complete expanded snapshot, and every charge. Add last-round acceptance and tampered/missing terminal-closure regressions, while keeping the independent evaluation packets isolated from development adaptation.

## Review boundaries and handoff

These findings do not authorize an empirical allocation or a retry. Same-plan source repairs and focused regression proof should precede the consolidated Plan 07 Task 2 allocation checkpoint. The exact empirical 12-Strategy/6-family/5-core/3-finalist conditions remain unchanged. A disappointing but process-valid result and an honest no-finalist outcome remain acceptable results; an unreachable gate, incompatible historical evidence shape, or misclassified incomplete/failure path does not.

Only this review artifact was written by the reviewer. No implementation/test files, security/evaluation audit artifacts, or historical untracked files were modified, and no commit or push was performed.

_Reviewer: gsd-code-reviewer; depth: deep; source-only._
