---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T03:12:38Z
depth: deep
reviewed_source_commit: cf882bc50e2e95f98f9e71d3b6a67cf4f2835c2c
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V5

**Reviewed:** 2026-08-24T03:12:38Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V4 correction adds bounded route-output parsing, a Node filesystem observer,
fresh Plan-62 rederivation, and more mutation helpers. It does not close the
review contract. The execution-context CLI branch still calls the delegated
route-start function directly while the manifest-named public alias is exercised
in a separate invocation. The filesystem ledger records attempted operations
before their outcome and mislabels descriptor-based `writeFileSync` calls as
numeric repository paths. The supposedly fresh expected review is not
reproducible because it hashes clone-specific inode/timestamp metadata and binds
synthetic Git commit OIDs created without fixed commit dates.

The Plan-62 comparison also derives predecessor, convergence, lifecycle, R3, and
review/fix values but never includes or checks them in the canonical document or
report binding. Finally, both advertised summary-candidate commands require a
globally clean repository after the uncommitted candidate has been written, so
their required precommit use is impossible. The literal
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` result remains an A9 source finding,
not a reviewer-tool defect.

## Prior Finding Resolution Audit

| V4 finding | Status | Evidence |
|---|---|---|
| CR-01 exact manifest callable and bounded results | **OPEN** | Alias and CLI dispatch remain separate, and several successful result families are not exact; CR-01. |
| CR-02 true ordered filesystem ledger and closed inventory | **OPEN** | Descriptor writes are misattributed and attempted operations are recorded as completed; CR-02. |
| CR-03 fresh complete review observation bundle | **OPEN** | Fresh values are volatile and multiple required custody layers are discarded before comparison; CR-03 and CR-04. |
| WR-01 production gate-level mutations | **OPEN** | Tests exercise helpers, not the exact CLI gates, and one new hypothetical-valid test currently fails; WR-01. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The CLI branch still does not call the manifest-named alias and successful result validation is not exact

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:830-902,1124-1176,1179-1234`

**Issue:** For `--write-execution-context-v11-receipt`, the frozen manifest names
`writeV138ExecutionContextV11Receipt`, but the real `runReceiptCli` invocation is
authenticated only against `writeV138Plan26257RouteStartV1`. The public alias and
its delegate are called separately against an `alias-contract` clone before the
CLI command runs. That proves the alias can delegate when called directly; it
does not prove the real full-argv CLI branch called the manifest handler. A9's
dispatcher currently calls the delegate directly, so the mismatch must be
reported as an A9 source finding or the independently reviewed manifest must be
corrected. A separate successful call cannot convert it into observed CLI
reachability.

The output contract is also not exact for all successful branches. The
readiness and obstruction commands check only `schemaVersion` and allow extra or
missing fields. Terminal commands require a `disposition` key but accept a
non-string or `null` value even though their manifest requires one of the
allowlisted dispositions. Thus wrong successful results can still be recorded
as `success_no_disposition`.

**Fix:** Authenticate the manifest function on the actual `runReceiptCli` call
chain. If the CLI bypasses the alias, emit a dedicated A9 finding rather than
running the alias separately. Define an exact key/value schema and branch-specific
result/disposition allowlist for all ten successful outputs; require non-null
allowlisted dispositions wherever the manifest declares them.

### CR-02 [BLOCKER]: The filesystem ledger records false paths and attempted operations as successful effects

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:758-827,1173-1175,1207-1216,1262-1267,1308-1319`

**Issue:** The wrapper treats only `writeSync`, `fsyncSync`, and `closeSync` as
descriptor operations. Production code repeatedly calls `writeFileSync(fd,
bytes)`. The observer passes that numeric descriptor through `String(value)` and
records a fabricated path such as `"29"` under the repository instead of the
descriptor's real target. It also appends every event before calling the original
filesystem function and never records return or exception outcome. A failed
link, rename, write, or unlink is therefore indistinguishable from a completed
effect.

Transient event paths are appended as a name-only union to the aggregate after
snapshot, but their absent/present rows are not incorporated into both closed
before/after inventories. Consequently the emitted ledger and snapshots cannot
prove the actual ordered effects, restoration, or complete transient inventory
required by the plan.

**Fix:** Resolve every fd-accepting overload, including `writeFileSync`, through
the descriptor map; reject unknown descriptors. Record each operation only after
success, or record an explicit success/error outcome. Build both before and after
closed inventories over the full tracked/canonical/protected/hidden plus observed
transient-path union, with explicit absent rows, then derive events and cleanup
from those captured records.

### CR-03 [BLOCKER]: Fresh Plan-62 evidence is inherently non-reproducible across validation runs

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:699-744,1024-1059,1274-1319,1557-1607,1633-1647`

**Issue:** `routeInventory` hashes device, inode, ctime, and mtime values from
new disposable clones into every command's before/after roots and ultimately
into the exact review document. Those values change on every clone. The
synthetic prerequisite publication, B9, and post-execution publication commits
are also created without fixed author/committer dates, so their commit OIDs vary
with wall-clock time. The committed report binding nevertheless requires the
freshly regenerated `sourceB9`, publication commit, and roots, while the exact
document comparison requires the freshly regenerated snapshot roots.

