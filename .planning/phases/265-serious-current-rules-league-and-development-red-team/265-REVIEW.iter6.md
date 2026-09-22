---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-21T23:40:32Z
depth: deep
reviewed_head: 67bcde10b7da758354d672ae8c547167914572d4
reviewed_source: 67bcde10b7da758354d672ae8c547167914572d4
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
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: Code Review Report

**Reviewed:** 2026-09-21T23:40:32Z
**Depth:** deep
**Files Reviewed:** 46
**Status:** one BLOCKER remains

## Summary

The current fix at `0e4999d0` bounds live Match-payload retention and indexes the
authenticated record graph without caching decoded values. One retained-reader
path still reconstructs and simultaneously retains every full score Match
execution for a response. This is a source-traced memory finding, not an
observed Phase 265 heap/OOM measurement. The prior eight-defect closure is
preserved below. No empirical allocation exists; source-gate results do not
establish full-size memory feasibility.

## Critical Issues

### CR-01 — Retained fingerprint verification rematerializes all score Matches (BLOCKER)

**File:** `packages/strategy-lab/src/factory/fingerprint.ts:488-506` (caller:
`scripts/lib/v1-38-league-response-runtime.ts:313-325`)

**Issue:** `verifyRetainedLeagueResponse` accumulates every score supervision
artifact root, then invokes `verifyRetainedLeagueFactoryFingerprints`. Its
`scoreSupervisionArtifactRoots.map(...)` eagerly reads each entire artifact,
rebuilds full `execution` objects containing transitions, accounting, result
state/events, and traces, and retains all of them in `receipts` until the final
ordered matchup fingerprint is derived. The saved primary receipt is also used
for legal-input and Chronicle fingerprints, but every *other* full execution
needs only its compact execution commitment, receipt root, and matchup metadata.
Thus retained verification reintroduces full response-payload residency after
the live path removed it. For a 21-opponent, two-seed response schedule this is
336 score Matches (`8 × 21 × 2`) in one array, before reader/graph working data;
that count illustrates the configured schedule shape, not a measured heap size.

**Fix:** Iterate authenticated score supervision artifacts one at a time. Keep
the first full receipt only for its legal-input/Chronicle fingerprints; immediately
derive and append a compact `{ supervisionReceiptRoot, matchup, execution:
deriveFactoryExecutionCommitment(execution) }` from each verified receipt, then
discard its full execution before reading the next. Derive the same ordered
matchup root from those compact rows and retain exact root/binding/duplicate
checks. Reopening must remain data-only (`issued: false`): do not add retained
receipts to the live WeakSet or treat a serialized commitment as host-issued.
Add a trusted large-synthetic retained-reader regression that checks bounded
full-execution residency, exact existing fingerprint roots, and tamper rejection.

The loop-level retained response verifier and the global replay each decode a
response result transiently; the reported accumulation is specifically the
`receipts` array above. This repair stays within the existing Phase 265 plan and
requires no empirical allocation or new rules decision.

## Narrative Findings (AI reviewer)

No additional BLOCKER, WARNING, or INFO finding is established by this re-review.
The earlier unsupported independent-round dereference allegation remains removed:
TypeScript groups the whole development-target comparison, including
`roundBlocks[0]`, under the `evaluationRole === "development_response"` short circuit.

### Current memory-fix trace

`LeagueConnectedSession` now retains a scalar executed count, compact cell
receipts, and compact matrix roots; probe normalization occurs while its one
execution is transient. `readLeagueRecordGraph` authenticates bounded canonical
descriptors, chunks, links, cycles, and aggregate read budgets in one traversal,
then exposes indexed lazy values rather than a persistent decoded-value Map.
Callers build compact cell/journal/matrix maps and retrieve response charges by
parent-start index; failed-prefix and published-seed verification still traverse
rooted records. Response production retains one full primary receipt and
WeakSet-issued compact pairings, with the same saved matchup root. The remaining
reader defect is the eager full `receipts` array above; the source trace does not
claim that the graph's shallow metadata or matrix maps duplicate all payloads.

### Closure map

| Reviewed repair | Source-trace result |
| --- | --- |
| CR-01 ordinary journal accounting | Successful League/Factory terminals charge ordinary work; explicit failure/cleanup retains emergency capacity, and the connected start checks journal-plus-graph headroom before dispatch. |
| CR-02 preceding-target strength | The linked proof uses two distinct accepted response revisions against their own frozen preceding targets, with authenticated intervening population/snapshot evolution; current-matrix, validation, probe, and diversity gates remain separate. |
| CR-03 charged failure reopening | Failed cells and response-provider failures retain non-scorable process-invalid prefixes; live/reader terminal derivation and charged evidence checks remain connected. |
| CR-04 bounded matrix/report composition | Authenticated chunks preserve the individual 256 KiB artifact and 8 MiB aggregate canonical limits; declared maximum-population capacity is checked before the first charge. |
| CR-05 historical controls | Writer-shaped mechanics-only imported controls remain comparison-only and do not increase real-producer/family/core inventory. |
| CR-06 final-round acceptance | A final accepted counter leaves an honest `response_round_budget_exhausted` / `not_closed` outcome with no independent dispatch or finalist publication. |
| Iteration-3 CR-01 post-terminal result failure | The retained failure includes the immutable accepted Factory terminal and root-only candidate closure. Reopening checks the journal, closure/source/admission joins, validation and independence roots, complete charged Match prefix, and absence of a production-result record; it never rewrites the terminal or claims a score. |
| Iteration-3 CR-02 partial report failure | Failed heads admit only an ordered, recomputed selection/report seed prefix after an authenticated close; a complete head still requires all seed reports and exact retained report roots. Report artifact bytes are digest-checked. |

The removed equality check on each selection record's auxiliary serialized `candidates` field does not weaken scoring or source admission: initial candidate records are compared with imported content, produced candidate admissions and closures are revalidated, and each retained selection/report is recomputed from authenticated final candidates, matrix, ledger, and projection. The test-only `beforeReportPublication` seam is nested under `LeagueFixtureSeams`; `runSeriousLeague` admits a fixture only for an `injected_fixture` allocation, and the CLI does not accept a fixture or provider input. The new path therefore does not authorize empirical injection.

This review made no private-store read, Strategy/Match execution, author/model/provider call, teacher search, allocation, or authority mutation. It did not repeat the long connected tests or the full 29-suite gate. `empiricalRequirementsComplete: false` remains intentionally unchanged. CI `67bcde10` raises only the named source-gate timeout from 30 to 45 minutes.

---

_Reviewed: 2026-09-21T23:40:32Z_
_Reviewer: gsd-code-reviewer; depth: deep; source-only._
