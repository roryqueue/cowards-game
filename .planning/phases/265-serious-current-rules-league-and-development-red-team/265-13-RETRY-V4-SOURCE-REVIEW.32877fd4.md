---
status: issues_found
reviewer: /root/265_retry_plan_check
reviewer_role: independent read-only Codex reviewer (not the typed gsd-code-reviewer agent)
independent: true
commit: 32877fd4715a870a562ad7fd7e2f90111cf41e0c
files_reviewed: focused v4 producer/bridge/harness and supervisor paths; relevant tests and runtime/kernel/schema dependencies; remaining closure entries hashed, not individually inspected
critical: 0
blocker: 3
warning: 0
info: 0
total: 3
source_closure_root: sha256:7a0509d1c464ac78908496df3681c67fedc6b4e26d203f871546fd2e1f0ef226
closure_root: sha256:1c11c9d009fa713916338db39bb7ef5a86c6c17f088bcc43307529d2cb682875
---

## Findings

### BLOCKER — The exported evidence producer can retain a fabricated successful execution

`packages/strategy-lab/src/league/diagnostic-retry-v4.ts:385-393` exports `retainDiagnosticRetryV4Execution` with a caller-supplied `LabMatchExecution`. It checks structural transition validity and hashes, but it does not require a one-use capability proving the value came from the admitted v4 bridge or that its providers were issued for the assessed candidates. A caller can create a charged ledger/start, enter stage 3, run the canonical runner with injected non-assessed providers (or supply a structurally valid execution), and call this producer directly. `runAndRetainCanonicalDiagnosticRetryV4` does use the canonical bridge (`:433-452`), but that wrapper does not make the separate exported producer private. The comment at `:433-434` claiming callers cannot retain an invented success is therefore false. The unit test also directly invokes the exported producer (`diagnostic-retry-v4.test.ts:105-108`), so its genuine-kernel fixture does not establish that the production API rejects executions from unassessed providers.

**Fix:** Make the complete-manifest producer module-private and reachable only after the consumed run permit and one-use bridge-issued execution capability have been checked, or require an unforgeable one-use canonical-result capability bound to the exact Match, providers, allocation, cell, and start. Keep fixture access behind an explicitly test-only seam that cannot be imported by the operational harness. Add a negative test proving a structurally valid but unissued execution cannot become a retained successful manifest.

### BLOCKER — The reusable v4 lifetime grant is not bound to the assessed candidate/executable or consumed once

`packages/strategy-lab/src/league/diagnostic-retry-v4.ts:319-348` exports `issueDiagnosticRetryV4LifetimeGrant`. Its WeakMap proves only that the grant object was minted in-process and ties it to allocation/cell/start/seat/container. It has no candidate, admission, revision/source, executable, or runtime identity and no consumed state; `requireDiagnosticRetryV4LifetimeGrant` can validate the same object repeatedly. The factory supervisor (`scripts/lib/v1-38-factory-supervised-runtime.ts:29-43`) and planner supervisor validate the grant’s roots/seat/labels/lifetime, but do not bind it to the admitted candidate or executable being constructed. The bridge separately performs candidate checks, but the exported grant issuer and supervisor entry points let another in-process caller use a charged grant outside that assessed-candidate path or reuse it to construct another runtime. That leaves the five-cell/candidate boundary dependent on convention rather than the grant.

**Fix:** Mint the capability privately inside the assessed-candidate provider issuer only after validating the exact candidate, admission, source/revision, executable, runtime, seat, allocation, cell, and start. Bind all those identities into the WeakMap record and supervisor checks. Consume the grant once at the assessed-provider issuance boundary; nested factory/planner layers may validate that active single-use issuance but must not allow a second runtime construction from the same grant. Test wrong-source, wrong-executable, wrong-runtime, repeated issuance, and cross-seat reuse rejection.

### BLOCKER — Durable stage records claim issuance/pre-kernel stages before those stages occur

`scripts/run-v1-38-diagnostic-retry-v4.ts:269-274` writes `bottom_issuance`, `top_issuance`, and `pre_kernel_binding` consecutively before entering the `try` block that reads the assessed pair or issues either provider (`:277-288`). On failure in candidate reopening/admission or before provider issuance, `stage` is already 2; the terminal later records that as `failureStage` (`:301-305`). The durable evidence can therefore claim that issuance and pre-kernel binding were entered when they were not. Writing the three stage markers up front to satisfy the `stage-2` run-attempt precondition (`diagnostic-retry-v4.ts:284-290`) undermines the stated stage semantics and can mislead retained diagnosis.

**Fix:** Keep the durable run-attempt charge/latch independent from execution-stage facts. Write each stage marker only at its actual boundary immediately before entering that operation, and derive `failureStage` from the last actually entered operation (or `unknown`). Update the ledger precondition and tests so an attempt can be charged without pre-writing future stages; test failures during candidate read, bottom/top issuance, pre-kernel bind, and kernel entry for truthful retained stages.

## Scope and controls reviewed

- Review scope was the frozen commit's v4 producer/reader, adapter, CLI/harness, factory/planner supervisor grant paths, relevant tests, and runtime bridge/kernel/schema boundaries. The committed source closure has 1,013 source/config entries; it was hash-bound as recorded above, but the remaining unchanged entries were not individually inspected.
- The new path uses per-ordinal private stores, distinct rooted allocation identities, fresh preflight control records, serial stop conditions, unchanged seed derivation, and the stated 240000 ms cell / 600000 ms command-entry / 30000 ms cleanup bounds. It keeps the v3 module, CLI, connected runner, kernel, and runtime bridge out of the changed-file allowlist; root reports its QA found those historical bytes unchanged.
- The state-reference codec retains 8192-byte transition-row and 131072-byte blob caps, rehydrates state before transition validation, and checks adjacent gameplay-state hashes while retaining machine hashes. No issue was identified in that path from static review.
- The bridge tests mock `runCanonicalLabMatch` and use assessed fixtures as injected source-only tests; they verify adapter plumbing, not live or independently assessed candidate behavior. No live execution is claimed here.
- Root-provided QA (not run by this reviewer): required combined five-file Vitest command passed 68/68; the two required TypeScript commands exited 0; historical v3/runtime-bridge tests passed 18/18; the boundary scanner reported zero violations across 1,353 files; `git diff --check` was clean.

## Review disposition

`issues_found`: three unresolved actionable blockers. This is not an accepted/zero-actionable review and does not satisfy Plan 13's source-review admission gate. No tests, source edits, private-store reads, allocation/preflight/provider/Match operations, or commits were performed by this reviewer.

```json
{
  "schemaVersion": "diagnostic-retry-source-review-v4",
  "sourceClosureRoot": "sha256:7a0509d1c464ac78908496df3681c67fedc6b4e26d203f871546fd2e1f0ef226",
  "closureRoot": "sha256:1c11c9d009fa713916338db39bb7ef5a86c6c17f088bcc43307529d2cb682875",
  "reviewer": "/root/265_retry_plan_check",
  "independent": true,
  "disposition": "issues_found",
  "unresolvedActionableFindings": 3,
  "commands": [
    { "command": "pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-retry-v4.test.ts packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts", "exitCode": 0 },
    { "command": "pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json", "exitCode": 0 },
    { "command": "pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node scripts/run-v1-38-diagnostic-retry-v4.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts", "exitCode": 0 }
  ]
}
```
