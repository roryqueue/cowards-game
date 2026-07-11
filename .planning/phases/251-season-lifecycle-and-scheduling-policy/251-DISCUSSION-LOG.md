# Phase 251 Discussion Log

**Date:** 2026-07-11
**Mode:** Autonomous continuation from the user-approved v1.36 milestone brief

## Inputs Applied

- Trial Seasons remain resettable and Season-scoped; no permanent rating promise.
- Entry eligibility is inherited from completed Phase 250.
- Scheduling must use locked immutable entrant snapshots and must not mix Seasons.
- Public copy must explain lifecycle, resets, and insufficient evidence honestly.
- Runtime and deterministic game ownership remain unchanged.

## Decisions

1. Keep the existing six statuses and enforce a monotonic transition graph.
2. Treat `open -> scheduling` as the entry freeze boundary and set `closed_at` there.
3. Make scheduling one transaction with a row lock and idempotent run behavior.
4. Complete below-minimum Seasons as `insufficient_evidence` instead of leaving an ambiguous error-only state.
5. Project lifecycle windows and outcomes in both TypeScript and Go public ladder reads.

## Scope Guard

Result classification, governance, public page redesign, service-backed E2E, game rules, runtime execution, and durable ratings are not part of Phase 251.
