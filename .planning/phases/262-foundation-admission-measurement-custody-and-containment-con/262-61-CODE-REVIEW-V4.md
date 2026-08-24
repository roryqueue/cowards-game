---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T02:31:15Z
depth: deep
reviewed_source_commit: 32cc57c743419192975cf35dcca310d67d8e23b3
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V4

**Reviewed:** 2026-08-24T02:31:15Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V3 correction closes final-R3 physical custody, scans the actual Plan-61/62 temporary namespaces, uses an inspector function-call breakpoint to authenticate real production calls, records the literal calibration error, and replaces the sparse Plan-62 summary with a closed exact schema. The literal `MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` result is a truthfully surfaced A9 source finding, not a reviewer-tool defect.

The reviewer tool is not yet freezeable. The execution evidence does not require the manifest handler for the execution-context alias, accepts any successful JSON output without a bounded size or expected disposition, and reduces filesystem semantics to before/after inventories plus one synthetic event per command. The downstream `--check-review-v3` path independently reruns route execution, but it binds only events, cleanup, and publication paths; source custody, protected history, authorization bytes, and snapshots remain candidate-controlled self-consistent claims. The tests do not exercise those production gates or their required mutation families.

## Prior Finding Resolution Audit

| V3 finding | Status | Evidence |
|---|---|---|
| CR-01 handler authentication and literal results | **PARTIAL** | Function-call breakpoints and the literal calibration code are real, but the alias authenticates a different function than the manifest and successful results are not bounded or disposition-checked; CR-01. |
| CR-02 inventories/events/cleanup/publication | **PARTIAL** | Before/after and cleanup are observed, but transient operations and ordered filesystem events are not; CR-02. |
| CR-03 exact crash-leak namespace | **RESOLVED** | `OWNED_TEMP_PREFIX`, no-follow temp inventory, and the named crash-leak test cover the actual Plan-61 and Plan-62 prefixes. |
| CR-04 physical R3 custody | **RESOLVED** | Both R3 paths use repository-confined no-follow reads, Git/current mode and byte equality, clean status, single-link ownership, and stable identity. |
| CR-05 canonical review rederivation | **OPEN** | Actual A9 findings fail closed, but a hypothetical finding-free candidate is not rebound to independently derived source/protected/snapshot observations; CR-03. |
| CR-06 exact Plan-62 summary schema | **RESOLVED** | Candidate and committed modes construct one nested expected object with full author, receipt, R3, convergence, publication, identity, eligibility, and authority fields. |
| WR-01 semantic mutation coverage | **OPEN** | The remaining production evidence boundaries have no named gate-level mutations; WR-01. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Route authentication does not enforce the manifest handler or bounded exact successful results

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:619-633,968-1039`

**Issue:** The inspector breakpoint does authenticate one real function call, but `ACTUAL_HANDLER_BY_COMMAND` maps `--write-execution-context-v11-receipt` to `writeV138Plan26257RouteStartV1` while the frozen route manifest names `writeV138ExecutionContextV11Receipt`. The observation retains both names but never requires them to agree, so this branch does not prove the manifest handler it claims to cover. For successful branches, any parseable JSON is accepted: output length is unbounded, `resultCode` is always the generic string `success`, and `observedDisposition` is never checked against the manifest's allowed terminal dispositions. A dispatcher can therefore call the wrong compatible handler or return the wrong successful terminal result and still produce passing machine evidence. The literal calibration failure is handled correctly and is not the defect here.

**Fix:** Derive the expected callable from the frozen manifest and authenticate that exact function object. If the execution-context command is intentionally an alias, trace both the public alias and its delegated route-start call or correct the manifest/dispatcher contract in the independently reviewed A9 layer; do not silently substitute a second map. Define a bounded allowlist of exact success and terminal result codes/dispositions for every command, reject successful output above the contract limit, and compare parsed output to the branch-specific expectation before recording the observation.

### CR-02 [BLOCKER]: Filesystem events and closed semantic inventories are still synthesized from endpoint state

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:679-753,1040-1071,1160-1210`

**Issue:** `routeInventory` provides useful endpoint snapshots, but its baseline covers selected planning/source paths rather than every tracked repository path, and its dynamic status expansion sees only paths dirty at snapshot time. A handler can write and restore an unlisted tracked file, create and delete an unlisted file, or perform effects in the wrong order without appearing in either snapshot. `orderedEvents` then records exactly one reviewer-created `execute:<handler>` row per command; it is not an observed filesystem-operation ledger. The eventual review document again uses identical four-source-path snapshots rather than the complete per-command inventories, and the shared comparator receives those constructed snapshot claims. Consequently transient write/restore, effect ordering, unlisted leakage, and complete closed-inventory requirements are not proved.

