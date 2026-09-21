---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-21T22:34:36Z
depth: deep
reviewed_head: 5d55492009a6cd8fe031522fceb4543719edfc24
reviewed_source: 5d55492009a6cd8fe031522fceb4543719edfc24
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
status: findings_found
reconciled: 2026-09-21
---

# Phase 265: Code Review Report

**Reviewed:** 2026-09-21T22:34:36Z
**Depth:** deep
**Files Reviewed:** 46
**Status:** one subsequently confirmed scalability blocker

## Summary

The original independent deep review closed all eight supported defects at
`5d55492009a6cd8fe031522fceb4543719edfc24`; its unchanged clean report is
preserved in `265-REVIEW.iter4.md`. Main's subsequent execution-realism check,
independently traced by `/root/265_memory_scale_check`, confirms the additional
scalability blocker below. This is an explicit amendment, not a claim that the
earlier reviewer found it. The ongoing combined gate is a baseline for these
bytes, not proof of full-size memory feasibility. No empirical allocation exists.

## Current finding

### CR-01 — Complete Match payloads accumulate without a memory bound (BLOCKER)

**Severity:** critical for the intended full private league and retained verification.
**Source:** main realism inspection plus independent read-only data-flow check.
**Files:** `scripts/run-v1-38-serious-league.ts`,
`scripts/lib/v1-38-league-response-runtime.ts`, and the paired-fingerprint issuer
in `packages/strategy-lab/src/factory/fingerprint.ts`.

- `LeagueConnectedSession.cells` keeps every result's complete `execution`
  (`run-v1-38-serious-league.ts:175,218`); `matrix().results`, current matrices and
  round blocks retain the same payload references (`:231`). Probe executions
  enter the same permanent array. Most consumers need only roots, terminals and
  candidate/condition identities, or one transient execution for a probe digest.
- Response production retains full score receipts and their executions in
  `receipts[]` (`v1-38-league-response-runtime.ts:155,207`) until fingerprinting.
- `readLeagueRecordGraph` eagerly decodes all linked values into a Map
  (`run-v1-38-serious-league.ts:103`). Full verification and production-failure
  verification materialize entries; cell/matrix maps and the response reader
  then retain full executions. Merely wrapping that Map in lazy getters without
  changing materializing callers is insufficient.

**Impact:** peak live payload scales with the entire retained run instead of one
Match or a bounded working set. The actual host has 16 GiB RAM. Historical Phase
263 retained 187,807,888 trace bytes for 24 full Matches (about 7.83 MB per Match).
At 21 candidates a single matrix has 1,680 Matches; two seeds have 3,360. Applying
that historical serialized-size reference gives about 26.3 GB before probes or
responses. This is an illustrative scale comparison, NOT a measured Phase 265
heap/OOM result; JavaScript representation and traces differ. Shallow maps/arrays
share objects and are not alleged to duplicate all payload bytes. Disk/record
ceilings and bounded solver-payoff transport do not bound the persistent heap.

**Required same-plan repair:** retain scalar executed counts and compact rooted
cell/matrix receipts; derive normalized probe evidence while one execution is
transient. Index/authenticate graph descriptors and links without retaining every
decoded payload, and provide bounded on-demand reads throughout all retained
verification paths. Compact response paired commitments must preserve actual
host-issued fingerprint provenance and exact roots; never replace issued receipt
checks with a serializable trust flag. Preserve all disk evidence, replay/tamper
checks, counters, failures, runtime bounds and historical identities.

**Regression:** use trusted synthetic large payloads and injected callbacks to
prove bounded decoded-value residency and compact runner/response retention,
unchanged semantic/fingerprint roots, and rejection of forged compact evidence,
missing/tampered/cyclic graphs and over-budget reads. No real Match, authoring,
provider, historical-store mutation or live allocation is needed for this repair.

This is the third same-plan fix pass, not a new phase, numbered plan, rules
decision, external-custody requirement or user checkpoint.

## Narrative Findings (AI reviewer)

No BLOCKER, WARNING, or INFO finding is established by this re-review. The earlier unsupported independent-round dereference allegation remains removed: TypeScript groups the whole development-target comparison, including `roundBlocks[0]`, under the `evaluationRole === "development_response"` short circuit.

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

This review made no private-store read, Strategy/Match execution, author/model/provider call, teacher search, allocation, or authority mutation. It did not repeat the long connected tests or the full 29-suite gate. `empiricalRequirementsComplete: false` remains intentionally unchanged.

---

_Reviewed: 2026-09-21T22:34:36Z_
_Reviewer: gsd-code-reviewer; depth: deep; source-only._
