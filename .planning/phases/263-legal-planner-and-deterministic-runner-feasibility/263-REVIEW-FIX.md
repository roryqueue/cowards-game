---
phase: 263-legal-planner-and-deterministic-runner-feasibility
fixed_at: 2026-09-10T04:21:19Z
review_path: .planning/phases/263-legal-planner-and-deterministic-runner-feasibility/263-REVIEW.md
iteration: 3
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 263: Code Review Fix Report

## Iteration 3 — Full-path corrections

Source review: main `bc9920dd`. Isolated branch `codex/263-review-fixes3`, worktree `/tmp/sv-263-reviewfix3-A8mosW`. Parent integrates by cherry-pick; no main merge or worktree cleanup was performed. All five active findings were addressed; none skipped. Each logic correction is **fixed: requires human verification** through the parent's independent re-review.

### CR-12: Routine CLI tests could reach the real host

**Commit:** `02857399`.
**Files:** `scripts/run-v1-38-planner-feasibility.test.ts`.
**Applied fix:** Hoisted deny-by-default host constructor mock and deterministic unresolved review fixture remove dependence on the checked-in review's status. Assertions require zero host construction. Injected synthetic transport tests remain separate. Fixed first, before running routine CLI tests.

### CR-08: Benchmark host inherited the 120-second Match lifetime

**Commit:** `b485dbe0`.
**Files:** `scripts/lib/v1-38-planner-supervised-runtime.ts`, its test, and CLI.
**Applied fix:** Only the 2,200-invocation observer host accepts an explicit positive lifetime bounded by the remaining 60-minute outer budget. The CLI supplies that remainder. Ordinary Match hosts retain 120 seconds, and all invocation frames retain 1,000 ms.
**Regression:** Fake monotonic time admits benchmark work at 132 seconds within its 180-second remainder, rejects work at expiry, and preserves ordinary Match expiry at 120 seconds. No real host.

### CR-09: Failed receipts lost durable precharges

**Commit:** `f1105062`.
**Files:** CLI and CLI test.
**Applied fix:** Fixed bounded charge/dispatch inventories derive allocated, unused, attempted, confirmed-returned and uncertain counts independently of successful function returns. Missing charged terminal records become explicit uncertain records in the caught-failure terminalization path; benchmark invocation errors also retain uncertainty. Match charged/unused/uncertain counts derive from the existing runner inventory. Caught execution failures publish a terminal receipt without fabricated successful completion.
**Regression:** Temporary synthetic fixture has three validation precharges, one dispatch, one benchmark precharge and no returned summaries. Terminalization retains all charges, zero confirmed calls, and explicit uncertainty; the complete non-pass receipt verifies read-only.
**Limit:** An abrupt process kill or unavailable filesystem cannot physically publish a receipt at that instant. Existing durable precharges remain the source of truth; read-only verification reports incomplete/non-pass instead of claiming completion.

### CR-11: Executable commitment omitted selected dependencies

**Commit:** `672ddce3`.
**Files:** CLI, new narrow `scripts/lib/v1-38-executable-closure.ts` and its test.
**Applied fix:** TypeScript static import/export/require resolution traverses the selected local executable closure, including runtime executor, ABI/spec, kernel and emitted planner dependencies. It hashes installed external dependency bytes and dependency manifests recursively, rejects unresolved/dynamic edges, and excludes review/artifact files. No review-root self-reference or custody chain.
**Regression:** Read-only closure includes 372 files in this installed workspace; synthetic in-memory changes to executor, spec schema and kernel step change the commitment. Missing dependency fails admission.

### CR-10: Retained verification trusted counts and discarded failure predicates

**Commit:** `a23d0ce8`.
**Files:** CLI and CLI test.
**Applied fix:** Strict manifest, charge/terminal, validation/runtime, benchmark observation/summary/cleanup and receipt envelopes; complete expected runtime identity and invocation binding; validation classification/value rederivation; every published allocation count compared to the fixed retained inventories; read-only expected Match run-header and machine binding; trace envelope/semantic recomputation; benchmark commitment, measured arrays and p99 consistency; explicit cleanup, provenance and completion pass predicates. Host cleanup failure no longer overwrites the classification of a valid retained runtime result.
**Regressions:** Reject missing/unknown fields, impossible counts, altered derived counts, changed runtime identity/classification and wrong run binding. Complete low-latency samples cannot pass with failed summary or failed cleanup. The interrupted fixture remains a valid non-pass.

### Verification and scope