A review/report created from one derivation therefore cannot reliably pass a
later `--check-review-v3` process, especially once the second changes. This
violates deterministic custody and makes the mandatory post-publication check
non-repeatable.

**Fix:** Exclude volatile host metadata from semantic roots or normalize it into
separate non-binding diagnostics. Set deterministic author/committer identities
and dates for every synthetic commit, and prove two independent fresh derivations
produce byte-identical expected documents and report manifests before accepting
publication.

### CR-04 [BLOCKER]: The canonical review and report discard required predecessor, convergence, lifecycle, R3, and review-fix custody

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1506-1554,1557-1590,1633-1647`

**Issue:** `deriveExpectedPlan26262ReviewFresh` computes `predecessors`,
Plan-60 `convergence`, and the 48-plan `lifecycle`, but
`assembleExpectedPlan26262Review` omits all three. The exact candidate comparison
therefore cannot detect their mutation. Neither the canonical document nor the
report binding contains the reviewed R3 commit/tree/parent, terminal V5 review
root, or REVIEW-FIX root. The report binding adds synthetic B9 roots, but arbitrary
human-report prose outside its one JSON line is unchecked. This falls short of
the plan's required full source/predecessor/convergence/protected/charges/
authorization/lifecycle/route/publication/B9/report observation bundle and its
exact reviewed-R3 review/fix custody.

**Fix:** Bind the independently derived predecessor manifest, Plan-60 convergence,
lifecycle inventory/root, exact R3, terminal review, REVIEW-FIX, publication/B9,
and a normalized human-report content root in an exact validated wrapper or
report manifest. Add individual recomputed mutations for every field at the
actual `inspectPlan26262Review` gate.

### CR-05 [BLOCKER]: Both required summary-candidate commands fail by construction on their uncommitted candidate

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:562-592,1444-1450,1713-1723,1783-1817`

**Issue:** Plan 262-61 requires `--check-plan-61-summary-candidate` after writing
but before committing `262-61-SUMMARY.md`. That branch calls receipt/convergence,
which calls `inspectCommittedR3`, which calls `requireCleanRepository` over the
entire worktree. The uncommitted summary candidate makes the repository dirty,
so the precommit check always fails. Plan 262-62's `--check-summary-candidate`
has the same defect through agent separation/receipt convergence and the fresh A9
inspection. The implementation tests only the generic equality helper and never
invoke either exact candidate CLI.

**Fix:** Give candidate modes a narrowly scoped cleanliness policy that permits
exactly the expected uncommitted summary path while requiring every source,
receipt, review, report, authority, and other path clean. Keep global cleanliness
for committed modes. Add real candidate-then-commit fixtures for both Plan-61 and
Plan-62 commands.

## Warnings

### WR-01 [WARNING]: The claimed production-gate mutation coverage is still absent and the new hypothetical-valid test fails in the current checkout

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:497-570`

**Issue:** The filesystem test mutates hand-built inventory rows rather than
observing a real transient write/restore. The hypothetical review test calls the
exported comparator directly with synthetic snapshots/events rather than invoking
`inspectPlan26262Review` or the CLI. Summary tests call only
`validatePlan26262Summary` against a toy schema. There is no two-fresh-run
determinism test, real alias-bypass rejection, descriptor-write attribution test,
failed-operation ledger test, or exact Plan-61/62 candidate-mode test.

The targeted hypothetical-valid test also fails in the current checkout with
`V138_PLAN_262_61_PATH_METADATA_INVALID` because the protected source-failure
artifact is mode `0600` while the helper requires `0644`. Thus the new test does
not currently establish its claimed positive gate in the repository being
reviewed.

**Fix:** Exercise the exact exported/CLI production gates with disposable
repository fixtures, including two independent fresh derivations and the real
candidate precommit sequence. Cover fd-based writes and failed filesystem calls.
Make the protected-artifact mode contract explicit and ensure the checked-out
fixture satisfies it before claiming a green focused suite.

## Verification Performed

- Confirmed source commit `cf882bc50e2e95f98f9e71d3b6a67cf4f2835c2c` has tree `03b6ee8a85b28c1a83b3a4347d52f271810978ba`, sole parent `f9f316b26d1471d872c005c15b436079a2479d59`, trailer `Plan-262-61-Reviewer-Tool: codex-plan-262-61-r3-v5`, and exactly the two scoped source paths.
- `pnpm exec tsc --noEmit --pretty false` passed.
- `git diff --check cf882bc^ cf882bc` passed.
- The targeted bounded-result test passed: 1 passed, 42 skipped.
- The targeted hypothetical-review test failed before its positive assertion with `V138_PLAN_262_61_PATH_METADATA_INVALID`; the current protected source-failure artifact is mode `0600` while Git records mode `100644` and the checker requires current mode `0644`.
- Traced `runReceiptCli`: the execution-context command calls `writeV138Plan26257RouteStartV1` directly, not the manifest-named alias.
- Traced production immutable writers: both reviewed route libraries use `writeFileSync` with numeric descriptors, which the observer currently treats as repository path strings.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal, B9, route, or live path was modified by review.

---

_Reviewed: 2026-08-24T03:12:38Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
