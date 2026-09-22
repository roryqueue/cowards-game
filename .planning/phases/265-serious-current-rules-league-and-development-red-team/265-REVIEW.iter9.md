---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-22T00:29:46Z
depth: deep
reviewed_head: 9c910d828776d9f1497493f72f6be775d09acc67
reviewed_source: 9c910d828776d9f1497493f72f6be775d09acc67
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
status: source-realism-gap-confirmed
---

# Phase 265: Code Review Report

**Reviewed:** 2026-09-22T00:29:46Z
**Depth:** deep
**Files Reviewed:** 46
**Status:** one confirmed full-Match storage blocker; preceding clean review preserved in `265-REVIEW.iter8.md`.

## Main amendment after retained-data realism check

### CR-01 — full executions exceed canonical admission before chunking

**Severity:** Critical (source readiness, not a new empirical outcome).
**Confirmed by:** main's read-only retained Phase263 witness and independent
`/root/265_memory_scale_check` source review at the same9c910d82 source.

`LeagueRecordGraph.publish` first canonicalizes a whole value, then chunks it.
The `cell-result`, `response-match-result`, and
`response-match-execution-failure` values embed complete executions. A real
11,981,860-byte old execution fails MAX_NODES_EXCEEDED at transition469. Current
canonical limits remain8MiB and262,144nodes; the existing composed-byte helper
also limits one logical value to8MiB and cannot solve this by itself.

Implement bounded, versioned private execution-record composition while keeping
the exact v1 encoding/root path for admissible small records. Use individually
admitted, ordered header/state/event/transition/accounting records; authenticate
chunks, counts, order, commitments and existing graph links within allocation
byte/record budgets. Reconstruct at most one execution on demand. Preserve
canonical limits, evidence completeness, live issuance, runtime and game rules.
Check adjacent whole-events/gameplay hash and replay equality sites; preserve
small-value roots and domain-separate any necessary large aggregate fallback.

Also fix the connected publication-order seam: runLeagueCell currently persists
a success terminal before cell-result graph retention. If retention fails, the
immutable success terminal can lack the result required by retained coverage.
Retain/preflight before success, or authenticate an honest post-terminal
retention-failure disposition; never rewrite a terminal or count an unpublished
result. Keep all charge/failure evidence and fail-closed process status.

Regressions: synthetic executions independently exceeding node and byte caps,
all three result-bearing kinds, exact small-root compatibility, missing/changed/
reordered chunks and records, bad counts/ordinals/commitment, resource exhaustion,
oversized aggregate roots/comparisons, and charged failure-prefix reopening.
No empirical allocation or new product decision is required for this source fix.
See `265-REALISM-CHECK.md` for the actual read-only witness and nonclaims.

The clean incremental review below predates this new discovery and is retained
as history; its 'no supported finding' statement does not close CR-01 above.

## Summary

No supported BLOCKER, WARNING, or INFO finding remains at the stated HEAD. This
is an incremental recheck of the four-line correction after the prior deep
46-file clean review, not a new discovery pass. The retained fingerprint reader
repairs the one finding preserved in
`265-REVIEW.iter6.md`: it authenticates each score supervision artifact in
sequence, keeps one primary full receipt for legal-input/Chronicle roots, and
retains only compact ordered execution commitments for the matchup root. The
earlier eight-defect closure remains below. This is source-review closure, not
a measured full-league heap/OOM result or an empirical Phase 265 outcome. No
empirical allocation exists. The full 29-suite gate on the preceding source
reported one failed injected probe-count assertion (268/269 tests); the focused
correction passed, and the final full-gate rerun remains main's task.

## Narrative Findings (AI reviewer)

No BLOCKER, WARNING, or INFO finding is established by this re-review.
The earlier unsupported independent-round dereference allegation remains removed:
TypeScript groups the whole development-target comparison, including
`roundBlocks[0]`, under the `evaluationRole === "development_response"` short circuit.

### Post-gate count correction

At `scripts/run-v1-38-serious-league.ts:245-248`, the scalar `executedCells`
increments immediately after the durable `cell-result` append. A non-success
terminal is rejected next, before the success-only normalized probe digest is
constructed. Previously that digest was evaluated inside the return object
before the increment, so a failed probe could persist a `cell-result` without
being included in the run head's count. The new order matches retained
verification's exact `cellResults.length === head.value.executedCells` check,
including failed probes, while an append failure still leaves the count
unchanged because no cell-result was saved. Existing failure-prefix and success
digest paths are otherwise unchanged. The previously failing injected test
passed 1/1 on the new source per `265-VERIFICATION-FIX.md`; this review did not
repeat that test or the full gate.

### Current memory-fix trace

`LeagueConnectedSession` now retains a scalar executed count, compact cell
receipts, and compact matrix roots; probe normalization occurs while its one
execution is transient. `readLeagueRecordGraph` authenticates bounded canonical
descriptors, chunks, links, cycles, and aggregate read budgets in one traversal,
then exposes indexed lazy values rather than a persistent decoded-value Map.
Callers build compact cell/journal/matrix maps and retrieve response charges by
parent-start index; failed-prefix and published-seed verification still traverse
rooted records. Response production retains one full primary receipt and
WeakSet-issued compact pairings. At `fingerprint.ts:488-515`, retained fingerprint
verification now reads each authenticated score artifact transiently, rejecting
duplicate receipt roots while appending only its compact execution commitment.
The first full receipt remains for legal-input and Chronicle roots; ordered
commitments derive the exact existing matchup root. The underlying artifact
reader recomputes each receipt/execution/traces root and enforces the per-read
bounds before returning records. Reopening still returns `issued: false` and
never enters the live WeakSet. The enlarged test compares against host-issued
compact root parity across 13 score artifacts, and rejects duplicate/reordered
roots, forged candidate fingerprints, retained-to-live issuance, and artifact
tampering. It is a meaningful synthetic identity/tamper regression, not a
quantitative heap-bound measurement; bounded residency follows from the source
loop's one-at-a-time ownership. The source trace does not claim that shallow
graph metadata or matrix maps duplicate all payloads.

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

This review made no private-store read, Strategy/Match execution, author/model/provider call, teacher search, allocation, or authority mutation. It did not repeat the long connected tests or the full 29-suite gate. `empiricalRequirementsComplete: false` remains intentionally unchanged. CI `67bcde10` raises only the named source-gate timeout from 30 to 45 minutes; `967742cb` gives the larger fingerprint fixture a per-test 30-second bound.

---

_Reviewed: 2026-09-22T00:29:46Z_
_Reviewer: gsd-code-reviewer; depth: deep; source-only._
