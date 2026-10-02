# Plan 07 asynchronous dependency supplement recheck

## VERIFICATION PASSED

Focused revision-gate recheck of the same Plan 265-07 supplement: 0 BLOCKER findings, 0 WARNING findings. The complete revised supplement was read; no source edit, test, import, profile, Match, runtime/model/Docker action or commit occurred. This result approves source implementation planning only, not empirical completion or a current-league freeze.

### Check-v1 blockers resolved

1. Racing invocation/failure ordering is now executable: the mandatory correction section tracks the full active wrapper operation; same-wrapper races await settlement and then reject without another guest, capacity or retention call. Shared-graph failures await the graph-owned settlement gate before failure append and cleanup. The gate does not queue dispatch, alter charges/latches or replace the initiating error. Ordinary and response catches/finally paths are explicitly included, with controlled same-wrapper and shared-graph tests.
2. Direct close is now executable without widening the provider contract: synchronous wrapper close refuses pending work without calling the underlying provider or recording successful cleanup; actual asynchronous production cleanup waits for graph/wrapper settlement before synchronous close. Tests require zero premature close/failure/terminal side effects and preserve original errors and conservative charges.

The mandatory correction section complements Task 3's original pending-guard and unchanged-close-contract text; it supplies the previously missing timing and refusal semantics. Its catch/finally audit is within Task 3's listed runner/response source and test files. “Synchronous path” for failure/cleanup retention continues to describe the append/close APIs after settlement, not permission to overtake pending work. No remaining contradictory executable instruction was found.

### Preserved repair contract

Real default async fsync delegation, exactly-two bounded owned dependency snapshots, all-settlement fd/error handling, dependency-directory barrier before serial descriptor/final barrier, exact successful bytes/roots/accounting, ordered prewrite charges and no refunds/cap relaxation remain required. Both ordinary and response retention are awaited before root-array updates and WeakMap issuance. The optional typed response capability must survive production-graph adapters. Public graph pending guards, failed-retention dispatch stop, synchronous/large/stream fallbacks and focused tests remain intact.

The three sequential tasks/six-file scope remains bounded. No 120000-ms lifetime, capacity cadence, provider isolation, runtime budget, retry policy or final-quality gate changes are introduced. No human-only approval checkpoint or additional profiler is needed for this internal source repair.

### Actual reviewed hashes

Raw SHA-256 measured read-only during this recheck:

| File | SHA-256 |
| --- | --- |
| `265-07-ASYNC-DEPENDENCY-REPAIR-PLAN-v1.md` | `418a71ac72d7970038ad7e3ecab42ecf774e086a44c972b9bb6638cc500b49c8` |
| `packages/strategy-lab/src/league/repository.ts` | `98b68cce1a3805d495feb9153b937dce69529866f604a1bfba96b43f370efdc2` |
| `packages/strategy-lab/src/league/repository.test.ts` | `bf6e31683edb1372759ab853364bd292ef1c6fb9123b35efda5e1947316ce4da` |
| `scripts/run-v1-38-serious-league.ts` | `6bd13928345b91d2736bc6c4cc3ca9c234ddd9594b5c1dd1d511d688eefc83a3` |
| `scripts/run-v1-38-serious-league.test.ts` | `4b0104a8620adb394559add1c682c8f49f152dbb279d181bfbcbd3f9b437442e` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `686c83d954178ee75d3c0af68c49b569af83d93abec1560c7b7e4254708ba607` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `f94015d69669416606a7c9e00ea8daed5206fd5b53dc310431efbe9b23e506fc` |

All six source/test hashes remain unchanged from check-v1. Prior check-v1 remains historical and is not overwritten.

```yaml
issues: []
```

Handoff: root may start the six-file source implementation under the revised supplement, then run its focused tests and existing independent scoped review/source gate. Report any actually necessary frozen-contract or wider-interface change to root; do not infer empirical dispatch authority from this check.
