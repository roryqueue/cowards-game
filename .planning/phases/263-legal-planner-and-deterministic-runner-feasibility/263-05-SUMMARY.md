---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "05"
subsystem: strategy-lab
tags: [worker-threads, canonical-identities, atomic-shards, resume, private-accounting]
requires:
  - phase: 263-01
    provides: Bounded contracts and fixed24-attempt feasibility allocation
provides:
  - Twelve scientific/alias task identities and24 distinct preallocated attempts
  - Domain-separated SHA256 counter streams with fixed vectors
  - No-clobber private shards, verified trace references and append-only charge ledger
  - Actual trusted worker-thread scheduling and canonical semantic reduction
affects: [263-06, 263-07]
tech-stack:
  added: []
  patterns: [fixed trusted thread entry, atomic hard-link publication, explicit semantic projection, no-refund uncertain attempts]
key-files:
  created: [packages/strategy-lab/src/identity.ts, packages/strategy-lab/src/tasks.ts, packages/strategy-lab/src/tasks.test.ts, packages/strategy-lab/src/shards.ts, packages/strategy-lab/src/shards.test.ts, packages/strategy-lab/src/worker.ts, packages/strategy-lab/src/runner.ts, packages/strategy-lab/src/reduce.ts, packages/strategy-lab/src/runner-invariance.test.ts]
  modified: []
key-decisions:
  - Only internally constructed deeply frozen task graphs may bypass repeated structural admission; caller objects never enter the trusted cache.
  - Uncertain launched work is terminal non-pass and charged at24800method-call ceiling, never refunded or retried.
  - Actual threads run a fixed synthetic job or relay effects to the existing coordinator-owned supervisor; no callback serialization or eval.
requirements-completed: []
requirements-covered: [FACT-03, FACT-04]
duration: 16min
completed: 2026-09-09
status: complete
coverage:
  - id: identities
    description: Fixed scientific task and independent stream identities
    requirement: FACT-04
    verification: [{kind: unit, ref: "packages/strategy-lab/src/tasks.test.ts", status: pass}]
    human_judgment: false
  - id: publication
    description: Atomic no-clobber publication, charged uncertainty and validated resume
    requirement: FACT-04
    verification: [{kind: unit, ref: "packages/strategy-lab/src/shards.test.ts", status: pass}]
    human_judgment: false
  - id: threads
    description: Actual worker-thread Cartesian invariance and unscored failures
    requirement: FACT-03
    verification: [{kind: unit, ref: "packages/strategy-lab/src/runner-invariance.test.ts", status: pass}]
    human_judgment: false
---

# Phase 263 Plan 05: Stable Tasks, Atomic Shards and Trusted-Thread Reduction

Twelve task identities,24 precharged opportunities, append-only publication accounting and actual trusted worker threads reproduce identical semantic bytes across36 synthetic execution variants without permitting retries or failed payoffs.

## Accomplishments

- Task identities bind admitted/algorithm/candidate/opponent/input/budget roots, development split, geometry/side/initiative identity, arena label, ordinal and purpose. Eight scientific tasks and four explicit alias-compatibility tasks have representative links; two passes share task IDs but have distinct attempt IDs. Operational worker/shard/order/host fields cannot enter these task identities.
- SHA256 counter blocks have explicit domain/version/purpose/counter framing and stable golden vectors. Malformed roots, counters, identity keys and invented layout/retry capacity fail closed. The cache only recognizes graphs constructed and recursively frozen internally; a caller clone that mutates after an accepted validation is rejected on its next use.
- Single-coordinator publication writes exclusive same-directory temporary files, flushes/closes, rereads and validates bytes, publishes with atomic no-clobber hard links, and syncs the directory. Duplicate/conflicting targets are preserved. Generated filenames, canonical byte caps, trace digests and strict record/task/root joins are checked. Existing files are never silently overwritten.
- Per-attempt start and terminal files are append-only. Resume validates shards, trace references and ledger joins, excludes already-published attempts, ignores incomplete temp bytes, and identifies uncertain starts. Interrupted launched work cannot rerun or become unused; runner terminalizes it as system failure with a conservative24800-call charge. Remaining unstarted allocations become explicit unused records after failure.
- `worker.ts` is an actual `worker_threads` entry point. The known synthetic task executes in real threads with positive thread IDs; the supervised transport kind only requests the coordinator's injected existing supervisor. No Strategy source, callback string, eval, alternate rules, or package execution enters the trusted thread.
- Reduction requires exact24-attempt coverage, rejects even identical duplicate coverage, preserves outcome/final-state/transition/accounting roots and classifications, and compares both passes. Explicit semantic projection excludes physical metadata. Operational roots separately retain records, layout, ledger, machine and actual thread identities. Failed/incomplete/player-violation work yields no payoffs.

