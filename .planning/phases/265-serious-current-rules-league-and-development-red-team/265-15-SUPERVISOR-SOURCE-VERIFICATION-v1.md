---
phase: 265-supervisor-repair
verified: 2026-10-04T11:25:51Z
status: source-repair-verified
source_commit: 75ce00e483f214d496b9912f42b38206436395f7
source_root: sha256:83abe344f7d71bf4cd2aa78c2f73fbb8a59c40996c0999536e534b5245f7a590
source_entries: 863
scope: six-file source repair only
empirical_phase_credit: false
---

# Phase 265-15 Supervisor Repair — Narrow Source Verification

**Result:** The bounded source-repair subgoal is verified at the pinned commit. This does not verify a fresh pilot, explain the historical v6 initiating cause, or complete Phase 265 or its milestone.

## Provenance and scope

The checkout was at `75ce00e483f214d496b9912f42b38206436395f7`, matching the review's `source_commit`. The source manifest was independently recomputed by importing the inert `leanSourceManifest()` function and returned `sha256:83abe344f7d71bf4cd2aa78c2f73fbb8a59c40996c0999536e534b5245f7a590` (863 entries), matching the fixed source and review metadata. No tracked working-tree changes were present; the six reviewed files have no diff from the pinned commit. Existing unrelated untracked artifacts were left untouched.

The audit read the repair scope and gate note in [265-15-SUPERVISOR-REPAIR-20261004.md](265-15-SUPERVISOR-REPAIR-20261004.md), [265-15-SUPERVISOR-REPAIR-GATES-v1.md](265-15-SUPERVISOR-REPAIR-GATES-v1.md), and the independent [265-15-SUPERVISOR-REVIEW-v1.md](265-15-SUPERVISOR-REVIEW-v1.md). Review metadata identifies the same fixed commit/root, lists the six changed files, and reports clean with zero findings.

## Observable source truths

| Truth | Status | Source evidence |
|---|---|---|
| New failed-cell diagnosis is finite, privacy-safe, tied to the charge, and authenticated without changing the legacy compact record or old result schema. | VERIFIED | `deriveLeanSupervisorDiagnostic` allowlists stage/reason/runtime code/method/ordinal and falls back to unknown; `readLeanDiagnostics` enforces exact filenames, exact keys, charge binding, size/canonical bytes, and a diagnostic root. Failed records get sidecars and result-v3 includes their root. `compactExecution` remains unchanged from the parent of the pinned commit. See [`run-v1-38-lean-experiment.ts`](../../../scripts/run-v1-38-lean-experiment.ts:168) and tests at [`run-v1-38-lean-experiment.test.ts`](../../../scripts/run-v1-38-lean-experiment.test.ts:143).
| Diagnostic forwarding consults the private WeakMap accessor for the exact native provider/evidence pair, and only projects recognized private origins. | VERIFIED (source wiring) | `nativeLeanProvider` registers a closure in `leanDiagnosticReaders` that calls `getFactoryPrivateDiagnostic(provider, evidence)`; `observeProvider` awaits invocation, retrieves through that closure, checks `isLeanPrivateFailureOrigin`, and maps only four allowed private stages. The underlying factory runtime accessor itself is backed by its private WeakMap. See [`run-v1-38-lean-experiment.ts`](../../../scripts/run-v1-38-lean-experiment.ts:219) and [`v1-38-factory-supervised-runtime.ts`](../../../scripts/lib/v1-38-factory-supervised-runtime.ts:16). This exact new-route end-to-end forwarding was not exercised with a live provider in this source-only audit.
| Invocation and child terminal handling are Promise-aware, while private errors are not serialized and optional receipt failure does not suppress mandatory terminal publication. | VERIFIED | Runtime bridge's provider type accepts `LabRuntimeEvidence | Promise<LabRuntimeEvidence>` and awaits it; the new observer uses `async invoke`/`await`. CLI terminal awaits the action and emits only fixed safe receipts / withheld stderr text. Focused tests cover rejected Promises, receipt privacy/tampering, and mandatory terminal publication after optional receipt failure. See [`runtime-bridge.ts`](../../../packages/strategy-lab/src/runtime-bridge.ts:15), [`lean-child-cli-terminal.ts`](../../../scripts/lib/v1-38-lean-child-cli-terminal.ts:37), and [`run-v1-38-lean-experiment.test.ts`](../../../scripts/run-v1-38-lean-experiment.test.ts:29).
| New successor work has a disjoint v7 route and carries closed-v6 exact metadata, time, charge, and conservative surviving-disk cost without reopening the old result through the ordinary reader. | VERIFIED | v7 request/store/temp paths are distinct; v7 admission binds the closed-v6 predecessor. The inert test checks 2,168,630ms, one charged Match, 45,056 v6 survivor bytes, 208,896 measured cumulative bytes, 516,096B conservative allocation, and unknown historical peaks; tamper cases reject changed roots, counts, closures, or inventories. `inspectLeanClosedV6Predecessor` uses fixed roots and bounded metadata rather than `openLeanLedger`, `readLeanLedger`, or `verifyLeanEvidence`. See [`lean-experiment.ts`](../../../packages/strategy-lab/src/league/lean-experiment.ts:144), [`lean-experiment.ts`](../../../packages/strategy-lab/src/league/lean-experiment.ts:371), [`lean-experiment.ts`](../../../packages/strategy-lab/src/league/lean-experiment.ts:950), and [`lean-experiment.test.ts`](../../../packages/strategy-lab/src/league/lean-experiment.test.ts:155).

## Verification evidence and limitations

The source-only gate note reports 160/160 focused accounting/runner/native-session regressions across three files and a separate final 26/26 runner regression; strict explicit-file TypeScript checks for changed runner/module and tests; passing strategy-lab `tsc --noEmit`; shell syntax and `git diff --check`; plus lab, factory, and serious-league boundary scans with zero violations over 1,364 files. This audit independently confirmed the pinned source manifest, clean six-file diff, `sh -n` on the launcher, and `git diff --check` for the pinned patch; it did not rerun the reported test/type/scan gates.

The reported broader `tsc -b` is a failure, not a pass: it has two pre-existing errors in unchanged `apps/runtime-service/src/execute-match-v1-18.test.ts` at lines 107 and 150 (`candidateMatch` and `initialInitiativePlayerId` types). No unrelated runtime-service source was changed.

The repair makes prospective failures diagnosable; it does not recover v6's discarded initiating attribution. Its cause remains unknown. No prepare/import, historical ordinary-reader invocation, Match/provider execution, or empirical pilot was performed or authorized by this scope. The gate note and review are source evidence only; synthetic tests confer no Match or LEAG credit. Fresh-route preparation, committed allocation, same-process capacity, and one unique retained verification remain outstanding prerequisites.

---

_Verified: 2026-10-04 — narrow source-repair verification only._
