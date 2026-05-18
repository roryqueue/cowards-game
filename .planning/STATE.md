---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Trustworthy Simulation Beta
status: gaps_found
last_updated: "2026-05-18T16:36:00.000-04:00"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 25
  completed_plans: 25
  percent: 94
---

# State: Coward's Game

**Initialized:** 2026-05-16  
**Status:** v1.1 audit found closure gap

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Current focus:** Close persisted owner replay debug authorization gap
**Completed milestone:** v1.0 MVP
**Archived roadmap:** .planning/milestones/v1.0-ROADMAP.md
**Archived requirements:** .planning/milestones/v1.0-REQUIREMENTS.md

## Current Position

Phase: 12 — Local and CI Reliability
Plan: —
Status: v1.1 milestone audit found DEBUG-04/DEBUG-05 partial due persisted replay owner-debug routing gap
Last activity: 2026-05-18 — Audited v1.1 and wrote `.planning/v1.1-MILESTONE-AUDIT.md` plus `.planning/v1.1-INTEGRATION-CHECK.md`

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
- Active REQUIREMENTS.md and ROADMAP.md now track v1.1 until the milestone is audited and archived.
- v1.1 is focused on trustworthy simulation: replay fidelity, strict Chronicle grammar and compatibility, stronger runtime isolation, doctrine debugging UX, and local/CI reliability.
- Ranked ladders remain out of scope for v1.1 because they multiply replay dispute, sandbox abuse, deterministic compatibility, privacy leakage, stale Strategy Revision, and scoring fairness risks.
- v1.1 roadmap continues phase numbering from v1.0 and spans Phase 8 through Phase 12.
- Phase context has been gathered and committed for all v1.1 phases: 8 replay fixture fidelity, 9 Chronicle grammar, 10 runtime isolation, 11 doctrine debugging UX, and 12 local/CI reliability.
- Phase 12 explicitly requires verifying the Docker local development path end to end now that Docker is available locally.
- Phase 8 added engine-generated replay scenario fixtures, legality diagnostics, projection-parity fixture rendering, stable replay timeline labels, focused visual regression baselines, and the `pnpm e2e:visual` gate.
- Phase 8 code review and UI review pass; Nyquist validation marks FID-01 through FID-07 covered.
- Phase 9 added strict Chronicle grammar, compatibility gates, per-boundary snapshot validation, public projection privacy hard gates, bounded replay transition contradiction checks, negative fixtures, and replay unavailable diagnostics.
- Phase 9 code review found and fixed validator false negatives for per-instance snapshots, impossible activation/cycle indices, unknown Soldier mutations, and abandoned Cycle windows; Nyquist validation marks GRAM-01 through GRAM-08 covered.
- Phase 10 added a Strategy execution adapter contract, explicit worker-thread metadata, an opt-in subprocess JSON IPC adapter, worker adapter selection, hostile Strategy matrix coverage, source import boundary gates, and runtime/system failure taxonomy coverage.
- Phase 10 code review found and fixed nondeterministic global exposure, stale/forged validation metadata trust, worker-thread output caps, and cloneable non-JSON worker payload leakage; Nyquist validation marks ISO-01 through ISO-07 covered.
- Phase 11 added actionable validation/runtime guidance, a richer sample Strategy catalog, Workshop replay links, owner-only replay inactivity explanations, debug overlay privacy gates, and public projection safeguards; Nyquist validation marks DEBUG-01 through DEBUG-06 covered.
- Phase 12 added Docker Compose readiness checks, no-Docker local Postgres diagnostics, a shared preflight command, isolated service-backed E2E, CI command separation, replay-route preflight evidence, and REL-01 through REL-06 validation evidence.
- v1.1 milestone audit found one product integration gap: persisted Match replay pages cannot reach trusted owner debug mode, so DEBUG-04 and DEBUG-05 remain partial for real persisted replay user flows.

## Post-Shipment Corrections

- 2026-05-18: Tightened the replay demo fixture outside the phase workflow after manual review found visually useful but rule-inaccurate beats. The fixture now starts from the canonical 12x12 two-army board and uses legal move, push, fall, stone, blocked-move, and contraction states.
- Added web fixture guard tests covering starting formation, push destination legality, terrain-blocked movement, contraction fallout, and future Backstab direct-behind legality.
- Verification run for the correction: `pnpm --filter @cowards/web test -- replay-fixture.test.ts`, `pnpm --filter @cowards/web typecheck`, `pnpm --filter @cowards/web lint`, and `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts`.

## Next Command

Insert and execute a closure phase for persisted owner replay debug authorization, then rerun `$gsd-audit-milestone 1.1`.

---
*Last updated: 2026-05-18 after v1.1 milestone audit*
