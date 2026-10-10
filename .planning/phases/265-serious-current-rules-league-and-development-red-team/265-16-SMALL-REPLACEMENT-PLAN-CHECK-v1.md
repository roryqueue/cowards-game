# Phase 265 Plan 16 Small Replacement — Plan Check v1

**Status:** ISSUES FOUND — 4 blockers, 1 warning  
**Scope checked:** `265-16-SMALL-REPLACEMENT-PLAN-v1.md` against the 2026-10-10 approval, replacement research, active Phase 265 context/roadmap/requirements, current state/debug diagnosis, project instructions, and the live runtime authority/provider call graph.  
**Review boundary:** Read-only plan/source inspection only; no tests, runtime, Strategy, provider, Match, or reader execution.

## Scope and goal interpretation

The approved four-probe/zero-Match diagnostic is a valid *smaller replacement* and must not be rejected merely because it is not a league. It must not be credited as LEAG-01–09 completion, baseline/freeze, or Phase 265 completion. The plan says this clearly in its source audit, must-haves, and success criteria; the old failed family stays immutable. The phase requirements remain pending as the plan itself states.

## Findings

### Blockers

1. **[BLOCKER — architectural/runtime authority] The proposed no-Match capability cannot use the named existing claim chain as specified.**

   Task 1 says the probe issuer returns the existing `LeanRuntimeAuthority` and uses the existing factory → planner → session claims, while forbidding a seat schedule and fake Match identity. In current source, that authority requires a `seat: "bottom" | "top"`; all three claims compare against a `ProspectiveLeagueLifetimeProviderBinding` that includes the seat. The factory and session also require `matchId`, `containerName`, and `ownershipLabel`; the session is explicitly `LeanContainerMatchSession` and validates those bindings before construction. Thus the task either invents a seat/Match-shaped identity contrary to its own constraints or cannot satisfy the actual types and claim predicates. `FactorySupervisionProvider.invoke` itself is reusable, but the plan does not specify a supported no-Match lifetime/session seam. This is the key feasibility question identified in research, not a detail execution can safely guess.

   **Fix:** Before execution, define a concrete, source-backed non-Match probe authority/binding path that reaches the already-supervised provider without synthetic Match/seat semantics, or revise the scope to stop before runtime dispatch and report `feasibility_not_established`. Do not loosen existing Match issuers or silently fabricate identity fields. Update the plan artifacts/key links and tests to the actual chosen path.

2. **[BLOCKER — read-only verification / inventory contradiction] `--verify` is declared read-only but its verifier output is inside the retained store.**

   Task 2 requires `--verify` to be a read-only independent process. Task 3’s exact store inventory nevertheless requires that process to leave `retained-verification.json` inside the store, and the physical-inventory section says the result root binds that file. A process that creates that file is not read-only; a process forbidden from writing cannot produce it. The plan also excludes other sidecars, so there is no currently authorized destination for the verification report.

   **Fix:** Keep the independent verifier read-only over the store and put its report in a separately enumerated, budgeted external evidence path, or explicitly define a separate post-verification publisher/write step with an exact inventory and root-ordering contract. Do not call a store-writing verifier read-only.

3. **[BLOCKER — task completeness / bounded file ownership] Task 3 omits its planned outputs from `<files>`.**

   Task 3’s `<files>` lists only the four source/test files, but its action creates six named evidence notes and a private allocation/store/result inventory. The plan-level `files_modified` likewise lists only four files while the output contract includes the plan plus six notes and runtime records. These are required gate artifacts, so their ownership, allowed locations, and resource accounting are not represented by the task’s file contract.

   **Fix:** Enumerate the six exact notes and the bounded private-store location in Task 3’s `<files>`/output contract, and reconcile the plan-level inventory with what is actually created. Keep the existing exact-path/no-sidecar restriction.

### Warning

1. **[WARNING — requirement metadata] The frontmatter claims `LEAG-01` through `LEAG-09` while the plan explicitly delivers none of them.**

   The four-probe diagnostic is appropriately described as prerequisite feasibility evidence, not requirement coverage. Listing all nine as this supplement’s `requirements` can make automated coverage/reporting imply that this plan addresses those requirements, despite the explicit `PENDING` dispositions.

   **Fix:** Use the project’s convention for a diagnostic-only supplement (for example, omit those IDs or identify them as upstream phase requirements without claiming coverage). Keep all nine pending in the result.

## Structural and evidence checks

- All three XML tasks contain `<read_first>` and runnable `<verify>` commands; however, none has an explicit `<acceptance_criteria>` element. Each has `<done>`, but the requested execution contract calls for the explicit field, so this is a task-completeness blocker. Add measurable acceptance criteria, especially for Task 3’s review, source verification, allocation, and independent retained check.
- Task count is three; source files are four, within ordinary scope targets. The additional six notes and variable runtime artifacts must be accounted for as above.
- Dependencies: supplement depends on existing Plan 265-16; no internal cycle is described. The runtime work is properly gated after source review/validation in intent, but the authority mismatch blocks that gate from proving the proposed route.
- Input schemas and source role are plausible at the current API level: `LeanBaselineSource` recognizes role `probe`; the factory provider exposes `invoke`, `verify`, and `close`; runtime methods accept the v1.19 schemas. But the plan does not yet establish canonical legal observation provenance independently of a Match, nor resolve the non-Match authority/session binding.
- No requirement is inferred complete, no rules/resource limits are changed, and the four-probe/zero-Match size is accepted as the approved scope.
- Architectural responsibility map: SKIPPED (no applicable map was supplied with this supplement’s required artifacts). Nyquist validation: SKIPPED (no phase `VALIDATION.md`/applicable research validation-architecture contract was provided for this supplement). Pattern compliance: SKIPPED (no phase `PATTERNS.md`).

## Structured issues

```yaml
issues:
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "architectural_tier_compliance"
    severity: "blocker"
    description: "Probe-only non-Match authority is specified as the existing LeanRuntimeAuthority/claim chain, but that source contract requires a bottom/top seat and Match-shaped binding fields; the plan forbids those semantics and defines no alternative supported boundary."
    task: 1
    fix_hint: "Specify and test an actual no-Match authority/session binding into the existing supervised provider, or stop before dispatch and report feasibility_not_established."
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "The --verify process is required to be read-only but is also required to create retained-verification.json inside the store it verifies."
    task: 3
    fix_hint: "Keep verification read-only and enumerate an external report destination, or define a separate explicitly budgeted publisher step and root ordering."
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "task_completeness"
    severity: "blocker"
    description: "Task 3 creates six evidence notes and a private-store inventory, but its <files> and plan files_modified enumerate only four source/test files."
    task: 3
    fix_hint: "Enumerate the exact evidence-note/store outputs and reconcile plan-level ownership/resource inventory."
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "requirement_coverage"
    severity: "warning"
    description: "Frontmatter lists LEAG-01 through LEAG-09 although this approved diagnostic explicitly leaves each requirement pending and provides no league coverage."
    fix_hint: "Do not attach LEAG IDs as requirements covered by this diagnostic supplement; retain pending dispositions."
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "task_completeness"
    severity: "blocker"
    description: "Each task has read_first and done, but the explicit acceptance_criteria element is absent."
    fix_hint: "Add task-level measurable acceptance_criteria, including the pre-runtime and retained-verification gates."
```

## Recommendation

Return the supplement for bounded revision. The approved smaller diagnostic scope is sound, but runtime dispatch is not ready until the no-Match authority path and verifier write boundary are made internally consistent and Task 3’s outputs are explicitly owned. No broader baseline/league work is requested by this check.
