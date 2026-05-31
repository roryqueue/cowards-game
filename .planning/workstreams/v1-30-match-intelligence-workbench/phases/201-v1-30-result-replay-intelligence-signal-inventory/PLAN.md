# Phase 201 Plan: Result/Replay Intelligence Signal Inventory

## Research

- Public result data flows through `PublicReadMatchSetResultDto`, `match-execution-app-v1` fixture summaries, and app-only missing-Chronicle/no-result fixtures.
- Public replay data flows through `ReplayReadyDto`, public Chronicle projections, timeline entries, board states, replay focus requests, and canonical replay fixture scenarios.
- Owner debug payloads, owner-private projections, Strategy source, memories, objectives, raw diagnostics, host/env/DB/package details, and runtime internals are excluded from default public intelligence.

## Plan

1. Inventory available result DTO, replay DTO, fixture, and app view-model signals.
2. Classify signals as public intelligence, low-signal public state, owner/test-only, execution-internal, persistence-internal, runtime-internal, or unstable.
3. Record fixture viability for tactical summary, annotations, Soldier progression, board control, terrain/STONE, and action mix.
4. Preserve frozen contract and runtime/ownership non-claims in downstream proof.

## Verification

- `pnpm match-execution:intelligence:check`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
