---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "06"
subsystem: strategy-lab-cli
tags: [partial, task-one-only, frozen-inventory, synthetic-validation]
requires: [{phase: 263-01, provides: Final mapped protocol}, {phase: 263-03, provides: Static source builder}, {phase: 263-04, provides: Selected supervisor and observer}, {phase: 263-05, provides: Bound runner and private shards}]
provides: [Private prepare/run/verify command, Frozen256-case inventory, Read-only retained-evidence reconstruction]
affects: [263-06-task-2, 263-06-task-3, 263-07]
tech-stack:
  added: []
  patterns: [No-clobber private publication, Explicit case-vs-guest-call accounting, Schema-owned semantic projection]
key-files:
  created: [scripts/run-v1-38-planner-feasibility.ts, scripts/run-v1-38-planner-feasibility.test.ts, packages/strategy-lab/src/planner/information-boundary.test.ts]
  modified: []
key-decisions:
  - Charge256 validation cases separately from actual supervised guest dispatches; source/input rejection consumes its frozen case but no guest call.
  - Independent clean review must bind both emitted sourceRoot and the full coordinator executionRoot before run.
  - Baseline/alias/reproduction Match identities derive from geometry rather than physical attempt or arena label.
requirements-covered: [PLAN-04, PLAN-05, PLAN-06, FACT-02, FACT-03, FACT-04]
requirements-completed: []
duration: 25min
completed: null
status: partial
tasks-completed: 1
tasks-total: 3
---

# Phase 263 Plan 06: Task 1 Partial Summary

Task1 implements the private CLI and frozen256-case validation inventory. Tasks2 independent review and3 sole live allocation remain parent-owned and unexecuted; this is not plan or empirical completion.

## Task 1 Commits

- RED `7f4150e2`: CLI/information inventory tests failed on absent implementation.
- GREEN `524fc740`: CLI, inventory, source/pair/tactic checks and retained-evidence reconstruction.

## Verification Performed

- `./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-planner-feasibility.test.ts packages/strategy-lab/src/planner/information-boundary.test.ts`:5/5 passed,39.50seconds. Tests include256-case cardinality,64 canonical equal-input/private-different pairs, both-method visible controls, constant-controller rejection, temporary no-clobber preparation, read-only prepared verification and unresolved-review run denial.
- `./node_modules/.bin/tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --skipLibCheck --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --types node --ignoreConfig scripts/run-v1-38-planner-feasibility.ts scripts/run-v1-38-planner-feasibility.test.ts`: passed.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: passed after parent integrated runtime-js references.
- `git diff --check`: passed.
- Tests prepared only disposable `mkdtemp` directories, then removed those exact test directories. No final manifest preparation, source execution, supervisor, container, preflight, Match or benchmark occurred. Trusted source-module calls and static source building are the only Strategy-related tests performed here.

## Frozen Validation Inventory

-128 cases form64 pairs:32 per method, each split16 fresh-context and16 reused-context pairs. Canonical full-board or5x5 projection bytes are equal before output comparison, while hidden opponent StrategyMemory/SoldierMemory differs. Visible inputs vary across pairs. Both returned choice and returned memory are compared.
-64 legitimate controls:16 full-board evacuation/active-Soldier identity controls,16 rotated edge pushes,16 locally stale-target cases,16 authoritative Advance final-Cycle cases. Expected behaviors are specified independently of candidate output.
-64 hostile cases: invalid Action, oversized SoldierMemory, oversized StrategyMemory, oversized objective, thrown private exception, malformed input, forbidden source capability and source-size overflow; eight variants per group. Exact case order, expectations, source variants, input roots and hidden-state roots are hashed before measurement.
- Successful completion charges256 cases and expects232 guest dispatches:16 source rejections and8 input rejections occur before runtime. It never claims256 executed guest calls. Synthetic records permanently return `empirical:false,passed:false`, even when protocol checks pass.

## CLI and Integration APIs

