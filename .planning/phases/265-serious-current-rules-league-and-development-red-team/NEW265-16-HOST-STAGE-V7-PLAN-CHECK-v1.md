## ISSUES FOUND

**Scope:** Independent review of `NEW265-16-HOST-STAGE-V7-PLAN-v1.md` and its policy against the 2026-10-06 approval, V7 research, phase state/context, and named current source seams. This does not assess other Plan 265 work.

### Blockers

**1. [task_completeness] V7 source closure is not pinned to an executable symbol inventory.**
- Plan: `NEW265-16-HOST-STAGE-V7-PLAN-v1.md`, Tasks 1–3.
- Severity: **BLOCKER**
- The tasks say to update “every strict union/path/capability/broker/factory/planner/source-manifest/retained-reader/authorizer/shell consumer named in research,” but do not enumerate those consumers or their functions, nor identify exact target symbols for the host-stage publisher/catch boundaries. Current seams include numerous independently versioned paths: allocation mode/admission/path/cap selection and ledger validation in `lean-experiment.ts`, plus route dispatch and strict retained-reader/authentication joins. The same plan delegates an independent source-manifest closure check without a complete target inventory. Thus an implementer can satisfy the prose while missing a strict consumer or wiring stage provenance only at a wrapper that does not observe the failure.
- Fix: add a compact target table to Task 1/2 listing each current file and exact function/constant(s) to extend or prove unchanged, including the capability/factory/planner/runtime-provider chain; list the exact trusted host catches and publication/classifier handoff symbols for each required finite stage. Require positive v7 and negative alias/legacy controls at each listed dispatch/join, then derive manifest membership from the completed table.

### Structured issues

```yaml
issues:
  - plan: "16-v7-host-stage-supplement"
    dimension: task_completeness
    severity: blocker
    description: "Tasks 1–3 do not enumerate exact source symbols for all strict v7 consumers or the actual trusted stage catch/publisher boundaries; broad category references leave source-closure omissions undetectable."
    tasks: [1, 2, 3]
    fix_hint: "Add a file-to-symbol target inventory covering route/schema/allocation admission, capability/factory/planner/runtime provider, source publisher/classifier, shell, and retained-reader/authorizer joins; name the real host catches and test each join."
```

### Checked constraints

- The policy JSON matches v6 in all displayed limits and inherited-policy fields; only `schemaVersion` and `elapsedMs` differ (`43200000` → `57600000`).
- Approval is prospective, carries 28 charges and 41,943,494 ms from `1791290048578`, preserves 15 GB/300 Matches and all other stated bounds; the plan repeats these values and prohibits gap/overlap discounts.
- The plan prohibits a stage journal/ledger, source-only LEAG or phase credit, and legacy behavior changes. Its MAIN checkpoint correctly orders source gates before allocation/data preparation and requires immutable commit, fresh checked empty 0700 store, same-process capacity before charge/provider dispatch, one diagnostic, and only conditionally one baseline with reader-close carry.
- No issue found with the policy-delta claim or stated MAIN gate ordering.