- Strict standalone TypeScript check passed for CLI and CLI tests.
- Final synthetic/read-only run: **3 suites, 21 tests passed**, 84.32 seconds wall time: `vitest run --maxWorkers=1 scripts/run-v1-38-planner-feasibility.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-executable-closure.test.ts`.
- Modified sections reread; `git diff --check` passed.
- One preliminary fixture rerun detected implementation-root drift while this agent was still editing source; the final run held source fixed and passed.
- Fixed inventories remain 256 validation slots / 232 intended guest calls / 2,200 benchmark calls / 24 Matches / zero retries. Warmups remain 100 and samples 1,000 per method, p99 threshold strictly below 5 ms.
- No live guest source, supervisor, container, Match, preflight, benchmark or final empirical manifest was executed/created. Temporary synthetic preparation was removed by test teardown.
- No unresolved scoped finding is claimed; independent review still owns acceptance. These tests establish local consistency, not external attestation or measured feasibility.

## Prior fix history (unchanged)

## Iteration 2 — Cleanup Corrections

Independent iteration-2 review on main `4db271cd` resolves the original six findings and identifies only CR-06/CR-07. Both are fixed, none skipped. Prior iteration history is retained below. This is still pre-integration synthetic verification, not empirical feasibility.

### CR-06: Pre-dispatch benchmark rejection skipped owned-provider cleanup

**Files modified:** `packages/strategy-lab/src/benchmark.ts`, `packages/strategy-lab/src/benchmark.test.ts`.
**Commit:** `7eb1d19e`.
**Status:** fixed: requires human verification.
**Applied fix:** All corpus admission, identity validation and immutable copying now run inside the provider's exactly-once cleanup guard. Rejection returns a structured non-pass with `charged:0`, `reason:admission_rejected` and explicit `cleanupComplete`; cleanup exceptions or incomplete cleanup remain false. Post-dispatch non-pass also reports cleanup status. No invalid setup consumes invocations and no rejected setup bypasses `close()`.
**Verification:** Eight targeted tests pass: wrong initial source/harness/attempt, malformed corpus, clone failure, thrown/incomplete cleanup and altered corpus. Counters require zero invokes and exactly one close. Source sections reread; package TypeScript passes. This intentionally changes pre-admission failure from an unguarded exception to the bounded zero-charge non-pass result consumed by the CLI.

### CR-07: Stalled cancellation prevented relay termination and terminal accounting

**Files modified:** `packages/strategy-lab/src/worker.ts`, `worker.test.ts`, `runner.ts`, `runner-invariance.test.ts`.
**Commit:** `3009543c`.
**Status:** fixed: requires human verification.
**Applied fix:** Failure immediately requests termination of every owned relay before calling external cancellation. Async cancellation is raced against the coordinator's remaining outer budget, clamped to the pool's elapsed remaining 3600000 ms ceiling; invalid/throwing budget callbacks give zero remaining time. Rejection or timeout records `cleanupComplete:false`. Late result callbacks cannot re-arm timers after pool failure. Actual worker exit is separately reported as `relaysTerminated`, not confused with uncertain external supervisor cleanup. All timers are cleared when the pool returns. The actual 120000 ms per-attempt limit and coordinator-owned 60-minute outer limit are unchanged.

**Integration API:** Optional supervised `job.remainingCleanupMs: () => number` forwards the exact remaining outer budget; CLI owner was notified to supply `Math.max(0,3600000-(performance.now()-start))`. Existing `cancel(assignment):void|Promise<void>` signature is unchanged. The runner exposes `cleanupComplete` and `relaysTerminated` as operational output and preserves conservative incomplete cleanup for uncertain charged records.

**Verification:** Worker suite5/5 passes, including two actual relay workers for each rejected/never-settling cancellation fault, both observed terminated (`threadId === -1`), no results and incomplete cleanup. Additional runner regression passes: stalled cancellation still publishes two system-failed attempts charged at24800 each plus22 unused allocations, with no payoffs and incomplete cleanup. These use trusted synthetic callbacks only and a simulated20 ms remaining cleanup budget; no guest source, supervisor, container, Match, preflight or benchmark execution. Package TypeScript and `git diff --check` pass.

**Final regression:** Complete synthetic benchmark plus worker suites pass26/26 in39.27seconds. The separate charged-failure runner regression also passes. No historical guest-execution suites or empirical gates were run.

**Handoff:** Parent cherry-picks `7eb1d19e`, then `3009543c`. Report remains uncommitted in the same isolated worktree. No automatic main merge, new worktree, new plan, assurance expansion, retry allocation, rules change or unrelated source edit.

## Iteration 1 — Historical Fix Report

**Source review:** 263-REVIEW.md, partial pre-integration review of Plans 01/02/04/05.
**Iteration:** 1. Six findings fixed, none skipped. Logic changes require human/re-review verification; this is not an empirical gate pass.

