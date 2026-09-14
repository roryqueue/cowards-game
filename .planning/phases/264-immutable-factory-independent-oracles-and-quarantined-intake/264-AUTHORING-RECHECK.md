---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-14T10:54:00-04:00
depth: deep
scope: Plan264-07_authoring_transport_recheck
source_commit: d1cbfa984fd60dc399a4d0fe856a2704448bf1d3
reviewer_role: reused-existing-gsd-code-reviewer-not-fresh-typed-reviewer
files_reviewed: 4
files_reviewed_list:
  - scripts/author-v1-38-factory-model-source.ts
  - scripts/author-v1-38-factory-model-source.test.ts
  - scripts/v1-38-factory-app-server-transport.ts
  - scripts/v1-38-factory-app-server-transport.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: relevant_source_findings_resolved
verification:
  - "vitest final pure/fake-process relevant scope: 38 passed"
  - "installed codex app-server help and generated TypeScript protocol bindings inspected without starting a server"
---

# Phase 264: Plan 07 Authoring/Transport Recheck

**Current disposition:** Clean at `d1cbfa98`; see the final bounded repair recheck below. Earlier findings and test counts are retained as historical review snapshots, not current blockers.

**Scope:** Committed authoring and app-server transport at `a60347fd`. This reused the existing reviewer rubric and is not a claim of a fresh typed reviewer. Bundle and calibration code being repaired concurrently were intentionally not reviewed.

## Summary

The installed CLI confirms that the selected app-server flags and RPC families exist, and the fake-process suite passes. The operational path nevertheless does not preserve the inspected execution environment, does not validate the protocol’s returned approval policy, accepts a caller-selected directory that can still be within or symlink into the repository, and only signals rather than observes process termination. These are pre-charge isolation and bounded-cleanup failures, not a request to run a model call.

## Critical Issues

### CR-01A: BLOCKER — The actual app-server launch discards the recorded sanitized PATH

**Files:** `scripts/author-v1-38-factory-model-source.ts:47-48`; `scripts/v1-38-factory-app-server-transport.ts:57-61`

**Issue:** `buildFactoryAuthorCommand()` records a fixed `launch.env`, including the caller-supplied sanitized `codePath`, but `runFactoryAppServerAuthorAttempt()` never passes it to the transport. The transport instead spawns bare `codex` with `process.env.PATH`. The help/capability probe and the actual authoring process can therefore resolve different executables, and host PATH configuration is again part of the launch despite the retained request root claiming a sanitized context.

**Fix:** Resolve and retain the exact inspected Codex executable before capability validation, pass an explicit sanitized environment through transport options, and spawn that exact path. Bind the executable/version/environment identity into the pre-charge request record. Make the fake transport test assert the exact launch environment rather than `PATH: expect.any(String)`.

### CR-01B: BLOCKER — Thread-start approval policy is requested but not verified before charging

**File:** `scripts/v1-38-factory-app-server-transport.ts:102-107`

**Issue:** The installed generated protocol defines `ThreadStartResponse.approvalPolicy`, but the code ignores it. It accepts a thread when model/provider/cwd/sandbox/instruction sources match even if the server’s effective policy is `on-request` or `untrusted`, despite requesting `approvalPolicy: "never"`. The fake response omits the field entirely and still passes. This leaves the claimed no-tool/no-approval authoring boundary dependent on an unverified server default.

**Fix:** Require the returned `approvalPolicy` to equal `"never"` (and reject missing/other values) before `startAuthorAttempt()`. Add fake responses for missing and non-`never` policies and assert no ledger start is written.

### CR-01C: BLOCKER — “Disclosed packet only” does not reject repository or symlink paths

**File:** `scripts/author-v1-38-factory-model-source.ts:47-48,120-124`

**Issue:** The only cwd check is `mkdirSync()` plus an empty directory listing. `resolve()` is lexical and does not reject a symlink or a newly empty directory inside a repository. A caller can supply a repository child or symlinked path as `disclosedDirectory`, then the app-server starts with that path as cwd. Parent repository configuration and private data are consequently still reachable by the process, contrary to the source-only disclosed packet boundary; `instructionSources: []` does not prove absence of repository ancestry or symlink traversal.

**Fix:** Create the disclosed directory internally beneath a controlled private temporary root, canonicalize it with `realpath`, reject symlinks and any `.git`/repository ancestor, and record its canonical class—not a caller path. Add negative tests for a repository subdirectory and a symlink to one.

### CR-02: BLOCKER — Deadline cleanup only sends SIGTERM and returns without confirming exit

**Files:** `scripts/v1-38-factory-app-server-transport.ts:94-100,112-132`; `scripts/author-v1-38-factory-model-source.ts:124-135`

