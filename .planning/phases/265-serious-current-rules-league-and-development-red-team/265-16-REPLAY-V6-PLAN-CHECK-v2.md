# Plan 265-16 replay-v6 supplement — recheck

**Result: VERIFICATION PASSED**  
**Plan checked:** revised `265-16-REPLAY-V6-PLAN-v1.md`  
**Prior review:** v1 findings are preserved in `265-16-REPLAY-V6-PLAN-CHECK-v1.md`; this recheck evaluates the revised plan and the named source seams only. Static review; no tests, empirical commands, readers, or source edits were run.

## Resolution of prior blockers

- Planner startup authority and baseline-source publication now have explicit ownership in Task 3: `v1-38-lean-experiment-authority.ts`, `v1-38-planner-supervised-runtime.ts`, `v1-38-lean-baseline-source.ts`, baseline Match, and startup supervisor. Its behavior and action require v6 identity correlation, v5/legacy preservation, both reused and new-source publication paths, and source-manifest pins.
- The exact old v5 baseline predecessor is now named by its allocation/raw/time/terminal roots and close time, with zero new charges and an empty ledger explicitly admissible without any stopped-state predicate or old-reader invocation. This condition appears in Task 1 behavior and is repeated in Tasks 3 and 4.
- Per-task owned-file counts are 3, 5, 5, and 3. No task exceeds the requested five-file cap. The existing pipeline remains conditional on a demonstrated v6 identity edge.

## Goal-backward coverage

| Required outcome | Plan coverage | Status |
|---|---|---|
| Exact additive v6 admission and selector; v5 and legacy behavior retained | Task 1 behavior/action/verify | Covered |
| Request, CLI, startup/capability, planner/factory, and publisher identity are joined | Tasks 2–3 | Covered |
| All frames validated only after complete v6 admission; retained/no-result reader paths correlate | Tasks 1 and 4 | Covered |
| Fixed budgets, rounded effective clock, finite predecessor carry | Task 1; scope and Task 3 explicit zero-charge predecessor case | Covered |
| Independent source review → validation → source verification before MAIN; no empirical work in this plan | Task 4 and scope/verification | Covered |

The plan keeps empirical credit false and conditions the one fresh diagnostic and possible one 36-Match baseline on the approved boundaries. The fixed guest/host/startup/Match and replay/inflate limits remain unchanged. The research responsibility map is addressed at the planner/factory, retained-reader, and custody tiers. AGENTS.md has no conflicting applicable directive; research contains no open-question section requiring resolution.

## Issues

None found. No new numbered plan is needed. Proceed to execution of this source-only supplement under its ordered gates; this check itself authorizes no tests, MAIN entry, or empirical action.
