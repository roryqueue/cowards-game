---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "01"
subsystem: strategy-lab
tags: [private-lab, canonical-json, deterministic-corpus, dependency-boundaries]
requires:
  - phase: 262
    provides: Verified fixture admission roots and unchanged selected runtime profile
provides:
  - Strict bounded private contracts and exact expected-manifest admission
  - Fixed 200-input legal timing corpus and 24-attempt allocation
  - Negative production dependency graph and receipt allowlist
affects: [263-02, 263-03, 263-04, 263-05, 263-06, 263-07]
tech-stack:
  added: []
  patterns: [canonical byte admission, domain-separated identities, source-independent measurement allocation, AST module graph]
key-files:
  created: [packages/strategy-lab/package.json, packages/strategy-lab/tsconfig.json, packages/strategy-lab/src/index.ts, packages/strategy-lab/src/contracts.ts, packages/strategy-lab/src/contracts.test.ts, packages/strategy-lab/src/feasibility-protocol.ts, packages/strategy-lab/src/feasibility-protocol.test.ts, scripts/check-v1-38-lab-boundaries.ts, scripts/check-v1-38-lab-boundaries.test.ts]
  modified: []
key-decisions:
  - Canonical fixture context describes scenarios without claiming deployed mission behavior; actual mission ABI integration remains explicit downstream.
  - Trusted coordinator freezes the expected manifest and exact allocation before admitting runtime-bound source and machine identities.
  - Keep shared requirements pending until their remaining implementation and empirical gates are verified.
requirements-completed: []
requirements-covered: [PLAN-06, FACT-01, FACT-04]
duration: 10min
completed: 2026-09-09
status: complete
coverage:
  - id: contracts
    description: Private bounded manifest and classified records
    requirement: FACT-04
    verification: [{kind: unit, ref: "packages/strategy-lab/src/contracts.test.ts", status: pass}]
    human_judgment: false
  - id: protocol
    description: Frozen legal corpus, allocation and timing calculation
    requirement: PLAN-06
    verification: [{kind: unit, ref: "packages/strategy-lab/src/feasibility-protocol.test.ts", status: pass}]
    human_judgment: false
  - id: boundaries
    description: One-way graph and safe receipt negative fixtures
    requirement: FACT-01
    verification: [{kind: unit, ref: "scripts/check-v1-38-lab-boundaries.test.ts", status: pass}]
    human_judgment: false
---

# Phase 263 Plan 01: Private Contracts and Frozen Feasibility Protocol Summary

Strict private admission, 200 distinct canonical legal inputs, 24 charged attempts covering eight scientific cells, and a negative production graph monitor are implemented without executing Strategy source or Matches.

## Accomplishments

- Private ESM package with only existing workspace dependencies and no production build entry. Contract schemas reject unknown keys, invalid identities, unsafe artifact names, invalid classifications, and noncanonical/oversized raw envelopes. Semantic and operational evidence remain separate.
- Pinned admitted study/measurement/tuple/runtime/image/profile/source-module/custody references do not reuse consumed markers or capacity. Fresh candidate, fixture, corpus, harness, budget, machine and validation-inventory roots are bound by exact expected-manifest admission.
- Fixed corpus root: `sha256:b14605fdf1d117e0759fb75df0719f6196f54dda8f63660b14742937a7edaed3`. Ten missions × ten scenario families yield 100 distinct canonical input hashes per method. Inputs vary board positions, threat orientation, terrain, STONE, reversal history, phase/round, Advance, objective and memory. The hostile-schema timing family is valid boundary-size data, never malformed input.
- Allocation retains 12 arena-label tasks, eight geometry/side/initiative cells, two passes and 24 distinct charges. Alias compatibility and replication never inflate the eight-cell scientific denominator. Baseline geometry-distinct cells are marked for review; all traces and all failures require retention/review downstream.
- Benchmark is 100 warmups + 1000 samples per method, 2200 total calls, nearest-rank sample990, strict per-method p99 below5ms, fresh input/memory every call, trusted supervised observer only. Runtime timeout remains1000ms; 256 validation calls, zero retries, 120-second Match and60-minute total bounds remain fixed. Structural ceiling597656 includes Matches and both invocation inventories.
- AST imports/reexports/require/dynamic forms, constant expressions, TypeScript path aliases, transitive paths, Go/generated/image/deployment exposure and core reverse dependencies have negative tests. Actual repository scan:1181 files, zero violations. Receipt fields are allowlisted and count-conserving.

