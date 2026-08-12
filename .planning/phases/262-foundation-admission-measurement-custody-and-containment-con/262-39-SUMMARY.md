---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 39
subsystem: policy-authority
tags: [pre-search-policy, canonical-json, capability-separation, mutation-testing, fail-closed]
requires:
  - phase: 262-35
    provides: exact non-authorizing study and accounting policy
  - phase: 262-36
    provides: exact non-authorizing measurement, report-state, and claim policy
  - phase: 262-37
    provides: protocol-only classifier policy and zero-finding pre-formation containment
  - phase: 262-38
    provides: synthetic custody mechanics with unavailable genuine custody and no SEAL-01 credit
provides:
  - capability-specific pre_search_policy_root joining every ready policy lane without activation authority
  - exact six-field denial projection preserving blocked ADMIT-03 and unavailable SEAL-01
  - deterministic write/check CLI with exact source, predecessor, supersession, and replay-tooling bindings
affects: [262-40, ADMIT-03, MEAS-01, MEAS-02, MEAS-03, MEAS-04, MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09, MEAS-10, SEAL-01, DECI-02]
tech-stack:
  added: []
  patterns: [capability-specific identity domain, exact-key denial schema, deterministic atomic artifact publication, separate tooling-dependency attribution]
key-files:
  created:
    - scripts/evaluate-v1-38-pre-search-policy.ts
    - scripts/evaluate-v1-38-pre-search-policy.test.ts
    - .planning/artifacts/v1.38-pre-search-policy-root.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-39-SUMMARY.md
  modified: []
key-decisions:
  - "Name and domain the aggregate only as pre_search_policy_root; it is never a generic foundation or activation authority."
  - "Keep exactly six false authority denials while validating every joined component's broader live, holdout, public, persistence, scheduling, replay, and result denials at the source boundary."
  - "Classify the frozen replay commit as an external tooling dependency only after the exact test, manifest, and unreachable Git object agree; never repair or waive it here."
patterns-established:
  - "Policy identity is non-transitive: a ready policy root cannot satisfy matrix admission, genuine custody, Phase 263, candidate search, formation, or production gates."
  - "Repository-tooling failures remain separately bound evidence and cannot compensate for or invalidate passing focused policy gates."
requirements-completed: [MEAS-01, MEAS-02, MEAS-03, MEAS-04, MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09, MEAS-10, DECI-02]
coverage:
  - id: D1
    description: "Exact study, measurement, protocol, containment, and synthetic-custody bytes join under a deterministic capability-specific policy root."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-pre-search-policy.test.ts#joins the exact policy components under a capability-specific non-authorizing root"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/evaluate-v1-38-pre-search-policy.ts --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every missing, extra, or flipped authority denial and every historical/live/candidate/holdout/formation input fails closed."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-pre-search-policy.test.ts#rejects every missing, extra, or flipped denial before a root can validate"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
  - id: D3
    description: "Policy readiness retains blocked admission, unavailable genuine custody, gaps_found/in_progress phase status, and denied downstream authority."
    requirement: DECI-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-pre-search-policy.test.ts#rejects generic activation naming and all historical live candidate holdout and formation admission inputs"
        status: pass
      - kind: other
        ref: "jq exact six-denial and orthogonal-status assertion over v1.38-pre-search-policy-root.json"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-08-12
status: complete
---

# Phase 262 Plan 39: Capability-Specific Pre-Search Policy Root Summary

**A deterministic `pre_search_policy_root` now joins every ready MEAS/DECI policy lane while ADMIT-03, SEAL-01, candidate search, Phase 263, formation, and production remain explicitly denied.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-12T22:28:13Z
- **Completed:** 2026-08-12T22:34:20Z
- **Tasks:** 2/2
- **Files modified:** 3 implementation/test/artifact files plus this summary

## Accomplishments

- Joined exact study, measurement, protocol, containment, and synthetic-custody artifact bytes and roots with generator/checker, test, authority, selected predecessor, supersession, and replay-tooling source bindings.
- Froze policy root `sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382` under the distinct `cowards-game:v1.38:pre-search-policy-root:v1` domain.
- Enforced exactly six false denial fields and rejected every missing, extra, flipped, generic-activation, route-5/A6/historical, live-writer, candidate, holdout, formation, provider, or database mutation.
- Added import-meta-rooted deterministic `--write`/`--check` modes with exclusive temporary creation and atomic publication, bounded public-safe stdout, and byte-identical regeneration.
- Bound the exact frozen replay test/manifest and observed unreachable commit as `tooling_dependency: frozen_replay_commit_unreachable` without modifying or substituting replay evidence.

## Task Commits

Task 1 used the mandatory TDD RED/GREEN sequence; Task 2 was committed separately:

1. **Task 1 RED: failing policy-root mutation and conjunction tests** - `8c6b5109` (test)
2. **Task 1 GREEN: capability-specific non-authorizing policy root** - `990988cc` (feat)
3. **Task 2: deterministic write/check artifact and replay classification** - `60621ca7` (feat)

