---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "142"
reviewed: 2026-08-31T13:56:00Z
review_type: open_plan_source_review
subject_commit: 4c0821792fd646c62675b5e375af75ccd2ededb1
subject_tree: c0e726bb482dc9aad92c6843ef3087769607d284
subject_parents:
  - 3187775e4f1388361da3a7d3fb8d1ae7d6baaa7a
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts
  - scripts/check-v1-38-plan-262-142-live-v13-custody-v10.test.ts
source_blob: 876e6ee47e5042b9faa1612074887bdbec8359cb
source_sha256: 0eb811be19c9677965f74f15aec6ae4e7e51bea3465f498bd5e8cef3b06a6db1
test_blob: d102a5a17c993113d03566a3e34e2f5a7cd115f9
test_sha256: 4f2ecb4de0f87a8ecbce558cb11c3b68b0ffc75a70c2bf51bcf911559cf02309
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 142: Code Review Report

## Summary

Deep, focused review of the two pinned source files found one reproducible absence-gate race and one test-reliability defect. The race accepts an ENOENT obtained through a temporarily redirected ancestor during the check itself. It does not require forged filesystem metadata or a modified implementation.

This is an open-Plan142 source review, not Plan143 execution or publication. Task 3 summary/tracking is deliberately held and is not reported as a defect. No source, live/effect artifact, or historical publication was modified; no commit was made.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: BLOCKER — The final after-pass lookup can follow an ABA-swapped ancestor and still certify absence

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts:369-392`

**Issue:** Each `effectWalk` records the root and ancestor identities *before* calling pathname-based `lstatSync(current)` on the final destination. That final call still follows intermediate symlinks. Comparing two such arrays does not close the last lookup's window: during the final destination lookup in the second walk, `.planning/artifacts` can be renamed aside, temporarily replaced with a symlink to an empty directory, and restored. The lookup obtains ENOENT from the redirected directory; all identities stored in both arrays predate this swap, so the function returns `true`. The changed parent timestamps are never sampled afterward.

This violates Plan142's stated no-follow, unchanged-component absent-snapshot guarantee for an explicitly in-scope concurrent component swap. It is not a claim that a filesystem must remain unchanged after a successful check returns. The concrete failure is that a lookup *inside* the check resolves through an unretained, symlinked ancestor, and that lookup is accepted as evidence about the authenticated destination.

**Reproduction:** Ran the following against the unmodified pinned source. The wrapper controls only the scheduling boundary; every `lstat` result comes from the real filesystem, and all rename/symlink operations are real. It models another process being scheduled between the ancestor sample and final lookup. Only a disposable directory is changed and it is removed afterward.

```javascript
// Run with: node --import tsx --input-type=module
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
const subject = await import("./scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "plan142-review-race-"));
const artifacts = path.join(root, ".planning/artifacts");
const saved = path.join(root, ".planning/saved");
const redirect = path.join(root, "redirect");
fs.mkdirSync(artifacts, { recursive: true });
fs.mkdirSync(redirect);
const final = path.join(root, subject.V138_PLAN142_EFFECT_PATHS.at(-1));
const realLstat = fs.lstatSync;
let lookups = 0;
let traversed = false;
fs.lstatSync = function (p, ...args) {
  if (String(p) === final && ++lookups === 2) {
    fs.renameSync(artifacts, saved);
    fs.symlinkSync(redirect, artifacts);
    traversed = realLstat(artifacts).isSymbolicLink();
    try { return realLstat(p, ...args); }
    finally {
      fs.unlinkSync(artifacts);
      fs.renameSync(saved, artifacts);
    }
  }
  return realLstat(p, ...args);
};
syncBuiltinESMExports();
try {
  console.log({
    returned: subject.checkV138Plan142EffectPathsAbsentForReview(root),
    symlinkTraversedDuringFinalLookup: traversed,
    finalLookups: lookups,
  });
} finally {
  fs.lstatSync = realLstat;
  syncBuiltinESMExports();
  fs.rmSync(root, { recursive: true, force: true });
}
```

Observed: `{"returned":true,"symlinkTraversedDuringFinalLookup":true,"finalLookups":2}`.

The current race test at test lines 152-164 cannot exclude this failure: it succeeds once *any* of up to 200 unsynchronized checks throws, including a simple missing-ancestor window. It does not assert rejection at the actual final-lookup swap boundary.

**Fix:** Reuse the existing retained-directory batch reader in `scripts/lib/v1-38-secure-workspace-path-v6.ts`, for example its `readV138WorkspaceBatch(root, [], V138_PLAN142_EFFECT_PATHS)` absence batch, with the existing explicit supplied-root symlink rejection and a comparison of the returned root device/inode to the authenticated root. Its native reader uses retained ancestor descriptors, `openat(..., O_DIRECTORY | O_NOFOLLOW)`, `fstatat(..., AT_SYMLINK_NOFOLLOW)`, and parent-generation checks. These source files and their bootstrap already exist at the pinned executor commit; no new native implementation is needed. Authenticate the reused helper's existing source/bootstrap identity within the review boundary, and keep the guarantee scoped to a descriptor-bound checked snapshot. Do not substitute another pathname-only walk and call that a no-follow guarantee. Add a deterministic barrier regression for the transient symlink/restore schedule, as well as the unchanged-absence control; require rejection or safe retained-directory resolution, not merely one eventual exception in a racing loop.

## Warnings

### WR-01: WARNING — Mapping and authority mutation tests are masked by outer digest/provenance rejection

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/check-v1-38-plan-262-142-live-v13-custody-v10.test.ts:172-181`

**Issue:** Every mutation starts from `structuredClone(BASE)`, changes a nested field, leaves `payloadRoot` and `carrierRoot` unchanged, and asserts only `accepted === false`. Consequently, all seven cases fail the outer payload digest check at source lines 667-672 before testing their claimed mapping semantics. Repairing those outer roots alone would still leave the cloned object without private provenance, so it would fail at lines 698-704 even if the relevant native-order, observation-order, runtime-inventory, or producer-guard check were removed. These tests therefore cannot detect regressions in the semantic invariants named in their title. The genuine-execution validator at lines 548-601 is not exercised by these post-build candidate mutations at all.

**Fix:** Keep the clone-rejection tests as provenance tests, with an unmodified-clone negative control and asserted rejection codes. Separately exercise the pure execution-to-stable validation boundary using a genuine transcript fixture: mutate mode/order/reduced value/native mapping/producer guard, repair the applicable enclosing digests, and assert the intended semantic rejection code. A narrowly scoped pure validation test seam need not issue trusted provenance or execution authority. Independently recompute expected ordered stable roots from valid records, and enumerate the fixed false-authority values. This makes a removed semantic check produce a failing test instead of being hidden by an unrelated gate.

## Verification and Review Boundaries

- Read both complete submitted files, AGENTS.md, Plan142, prior Plan140 review, the relevant Phase262 local-assurance decisions, and the Plan133 execution/custody call chain. No project-local `.codex/skills` or `.agents/skills` directory was present; neither reviewed file is ignored.
- Verified the subject commit, tree, parent, blobs, and both current SHA-256 values recorded above. The workspace source matched the committed subject.
- Traced the complete package-tree inventory, pnpm distribution, private Node copy, generated launcher normalization, private materialization, child pre/exit verification, and disabled tsx cache. The launcher is used by Plan133's six child invocations, including those reached through disposable worktree dependency links.
- Traced the immutable Git snapshot and exact archived executor, ordered native C tuples, genuine-to-stable reduction, canonical-root/device/inode/metadata/runtime provenance, immutable candidate construction, public error sanitization, and false-authority output. No additional concrete acceptance bypass was established in those paths.
- Reran the source-only selector against the pinned current source: repository closure count `4429`, root `sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d`; semantic runtime count `3931`, root `sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e`. It returned false Plan143/Plan110/execution authority and zero invocation/counter values.
- Ran the deterministic disposable CR-01 proof above. The complete roughly ten-minute suite was not repeated. The orchestrator supplied earlier six-test and final-source genuine-six-mode results; those are context, not fresh executions claimed by this review.
- Repeated authentication of an unchanged, root-bound object was not classified as consumed-authority reuse: this source-only API grants no live or retry authority. Malicious-owner replacement of arbitrary private process/compiler/OS state is outside the declared local-assurance claim and was not invented as a finding.
- The GSD review procedure influenced artifact structure and severity classification. This report records concrete defects, not Task3 closure or Plan143 eligibility.

---

_Reviewer: gsd-code-reviewer_
_Depth: deep_
