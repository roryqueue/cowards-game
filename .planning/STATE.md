---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: MVP
status: shipped
last_updated: "2026-05-18T08:45:00.000-04:00"
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 33
  completed_plans: 33
  percent: 100
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.0 shipped

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-17)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Planning next milestone
**Completed milestone:** v1.0 MVP
**Archived roadmap:** .planning/milestones/v1.0-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.0-REQUIREMENTS.md

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

## Post-Shipment Corrections

- 2026-05-18: Tightened the replay demo fixture outside the phase workflow after manual review found visually useful but rule-inaccurate beats. The fixture now starts from the canonical 12x12 two-army board and uses legal move, push, fall, stone, blocked-move, and contraction states.
- Added web fixture guard tests covering starting formation, push destination legality, terrain-blocked movement, contraction fallout, and future Backstab direct-behind legality.
- Verification run for the correction: `pnpm --filter @cowards/web test -- replay-fixture.test.ts`, `pnpm --filter @cowards/web typecheck`, `pnpm --filter @cowards/web lint`, and `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`.

## Next Command

`$gsd-new-milestone`

---
*Last updated: 2026-05-18 after post-shipment replay fixture legality correction*
