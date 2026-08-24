---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T01:16:37Z
depth: deep
reviewed_source_commit: 3329c7c4f736ef33c7dd2c17481e58132a0768c9
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 6
  warning: 1
  info: 0
  total: 7
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V3

**Reviewed:** 2026-08-24T01:16:37Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V2 correction now invokes the real `runReceiptCli` with complete argv in disposable repositories, freezes protected authorization/lifecycle history, derives report/fix progression from Git, binds the author receipt to bounded history bytes, and adds the missing Plan-62 entry points. It also truthfully fails closed when the real calibration branch throws `MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID`; the recorded output hash is exactly the SHA-256 of that branch-defined error text, so the A9 defect itself is not a defect in this reviewer.

The reviewer still cannot be frozen. It labels copied manifest handler/disposition values as observations and reduces the exact calibration result to an unauthenticated hash. Its route snapshots/event ledger are partial or synthetic. More importantly, the downstream `--check-review-v3` mode validates only a self-consistent document and never rebinds it to R3 observations, while the Plan-62 summary mode checks only four unconstrained fields. The readiness preflight misses the exact temp/clone namespace created by this tool, and R3 custody still follows ordinary paths without enforcing current physical identity or mode.

## Prior Finding Resolution Audit

| V2 finding | Status | Evidence |
|---|---|---|
| CR-01 actual handlers/terminal branches | **PARTIAL** | `runReceiptCli` executes, but handler and terminal identity are still copied; CR-01. |
| CR-02 snapshots/events/cleanup/publication | **PARTIAL** | Disposable commits and cleanup are real, but claimed observations remain partial/synthetic; CR-02. |
| CR-03 protected history | **RESOLVED** | Descendant mutate/restore touches are rejected at lines 335-345. |
| CR-04 lifecycle | **RESOLVED** | Exact 109-path baseline bytes, root, history, graph, archive, and incomplete set are enforced at lines 415-460. |
| CR-05 review/fix progression | **RESOLVED** | Ordered report carriers and intervening exact two-path source commits are Git-derived at lines 513-608. |
| CR-06 bounded author receipt | **RESOLVED** | Receipt snapshot/cardinality/entry/root and one-path carrier are recomputed at lines 984-1020. |
| CR-07 readiness and Plan-62 modes | **PARTIAL** | Modes exist, but readiness misses the tool's own clone namespace and Plan-62 verification is not evidence-bound; CR-03, CR-05, and CR-06. |
| CR-08 mode custody | **PARTIAL** | Generic artifacts are mode-bound, but final R3 itself is not; CR-04. |
| WR-01 semantic mutation coverage | **OPEN** | The suite does not exercise the remaining evidence-boundary failures; WR-01. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Handler identity and the exact calibration terminal result are not observed

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:833-870`

**Issue:** The loop really invokes `runReceiptCli`, but afterward it merely looks up the manifest-named export and copies `entry.handler` and `entry.terminalDisposition` into the observation. It never proves that `runReceiptCli` called that function. For failures it retains only `sha256(error.message)`, and the no-publish finding projection drops even `terminalDisposition`. The calibration hash happens to equal SHA-256 of `MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID`, but any different error with a substituted expected hash, or a dispatcher that bypasses the named function while producing the same filesystem shape, remains indistinguishable in the machine evidence. This does not satisfy the exact handler/terminal-branch observation required by Plan 262-61.

**Fix:** Add an independently authenticated handler-call observation seam (or equivalent call-bound trace) and record a bounded exact result code/disposition derived from returned JSON or the caught error. Require calibration to report the literal allowlisted `MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID`, bind its hash as a secondary field, and reject argument-validation/infrastructure errors separately rather than treating every nonzero exit as a source finding.

### CR-02 [BLOCKER]: Closed snapshots, ordered events, and the synthetic publication are still asserted rather than observed

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:639-656,721-790,913-961`

**Issue:** `routeInventory` covers only a small destination list, not the complete canonical/protected inventory. The disposable review is built before route execution with a literal zero-finding verdict, manifest-derived events, and literal cleanup; it is then used to mint the synthetic authorization/B9. The final review document again uses two identical four-source-path snapshots, synthetic `execute:<manifest handler>` events, and literal cleanup. It never incorporates the actual per-command before/after roots or changed paths. A handler can transiently alter and restore a protected path, write outside the listed destinations, reorder effects, or leak an unlisted file while these claims still pass the shared equality check because claims and observations share the same construction path.

**Fix:** Inventory the complete frozen canonical/protected set in every disposable clone, record actual filesystem operations and bounded outputs, and derive the review document's snapshots/events/cleanup/publication from those independently captured records after execution. Keep the prerequisite publication explicitly marked synthetic and prevent its fabricated verdict/events from being reused as semantic review evidence.

