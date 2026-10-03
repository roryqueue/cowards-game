---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T23:38:48Z
depth: deep
source_commit: 5626a84a285c2a904f2efa0fcfa86ae9b97be605
source_root: sha256:b6d2b58ccc64cf92a6284d8de2f310a1292e13b9f9124ea55c80b1372a63f20b
source_manifest_entries: 863
author_agent: /root/fixture_265_15_full_verifier
co_author_agent: /root/debug_lean_pilot_ipc_exit
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.sh
  - scripts/lib/v1-38-lean-child-cli-terminal.ts
  - scripts/fixtures/v1-38-lean-child-terminal-probe.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265-15: V4 successor and finite-diagnostic source review

## Summary

The source binds the closed v3 allocation, request, entry, bounded receipt, failed terminal, closed time and empty charge journals, held HEAD/source and independent terminal report bytes. Its v4 predecessor reopens the bounded v1/v2/v3 chain, checks exact store inventories and survivor blocks, and carries 1,362,476 ms, zero charges and a conservative 212,992-byte disk floor with historical peak still unknown. New v4 store/temp/allocation and v5 request identities are disjoint; version-owned writable paths and unchanged caps preserve the prior readers. The checked v3 terminal report's raw digest matches the source literal. I recomputed `leanSourceManifest()` by guarded inert import only; its root and 863 entries are in frontmatter. I did not run tests, the historical assessment, preparation, a provider, or a Match. Root is running its own focused gates.

The finite error list does not publish raw private errors and rejects nonexact near-miss text. However, one stage attribution is incorrect and must be repaired before this diagnostic-purpose entry can rely on the receipt. Nothing in this review establishes the consumed v3 exception's cause or an empirical result.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: Error text alone falsely assigns shared failures to candidate import

**File:** `scripts/lib/v1-38-lean-child-cli-terminal.ts:7-8,59,72-77`; callsites `scripts/run-v1-38-lean-experiment.ts:212-243` and `packages/strategy-lab/src/league/lean-experiment.ts:682-699`

**Issue:** The helper marks every allowlisted trusted error as stage `candidate-import` based only on exact message text, regardless of where the child failed. `LEAN_EXPERIMENT_RESOURCE` is emitted by post-charge publication/checkpoint code, and `LEAN_EXPERIMENT_BUFFER_CAP` by post-charge replay-frame encoding; both are on the new import list. Factory repository and closure errors can also arise during `nativeLeanProvider` after the durable charge. Consequently a later Match/finalization failure can be durably reported as a precharge candidate-import failure. The inert tests assert this incorrect mapping for the two shared resource codes, but never distinguish the same code before versus after charge. Exact finite text protects privacy; it does not establish stage provenance.

**Fix:** Keep the finite, reviewed code allowlist but derive `candidate-import` stage from a trusted precharge callsite boundary, not globally from the error string. At minimum, make ambiguous shared codes `unknown` outside an explicit `readCandidates`/precharge catch; add focused tests for the same resource code before and after charge. Preserve unknown/private-error fallback and do not infer the consumed v3 error from this change.

---

_Reviewer: /root/review_265_15_import_crash; source-only review of the fixed commit above._
