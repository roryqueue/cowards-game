---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: source_only_authenticated_cap_reuse
verified: 2026-10-07T00:13:02Z
scope: source_only
source_ancestor: 1b5f59d62704cf6672b4ba2953925ddede8a9957
source_commit: 13b2fe13ce5b0677ab5ac44f2df463914b983e7d
actual_head: 13b2fe13ce5b0677ab5ac44f2df463914b983e7d
status: passed_scoped_source_verification
score: 5/5 scoped truths
author: /root/fix_265_cap_bookkeeping
reviewer: /root/review_265_cap_bookkeeping
verifier: /root/verify_265_cap_bookkeeping
---

# Phase 265 Plan 16 — authenticated cap reuse source verification

**Result:** The narrow source repair is present and its five scoped truths are verified at source commit `13b2fe13ce5b0677ab5ac44f2df463914b983e7d` (also actual HEAD during this check), relative to ancestor `1b5f59d62704cf6672b4ba2953925ddede8a9957`. This is not verification of all Plan 16 work or Phase 265 completion.

## Truths and evidence

| # | Scoped truth | Status | Evidence |
|---|---|---|---|
| 1 | Only a fully successful v8 admission registers its reconstructed expected object for identity reuse. | VERIFIED | In `lean-experiment.ts`, v8 input keys are checked, `expected` is reconstructed, and admission-root equality is required before `immutableRetryData(expected)` may register that exact object in a `WeakMap`. Cache lookup is by object identity; a miss continues through full `admitLeanAllocation`. The focused tests confirm the constructor input, mutable/shallow/deep-frozen clones, and root-sharing clones do not obtain a hit; explicit admission still reconstructs. |
| 2 | Cache eligibility is conservative, plain-data-only, and bounded, rejecting mutable/proxy/accessor/exotic/hidden cyclic, deep, oversized, or sparse-array hazards without broadening historical admission. | VERIFIED | `immutableRetryData` excludes proxies before reflection, requires frozen ordinary arrays/records, inspects own descriptors without evaluating accessors, and bounds depth (32), nodes (4096), and property work (4096); repeated references/cycles and non-own array indices are ineligible. Regressions exercise getter/proxy, custom prototype, non-enumerable accessor, hidden and symbol cycles, deep/large hidden graphs, and confirm unsafe admitted inputs still take full admission on reads. The source explicitly checks every index for an own data descriptor; the focused 27-test file does not contain a dedicated sparse-array case. |
| 3 | Authenticated own-extension cap selection preserves the 20-hour extended cap, legacy 16-hour cap, and older cap behavior. | VERIFIED | The registration value is selected by `Object.hasOwn(expected, "timeboxExtension")`; only the fully reconstructed expected allocation can be registered. The 27-test run covers 72,000,000 ms for an own extension, 57,600,000 ms without it (including an inherited-property pollution regression), canonical root/resource-cap parity, and supervisor v2–v7 plus v1 historical cap behavior. |
| 4 | Authority, charging, source, and reader checks are not cached or weakened, and the repair adds no execution authority. | VERIFIED | The ancestor-to-source change is confined to the cache eligibility/registration/lookup in the private allocation module, an import of `node:util`, and two boundary-monitor exceptions with their tests. No charge, source, reader, dispatch, runtime, or public API implementation was changed. Cache selection returns cap constants only; misses and explicit admission retain full admission. This source-scope result is not an execution or empirical authorization. |
| 5 | The `node:util` owner exception is exact and private; other private/public restrictions remain. | VERIFIED | Both monitors exempt `node:util` only for `packages/strategy-lab/src/league/lean-experiment.ts`; their shared `allowedNode` sets are unchanged. Focused monitor regressions assert other private owners and unreviewed private transitive helpers fail, existing non-private/runtime treatment remains, and public reachability of the private owner is rejected. |

## Checks observed in this verification

- `node node_modules/vitest/vitest.mjs run scripts/lib/v1-38-lean-admitted-cap-cache.test.ts --maxWorkers=1` — **27 passed**.
- `node node_modules/vitest/vitest.mjs run scripts/check-v1-38-lab-boundaries.test.ts scripts/check-v1-38-factory-boundaries.test.ts --maxWorkers=1 -t 'allows util only|allows gzip only|keeps the lean CLI and gzip codec'` — **4 passed; 77 skipped by the name filter**.

These were inert metadata and source-monitor checks only. The reported configured typecheck, full factory-boundary scan, and 25 selected affected-existing tests are executor/validation claims, not independently observed in this verification. No full test suite was run.

**Coverage note:** The dense/own-index guard is directly visible in source, but the focused cache suite has no isolated sparse-array regression. This is a test-coverage limitation, not an observed source failure.

## Provenance, limits, and phase status

The source summary identifies `/root/fix_265_cap_bookkeeping` as author; independent REVIEW-v4 identifies `/root/review_265_cap_bookkeeping` as reviewer and reports a clean narrow review; this note is by `/root/verify_265_cap_bookkeeping`. REVIEW-v1 through v3 remain preserved historical findings; their corrections are covered here only insofar as they appear in this source diff and focused tests.

This verifies source bookkeeping efficiency, not that repeated reconstruction caused RSS growth or that this repair cures the observed resource stop. No empirical, baseline, diagnostic, native, provider, Strategy, Worker, Match, historical-reader, or private-payload scan was run. It grants no LEAG, phase, freeze, formation, holdout, public/counting, production, or fresh-route credit. The stated 20-hour / 15-GB / 300-match ceiling, 30 prior charges, consumed-history immutability, closed current entries/readers, released holds, and unapproved pending route decision remain unchanged; this note does not re-adjudicate them. Whole Phase 265 remains incomplete.

_Verifier: `/root/verify_265_cap_bookkeeping` — narrow source-only verification._

## MAIN test-only coverage-closure addendum

The independent verifier's original13b2fe13 observations and five-truth result above are preserved. MAIN subsequently integrated test-only `f56a325e6f0afd2769b38969de3f378969b11597`; production remains13b2fe13. MAIN inspected the only changed file and independently ran28/28 cap-cache tests PASS. The new isolated sparse-array case proves inherited numeric mutable metadata stays outside the cache: historical admission succeeds initially, then explicit admission and cap reads both reject a changed inherited survivor. That resolves the original dedicated-test limitation; it does not amend the independent verifier's earlier observed27-test run or claim a second independent verifier run. Reactivating the verifier hit the session's agent-thread limit, so this follow-up is explicitly MAIN-authored. Independent reviewer separately reviews the test-only addition. Same source-only/authority/resource/empirical limitations apply.