## Fixed Issues

### CR-01: Completed synthetic inventory accepted as supervised work

**Files modified:** `runner.ts`, `shards.ts`, `runner-invariance.test.ts` in `packages/strategy-lab/src`.
**Commits:** `4e5de776`, integration follow-up `21f724f7`.
**Status:** fixed: requires human verification.
**Applied fix:** Atomic immutable inventory header binds evidence class, machine, graph and execution commitment before records are read. Unbound old inventory cannot acquire a live evidence class. Resumed machine identity and supervised scored-record traces are checked; trace bytes/digests remain checked by shard admission. Layout remains operational, not scientific identity. Coordinator supplies `job.executionRoot`, committing selected source/executable/provider/protocol identities. Approved Plan 06 checkpoint integration adds unique bounded `attemptOrdinals` selecting only existing opportunities; full graph and reduction coverage remain 24. Partial coverage is never scored.
**Verification:** Synthetic-to-supervised and machine-drift resume reject before dispatch. Checkpoint filters reject duplicates, fractions, negative/out-of-range ordinals and inflated lists; already published selected work dispatches zero times and remains incomplete.

### CR-02: Worker batch incorrectly consumed one Match deadline

**Files modified:** `worker.ts`, `worker.test.ts`, `runner.ts`, `runner-invariance.test.ts`.
**Commits:** `82a0bb19`; focused test follow-up `042a0abb`.
**Status:** fixed: requires human verification.
**Applied fix:** A fresh 120000 ms attempt deadline starts at each charged dispatch and cancels on terminal result before validation/publication. Idle transport uses the 3600000 ms overall ceiling, not a tighter batch gate. The coordinator still owns the actual remaining outer 60-minute budget. Required supervised `job.cancel(assignment)` cancels owned external work on failure, in addition to terminating relay threads. Late invoke completions cannot send further worker messages after failure.
**Verification:** Fake-clock real relay-worker test completes two individually valid 70-second attempts (140 seconds cumulative), but a single 120001 ms attempt produces one start, zero results, cancellation and terminal worker failure. Separate timer reset/clear tests pass. Lost-worker accounting regression preserves charged failure and unused allocations.

### CR-03: Alias results not compared with representative geometry

**Files modified:** `reduce.ts`, `worker.ts`, `runner-invariance.test.ts`.
**Commit:** `fc2cef15`.
**Status:** fixed: requires human verification.
**Applied fix:** Explicit schema-owned comparison requires alias and representative classification, outcome, final-state, transition and runtime-accounting semantic roots to agree, excluding task identity. Both reproduction passes must still agree independently. Synthetic fixture roots now derive from representative identity, not the alias label. Mismatch returns non-pass and no payoffs.
**Verification:** Changing both alias passes consistently to the same wrong outcome or any of the three wrong semantic roots, then recomputing record hashes, yields non-pass with no payoffs. Plan 06 must construct these roots from geometry-equivalent semantic projections, not raw trace/request/attempt/label identities.

### CR-04: Timing corpus lacked deployed mission inputs

**Files modified:** new `planner-corpus.ts`; `feasibility-protocol.ts`, `feasibility-protocol.test.ts`, `planner/emit.ts`, `planner/emission.test.ts`, package manifest and tsconfig.
**Commit:** `f1e0f8e2`.
**Status:** fixed: requires human verification.
**Applied fix:** The independent mapper uses canonical observation fixtures and actual mission constructors. StrategyMemory carries mission lists, including genuinely expired and target-unavailable prior missions; SoldierBrain receives actual mission packets, local stale-target cases and explicit absent-objective fallback cases. Valid boundary-sized but mission-invalid hostile objectives remain separate. The emitter re-exports the shared mapper without a protocol/emitter dependency cycle. `buildFeasibilityCorpus()` now returns the final mapped corpus used by both protocol and benchmark admission; `buildFixtureFeasibilityCorpus()` retains the original raw fixture builder.

Original source-independent fixture root: `sha256:b14605fdf1d117e0759fb75df0719f6196f54dda8f63660b14742937a7edaed3`.
Final premeasurement mapped root: `sha256:fe109ecf734e1f8d0dcdebd140037f083a4a51f7e28cd22a0e313133eb116340`.

This is an explicit premeasurement root correction, not reinterpretation of empirical evidence. No source measurements existed for the old corpus. All 100 ordered inputs per method, 100 warmups plus 1000 measured samples per method, nearest-rank 990, strict below-5 ms gates, 24 Matches and runtime budgets remain unchanged. Mechanical runtime-js workspace dependency/project-reference additions support the already-owned trusted emitter, with no install or lockfile changes.
**Verification:** Exact root golden, 200 legal input schemas, distinct case/input roots, deterministic rebuild, ten actual mission kinds, planner active/stale/failed/empty-fallback memory paths and brain active/complete/stale/absent/invalid paths are checked. Corpus/emission suites: 16/16 pass; emitted source is statically inspected, never executed.