- `inspectPlannerFeasibility()` is a read-only static builder returning source/execution/protocol/corpus/inventory/graph/harness roots. Parent uses it to bind the independent review before preparation; no guest source is invoked.
- `preparePlannerFeasibility({manifestPath,outputDirectory})`: captures Git commit/tracked-diff digest, lockfile, Node/V8/OpenSSL/OS/architecture/CPU metadata; binds final mapped corpus, exact source/artifact, fixture module pin, observer, task graph, implementation closure and fixed budgets. Writes immutable256 case files and a manifest once, with owner-only modes and no-clobber publication.
- `runPlannerFeasibility(paths)`: requires existing exact manifest, matching source/implementation/environment and review `status: clean` containing exact sourceRoot and executionRoot, with matching review digest. Claims consumed allocation before any execution. Uses the selected existing supervisor only. Validation precedes2200 benchmark calls; both gates must pass before24 Match opportunities. No retries.
- Runner uses frozen `executionRoot`, owned `cancel`, `attemptOrdinals:[0..5]`, `[6..11]`, `[12..23]`; first two batches are baseline1worker/shard1/forward, third is2workers/shard3/reverse. The final completed-inventory resume must dispatch zero new work. Geometry-owned Match identity/seed and canonical resolved arena normalize labels without dropping arbitrary raw data.
- `verifyPlannerFeasibility(paths)` rebuilds static material, validates retained case/charge/runtime bindings, reconstructs benchmark percentiles from retained timing, validates trace bytes, rederives schema-owned Match semantic roots and sorted reductions, and checks aggregate receipt counts. It never constructs a runtime host or reruns a Match.
- `buildPlannerValidationInventory()`, `evaluatePlannerValidation()`, `projectPlannerSemanticState()` and `derivePlannerMatchSemantic()` are exported for integration and synthetic tests.

CLI syntax is `--prepare|--run|--verify --manifest <path> --output <path>`. Exactly one mode and both paths are mandatory; unknown/secret flags are rejected. CLI output must lie under repository `.strategy-lab/`. Use the planned `.strategy-lab/phase263-feasibility`; its shard subdirectory is `lab-matches`, satisfying Plan05 basename admission. Root stdout contains only mode/status/productionAuthorized, never private manifest or evidence.

## Retained Evidence and Bounds

- Validation and benchmark charges/results occupy separate private subdirectories; full Match executions remain trace files in `lab-matches`. Operational identity stays in full private evidence, while comparison uses explicit state/transition/runtime projections and length-framed canonical sequence hashing.
- Fixed caps remain256 validation cases,2200 benchmark calls,24 Match opportunities,24800 calls/Match,597656 overall invocation ceiling,120seconds/Match,60minutes overall,1000ms existing per-method limit and strict p99 below5ms. Global timing begins before source rebuild and includes startup/cleanup.
- Receipt reports actual retained/charged counts, unused Match opportunities, elapsed time and **host** peak RSS. It does not claim container peak-memory measurement or external attestation.

## Deviations and Remaining Parent Work

- [Rule3] Information test uses a dynamic trusted root-CLI import so package TypeScript does not pull root scripts into its `rootDir`; source implementation remains statically typed and standalone-checked.
- [Rule3] macOS temporary directory tests canonicalize `/var` to its real `/private/var` location before strict no-symlink publication.
- [Rule2] Source/input rejection accounting explicitly separates case charges and actual guest dispatches, avoiding fabricated execution counts.
- Parent/fixer already integrated final mapped protocol and runner admission/filtering. CLI does not remap a final corpus. Cleanup CR06/CR07 fixes are still parent/fixer-owned; optional `job.remainingCleanupMs()` can use `Math.max(0,3600000-(performance.now()-start))` when that interface lands.
- Independent Task2 review must inspect the newly wired live branches and read-only verifier. The synthetic tests do not establish real supervisor behavior, live p99, complete Match success or byte-identical actual-source reproduction.
- Parent Task3 must perform the exact-runtime availability check, final clean review/root binding, sole final preparation/run and required eight geometry-baseline/all-failure trace realism review. No final manifest or feasibility report has been created.
- Read-only evidence reconstruction is a private local integrity check, not a new producer-attestation mechanism. Runtime issuance is checked during the owned execution path; serialized data is never promoted into a live supervisor issuer.
- No shared STATE/ROADMAP/REQUIREMENTS, review document, other-agent source, historical lock or consumed Phase262 selector was modified.

## Self-Check: PASSED (Task 1 Only)

All three owned source/test files exist, both task commits exist,5 tests and both typechecks pass. Tasks2/3 and final empirical report remain incomplete by explicit delegation.