## Task Commits

1. Identities RED `108d6976`; GREEN `db8931d6`.
2. Shards RED `8436d7a4`; GREEN `b9357925`.
3. Runner RED `938b8bfc`; GREEN `38112d1f` (includes bounded immutable-graph cache and associated tamper regression).

All RED runs failed on missing implementation modules before implementation. No tracked-file deletions occurred. Task scope is nine source/test files; shared state/roadmap/requirements were left to the orchestrator as requested.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/tasks.test.ts packages/strategy-lab/src/shards.test.ts`:12/12 pass;5.61seconds. Task tests4, shard tests8.
- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/runner-invariance.test.ts`:3/3 pass;132.57seconds wall/130.67seconds tests.
- The matrix is the full Cartesian product workers{1,2} × shards{1,3} × order{forward,reverse,fixed permutation} × lifecycle{continuous,restart-after-publication,resume-complete}. All36 variants have identical semantic bytes and proper operational differences. Resume-complete dispatches zero workers/jobs. These are synthetic protocol proofs, not runtime or Match evidence.
- Lost actual worker is charged once, yields one system failure plus23 unused opportunities and no payoffs. Missing/duplicate/tampered semantic records fail admission.
- Fault injections cover before write, partial write, before publication, after publication and before terminal-ledger observation. Published evidence survives; otherwise its started charge remains uncertain and non-runnable.
- `./node_modules/.bin/tsc -b packages/strategy-lab`:passes after sibling runtime work completed. Earlier invocation encountered only the sibling's then-unimplemented benchmark module; no out-of-scope repair was made.
- `./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts`:passes,1201 files and zero violations.
- Owned-source stub scan: no TODO/FIXME/placeholder stubs.

## Deviations and Corrections

- [Rule3 — Performance] The initial full matrix exceeded its120-second test limit. Repeated admission of the same internally constructed immutable graph was eliminated with a WeakSet of only deeply frozen constructor outputs; untrusted graphs are still validated every time. A mutate-after-first-admission regression passes. The synthetic test limit is240seconds; actual final elapsed time132.57seconds. No empirical deadline or scientific gate changed.
- [Rule2 — Accounting] Unknown interrupted invocation count is conservatively charged at the per-Match upper bound rather than incorrectly claimed as zero. It remains system failure/unscored; no retries or capacity are minted.
- [Rule2 — Correctness] Terminal-ledger shard roots must match the particular record's containing shard, not merely any shard in the inventory. Supervised records require trace references and exact assigned machine/worker/shard binding before publication.

## Integration and Limitations

- Output directory must already exist, use a canonical realpath with basename beginning `lab-`, and not be a symlink. Temporary tests use isolated `mkdtemp` roots; all created test directories are removed by their own cleanup. Historical36locks and the existing research cache remain untouched.
- `enumerateLabTasks(context)` builds a graph, `assignLabTasks(graph, layout)` preassigns all attempts, and `runLabTasks({directory,graph,layout,machineRoot,job})` owns dispatch/publication/reduction. `job.kind:"supervised"` requires an injected trusted `execute` returning strict `LabStoredRecord` with a published trace reference. Plan06 must select this kind and bind its actual manifest/source/observer identities; synthetic output cannot substitute for empirical evidence.
- The native Node24 fixed worker entry uses Node's built-in TypeScript stripping during source tests and compiled JS in builds. No dependency additions, upgrades or lockfile changes were made.
- External supervisor cancellation and lifecycle cleanup remain the injected bridge/coordinator's responsibility. Worker loss stops/terminates trusted threads and preserves incomplete cleanup/non-pass; it is not a claim that the core can terminate external containers it does not own.
- Trace bytes are bounded at64MiB/reference; shard/ledger canonical envelopes at262144bytes; shards contain1–3 records; directories at256 entries. Plan06 must retain actual full traces within these bounds or stop, never silently truncate or waive retention.
- `syntheticDispatchLimit` is accepted only for synthetic jobs to exercise pre-dispatch/complete-publication restart boundaries. It does not create partial live-run authority or retry capacity.
- Atomic hard-link publication and directory synchronization are tested under the single-coordinator local filesystem model. No hostile-same-UID, distributed-writer or universal power-loss durability certification is claimed.
- No live Strategy, benchmark, preflight, Match, container, production, formation or holdout work was performed. Requirement completion and empirical admission remain the later verifier/orchestrator's responsibility.

## Self-Check: PASSED

All nine owned source/test files and six task commits exist. Focused suites total15passing tests, including the36-variant matrix. Package typecheck and repository boundary monitor pass. No shared tracking edits or unrelated source changes were made by this plan.
