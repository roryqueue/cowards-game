---
status: issues_found
reviewer: /root/265_retry_plan_check
reviewer_role: independent read-only Codex reviewer (not the typed gsd-code-reviewer agent)
independent: true
commit: 1e23231f5a7f7517205171dd8f389c751a406afd
files_reviewed: all ten changed source/test files plus focused supervisor, canonical-runner, factory-admission, and harness dependencies; remaining closure entries hash-bound, not individually inspected
critical: 0
blocker: 1
warning: 0
info: 0
total: 1
source_closure_root: sha256:bcb79c88237a990b58326eece3c38d399ea916b18c03a9effdc27459974230c1
closure_root: sha256:4d47c98426bd062db4fc199b66cd5996fd2ea79f924c38ef356cf92fea9b967b
---

## Finding

### BLOCKER — Exported provider issuer still accepts a caller-controlled supervisor

`packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.ts:79-83, 105-121` exports `issueDiagnosticRetryV4ProviderFromFactoryCandidate` and accepts an arbitrary `host.createFactorySupervisedRuntime`. The issuer correctly verifies the assessed candidate and its closure, then mints the active bound grant and gives it to that host. But the grant's ordered factory/planner claims are callable exports, and `constructGrantedProvider` only checks that both claims occurred. Afterward, the issuer validates identity fields returned by the host; `requireRetryV4Issued` likewise compares the provider identity to the handle but does not establish that the provider was constructed by the real supervised factory/planner implementation. A caller can therefore provide a host that claims both layers and returns a fabricated provider with the expected identity. The opaque handle then passes `runAuthorizedDiagnosticRetryV4`, which submits that provider to the canonical runner and retains its result as candidate execution evidence. This is a callable evidence-authority bypass, even though the normal CLI worker currently supplies the real factory wrapper.

**Fix:** Make the production issuance path bind provider construction to the real supervised factory/planner implementation, not a caller-supplied host callback. Keep dependency injection confined to tests (for example, module replacement), or require an unforgeable provider-construction receipt minted only by the real wrapper and checked before issuing the opaque handle. Add a negative test that supplies a host returning a matching-identity fake provider and proves it cannot reach the canonical runner or evidence producer.

## Re-review disposition and scope

The three previous blockers are otherwise resolved in this commit: the complete evidence producer is module-private and follows consumed run/bridge permits; grants are created after candidate/admission/revision/executable binding and expire after ordered one-time construction claims; and the worker charges independently of future stages, recording checkpoints at their boundaries. Removing the repository argument from `authorizeFactorySupervision` also prevents this new issuance path from publishing factory artifacts into the historical repository. Static inspection found no changed route into the v3 module, CLI, connected runner, generic canonical runner, or kernel. The codec/state-chain reader continues to enforce the reviewed row/blob bounds and adjacent state continuity.

The closure binds 1,013 source/configuration entries; the remaining unchanged closure entries were not individually inspected. I reviewed the ten changed source/test files and the relevant grant, candidate-admission, provider-wrapper, canonical-runner and worker dataflow. Root reports the required five-file Vitest command passed 84/84, both required TypeScript commands exited 0, legacy continuity passed 18/18, the scanner found zero violations, and whitespace checks passed. These are root-provided QA results, not commands run by this reviewer. No tests, live operations, host/private-store reads, or commits were performed by this reviewer.

```json
{
  "schemaVersion": "diagnostic-retry-source-review-v4",
  "sourceClosureRoot": "sha256:bcb79c88237a990b58326eece3c38d399ea916b18c03a9effdc27459974230c1",
  "closureRoot": "sha256:4d47c98426bd062db4fc199b66cd5996fd2ea79f924c38ef356cf92fea9b967b",
  "reviewer": "/root/265_retry_plan_check",
  "independent": true,
  "disposition": "issues_found",
  "unresolvedActionableFindings": 1,
  "commands": [
    { "command": "pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-retry-v4.test.ts packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts", "exitCode": 0 },
    { "command": "pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json", "exitCode": 0 },
    { "command": "pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node scripts/run-v1-38-diagnostic-retry-v4.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts", "exitCode": 0 }
  ]
}
```