**Issue:** On RPC or turn deadline, the pending request rejects but the process remains live until the outer `finally`. `close()` only calls `child.kill("SIGTERM")`; it neither waits for `close` nor escalates a non-exiting process. `runFactoryAppServerAuthorAttempt()` returns its charged terminal immediately after that synchronous signal. A stuck app-server can continue the already-started turn after the ledger reports a terminal failure, violating the bounded-deadline and process-cleanup guarantee.

**Fix:** Give the transport an async close/abort operation that waits for the close event, uses a short bounded grace period, escalates to SIGKILL when needed, and records the observed cleanup disposition before returning the terminal. Add a fake child that ignores SIGTERM until SIGKILL and assert no author attempt returns while it remains live.

## Verification

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/author-v1-38-factory-model-source.test.ts scripts/v1-38-factory-app-server-transport.test.ts`

Result: **2 files passed, 9 tests passed.** No live app-server handshake, model call, guest, runtime, or Match was performed. The installed `codex app-server --help` and locally generated TypeScript protocol bindings were read only to verify the response fields named above.

---

_Reviewer: reused existing gsd-code-reviewer role; bounded source review only._

## Final Relevant-Source Recheck at `4eda4d27`

**CR-01B: RESOLVED.** The transport requires the returned `thread/start` approval policy to be exactly `never`, alongside the returned requested model/provider, canonical cwd, read-only sandbox with network disabled, and no instruction sources. The raw V2 decoder now retains the same approval/sandbox/instruction constraints, preventing an admitted transcript from silently weakening those pre-charge facts.

**CR-01C: RESOLVED.** The launch builder canonicalizes a newly created child directory, rejects a symlinked or nonempty disclosed root, and rejects any canonical cwd with a `.git` ancestor. The packet is materialized only in that fresh non-repository child. The explicit repository-child and symlink test cases cover both routes.

### CR-01A: BLOCKER — Callable operational path does not canonicalize the inspected executable

**Files:** `scripts/author-v1-38-factory-model-source.ts:45-49,57-68,128-129` at `4eda4d27`

The CLI main canonicalizes its `which codex` result, but the exported `runFactoryAppServerAuthorAttempt()` accepts arbitrary `capability.codexExecutable`. `inspectAuthoringCapability()` only verifies it is absolute and trusts the caller-provided help/version strings; it neither resolves nor binds the executable inode/canonical path before the transport spawns it. A mutable absolute symlink can therefore be inspected as one executable, swapped before spawn, and still be retained under the old string in `requestRecord.codexExecutable`.

**Required regression:** use a fake/temporary executable symlink in the callable path; prove that non-canonical or changed executable identity is rejected before `startAuthorAttempt()`, and that the exact canonical path is passed to both the retained launch record and transport.

### CR-02: BLOCKER — Unobserved post-SIGKILL exit has no durable cleanup disposition

**Files:** `scripts/v1-38-factory-app-server-transport.ts:166-173`; `scripts/author-v1-38-factory-model-source.ts:143-146` at `4eda4d27`

The transport correctly awaits SIGTERM then SIGKILL, but throws `FACTORY_APP_SERVER_PROCESS_DID_NOT_EXIT` if neither produces a close event. The caller writes `process-cleanup.json` only after `await transport.close()` resolves. Consequently a charged attempt may already have a durable terminal while the cleanup failure throws from `finally` with no durable cleanup record/disposition at all.

**Required regression:** fake a process that ignores both signals; assert a durable `process_did_not_exit` cleanup record and a terminal system-failure result (never a normal return) after the bounded wait.

**Verification:**

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/author-v1-38-factory-model-source.test.ts scripts/v1-38-factory-app-server-transport.test.ts packages/strategy-oracle-model/src/model.test.ts scripts/prepare-v1-38-factory-calibration.test.ts scripts/v1-38-factory-controls.test.ts scripts/ingest-v1-38-factory-packet.test.ts`

Result: **6 files passed, 36 tests passed.** No app-server handshake, inference, guest, runtime, or Match was run.

## Final Bounded Repair Recheck at `d1cbfa98`

**CR-01A: RESOLVED.** The callable operational entrypoint now rejects a non-absolute executable, resolves its canonical path before building the capability/launch record, and passes that same canonical path to transport. The symlink regression verifies that the retained launch and spawned transport share the resolved target rather than the caller-supplied link.

**CR-02: RESOLVED.** A successful observed close produces a rooted cleanup record. A close failure after SIGTERM/SIGKILL produces the rooted `failed_to_exit` record before the operation rejects; an admitted V2 bundle additionally requires one of the successful cleanup dispositions. The fake child that ignores both signals and the operational failed-cleanup fake cover the failure route without a real process.

Final verification reran the six pure/fake-process relevant suites: **38 tests passed.** No live handshake, inference, guest, runtime, Match, generated-source execution, or empirical authorization occurred. These source findings are resolved; Plan 08 numeric/runner authority and empirical release work remain unimplemented and out of this review.
