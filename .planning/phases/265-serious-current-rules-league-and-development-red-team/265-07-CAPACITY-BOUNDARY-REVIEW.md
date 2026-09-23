---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-23T05:08:32Z
depth: deep
reviewed_commit: d695b7df
diff_base: d695b7df^
files_reviewed: 3
files_reviewed_list:
  - scripts/check-v1-38-serious-league-boundaries.ts
  - scripts/check-v1-38-serious-league-boundaries.test.ts
  - scripts/run-v1-38-serious-league.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_authority: false
---

# Phase 265 Plan 07: Capacity boundary code review

**Reviewed:** 2026-09-23T05:08:32Z  
**Depth:** deep  
**Files reviewed:** 3  
**Status:** issues_found

## Summary

The direct-import carveout is syntactically narrow: only the exact `scripts/run-v1-38-serious-league.ts` path and `node:child_process` specifier are exempted. The runner currently imports `spawnSync` only for the fixed Darwin `memory_pressure -Q` probe. The shared graph is still built and traversed; injected public, worker, and strategy-lab imports of the runner are rejected. However, the exception is applied to a *reached path* without regard to the restricted *origin*. A different restricted private helper can import the runner and use its exported host probe while the monitor reports clean. That contradicts the new comment's stated containment and is a blocking boundary-checker defect.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Reached-file exception lets another restricted origin access the host probe

**Classification:** BLOCKER  
**File:** `scripts/check-v1-38-serious-league-boundaries.ts:40-49` (test gap: `scripts/check-v1-38-serious-league-boundaries.test.ts:22-27`; exported probe: `scripts/run-v1-38-serious-league.ts:264`)  
**Issue:** The traversal begins at each restricted `origin`, but line 48 exempts `node:child_process` whenever the currently reached `path` is the CLI. A source graph containing `scripts/lib/v1-38-league-authoring.ts -> scripts/run-v1-38-serious-league.ts -> node:child_process` therefore returns `{ "ok": true, "violations": [] }`; I reproduced this with injected files, with the helper importing the runner's exported probe. The new test checks a direct `node:child_process` import in the helper, not this transitive case. The graph is not missing the edge—the origin-insensitive exemption suppresses the violation. The present checkout has no such reverse import, so this is a fail-open future-change gate, not evidence that public or Strategy code can currently dispatch the probe.

**Fix:** Scope the exemption to both the reached file and the traversal origin, for example:

```ts
if (
  origin === "scripts/run-v1-38-serious-league.ts" &&
  path === origin &&
  specifier === "node:child_process"
) continue
```

Add an injected `authoring -> runner -> node:child_process` case that must return `unresolved-private-loader`, alongside the direct allowed/denied cases. Preserve the existing public/deployment and strategy-lab graph checks.

## Source-bound validation status

The 11 boundary tests and the current 1,336-file scanner run passed; these do not exercise the transitive restricted-origin case above. Injected public, worker, and strategy-lab imports of the runner were rejected, as was the noncanonical `child_process` specifier. No live preflight, provider, Strategy, or Match ran. This source change also changes the reviewed-source identity, so the separately recorded stale-allocation lineage blocker remains open until final repair, complete source validation, and regeneration. No source file or earlier review was modified.

---

_Reviewed: 2026-09-23T05:08:32Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
