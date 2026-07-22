---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "25"
subsystem: boundary-security
tags: [typescript, ast, module-graph, go, runtime-ownership, semantic-authority]

requires:
  - phase: 260-05
    provides: Candidate TypeScript four-condition scheduling and generated-authority consumption
  - phase: 260-06
    provides: Candidate Go scheduling with structural-only ownership
  - phase: 260-09
    provides: Candidate replay validation without execution or fairness derivation
  - phase: 260-10
    provides: Runtime-service and provider-only v1.19 execution transport
  - phase: 260-18
    provides: Candidate Workshop examples and generated current selector
  - phase: 260-24
    provides: Candidate web replay/result projections without semantic ownership
provides:
  - Permanent AST and local-module-graph gates for Strategy execution ownership outside runtime-service/providers
  - Structural guards against non-kernel observation derivation, handwritten successor geometry, seed-derived fairness, Go gameplay ownership, and current-selector bypass
  - Adversarial proof for aliases, re-exports, computed namespace access, helper indirection, generated-header spoofing, and fixture-directory escape
affects: [260-14, 260-15, 260-21, phase-261-proof, boundary-monitors]

tech-stack:
  added: []
  patterns: [path-exact-authority-allowlist, ast-symbol-inspection, local-module-graph-closure, privacy-safe-findings]

key-files:
  created: []
  modified:
    - scripts/check-service-boundary-imports.ts
    - scripts/check-service-boundary-imports.test.ts

key-decisions:
  - "Execution ownership is judged from original imported or re-exported symbols and resolved local-module paths, so aliases, computed names, generated-looking headers, and helper placement cannot grant authority."
  - "Chronicle grammar may validate recorded initiative and slot-Advance facts, but its allowlist suppresses only observation-derivation findings; execution-import checks still apply to those exact files."
  - "Diagnostics expose deterministic path, line, and rule identifiers only; source statements and private payload content never enter the public monitor output."

patterns-established:
  - "Authority exemptions are exact repository paths with one narrow semantic purpose, never filename conventions, generated headers, or fixture directories."
  - "Phase-260 consumers may transport spec-owned projections and kernel facts, but cannot reconstruct observations, geometry, fairness, gameplay, or execution behavior."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-03, SET-05]

coverage:
  - id: D1
    description: "Web, persistence, replay, API, and Go cannot acquire Strategy execution/evaluator or gameplay ownership through direct imports, aliases, re-exports, namespace access, or local helper indirection."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "scripts/check-service-boundary-imports.test.ts#Phase 260 execution and adversarial bypass probes"
        status: pass
      - kind: integration
        ref: "pnpm boundary:imports"
        status: pass
    human_judgment: false
  - id: D2
    description: "Initiative and slot-Advance derivation, successor arena literals, seed-encoded fairness, and current-selector bypass fail closed outside their exact authorities."
    requirement: SET-01
    verification:
      - kind: unit
        ref: "scripts/check-service-boundary-imports.test.ts#semantic ownership, Go, geometry, fairness, and selector probes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generated-looking files and fixture directories receive no implicit trust, while approved spec projections, transport-only consumers, and immutable historical dispatch remain valid."
    requirement: SET-05
    verification:
      - kind: unit
        ref: "scripts/check-service-boundary-imports.test.ts#generated spoof, fixture escape, and approved projection probes"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 25: Runtime and Semantic Ownership Monitor Summary

**The repository boundary monitor now rejects execution and semantic-authority shortcuts through AST symbol analysis, local-module graph closure, Go candidate scans, and privacy-safe adversarial probes.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-17T07:18:00Z
- **Completed:** 2026-07-17T07:30:09Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 2

## Accomplishments

- Extended the existing web import monitor with fail-closed Phase-260 ownership findings covering Strategy execution/evaluation, kernel observation truth, arena geometry, Set fairness, Go gameplay semantics, and current-selector identity.
- Added local TypeScript module-graph traversal and symbol-aware inspection for import aliases, re-exports, namespace/computed access, require/dynamic-import bindings, helper indirection, module subpaths, and star exports.
- Added exact positive fixtures for spec-owned data projections, transport-only consumers, and historical dispatch, plus deterministic privacy-safe diagnostics that contain paths and rule symbols but no source or private payloads.

## Task Commits

Each TDD task was committed as a RED/GREEN pair, followed by one security-narrowing fix:

