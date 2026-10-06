# Plan Check v2 — Prospective 20-hour binding

**Phase:** 265 — Serious Current-Rules League and Development Red Team  
**Plan checked:** `NEW265-16-TWENTY-HOUR-PLAN-v1.md` (revised)  
**Status:** VERIFICATION PASSED for the targeted v1 finding

## Recheck result

The prior blocker is resolved. The revised plan now:

- Includes `scripts/run-v1-38-lean-baseline.ts` and `scripts/run-v1-38-lean-baseline.test.ts` in `files_modified`, Task 1, and the execution context.
- Explicitly covers the runner's elapsed-threshold admission and child timeout, including the exact approved 56,000,917-ms carry and 1,791,326,194,166 start.
- Requires connected tests proving only a matching authenticated extension-bound allocation receives the 72,000,000-ms cap; missing, stale, mismatched, and legacy allocations cannot raise the 57,600,000-ms cap.
- Preserves the 1,860,000-ms reserve, resource gates, and actual accepted-check plus FINAL-close baseline authority join.
- Includes both runner files in the regenerated source inventory and its completion criteria.

No other scope was re-opened. **The targeted baseline-runner coverage finding from v1 is resolved; no remaining blocker is found for this recheck.**

## Structured issues

```yaml
issues: []
```
