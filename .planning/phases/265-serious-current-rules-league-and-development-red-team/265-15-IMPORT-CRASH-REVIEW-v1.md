---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T18:06:36Z
depth: deep
source_commit: 017c2ec3807fc229c09a73a19c66e319dc616796
source_root: sha256:8c6b893587a1633f1dc17832f27398b3745f76b22913b7007d0af87970216942
source_manifest_entries: 861
reviewer_agent: /root/review_265_15_import_crash
files_reviewed: 14
files_reviewed_list:
  - packages/strategy-lab/src/factory/supervision-artifacts.test.ts
  - packages/strategy-lab/src/factory/supervision-artifacts.ts
  - packages/strategy-lab/src/league/contracts.test.ts
  - packages/strategy-lab/src/league/contracts.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/assess-v1-38-factory-independence.test.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/v1-38-factory-observations.test.ts
  - scripts/v1-38-factory-observations.ts
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Plan 265-15 bounded import and crash-accounting source review

The prospective v2 code was reviewed against the approved 565,459-ms failed-entry upper bound, immutable v1 failure, unchanged cumulative 15,000,000,000-byte/28,800,000-ms/300-Match limits, and the checked repair supplement. This is a source-only nonpass, not a pilot or phase outcome. The old v1 open interval still consumes its full time envelope. The `leanSourceManifest()` computation was safe to run after confirming the imported CLI modules' guarded main entries; it returned the source root and 861 entries above, including all seven changed non-test source files. No preparation, old private assessment reader, provider, container, Match, model, or empirical command was run, and tests were not reexecuted.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: import allocations exceed the claimed source-bounded memory reserve

**File:** `packages/strategy-lab/src/factory/supervision-artifacts.ts:145-214`; `scripts/assess-v1-38-factory-independence.ts:136-157`; `scripts/v1-38-factory-observations.ts:81-117`; `scripts/run-v1-38-lean-experiment.ts:84-92`

**Issue:** The 64-MiB descriptor cap bounds canonical raw bytes, not the parsed object graph. The bounded reader still accumulates every parsed record in `output`, then creates complete transition/accounting/trace arrays and an execution object for commitment checks. The numeric projector creates nested token arrays, maps, duplicate decision signatures, and final `observation` before `boundedFactoryProjectionCharge` checks the 256-MiB aggregate. Its token charge occurs while generating tokens, not before `parse`, recursive `flatMap`, or intermediate arrays. The child reserves exactly 64 MiB plus 256 MiB atop sampled RSS, but no established worst-case expansion relates those raw/token limits to real simultaneous allocations. Therefore a legal 64-MiB cell can exhaust the process between pre-cell checks, reproducing the precharge crash despite a green capacity predicate. The 48-cell test charges one tiny reused object and never exercises this allocation shape.

**Fix:** Establish and enforce a conservative worst-case *pre-allocation* working-set bound for the parser, record/commitment graph and projector, or stream canonical records through commitment and numeric accumulators without retaining the full record/execution arrays. Bound intermediate token construction, not only the completed observation, and use the proven simultaneous maximum in `assessLeanPrefixCapacity` before every cell. Add an adversarial near-limit, multi-chunk 48-cell fixture that checks peak shape and old/new assessment and admission roots; if the bound cannot be proven, deny admission.

### CR-02 — BLOCKER: orphan child can continue a charged Match after the observing parent dies

**File:** `scripts/run-v1-38-lean-experiment.ts:201-211`; `scripts/run-v1-38-lean-experiment.ts:239-257`; `scripts/run-v1-38-lean-experiment.ts:143-176`

**Issue:** The child authenticates `process.ppid` once on release and again at the next slot charge, but has no IPC `disconnect`/parent-liveness fail-closed handler after release. If the parent dies during a Match, `process.ppid` can change, yet `trackBuffer()` samples the *new* parent PID rather than the bound `entry.parentPid`; the current provider and Match may keep invoking until the per-Match deadline. The parent can no longer enforce its 250-ms joint-RSS/time watchdog, observe cleanup, or publish a terminal. The ledger will eventually fail closed as an open interval, but execution and resource use are not stopped when parent observation is lost.

