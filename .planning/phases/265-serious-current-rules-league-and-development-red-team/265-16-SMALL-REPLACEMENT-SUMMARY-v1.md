---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-supplement-v1
subsystem: private-probe-source
tags: [private-probe, source-only, bounded-supplement]
dependency_graph:
  requires: [265-16-SMALL-REPLACEMENT-PLAN-v1.md, 265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md]
  provides: [opaque-private-probe-authority, ordered-layer-claims, payload-free-four-case-schedule]
  affects: [scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-lean-container-match-session.ts]
tech_stack:
  added: []
  patterns: [WeakMap-backed-capability, exact-root-binding, schema-checked-public-observation]
key_files:
  created: [scripts/lib/v1-38-lean-experiment-authority.test.ts, scripts/run-v1-38-lean-private-probe.ts, scripts/run-v1-38-lean-private-probe.test.ts]
  modified: [scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-container-match-session.test.ts]
decisions: [No Match/runtime/provider was invoked; source implementation and inert entry-path tests do not establish physical feasibility or replace ROOT-controlled source gates.]
metrics:
  duration: 00:18
  completed: 2026-10-10
status: partial
---

# Phase 265 Plan 16: Small Replacement Source Handoff

Implemented a separate opaque, one-use private-probe capability and bound its exact source/method/input/schema roots through the existing factory, planner, and session layers without changing legacy issuers.

## Completed Source Work

- Added a capacity receipt, committed-allocation admission handle, durable append/fsync/reopen debit path, per-ordinal opaque authority, and single-claim factory → planner → session ordering in `v1-38-lean-experiment-authority.ts`.
- Probe factory mode rejects property-presence overrides (including `createRuntime`), mixed legacy authorities, injected transport/observer seams, and requires the existing default runtime constructor.
- Factory and planner invocation boundaries consume at most one call and verify the exact admitted method/input/request roots before dispatch. Planner request roots bind method, input root, and tuple; the allocation ordinal is not confused with kernel request coordinates.
- Session probe mode rejects injected transports and mixed authority paths before container construction.
- Added pure schedule construction from the canonical smoke-arena starting state: two identical schema-valid `selectActivations` observations, two identical schema-valid `soldierBrain` observations, and `matchCount: 0`. The schedule retains roots, not input payloads.
- Added `prepare`, `entry`, and `verify` CLI modes. The immutable source input is selected only by `--source-store` plus `--source-root`; the fresh, payload-free output store is separately selected by `--store`. Prepare writes the canonical v1 allocation artifact for ROOT to commit after independent gates. Entry charges before calling the default factory once per ordinal, verifies evidence, closes it, records only bounded roots/status/measurements and stops after first failure. Verify is read-only and checks committed bytes/HEAD, debit ordering, exact inventory and retained roots.
- Added inert-module seam tests for four successful one-call ordinals, stopping on an explicit timeout, missing cleanup becoming system failure, and tampered results; these are source tests only and do not establish a real runtime/cleanup pass.

## Verification

- Focused runner/authority tests: 8 passed.
- Factory/planner/session plus runner/authority suites: 260 passed, 1 failed. The one failure is `does not issue diagnostics from pre-issuance accounting when cleanup throws`; the exact case also fails on the unchanged base checkout. It remains an unwaived NOTPASS and was not modified.
- Configured pinned `tsc -b --pretty false`: exit 0.
- Strict eight-file baseline before edits had 13 diagnostics. Final ten-file strict command exited 2 with the same 13 diagnostics and no new diagnostics in the ten scoped files. These inherited errors are not a green strict global typecheck.
- `git diff --check` passed before the source-layer commit.

## Bounded Gap / Not Executed

No prepare, entry, or verify command was invoked in this task. The source input location for a later ROOT-gated invocation is the pre-existing immutable private source store containing `source-probe.json`, selected by canonical `--source-store` and joined to `--source-root`; the fresh new store must not contain that source file. The command forms are:

```text
tsx scripts/run-v1-38-lean-private-probe.ts prepare --source-store <existing-private-source-store> --source-root <sha256-root> --store <fresh-private-store> --source-head <fixed-source-head> --cost-snapshot-root <sha256-root>
tsx scripts/run-v1-38-lean-private-probe.ts entry --source-store <existing-private-source-store> --source-root <sha256-root> --store <prepared-private-store> --allocation-commit <allocation-child-commit> --allocation-path .planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json
tsx scripts/run-v1-38-lean-private-probe.ts verify --source-root <sha256-root> --store <terminal-private-store> --allocation-commit <allocation-child-commit> --allocation-path .planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json
```

