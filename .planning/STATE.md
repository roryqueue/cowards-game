---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Trustworthy Simulation Beta
status: in_progress
last_updated: "2026-05-18T11:36:00.000-04:00"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
  percent: 20
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.1 in progress

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Phase 9: Strict Chronicle Grammar and Compatibility
**Completed milestone:** v1.0 MVP
**Archived roadmap:** .planning/milestones/v1.0-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.0-REQUIREMENTS.md

## Current Position

Phase: 9 — Strict Chronicle Grammar and Compatibility
Plan: —
Status: Phase 8 complete and verified; Phase 9 ready for research and planning
Last activity: 2026-05-18 — Completed Phase 8 execution, code review, UI review, Nyquist validation, and final `pnpm verify`

## Workflow Settings

- Mode: YOLO
- Granularity: Standard
- Execution: Parallel
- Git tracking: Yes
- Research before planning: Yes
- Plan check: Yes
- Verifier: Yes
- Model profile: Balanced

## Completed Milestone

| Milestone | Phases | Plans | Requirements | Status |
| --- | ---: | ---: | ---: | --- |
| v1.0 MVP | 7 | 33 | 80/80 | Shipped |

## Accumulated Context

- v1.0 established the complete author -> execute -> replay loop.
- All phase verification reports passed and the milestone audit passed.
- Phase directories were archived under .planning/milestones/v1.0-phases/.
- Active REQUIREMENTS.md is removed after archival; run `$gsd-new-milestone` to define the next requirement set.
- v1.1 is focused on trustworthy simulation: replay fidelity, strict Chronicle grammar and compatibility, stronger runtime isolation, doctrine debugging UX, and local/CI reliability.
- Ranked ladders remain out of scope for v1.1 because they multiply replay dispute, sandbox abuse, deterministic compatibility, privacy leakage, stale Strategy Revision, and scoring fairness risks.
- v1.1 roadmap continues phase numbering from v1.0 and spans Phase 8 through Phase 12.
- Phase context has been gathered and committed for all v1.1 phases: 8 replay fixture fidelity, 9 Chronicle grammar, 10 runtime isolation, 11 doctrine debugging UX, and 12 local/CI reliability.
- Phase 12 explicitly requires verifying the Docker local development path end to end now that Docker is available locally.
- Phase 8 added engine-generated replay scenario fixtures, legality diagnostics, projection-parity fixture rendering, stable replay timeline labels, focused visual regression baselines, and the `pnpm e2e:visual` gate.
- Phase 8 code review and UI review pass; Nyquist validation marks FID-01 through FID-07 covered.

## Post-Shipment Corrections

- 2026-05-18: Tightened the replay demo fixture outside the phase workflow after manual review found visually useful but rule-inaccurate beats. The fixture now starts from the canonical 12x12 two-army board and uses legal move, push, fall, stone, blocked-move, and contraction states.
- Added web fixture guard tests covering starting formation, push destination legality, terrain-blocked movement, contraction fallout, and future Backstab direct-behind legality.
- Verification run for the correction: `pnpm --filter @cowards/web test -- replay-fixture.test.ts`, `pnpm --filter @cowards/web typecheck`, `pnpm --filter @cowards/web lint`, and `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`.

## Next Command

`$gsd-plan-phase 9`

---
*Last updated: 2026-05-18 after Phase 8 completion*
