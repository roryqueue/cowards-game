# Research Summary

**Project:** Coward's Game  
**Date:** 2026-05-16  
**Milestone context:** Greenfield

## Key Findings

**Stack:** Keep the architecture spec's TypeScript/Next.js/Node/PostgreSQL/pnpm/Turborepo stack, updated to current package lines. Use Node 24 LTS, Next 16, React 19, TypeScript 6, Zod 4, Vitest 4, Playwright 1.60, PixiJS 8, and PostgreSQL 18 as current-version anchors.

**Feature scope:** v1 should prove the programmable strategy loop: author Strategy, submit immutable revision, run deterministic Match/MatchSet, generate Chronicle, inspect replay, and iterate in Workshop Mode.

**Architecture:** Build in this order: spec contracts, pure engine, Chronicle/replay validation, runtime boundary, worker execution, persistence, minimal replay viewer, strategy editor, then broader web product.

**Watch out for:** Sandbox complacency, UI-before-engine sequencing, Chronicle underdesign, nondeterminism, terminology drift, private data leakage, and over-scoped ranked infrastructure.

## Prescriptive Direction

1. Start with `packages/spec` and `packages/engine`.
2. Treat every rule from the canonical spec as a testable engine requirement.
3. Make Chronicle generation part of the simulation contract, not a UI feature.
4. Keep `apps/web` free of rule logic and strategy execution.
5. Use a worker-only strategy runtime boundary and assume strategy code is hostile.
6. Build Workshop Mode before ranked ladders.
7. Use hand-authored Arena Variants for v1.
8. Keep future multi-language runtime support architectural, but implement only JS/TS first.

## Requirements Implications

The requirements should be grouped around:

- Project foundation
- Spec contracts
- Engine rules
- Determinism and replay
- Strategy API and memory model
- Runtime sandbox
- Worker and MatchSet orchestration
- Persistence
- Strategy authoring
- Replay UX
- Local development and testing

## Roadmap Implications

Recommended roadmap style: Vertical MVP with early technical slices that still produce verifiable artifacts. A pure vertical user-facing slice is premature until the engine exists, but each phase should leave something demonstrable: testable rule engine, replayable Chronicle, sandboxed strategy run, local MatchSet, minimal replay UI, strategy editor loop.

## Sources

- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
