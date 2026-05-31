---
milestone: v1.31
milestone_name: Public Site Spine and Discovery Reads
status: planning
current_phase: 212
progress:
  phases_total: 11
  phases_complete: 1
  requirements_total: 57
  requirements_complete: 5
---

# State: Coward's Game v1.31

## Current Position

Phase: 212 - Discovery Read Requirements and Boundary Design
Plan: Pending
Status: Ready for Phase 212 discussion/planning
Last activity: 2026-05-31 - Phase 211 route and link inventory completed; v1.31 requirements and roadmap proposed.

## Project Reference

See: `.planning/PROJECT.md`

**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Active Boundary Notes

- New discovery reads are separate from `match-execution-app-v1`.
- Do not add fields to existing public execution DTOs.
- Do not change Go execution, runtime-service behavior, retry/recovery policy, quarantine, job lifecycle, MatchSet scoring, Chronicle persistence, internal operator controls, runtime promotion, ABI status, or counted language eligibility.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, or recovery payloads.

## Resume Notes

- Phase 211 artifacts:
  - `.planning/artifacts/v1.31-route-link-inventory.md`
  - `.planning/phases/211-route-and-link-inventory/211-CONTEXT.md`
  - `.planning/phases/211-route-and-link-inventory/211-PLAN.md`
  - `.planning/phases/211-route-and-link-inventory/211-SUMMARY.md`
- Phase 212 should define the new discovery DTOs/routes before any global shell or page implementation.
