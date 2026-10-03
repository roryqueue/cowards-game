---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T13:49:56Z
depth: standard
iteration: 2
source_commit: 345321d725923dd151a6b9094d81fae588f5a3f6
source_root: sha256:d3996eae5cf54c66fa00517090973f0b330abe8fd6bca27f096838d9c30df2e9
independently_reviewed: true
reviewer_agent: /root/review_265_15_lean_fixed
author_agent: /root/fix_265_15_lean_source
diff_base: c22a69a6
files_reviewed: 8
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Plan 265-15 bounded independent re-review

## Narrative Findings (AI reviewer)

Reviewed all six v1 findings, their actual source repairs, the approved prospective charter/active outline and Plan 265-15. The eight scoped source files are unchanged between the fixed source commit and observed HEAD `e98d3de0bb0c525eeb70d3bee49fa5f1673a0a1e`. An inert source-manifest invocation independently returned the root above with 861 implementation entries, including imported native-runtime helpers. This report is not clean and cannot admit empirical entry.

### CR-01 — BLOCKER: Caller-supplied charge ordinal can substitute the scheduled candidate

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.ts:28-33`.

**Issue:** The issuer reopens the durable ledger but chooses the scheduled candidate using `charge.ordinal` from its caller. Its durable-charge comparison checks only `state.charges.get(charge.slotRoot)?.root === charge.root`; it never compares the supplied ordinal or other charge fields with the retained charge. A genuine slot-zero charge can therefore be copied with `ordinal: 2`, keeping its original root/slotRoot. For bottom seat, the forged ordinal selects condition 2 and thus allocated candidate B, although the actual charged condition 0 requires candidate A. Supplying B's valid retained closure and derived runtime then satisfies both new candidate/runtime checks and all remaining binding predicates. The WeakMap capability contains that substituted runtime, and factory/planner/session claims do not reopen the scheduled slot. This still permits a real candidate/seat substitution under A's immutable charge; the v1 CR-03 repair is incomplete.

**Concrete counterexample:** Using the existing two-valid-candidate fixture sorted by candidate root, let `c` be the actual charge for `allocation.slots[0]`. Construct the ordinary bottom binding with `attemptRoot: c.root` and candidate B's derived runtime. Call:

```ts
issueLeanRuntimeAuthority(ledger, { ...c, ordinal: 2 }, candidateBClosure, bindingB)
```

The original charge root still matches the reopened map; scheduled selection reads the forged ordinal and agrees with B. The current negative fixture changes `root` or runtime/candidate independently, so it does not cover this coordinated substitution. This counterexample is established by tracing the predicates; an attempted standalone fixture harness encountered harness setup/import errors and is not claimed as a successful executed regression.

**Fix:** Resolve the retained charge first; require exact closed-schema/full-value equality with the supplied charge, or discard supplied fields after matching its identity. Derive the slot exclusively from `retainedCharge.ordinal`, and require its slot root to match. Add a source-only regression changing only `ordinal` on a genuine charge while passing the alternate valid candidate/runtime in the wrong seat; rejection must precede capability issuance/native construction. Retain the existing valid closure and ordered-claim tests.

## Remaining repair checks and limits

No additional demonstrated blocker was found in the other five repairs: append-only entry/verifier intervals survive failure and conservatively exhaust ambiguous interruptions; replay production is lazy and bounded before encoding/publication; publication checks include block/metadata allowance and the existing runtime scratch reservation; admission resolves actual review bytes and unchanged implementation inventory; the retained reader now compares closed canonical entry/result/HEAD/count fields; write-all advances by returned lengths and rejects zero progress. These are bounded source observations, not empirical resource-fit or completion evidence.

The two focused synthetic/source-only suites passed: **15 tests, 2 files**, no skipped tests. No live preparation/allocation/capacity mode, provider, Docker, Match, model or retained empirical reader was invoked. Temporary test fixtures grant no empirical credit. Source and historical artifacts were not modified; only this new report was written. Future balanced schedule extension remains Plan 265-16's work, carrying forward the existing durable time/charge ledger rather than resetting it; no additional full-league certification gate is imposed here.