### CR-03 [BLOCKER]: Main readiness misses the exact disposable clone namespace created by this reviewer

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:611-629,665-677`

**Issue:** The preflight scans `/tmp` only for Plan-262-62 prefixes and scans only registered Git worktrees. Actual review execution creates ordinary clones below `plan-262-61-exact-a9-*`; a killed or interrupted process can leave that directory, its private review bytes, authorization, B9, and route outputs behind. A later fresh process has an empty in-memory `activeDisposableRoots` set and `git worktree list` cannot see ordinary clones, so `--check-main-readiness` passes despite the leak. This defeats both cleanup and privacy readiness.

**Fix:** Scan the exact Plan-61 and Plan-62 owned temp prefixes, validate every matching entry without following links, and reject any residual ordinary clone/temp directory. Add a subprocess-crash fixture that leaves `plan-262-61-exact-a9-*` behind and require the exact readiness failure code before removing it.

### CR-04 [BLOCKER]: Final R3 custody does not enforce current no-follow identity or mode

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:560-579`

**Issue:** `inspectCommittedR3` compares committed bytes with `readFileSync(path.resolve(...))`. It does not use the repository-confined no-follow reader, require mode `0644`, compare current mode with Git `100644`, require a regular single-link owner file, or require a clean index/worktree. A symlink to identical external bytes or an unstaged executable-bit change can satisfy convergence even though the reviewed physical source is not the committed exact two-path R3.

**Fix:** Read both R3 paths through `readRepositoryFile`, require current `0644` and Git `100644`, regular one-link ownership and stable identity, and reject dirty source state. Add symlink, hard-link, executable-bit, and restored-byte/current-mode mutations specifically against both R3 paths.

### CR-05 [BLOCKER]: `--check-review-v3` accepts a self-consistent fabricated canonical review

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1038-1063`

**Issue:** The Plan-62 verifier parses the candidate, calls only the pure structural/root validator, checks the verdict, and authenticates the two-path commit. It never invokes `checkV138ReviewV3ClaimsAgainstObservations`, reruns or binds R3 derivation, checks exact A9/protected/lifecycle/publication/B9 roots, or verifies that the human report describes the JSON. An attacker can invent valid-looking OIDs/digests/snapshots/events, recompute `reviewV3Root`, commit that JSON with any report, and pass the command that Plan 262-62 uses as its post-publication gate.

**Fix:** Re-derive the immutable expected observation bundle from exact R3 and compare every canonical document claim against it, including exact A9, protected roots/authorization bytes, snapshots/events/cleanup, publication/B9 lineage, finding count, and report root/content. The canonical candidate must not be an input to the derivation that proves it.

### CR-06 [BLOCKER]: Plan-62 summary verification binds only four fields and permits missing custody/authority data

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1122-1150`

**Issue:** Candidate and committed summary modes accept any JSON object whose `r3AuthorAgent`, `reviewAgent`, `reviewRoot`, and `authorizesExecution` match. They do not require an exact schema/key set, either completion timestamp, the agent-history root, author-receipt commit/blob/root, canonical review commit/blob/root, report root, publication lineage, false identity/custody claims, or the other downstream authority denials required by the aggregate contract. A sparse four-key summary passes and can later be consumed as if it carried the full custody packet.

**Fix:** Define one exact Plan-262-62 summary schema, reject missing/extra keys, and bind all receipt/history/reviewer completion values, review/report commit/blob/root values, publication roots, false/unknown identity claims, and every authority denial. Test candidate and committed modes against each individual ID/time/root/authority mismatch.

## Warnings

### WR-01 [WARNING]: The mutation suite still does not cover the remaining semantic boundaries

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:147-208,370-452`

**Issue:** Route tests assert manifest-shaped handler names and the calibration output hash, not an observed handler call or literal terminal code. There are no named mutations for transient protected write/restore, incomplete inventory, event reorder, output leakage, stale/crashed Plan-61 temp clones, off-lineage/competing/later publication or B9, R3 mode/symlink custody, fabricated canonical Plan-62 review, Plan-62 author equality/cardinality, or sparse/mismatched Plan-62 candidate and committed summaries. The final generic hash mutation does not exercise any production gate.

**Fix:** Add one repository-backed named mutation for every remaining family and assert the specific rejection code. In particular, prove the calibration literal, readiness leak detection, canonical-review observation rebinding, exact Plan-62 summary schema, and R3 physical-mode custody.

## Verification Performed

- Confirmed source commit `3329c7c4f736ef33c7dd2c17481e58132a0768c9` has tree `5541f7d25d5a2600095089828d0fda003e606d8e`, sole parent `dfa7ac0c73d906b2f84bee56d52de5130826c52c`, nonempty reviewer-tool trailer, Git mode `100644` on both paths, and exactly the two scoped source paths.
- Traced `runReceiptCli` through the real production branches and confirmed `MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` is thrown by the route-7 adapter-key inventory check. The recorded hash `sha256:52f2b53101c192e5e045dba64a85da993375f2dfb8d288ed8879cf93c3b45740` exactly matches that literal error text.
- Traced the shared review-v3 validator and observation comparator. The Plan-62 post-publication mode calls only the structural validator.
- `git diff --check 3329c7c4^ 3329c7c4` passed.
- The full focused suite was not rerun because the orchestrator's required uncommitted `262-61-REVIEW-FIX.md` iteration-2 artifact makes the repository intentionally dirty and the source checker correctly rejects dirty main. Prior fix evidence is therefore not promoted to terminal review evidence.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal, B9, route, or live path was modified by this review.

---

_Reviewed: 2026-08-24T01:16:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