The source code does not itself provide the independent outside-store report or historical resource recomputation beyond recorded host RSS/disk/time samples; ROOT's source gates and external verifier remain required. No allocation was created, no source payload was copied into a new store, and no provider, container, guest code, Match, or historical evidence was invoked or rewritten. Therefore this work does not establish runtime feasibility and earns no baseline/freeze/LEAG/production credit; disposition remains `feasibility_not_established` until ROOT completes independent gates and real read-only verification.

## Commits

- `8db76c43` test(265-16): add failing private probe authority tests
- `bd9acbd4` feat(265-16): issue private probe authority from durable debit
- `26de80dc` feat(265-16): propagate private probe authority through runtime layers
- `0d5b633b` feat(265-16): add bounded private probe runner and verifier

## Self-Check: PASSED

All four listed source commits exist on the isolated replacement worktree. This summary is the fifth task commit. No STATE, ROADMAP, REQUIREMENTS, allocation artifact, or parent-owned note was modified.

## Bounded Review Correction — 2026-10-10

Disposition: `gaps_found`, source-only, pending independent re-review; runtime feasibility remains unestablished. All six critical findings were attempted within the same ten source/test paths. No allocation, prepare, entry, retained verification command, provider, container, Strategy, or Match was run. ROOT owns integration, review notes, gates, and actual entry.

- `3ac6cb29`: CR-02/CR-03/CR-06 source corrections. Probe host receipts derive 5000ms from the claimed binding while preserving guest1000 and executable equality; earlier debit bytes are reconstructed exactly; any uncertain issuance permanently invalidates the admission; alternate Docker and cleanup timeout property presence rejects at factory/planner/session. Logic changes require independent verification.
- `c815e832`: CR-01/CR-04/CR-05 corrections and bounded regressions. The sole 144640-byte historical snapshot is authenticated against its exact raw digest and body root, with 40 charges/1077 survivors/29970432 allocated bytes preserved. Current time uses carry285590903/cap292790903/resume1791633532000/deadline1791640732000 and the full1860000ms reserve. Prewrite and every-debit resource checks include actual bounded new-store blocks plus131072B future-write reserve. Existing aggregate RAM checking uses measured parent RSS/high-water plus the enforced256MiB container upper bound and unchanged external/guard reserves: this is not a sampled container peak. Terminal retains those exact-key measurements/bounds; the read-only verifier recomputes their arithmetic and retained-store block join.
- Admitted execution has an outer finite resource/I/O failure terminalization path, keeps attempted ordinals and provider cleanup, attempts terminal/result writes independently without reusing a failed capacity guard, and throws an honest incomplete-terminal error if persistence/capacity fails. Failed/incomplete retained stores cannot verify as accepted.
- Request bytes reconstruct the complete frozen nested schedule; records require exact case identity, safe nonnegative measurements, bounded numeric output bytes, evidenceVerified===true and cleanupComplete===true for success. Accepted retained verification rejects incomplete cleanup and continuation after cleanup failure. Constructor timing is accurately `factoryConstructionMs`; guest startup stays `unknown`.
- Added five actual temporary Git/filesystem admission/debit/ordered-claim corruption tests (request/input/case/extra/delimiter), including failed issuance followed by restoration/retry; override tests cover inherited, undefined and accessor presence without evaluating getters. Added arbitrary cost/private nested data/cleanup-order rejection tests.

Actual checks: final authority+runner suites14/14 PASS; earlier exact five-suite run267 PASS/1 inherited cleanup-throws failure, still NOTPASS/unwaived. Explicit ten-file strict check exited2 with inherited-only reported diagnostics and no new scoped errors. `git diff --check` passed. No global strict green or full-suite waiver is claimed.

Remaining scoped gaps: the full retained-store read-only tampering fixture and actual authenticated capability through all three default-provider constructor boundaries are not completed; existing runner seam tests remain seam evidence. Conservative container memory upper bounds are retained honestly, not sampled runtime peak measurements. These gaps and all logic fixes require independent source re-review before any empirical gate. No new helper/carrier/plan/report family or historical payload scan was introduced.
