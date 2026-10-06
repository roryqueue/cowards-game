# Plan 265-16 replay-v6 supplement — typed check

**Result: ISSUES FOUND**  
**Plan checked:** `265-16-REPLAY-V6-PLAN-v1.md`  
**Basis:** static comparison with v6 research, approval, current STATE, AGENTS.md, and the named source seams. No tests, runtime commands, payload readers, or source edits were run.

## Blockers

1. **[key_links_planned / architectural_tier_compliance] Planner runtime startup-authority seam is unowned.** The plan promises that v6 startup grant, invocation/origin, and capability bindings carry the same v6 identity, but Task 2 omits `scripts/lib/v1-38-planner-supervised-runtime.ts` and the task inventory also omits `scripts/lib/v1-38-lean-experiment-authority.ts`. The inspected planner runtime calls `leanStartupAuthorityDescriptorV5(...)` and claims runtime authority there; updating only the factory/session path does not establish that planner startup uses an independently bound v6 identity or preserves v5 behavior. Add these exact seams to bounded task ownership and require positive v6 plus unchanged-v5/legacy regressions before the source gates.

2. **[key_links_planned] Baseline-source publication seam is not explicitly closed.** `scripts/run-v1-38-lean-correction.ts` imports and invokes `publishLeanBaselineSource` / `publishLeanReusedBaselineSource` from `scripts/lib/v1-38-lean-baseline-source.ts`. The plan promises allocation/source/HEAD and v6 route identity through publication, yet this publisher is absent from `files_modified`, task `<files>`, and the specific join behaviors. The generic instruction to pin every builder is not enough to show that the publication artifact itself binds/checks the v6 identity or that existing v5 output remains byte-compatible. Assign the file to an existing task (keeping task ownership ≤5 files) and specify/test the exact publication-to-retained identity join; if no code change is needed, require an explicit inspected seam and regression evidence.

3. **[requirement_coverage / task_completeness] Predecessor admission does not explicitly preserve the authorized zero-charge predecessor case.** Approval authorizes one new v6 diagnostic, then only a conditional baseline; the specified finite old v5 baseline predecessor has zero new charges and an empty ledger. The plan says not to infer a stopped state from an empty zero-ledger, but does not make “old zero-charge predecessor need not be stopped” an acceptance condition for predecessor verification/admission. A generic malformed-predecessor rejection could therefore impose an unauthorized `stopped` prerequisite and block the authorized diagnostic. Add a fixture/assertion for that exact finite predecessor: authenticate its named roots/closed time and carry 24 historical charges, without requiring the old ledger to be stopped or invoking its reader.

## Checks that pass

- The supplement is additive, source-only, and explicitly keeps empirical credit false; the one fresh v6 diagnostic and conditional one 36-Match baseline remain correctly gated by acceptance of the new diagnostic and fresh capacity.
- v6-only selector after full admission, v5 validator retention, legacy decoder compatibility, disjoint paths, exact caps, and unchanged guest/host/startup/Match/replay/inflate budgets are called out.
- Effective clock language correctly preserves the v5 `max(wall delta, ceil(monotonic delta))` rule and conservative close behavior.
- The three ordered source gates and stop-before-MAIN condition are explicit. Task count is 3; per-task declared files are 3, 5, and 5 (within the five-file cap). The conditional baseline pipeline edit is correctly limited to a demonstrated v6 join need.
- AGENTS.md contains no additional applicable project convention that contradicts this source-only supplement. Research open-question section is absent; architectural responsibility map is present in research and its route/capability/readership tiers are broadly respected, subject to the unowned planner/publisher seams above.

## Structured issues

```yaml
issues:
  - plan: "265-16"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "Task 2 does not own scripts/lib/v1-38-planner-supervised-runtime.ts or scripts/lib/v1-38-lean-experiment-authority.ts, although the former selects v5 startup authority and the plan requires v6 identity through planner capability/startup bindings."
    fix_hint: "Assign the planner runtime and authority descriptor seams to existing task ownership (max 5 files per task), with v6 admission and v5/legacy compatibility regressions."
  - plan: "265-16"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "The imported publisher scripts/lib/v1-38-lean-baseline-source.ts is not in any task files or explicit join behavior, so route/allocation identity through source publication is not verifiably implemented."
    fix_hint: "Assign the publisher seam within the task file cap and specify a v6 publication-to-retained identity check plus v5 compatibility, or require explicit source inspection and regression proof if unchanged."
  - plan: "265-16"
    dimension: "requirement_coverage"
    severity: "blocker"
    description: "Predecessor acceptance does not explicitly allow the finite old-v5 zero-charge/empty-ledger baseline predecessor without a stopped-state predicate; this could deny the authorized v6 diagnostic."
    fix_hint: "Add an exact predecessor fixture asserting root/time/charge carry and acceptance without requiring stopped=true or calling an old reader."
```

**Recommendation:** Revise this supplement in place; no new numbered plan is needed. Keep each task at no more than five owned files and preserve the current authorization and all frozen limits exactly.
