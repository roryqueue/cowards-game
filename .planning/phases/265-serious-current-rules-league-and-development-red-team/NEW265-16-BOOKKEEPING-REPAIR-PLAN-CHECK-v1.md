# Bookkeeping repair plan check v1

**Result: PASS (focused source-only check)**

The proposed repair is bounded to the bookkeeping path and is supported by the inspected source contract. `admitLeanAllocation` reconstructs the expected allocation and checks exact keys plus the canonical admission root before returning it (`packages/strategy-lab/src/league/lean-experiment.ts`, `admitLeanAllocation`). The v8 reconstruction returns through `freezeLabValue`; that helper recursively freezes object children before freezing the object (`packages/strategy-lab/src/contracts.ts`). Therefore an internal `WeakMap` keyed by the exact successfully returned allocation object can avoid repeat reconstruction without trusting caller-provided frozen objects or root strings.

The implementation must check this identity cache before calling `admitLeanAllocation` in `leanCapsForAllocation`; otherwise repeated calls still perform the expensive reconstruction and the stated overhead reduction is not achieved. On a miss, preserve full admission and cache only the freshly reconstructed, recursively frozen v8 object after all existing checks succeed. The planned tests cover identity-only hits, cap/extension parity, unchanged resource bounds, forged/cloned/mutable inputs, and deep immutability.

The failure record establishes a pre-charge `resource_threshold` stop, but does not establish a causal link to allocation reconstruction. This plan correctly labels the change as source-efficiency work, keeps the kill/resource policy unchanged, does not authorize another baseline or diagnostic run, and preserves historical artifacts and phase gates. No scope or authorization blocker found within this focused review.

**Review boundary:** no tests, experiments, execution, historical scans, source edits, or changes to prior records were performed. This is not a full Phase 265 plan audit and does not grant execution authority.

```yaml
issues: []
```
