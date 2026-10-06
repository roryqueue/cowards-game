# Plan Check — Prospective 20-hour binding

**Phase:** 265 — Serious Current-Rules League and Development Red Team  
**Plan checked:** `NEW265-16-TWENTY-HOUR-PLAN-v1.md`  
**Status:** ISSUES FOUND — 1 blocker

## Scope reviewed

This check is limited to the approved prospective timebox amendment: the 72,000,000-ms ceiling, 56,000,917-ms carry from epoch 1,791,326,194,166, preserved v1–v8 history and non-time caps, retained closure/baseline consumers, and separation of source-only work from later MAIN empirical gates.

The approval and research agree with the plan's additive-root approach, exact carry/start formula, 20,091,542-ms idle exclusion, unchanged 15,000,000,000-byte and 300-Match ceilings, 29 prior charges, and 1,860,000-ms reserve. The plan explicitly keeps old v8 at 57,600,000 ms, preserves earlier artifacts, and forbids empirical execution in its source-only tasks. The actual-author and distinct-reviewer requirement is correctly left to MAIN's later request/helper gate; the plan does not authorize worker empirical activity.

## Blocker

**1. [key_links_planned] The extension is not planned through the standalone baseline runner's live cap consumers.**

- Plan: `NEW265-16-TWENTY-HOUR-PLAN-v1.md`, Task 1
- Severity: **BLOCKER**
- Evidence: `scripts/run-v1-38-lean-baseline.ts` calls `leanCapsForAllocation(allocation).elapsedMs` for both its resource-threshold admission and child timeout (`currentLeanElapsedMs` is compared against the selected cap). That file is absent from Task 1 and `files_modified`; its runner test, `scripts/run-v1-38-lean-baseline.test.ts`, is also absent. Although the plan updates baseline source/retained authority and tests those layers, it does not specify how a newly extension-bound baseline allocation reaches this runner or prove that the runner enforces the selected extension cap and carry/reserve while legacy allocations remain capped at 57,600,000 ms. This leaves a real baseline execution consumer outside the promised producer-to-consumer proof.
- Fix: Add `scripts/run-v1-38-lean-baseline.ts` and its focused test to the implementation and manifest scope. Specify connected assertions that an authenticated extension-bound conditional baseline uses the 72,000,000-ms ceiling and approved carry/start, while a missing, stale, or mismatched extension cannot raise the legacy cap; preserve the accepted diagnostic's actual retained-check + FINAL-close admission join and all existing reserve/resource gates.

## Other checks

- Requirement IDs in this supplement are named in frontmatter; the plan expressly does not claim phase requirements complete.
- Both tasks include files, concrete actions, runnable automated verification, and measurable done criteria. The plan has two tasks and no dependency cycle.
- The main legacy-v8/new-extension, carry, resource-cap, retained-closure, and manifest links are otherwise concretely specified.
- No phase-16 `CONTEXT.md` is present in the plan's own source audit; no separate locked-decision/deferred-scope finding is made here.
- Dimension 7c: SKIPPED — no responsibility map was part of this narrow review.
- Dimension 8: SKIPPED — this supplement review does not rely on a phase Validation Architecture contract.
- Dimension 10: project `AGENTS.md` adds no directly implicated requirement beyond the source-only/private-coordinator scope already stated in the plan.

## Structured issues

```yaml
issues:
  - plan: "NEW265-16-TWENTY-HOUR-PLAN-v1.md"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "The standalone baseline runner's allocation cap, elapsed threshold, and child timeout are live consumers of the selected timebox but the runner and its test are outside the task and changed-file scope. The conditional baseline therefore lacks an end-to-end extension/legacy-cap proof."
    files:
      - "scripts/run-v1-38-lean-baseline.ts"
      - "scripts/run-v1-38-lean-baseline.test.ts"
    fix_hint: "Include the runner and focused connected regression in the implementation and source inventory; prove extension-bound baseline admission uses the approved 72,000,000-ms carry/start while legacy or mismatched allocations remain at 57,600,000 ms and the existing accepted-check/FINAL-close and reserve gates remain mandatory."
```

**Recommendation:** Return to the planner for this targeted baseline-runner wiring/test correction, then re-check the amended plan.