**Fix:** Instrument the disposable route filesystem boundary (or isolate each route behind an operation-observer seam) and record every open/create/write/rename/unlink/mkdir event with its actual order and confined path. Start from a closed inventory of all tracked files plus all canonical/protected/hidden destinations and compare the full event-derived path union to final state. Build the canonical review snapshots/events/cleanup from those captured records, not from the four A9 source blobs or reviewer-generated execute rows, and reject any unobserved or restored transient effect.

### CR-03 [BLOCKER]: `--check-review-v3` still accepts fabricated source and protected evidence on a hypothetical finding-free route

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1295-1361`

**Issue:** `inspectPlan26262Review` correctly reruns the authenticated route and refuses the real A9 calibration finding. If route findings are absent, however, it only compares `orderedEvents`, cleanup, and the two publication paths. It never independently derives and compares `sourceBase9`, `sourceA9`, `sourceCustody`, protected-history roots, the forty charge IDs, six authorization byte records, or snapshots, and it never calls `checkV138ReviewV3ClaimsAgainstObservations`. `validateV138ReviewV3Document` proves only schema/root self-consistency, so a candidate can fabricate those values, recompute `reviewV3Root`, and pass after the route defect is fixed. The cached route observation further means this is not necessarily a fresh derivation within the same process. Thus actual-A9 refusal exists, but the required hypothetical-valid binding does not.

**Fix:** Build a fresh expected observation bundle from the committed R3 checker's independent A9, predecessor, convergence, protected-history, lifecycle, route, and publication derivations. Call the shared claims-vs-observations comparator and explicitly bind charge IDs, ordered events, cleanup, publication commit/tree/parent/blobs/roots, and the report manifest as well. Do not reuse a cached observation across candidate validation. Add a hypothetical finding-free fixture in which an exact candidate passes and individually recomputed source, protected, authorization, snapshot, event, publication, B9, and report mutations fail with dedicated codes.

## Warnings

### WR-01 [WARNING]: Mutation tests assert helpers and positive shapes instead of the remaining production gates

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:152-224,462-499`

**Issue:** The route test checks call counts and the literal calibration result but not manifest-handler equality, success output bounds, or expected dispositions. The inventory mutation test calls `inventoryChangedPaths` with hand-built rows rather than causing an actual handler to transiently write/restore. The Plan-62 summary mutations exercise only the generic canonical-equality helper against a toy schema. There is no direct candidate/committed `inspectPlan26262Review` fixture, no hypothetical valid review, and no gate-level mutation for fabricated source/protected/snapshot roots, event reorder, output leakage, off-lineage/competing/later publication or B9, R3 symlink/mode custody, Plan-62 author equality/cardinality, or the exact Plan-62 summary CLI modes. These tests can remain green while CR-01 through CR-03 are present.

**Fix:** Add named repository-backed tests that invoke each production gate and assert its exact rejection code. Include inspector alias/decoy coverage under both Vitest and the `tsx` CLI, bounded success-output/disposition mutations, an actual transient filesystem operation, a hypothetical valid canonical review followed by independently recomputed mutations, publication/B9 lineage mutations, R3 physical mutations on both reviewed paths, author-separation failures, and exact candidate/committed summary mutations.

## Verification Performed

- Confirmed source commit `32cc57c743419192975cf35dcca310d67d8e23b3` has tree `f35f510728f5184ebb918254ee49ef85b01dcfac`, sole parent `e161f0bd99e514c38c94fb8157b6b1eb4b66fe58`, trailer `Plan-262-61-Reviewer-Tool: codex-plan-262-61-r3-v4`, Git mode `100644` on both paths, and exactly the two scoped source paths.
- Confirmed both current scoped source files match commit `32cc57c7` and `git diff --check 32cc57c7^ 32cc57c7` passes.
- Traced production `runReceiptCli` and both execution-context exports. The dispatcher calls `writeV138Plan26257RouteStartV1` directly while the frozen manifest names `writeV138ExecutionContextV11Receipt` for the alias command.
- Traced the shared document validator and claims-vs-observations comparator. The Plan-62 checker invokes only the structural validator and its own partial comparisons.
- Reviewed all 41 focused tests. No test invokes a hypothetical finding-free `inspectPlan26262Review` or the exact Plan-62 candidate/committed summary gates.
- The full focused suite was not rerun because the orchestrator's required uncommitted iteration-3 `262-61-REVIEW-FIX.md` makes the main repository intentionally dirty and the reviewer correctly rejects dirty main. Prior fixer runtime evidence is not promoted to terminal-review evidence.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal, B9, route, or live destination was modified by this review.

---

_Reviewed: 2026-08-24T02:31:15Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
