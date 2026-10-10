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

All three listed commits exist on the isolated replacement worktree. No STATE, ROADMAP, REQUIREMENTS, allocation artifact, or parent-owned note was modified.
