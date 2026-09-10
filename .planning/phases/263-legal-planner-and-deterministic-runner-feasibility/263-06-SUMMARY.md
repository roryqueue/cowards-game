---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "06"
subsystem: strategy-lab-cli
tags: [terminal-non-pass, frozen-inventory, actual-validation, timing-failure]
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
completed: 2026-09-10
status: terminal_non_pass
tasks-completed: 3
tasks-total: 3
---

# Phase 263 Plan 06: Terminal Non-pass Summary

Tasks1/2 implemented and independently reviewed the private CLI. Task3 consumed its sole actual-source run:256 validation cases passed, but selection p99 failed64.135270ms against strict<5ms. SoldierBrain passed2.349449ms. Zero Matches ran. Accounting is terminal; phase feasibility is not satisfied. Historical task checkpoints below are superseded by the terminal section.

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
- Parent/fixer integrated final mapped protocol, runner admission/filtering and CR06/CR07 cleanup. CLI does not remap a final corpus. `job.remainingCleanupMs()` now reports `Math.max(0,3600000-(performance.now()-start))`; cancellation and final owned cleanup check both cleanupComplete and orphanedChild, retaining non-pass truth rather than ignoring returned cleanup failures.
- Independent Task2 review must inspect the newly wired live branches and read-only verifier. The synthetic tests do not establish real supervisor behavior, live p99, complete Match success or byte-identical actual-source reproduction.
- Parent Task3 must perform the exact-runtime availability check, final clean review/root binding, sole final preparation/run and required eight geometry-baseline/all-failure trace realism review. No final manifest or feasibility report has been created.
- Read-only evidence reconstruction is a private local integrity check, not a new producer-attestation mechanism. Runtime issuance is checked during the owned execution path; serialized data is never promoted into a live supervisor issuer.
- No shared STATE/ROADMAP/REQUIREMENTS, review document, other-agent source, historical lock or consumed Phase262 selector was modified.

## Task 1 Resource Correction

- [Rule1] Parent inspection found validation retained all170 admitted contexts until the full inventory ended. The injected context owner now precomputes each context's last case, closes fresh contexts immediately and reused contexts after their final declared case, and has a hard cap of two owned contexts. Per-case finally plus outer fallback drains early exits. An unsuccessful close remains owned, prevents replacement, and is never silently retried.
- Full256-case lifecycle regression confirms232 synthetic dispatches,24 static admission rejections with no host construction,170 total contexts, peak one live host, each host closed exactly once, and32 calls on each genuinely reused method context. A second regression covers failed cleanup, early exit and hard-cap rejection.
- RED observed two missing-helper failures. GREEN: the focused CLI/information suite passed7/7 in39.28seconds; strict standalone CLI/test TypeScript passed. No actual runtime host, container, emitted source, Match or benchmark was executed.
- Implementation closure changed; parent must regenerate inspection/review bindings before final preparation. Inventory counts and case expectations were not changed.

## Self-Check: PASSED (Task 1 Only)

All three owned source/test files exist; prior task commits exist. The corrected suite passes7 tests and the standalone typecheck passes. Tasks2/3 and final empirical report remain incomplete by explicit delegation.

## Task 2 Independent Review Complete

The final independent review resolves CR-01 through CR-12 and WR-01, with zero active findings. It binds unchanged emitted source `sha256:6bf1f02f273f4c743781aee7f9a9693aa55096e687bedaedba49504e4c14907b` and corrected execution closure `sha256:08cb747202ea9d67ec28119b1c776fcc2efabfcd8986887dd1dfdf25bfc2ca1c`. The linked REVIEW and REVIEW-FIX documents preserve prior findings and their resolution evidence. No new numbered repair plan or empirical retry was introduced.

Final CLI regression:8/8 passed in72.99seconds. Strict standalone CLI/test TypeScript and package build pass. Seven injected/static supervisor seam tests pass, with53 unrelated tests excluded to avoid unauthorized guest execution. Exact Docker server29.4.0 and pinned image availability were checked read-only. Full safe phase and canonical seam regression is the remaining pre-run check. No final manifest or live allocation has been consumed at this checkpoint.

Final pre-run regression subsequently passed181/181 across19 phase/canonical test files in223.60seconds. Together with8 CLI and7 selected injected/static supervisor tests,196 tests pass. No live guest execution occurred in those tests. Source review/fixes are committed as `cc60a512`; the final preparation/run remains unconsumed at this checkpoint.

## Task 3 Terminal Actual-source Result

The immutable manifest was prepared at `d138fdb2fe1767bb1d5439b4c935e1ea91deba0c`, then --run invoked exactly once without intervening source or Git changes. Actual validation passed256/256cases with232guest calls and24expected pre-runtime rejections. Benchmark completed2200calls: selection p99=64.135270ms FAILED; SoldierBrain p99=2.349449ms PASSED. All24Match slots remain unused because the hard gate correctly denied dispatch. Total elapsed517054.38332ms, no uncertain charges. Read-only --verify subsequently returned non_pass with no execution.

See263-FEASIBILITY.md for exact manifest/receipt roots, complete counts, private evidence footprint, observed cleanup facts and the aggregate-cleanup reporting nuance. No source timing was repeated and no threshold was changed. Plan263-07 records gaps and partial UAT; Phase264 remains blocked. A behavior-preserving source optimization is being prepared in an isolated branch only. A fresh actual-source allocation requires operator revision of the consumed no-retry envelope; no exact literal or new numbered plan chain is needed.