**Fix:** Bind every child prefix/capacity check and provider invocation to the immutable entry parent PID and live IPC channel; on `disconnect`, PID mismatch, or parent-observation uncertainty, stop dispatch, close/kill providers, and exit failed. Add a source-only injected mid-Match parent-death test proving no further invoke/charge and cleanup is attempted, while the open ledger retains full-cap failure if no parent terminal exists.

### CR-03 — BLOCKER: failed-prefix disk admission does not account for possible crash writes outside the old store

**File:** `packages/strategy-lab/src/league/lean-experiment.ts:131-145`; `packages/strategy-lab/src/league/lean-experiment.ts:214-227`; `scripts/run-v1-38-lean-experiment.ts:105-117`

**Issue:** `inspectLeanFailedPrefix()` authenticates four old store files, two planning documents and a request, then requires the old store's *current* allocated blocks to equal 12,288. `createLeanLedger` and `openLeanLedger` accept that as the entire predecessor disk debit. Nothing in the admission path binds an independently checked inventory of the failed process's other writable destinations (including any core/scratch artifact) or a defensible exclusion/bound. The approved supplement explicitly says the 12,288-byte current store is not an old high-water proof and admission must stop if a material out-of-path write cannot be excluded or charged. Current code can prepare and enter solely on this narrower store check, understating cumulative additional disk if a crash artifact exists elsewhere.

**Fix:** Before v2 allocation/admission, bind a reviewed exact writable-path/crash-artifact inventory (or a conservative independently established upper bound) into the immutable predecessor, charge any discovered allocated blocks, and fail closed when the paths or bound cannot be established. Keep v1 bytes and reader semantics unchanged; distinguish historical allocated disk from unknown old RSS.

### WR-01 — WARNING: import regression fixture does not test the real historical verifier path

**File:** `scripts/run-v1-38-serious-league.test.ts:74-81`; `scripts/assess-v1-38-factory-independence.test.ts:26-34`

**Issue:** The two-candidate equality test mocks `verifyHistoricalFactoryAssessmentForLeague` to return an affirmed label, so it cannot detect missing full 48-cell, threshold, supervision, or negative-control checks in the bounded mode. The separate “48-cell” test calls the projection-charge helper 48 times on the same tiny object; it does not run a 48-cell importer or establish old/new assessment-root equality. This leaves the highest-risk authenticity and memory regression untested.

**Fix:** Build an in-memory/synthetic complete retained 48-cell repository and run both genuine verifier modes, comparing the exact assessment, threshold and candidate roots. Mutate membership, terminal, supervision chunk/receipt, source and control inputs independently and assert bounded import denies each one.

### WR-02 — WARNING: parent process resource sampling can mistake an unrelated reparented process for the trusted parent

**File:** `scripts/run-v1-38-lean-experiment.ts:84-88`; `scripts/run-v1-38-lean-experiment.ts:153-155`

**Issue:** `assertLeanPrefixCapacity` defaults to the *current* `process.ppid`, not the entry's authenticated `parentPid`. Reparenting therefore changes which process's RSS participates in the joint working-set calculation. Even before a slot charge catches the PID mismatch, per-cell or provider checks can report an apparently valid capacity figure that excludes the original parent/its unresolved children. This compounds CR-02 and makes the retained `bufferHighWater` non-comparable across a parent-loss event.

**Fix:** Pass and verify the entry-bound parent PID on every sample, require live IPC/identity continuity, and treat any mismatch as immediate uncertainty rather than sampling a replacement process.

---

_Reviewed: 2026-10-03T18:06:36Z. Reviewer: `/root/review_265_15_import_crash`. Depth: deep. Source-only; no empirical authority._
