# Phase 66 Context: Workshop Analytics Evidence Read Boundary

**Milestone:** v1.10 Service Boundary Completion and Go Read-Model Decision  
**Date:** 2026-05-23  
**Status:** Complete

## Goal

Move the narrow Workshop Evidence Explorer analytics read slice behind `@cowards/service` and spec-owned DTOs while leaving Workshop source, save, validation, test execution, analytics rerun, export, and runtime flows in their existing TypeScript-owned boundaries.

## Starting Evidence

- Phase 65 left `pnpm boundary:imports` at `strict_offenses=0 report_only_offenses=33`.
- The selected Workshop analytics debt lived in:
  - `apps/web/app/workshop/types.ts` importing `WorkshopAnalyticsSnapshot` from persistence.
  - `apps/web/app/workshop/evidence/evidence-state.test.ts` importing persistence demo fixtures.
  - `apps/web/app/workshop/heatmap-state.test.ts` importing persistence demo fixtures.
- `apps/web/app/workshop/evidence/page.tsx` loaded analytics through broad `getWorkshopInitialData()`, which also pulled Workshop source/save/test/runtime concerns into the read page dependency closure.

## Non-Goals

- Do not move Workshop source retrieval, source save, validation, submission, test Match launch, worker execution, analytics rerun mutation, or analytics export.
- Do not change engine, rules, Chronicle, scoring, runtime ABI, or public terminology.
- Do not route production traffic to Go.
- Do not promote sandbox isolation or non-JS counted play.