1. **Task 1 RED: semantic ownership expectations** - `e945550` (test)
2. **Task 1 GREEN: runtime and semantic ownership monitor** - `726b2ca` (feat)
3. **Task 2 RED: adversarial bypass probes** - `4cebf2a` (test)
4. **Task 2 GREEN: module-graph and computed-access closure** - `6ceeaf8` (feat)
5. **Review fix: narrow authority exemptions and add Go/subpath/star coverage** - `01decb8` (fix)

## Files Created/Modified

- `scripts/check-service-boundary-imports.ts` - Adds Phase-260 AST/module-graph and Go ownership analysis, exact allowlists, fail-closed exit status, and privacy-safe formatting.
- `scripts/check-service-boundary-imports.test.ts` - Adds direct, adversarial, positive, deterministic, and privacy fixtures for every planned bypass class.

## Decisions Made

- Existing report-only web inventory remains visible and non-failing; the new Phase-260 ownership category is separately counted and always contributes to a nonzero exit.
- Runtime packages may still provide source validation/build helpers to persistence, but importing or re-exporting execution/evaluator symbols is forbidden outside runtime-service/providers.
- Historical and Chronicle validation paths are recognized only by exact path and only for their legitimate recorded-fact reconstruction; no comment, generated header, filename suffix, or fixture directory is trusted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Security Bug] Narrowed Chronicle authority exemptions**
- **Found during:** Post-Task-2 self-review
- **Issue:** The first implementation returned early for exact Chronicle grammar paths, which suppressed execution-import checks as well as the intended observation-derivation findings.
- **Fix:** Limited the allowlist to the observation-derivation branch and kept import/re-export/module-graph checks active for every exact Chronicle file. Added subpath/star-export and Go geometry/fairness probes at the same boundary.
- **Files modified:** `scripts/check-service-boundary-imports.ts`, `scripts/check-service-boundary-imports.test.ts`
- **Verification:** 17 focused tests, repository `boundary:imports`, ESLint, and the protected baseline all pass.
- **Committed in:** `01decb8`

---

**Total deviations:** 1 auto-fixed security bug.
**Impact on plan:** The fix makes the planned narrow allowlists genuinely fail closed without changing runtime, gameplay, historical evidence, or public output.

## Issues Encountered

- The first repository-wide semantic scan flagged `packages/replay/src/grammar.ts` because Chronicle grammar intentionally validates recorded Round initiative and per-slot Advance state. The final exact-path rule permits only that validation role and retains every execution-ownership check.
- Another Phase-260 executor was editing trace-generation files concurrently. All staging used exact Plan-25 paths; no trace, generated corpus, protected file, or sibling-plan artifact was staged or modified.

## User Setup Required

None - no dependency, service, database, secret, or environment change is required.

## Automated Evidence

- Focused boundary suite: 17/17 tests passed.
- Repository boundary import monitor: `strict_offenses=0 ownership_offenses=0`; the 19 established report-only inventory findings remain informational.
- ESLint passed for both modified files.
- Protected working-tree baseline remains exact at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Stub scan found no TODO, FIXME, HACK, placeholder, or unimplemented marker.

## TDD Gate Compliance

- Task 1 RED `e945550` failed on four missing ownership classes; GREEN `726b2ca` passes direct execution, observation, geometry, fairness, Go, selector, and positive projection cases.
- Task 2 RED `4cebf2a` failed on missing re-export, namespace/computed, and helper-graph findings; GREEN `6ceeaf8` and review fix `01decb8` pass all bypass, spoof, fixture, deterministic, privacy, and repository gates.

## Next Phase Readiness

- Plan 260-14 can activate only after these permanent structural gates remain green across the complete successor current-selector flip.
- Plans 260-15 and 260-21 can compose this monitor with tuple/certificate and full preactivation proof without adding duplicate authority checks.
- Phase 261 can invoke `pnpm boundary:imports` as a deterministic release drift guard; there are no Plan-25 blockers.

## Self-Check: PASSED

- Both modified files and this summary exist, and all five Plan-25 task/fix commits are present.
- Focused tests, repository monitor, lint, privacy diagnostics, stub scan, and protected-baseline verification pass.
- No protected file, active trace-generation file, Strategy source, runtime artifact, Chronicle evidence, generated authority, or current selector was changed by this plan.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
