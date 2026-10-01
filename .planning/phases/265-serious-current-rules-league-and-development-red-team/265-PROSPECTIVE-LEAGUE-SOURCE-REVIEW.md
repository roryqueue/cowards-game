---
phase: 265
review_type: incremental prospective-league source review
reviewer: /root/265_retry_plan_check
reviewer_role: independent read-only Codex reviewer (not a typed GSD reviewer agent)
independent: true
comparison: 4eb48e4d0070551cde3e0f7cb86ba7b46c0ed53a..e440763a75c0e66beb402548681a9acfddad9b24
current_implementation_root: sha256:cd473ada2a683facd8c4b1da52d165b80462d84cc489a8b1ac4d0d820baad60e
current_source_root: sha256:3ed892182f5130bd2578106ba7c1ab186b4b53a65570648435d597796a8ea6a5
status: issues_found
---

# Incremental full-league source review

## Scope and limits

Compared the previously accepted full-league source snapshot with the retry-v4
snapshot. Inspected the changed league connected runner and serious-league
reader/CLI, their focused tests, the factory/planner supervisor changes, and
the newly connected diagnostic-pilot/one-cell branches and grant callers. Also
traced the full-league execution stream, retained journal/result joins,
canonical-kernel replay, runtime cleanup, and allocation reservation path.

The ten-file retry-v4 source review remains the authority for its already
reviewed v4-only changes: [265-13-RETRY-V4-SOURCE-REVIEW.md](265-13-RETRY-V4-SOURCE-REVIEW.md).
This review does not re-review the 1,013-path closure, does not claim a full
Phase 265 review, and did not run tests or access private stores or selectors.
Root's current source gate was still running; no pending QA or type-check result
is asserted here.

## Finding

**BLOCKER — V3/pilot lifetime grants still authorize reusable and
constructor-injected runtimes.**

- `scripts/lib/v1-38-factory-supervised-runtime.ts:38-43,52-77` raises the
  accepted supervisor lifetime to 240 seconds for pilot/one-cell grants, but
  requires those tokens without claiming or consuming them. The constructor
  override guard at line 54 applies only to retry-v4 grants; `options.createRuntime`
  remains callable with a one-cell or pilot grant and the returned identity is
  accepted after matching source/runtime/attempt/budget/image at lines 78-81.
- `diagnostic-one-cell.ts:294-329` validates that a persisted start exists and
  has no run-attempt/terminal, then mints a reusable WeakSet grant. The pilot
  equivalent at `diagnostic-pilot.ts:330-362` likewise checks start/terminal
  but has no one-use claim. The grant is therefore available before durable
  execution charge; its `require` functions do not enforce later charge state.
- The one-cell worker's normal sequence issues each provider at
  `run-v1-38-one-cell-diagnostic.ts:904-909`, then enters
  `runDiagnosticOneCellCell` at line 915, where `writeRunAttempt` occurs only at
  `connected-runner.ts:325`. This establishes a concrete construction-before-
  charge path; repeated direct factory construction can reuse the grant. The
  ordinary full-league issuer does not pass these grants, so this finding is
  scoped to the still-callable legacy diagnostic branch, not a claim that the
  normal full-league provider path uses it.

**Fix guidance:** Disable the obsolete V3/pilot lifetime extensions for new
operations, or make their issuance require durable charge first and their
factory/planner claims atomic, root-bound, and single-use. Reject
`createRuntime`/host-constructor injection for every authority-bearing grant;
keep fixture injection in module-mocked tests only. A consumed V3 route must
not be reopened or resumed.

## Full-league path observations

- The ordinary league issuer and `runLeagueCell` remain distinct from the
  diagnostic provider APIs. The serious-league matrix path records its durable
  cell start before issuing providers (`run-v1-38-serious-league.ts:410-449`);
  the legacy allocation-only reservation is created with exclusive `open(...,
  "wx")` semantics (`:525-538`). The consumed allocation-v2 run therefore
  cannot authorize a repeat in its bound repository; retained validation also
  requires the same rooted marker/reservation (`:930-934`). A fresh route needs
  a fresh prospective allocation and capacity chain, not reuse of v2.
- The incremental retained journal/result helper at
  `run-v1-38-serious-league.ts:203-223` checks bijective start/result roots,
  duplicate/missing rows, allocation binding, and matching cell, candidate,
  seed, and options values. The enclosing verifier separately validates
  persisted terminal/failure joins (`:955-982`). The failure diagnostic stores
  only an allowlisted supervisor code and coarse error class (`:35-45`), not
  free-form messages.
- The full-league stream is separate from the V3/V4 diagnostic codecs. Its V2
  writer chunks canonical execution frames at 131,072 bytes; the reader bounds
  total bytes/records and rejects a logical frame over 8 MiB
  (`scripts/lib/v1-38-league-execution-stream.ts:69-120`). For empirical
  executions, retained verification replays each transition through
  `MATCH_KERNEL` and exact-compares each generated record
  (`run-v1-38-serious-league.ts:760-795,980`). This checks transition/machine
  continuity through canonical replay rather than the diagnostic codec's
  explicit adjacent-hash check. The V3 8,192-byte row ceiling is not the
  full-league limit; the distinct league reader uses the bounded 8 MiB frame
  ceiling plus allocation-wide caps. I found no corresponding continuity or
  row-ceiling blocker in this focused static trace.
- Plan 14 retained evidence is diagnostic-only; its recorded authority flags
  remain false in `265-14-RETAINED-REVIEW.md`. It cannot be imported as a
  complete matrix or as LEAG evidence.

## Verification status

This is a scoped incremental source review, not a replacement for the complete
pre-dispatch validation gate or for the pending root QA. One actionable blocker
remains in the legacy V3/pilot grant path; the ordinary full-league stream,
charge, retained-join, and replay paths showed no actionable defect in the
reviewed scope.