## Files Created/Modified

- `scripts/evaluate-v1-38-pre-search-policy.ts` - Exact component validator, capability-specific root builder, public-safe renderer, deterministic writer/checker, and bounded CLI.
- `scripts/evaluate-v1-38-pre-search-policy.test.ts` - Conjunction, source/root join, denial mutation, forbidden-input, deterministic-regeneration, privacy, and committed-artifact tests.
- `.planning/artifacts/v1.38-pre-search-policy-root.json` - Canonical ready-but-non-authorizing policy identity with six exact false denials.

## Automated Evidence

- Focused Vitest: 6 passed, 0 failed.
- Policy check mode: exact committed bytes and policy root passed.
- Deterministic regeneration: artifact SHA-256 remained `97eb6a7d3ba3e23f5cbeba101f7f17b0fe5556d5e6581da170313a0dbf5cf982` across a second write.
- Dependency-revision boundary monitor: `passed_absence`; 148 protected paths, eight successor sources, matrix admission `blocked`, downstream authority `denied`.
- Repository typecheck: 27/27 Turbo tasks passed.
- Exact artifact assertion: root kind, orthogonal statuses, six denials, and tooling classification all passed.
- Frozen replay classification probe: the exact historical manifest test failed only with the two expected `FROZEN_SOURCE_MISMATCH` findings caused by unreachable commit `4fab0afc058232f37ba11506b5d04a1d59b2f4e0`; replay sources and manifest remained untouched.

## Decisions Made

- The aggregate root is deliberately a policy capability, not a generic foundation identity; consumers must use the exact schema/domain and cannot reinterpret a hash as activation authority.
- Policy-ready completes the MEAS/DECI policy lane only. It cannot compensate for fresh matrix admission or genuine separately controlled custody.
- Broader public/live/holdout/persistence/scheduling/replay/result denials remain validated in the joined protocol and containment components, while the root's denial object stays exactly the six fields mandated by the plan.
- The replay defect is an independently observed tooling dependency, not a focused-policy failure, ADMIT-03 result, waiver, or Phase-262 closure condition.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected readonly mutation typing in the test fixture**
- **Found during:** Task 1 GREEN standalone TypeScript verification
- **Issue:** The byte-mutation test cloned a readonly component array and then assigned an entry, which direct TypeScript compilation rejected.
- **Fix:** Narrowed only the cloned test fixture to a mutable array while leaving production components readonly.
- **Files modified:** `scripts/evaluate-v1-38-pre-search-policy.test.ts`
- **Verification:** Focused Vitest, standalone TypeScript, boundary monitor, and repository typecheck all pass.
- **Committed in:** `990988cc`

**2. [Rule 1 - Bug] Corrected stale generated tracking metadata**
- **Found during:** Plan close-out
- **Issue:** The state helper counted 34/35 summaries but wrote `percent: 0` and retained Plan-262-38 activity, 33/35 narrative, stale successor lists, and `next_action: 262-39`.
- **Fix:** Corrected STATE and ROADMAP to 34/35, 97%, Plan 262-40 next, and the exact pre-search policy root while preserving `in_progress`/`gaps_found`, blocked ADMIT-03, and unmet SEAL-01.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Frontmatter, progress text, successor markers, plan checklist, and roadmap table agree.
- **Committed in:** Plan metadata commit

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs).  
**Impact on plan:** The fixes preserve test correctness and truthful fail-closed tracking; neither changes authority, artifact identity, protected history, or production behavior.

## Issues Encountered

The known frozen replay commit remains unreachable and produces the separately attributed historical replay failure. It was observed exactly and intentionally left unfixed.

## Authentication Gates

None.

## User Setup Required

None - no external services, secrets, providers, databases, or custody controls were created or used.

## Known Stubs

None. No placeholder, empty UI data source, candidate, live route, formation artifact, or operational-custody stand-in exists in the plan output.

## Live Truth Preserved

Route 5 remains `calibration_stopped`; fresh charged/accepted evidence remains 0/0; authority remains expired with no retry. ADMIT-03 remains blocked, genuine custody remains unavailable, and SEAL-01 remains unmet. Phase 262 remains `in_progress`/`gaps_found`; candidate search, Phase 263, holdout opening, formation materialization, live work, provider/database work, public exposure, persistence, scheduling, replay/result publication, and production authorization remain denied.

## Next Phase Readiness

Plan 262-40 may inspect genuine separately controlled custody inputs if they are actually supplied. The policy root grants it no identity, authorization, custody, candidate, Phase 263, formation, live-work, or production authority, and Phase 262 must remain open unless ADMIT-03 and SEAL-01 are literally satisfied through their separate gates.

## Self-Check: PASSED

All three implementation/test/artifact files and this summary exist; commits `8c6b5109`, `990988cc`, and `60621ca7` resolve in Git; focused tests, deterministic check mode, exact artifact assertions, boundary monitoring, and 27/27 repository typechecks pass.
