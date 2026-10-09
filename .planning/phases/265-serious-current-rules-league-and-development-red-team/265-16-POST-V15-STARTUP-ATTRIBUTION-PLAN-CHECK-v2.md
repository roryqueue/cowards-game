# Plan check: post-v15 startup attribution supplement v2

**Status:** `issues_found`  
**Plan:** `265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v2.md`  
**Inventory:** `265-16-POST-V15-STARTUP-ATTRIBUTION-PIN-INVENTORY-v1.md`  
**Review scope:** Static plan and inventory review only. No source, tests, worker runtime, provider, Strategy, Match, Docker, reader, publisher, or history scan was run.

## Result

The v2 revision closes the prior version collision and authority-path gaps: V8 is separately named; the ordered 21-path closure covers the policy, private grant, planner/factory, request, retention, and test seams; actual review roots are deferred until post-fix source exists; ordinal 5 remains dormant without the same-bounds control proof; and the prior 10-pin custody plus old inventory/budget boundaries are explicit. However, the executable plan still exceeds the plan scope limit (six implementation tasks and 21 functional/test files), and three commands labeled as capped have no enforced timeout or heap cap. Do not execute until these are revised or the work is split into checked bounded plans.

## Coverage summary

| Review area | Result | Evidence |
|---|---|---|
| New version/path and preservation of existing V5/V6/V7 | Covered | Frozen functional contract requires a new V8 module/tag and preserves legacy selectors/behavior |
| Exact authority call path and request/retained joins | Covered | Ordered 21-path closure includes policy, authority, planner, factory, baseline-match, correction, and retained validators/tests |
| Actual source/reviewer custody | Covered prospectively | Actual executor/reviewer roles and selected source-review-v7 path are named; actual roots are correctly generated only after final source exists |
| Ten failed-prefix pins and cost-only semantics | Covered | Exact paths, raw hashes, sizes, seven body roots/three absences, 39 charges and no-recredit rules are listed |
| Existing budgets, inventory bytes, and no-route boundary | Covered | No extension/reset; old arrays preserved; control proof is necessary and telemetry alone keeps ordinal 5 dormant |
| Test-first and source/privacy validation | Partially covered | Six TDD commands and 5000-ms per-test limit are concrete; three scanner commands are not actually capped |
| Scope | Fails | Six serial tasks and 21 functional/test files in one plan exceed the review thresholds |

## Blockers

1. **[scope_sanity] BLOCKER — The plan has six tasks and 21 functional/test files, exceeding the bounded plan scope.** The frozen closure is appropriately complete, but it is 6 implementation tasks across 21 functional/test paths (plus 10 pins, 4 inputs, and 6 outputs). This exceeds the plan-check limits of 5 tasks and 15 modified files per plan, increasing context and integration risk for a security-sensitive cross-layer change. **Fix:** preserve the complete closure but split it into a small number of strictly sequential, independently checked execution plans so each plan stays within the task/file limits; keep the V8 selector unavailable until the final integration plan and the actual control-repair/source-review gates pass. Update the input/output and debit inventories to bind the split plans before implementation; do not drop tests or paths to satisfy the count.

2. **[verification_caps] BLOCKER — The three scanner commands listed as capped do not enforce the required 60-second/768-MiB cap.** Under “Exact capped verification commands,” the six Vitest commands and package typecheck use `NODE_OPTIONS=--max-old-space-size=768` plus a 60-second Perl alarm. The subsequent commands for `pnpm boundary:imports`, `pnpm public-discovery:check`, and `pnpm exec tsx scripts/check-v1-38-factory-boundaries.ts` are bare commands. The prose saying each check is bounded does not make these invocations bounded. **Fix:** provide executable capped forms for all three scanners using the same hard alarm and Node heap limit, and retain the instruction that timeout/heap failure is a validation gap that leaves ordinal 5 dormant.

## Structured issues

```yaml
issues:
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v2"
    dimension: "scope_sanity"
    severity: "blocker"
    description: "One plan contains six implementation tasks and 21 functional/test files, above the 5-task and 15-file plan limits."
    fix_hint: "Split the frozen closure into sequential checked plans within those limits; preserve every path/test and keep V8 selection unavailable until the final integration and control-repair gates pass."
  - plan: "265-16-POST-V15-STARTUP-ATTRIBUTION-PLAN-v2"
    dimension: "verification_caps"
    severity: "blocker"
    description: "The boundary-import, public-discovery, and factory-boundary scanner commands are not wrapped in the required 60-second alarm or 768-MiB Node heap cap."
    fix_hint: "Add the same executable timeout/heap-cap wrapper used by the Vitest and package typecheck commands."
```

## Recommendation

Return for bounded revision. Do not require actual post-fix reviewer/source hashes before implementation; bind those after the exact 21-path source closure is fixed. Preserve the 39-charge carry, fixed cumulative/resource/time limits, unknown v15-4 physical cause, and dormant ordinal-5 state. No route authority is granted by this check.