### CR-05: Provider identity checked only after calls were spent

**Files modified:** `benchmark.ts`, `benchmark.test.ts`.
**Commit:** `7b8172c9`.
**Status:** fixed: requires human verification.
**Applied fix:** Full provider identity, including newly explicit committed `revisionId`, is admitted before dispatch. Every invoke receives the frozen admitted identity. Shared observation validation checks issuance, exact request/ordinal/input, complete runtime identity, timing binding, machine, output bounds, duration and invocation uniqueness before the next call. Post-dispatch failures retain charged counts, close the provider and return bounded non-pass; late evaluator errors no longer escape unclassified.
**Verification:** Wrong initial source/harness/attempt consumes zero calls. Wrong returned source, request, timing-input or machine binding stops after exactly one charged call. Full synthetic 2200-call calculation and strict5ms/reordered/forged/missing evidence tests pass, never claiming empirical success. Initial identity-hash implementation made existing synthetic test repetitions exceed5s; direct exact field comparison removed repeated hashing without changing measurement thresholds or sample counts.

### WR-01: File-wide constant map lost lexical scope

**Files modified:** `scripts/check-v1-38-lab-boundaries.ts`, matching test.
**Commit:** `2f0ab6e3`.
**Status:** fixed: requires human verification.
**Applied fix:** TypeScript lexical symbols resolve declaration identity. Reassignment candidates are retained rather than overwritten; unknown/compound potentially lab-directed imports fail closed. Conditional and concatenated constant candidates remain bounded. Exact `planner/emit.ts` → `typescript` static-build-tool exception supports the approved existing emitter only; no general external dependency allowlist or production edge was added.
**Verification:** Outer lab import with unrelated inner safe shadow is rejected; harmless outer import with inner lab declaration remains allowed. Mutable assignment/unknown/compound cases and complete repository graph pass. Boundary and benchmark suites jointly pass42/42; standalone boundary TypeScript check passes.

## Verification and Integration Handoff

- Per-fix modified sections reread; `git diff --check` passes.
- `./node_modules/.bin/tsc -b packages/strategy-lab` passes.
- Final shard/worker/runner focused run: 15/15 pass, with the already-established full36-layout matrix intentionally excluded. This run covers publication/trace/ledger faults, charged worker loss, resume rejection, alias mismatches, checkpoint selection and per-attempt deadline cancellation.
- Local installed tools and existing dependency symlinks only; no package install, lockfile upgrade, source evaluation, live guest/container/supervisor/preflight/Match/benchmark, production mutation, rules change, history rewrite or retry allocation.
- Ordered fix/integration commits: `4e5de776`, `82a0bb19`, `fc2cef15`, `f1e0f8e2`, `21f724f7`, `042a0abb`, `7b8172c9`, `2f0ab6e3`.
- No source edits left uncommitted. This report is intentionally uncommitted for the orchestrator.
- Parent requested safe cherry-pick integration rather than an automatic main-branch merge. Branch `codex/263-review-fixes` and worktree `/tmp/sv-263-reviewfix-m4xTWI` are retained with the discoverable recovery sentinel until parent integration/cleanup. Preserve the report before removing the worktree. Other agents' source and planning edits are untouched.

---
_Fixer: gsd-code-fixer; iteration 1. Logic findings remain subject to the bounded re-review loop before any measurement._

## Main integration

Iteration 3 was cherry-picked without conflicts as `50021c1f`, `7429a8b5`, `86f3fec6`, `bf668d80`, `adbe720b`. Prior fixes and the Plan06 lifecycle correction are preserved. Independent re-review remains pending; no empirical allocation is consumed.

### Final CR-09 deadline ordering correction

The Plan06 integration owner moved durable benchmark allocation ahead of the outer deadline guard through the production `allocatePlannerBenchmarkCall` helper. A deadline between benchmark calls now retains the same allocated count as the failed benchmark summary, while confirmed guest calls remain zero and the interrupted allocation is explicitly uncertain. The regression invokes that production helper with a throwing guard, writes the ordinary charged failure summary, and exercises actual retained-evidence verification. This is a premeasurement accounting fix within Plan06, not a new plan or retry. Independent re-review confirms the ordering and unconditional terminalization path are sound. Strict CLI TypeScript and package build pass; focused and complete safe regression results are recorded in the final review/feasibility handoff.
