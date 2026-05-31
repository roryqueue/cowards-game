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
Status: Ready for Phase 212 planning
Last activity: 2026-05-31 - Milestone-wide discussion completed for Phases 212-221; context and discussion logs written.

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
- Context and discussion logs exist for all remaining v1.31 phases:
  - Phase 212: Discovery Read Requirements and Boundary Design
  - Phase 213: Global Site Shell and Navigation
  - Phase 214: Public Home Discovery Hub
  - Phase 215: Watch Hub
  - Phase 216: Competition Hub and Competition Detail
  - Phase 217: Signed-In Entry Spine
  - Phase 218: Cross-Link Pass Across Existing Object Pages
  - Phase 219: Privacy, Boundary, and Discovery Monitor Coverage
  - Phase 220: Public and Signed-In Journey Proof
  - Phase 221: Audit, Archive, Commit, and Tag