## Task Commits

1. Contracts RED `cf3b5399`; GREEN `60c517f0`.
2. Protocol RED `ae8815c3`; GREEN `d6fc27ee`.
3. Boundaries RED `535f63c1`; GREEN `06de724d`.

Each RED run failed on the missing implementation module before implementation. Each GREEN passed its focused suite. No tracked files were deleted.

## Verification

- `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/contracts.test.ts`: initial RED; initial GREEN found one fixture-path typo. Corrected focused run passed5/5.
- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/feasibility-protocol.test.ts`:3/3 passed.
- `./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-lab-boundaries.test.ts`:20/20 passed.
- Combined three suites:28/28 passed, 7.91seconds.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: passed.
- `./node_modules/.bin/tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --skipLibCheck --strict --types node --ignoreConfig scripts/check-v1-38-lab-boundaries.ts`: passed. Initial standalone command omitted `--types node`; correcting the command resolved it without source edits.
- `./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts`: zero violations,1181 files.
- Changed-source stub scan: none. No new network, authentication, production schema, or public route surface.

## Deviations from Plan

- [Rule3 — Tooling] `pnpm exec` automatically refreshed workspace metadata after detecting the package. It downloaded nothing and upgraded no dependency; its importer/deprecation-only lockfile diff was removed with apply_patch. Subsequent verification used already-installed local binaries. Lockfile remains unchanged.
- [Rule3 — Test scope] Full repository graph scan initially exceeded the default five-second test timeout. Cached directory lookup and a30-second test timeout keep the bounded actual-tree check reliable; subsequent scan took about3.6seconds.
- [Rule2 — Truthful tracking] PLAN-06/FACT-01/FACT-04 are covered here but not globally completed: downstream runner, source execution and full coverage/atomicity gates remain outstanding. Do not infer empirical success from these synthetic tests.
- [Rule2 — History preservation] State/progress updates are scoped to current Phase263; legacy Phase262 sections and all36locks are preserved rather than allowing generic state handlers to reinterpret old current-position fields.

## Integration and Honest Limitations

- `LabManifestSchema` accepts the narrow allocation projection `{ordinal, taskRoot, attemptRoot, pass}`. Coordinator first validates the complete `buildFeasibilityAllocation()` result, then projects it into the manifest. Its trusted expected manifest must be frozen before measurement; accepting a manifest against itself is not admission.
- Corpus objective/StrategyMemory/SoldierMemory use explicit `fixtureContext`, not an invented deployed mission ABI. Downstream planner/validation integration must test any mission-packet mapping and freeze its final validation inventory before measurement. These100 cases/method establish legal input coverage, not ten-mission tactical success or reachable game trajectories.
- `harnessRoot` in the protocol identifies the fixed harness specification. Manifest harness/source roots must also bind the actual emitted/observer implementation before execution. Timing calculator consumes numbers only; authenticated observer provenance is Plan04's responsibility.
- Graph monitor covers supported static/constant module forms and fails potentially lab-directed unresolved edges; it is not a sandbox proof for arbitrary runtime-generated code.
- No live source, preflight, benchmark, Match, container, holdout, formation, production, or empirical pass was run or claimed. No deployment or engine/rule changes were made.

## Self-Check: PASSED

All nine owned deliverables exist. All six listed task commits exist. Combined tests and both relevant typechecks pass. Historical untracked cache and36locks remain untouched.
