---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "34"
review_status: resolved
resolved: 2026-07-18
fix_commit: 1437318
---

# Phase 260 Plan 34 Review Fix

## Disposition

All independent-review findings are resolved. Exact v2 admission is bound to the corpus identities reviewed in its immutable evidence, and activation-seam gates run against clone-local dependency bytes whose complete contents and symlink inventory are hashed before and after execution.

## Finding resolutions

1. **v2 review substitution:** the active v2 registry and reviewed pin must equal `V2_REVIEW`'s exact corpus root and corpus-file hash. A structurally valid mutated v2 corpus with recomputed registry and pin identities now fails `ACTIVE_REGISTRY`.
2. **Writable shared dependencies:** third-party dependencies are materialized into the disposable clone with copy-on-write where supported and a fail-closed copy fallback. Every dependency symlink is checked only after all dependency roots exist and must resolve inside the canonical clone root.
3. **Incomplete dependency mutation claim:** the complete clone-local dependency tree is hashed before and after the gate. Any changed file byte or symlink text makes the gate boundary fail and emits `dependency-tree-mutated`, even when the injected command exits zero.
4. **Failed-inventory validation:** both dependency digests require exact SHA-256 shape, the unchanged flag must equal digest equality, and the gate status reflects command success plus dependency immutability without falsifying the command's actual exit code.
5. **Untracked clone mutation:** selector mutation inventory uses full porcelain status with all untracked paths. A successful injected gate that creates an undeclared file produces a failed inventory and an `undeclared-mutation` finding.

## Verification

- Corpus and generator: 29/29 tests passed.
- Pure seam-inventory validation: 7/7 focused tests passed.
- Clean-clone adversarial isolation: 3/3 tests passed, covering failed command isolation, dependency-byte mutation, and untracked-file mutation.
- Golden typecheck/build and Spec build passed before final rereview.
- Final independent rereview: PASS.

The separate shared Strategy/Soldier fixture omission remains outside Plan 34 and is routed to bounded Plan 260-35.
