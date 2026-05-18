# Research: Stack

**Project:** Coward's Game
**Date:** 2026-05-18
**Milestone context:** v1.1 Trustworthy Simulation Beta

## Recommendation

Do not change the core application stack in v1.1. The existing TypeScript monorepo already has the right package boundaries for replay, engine, runtime, persistence, worker, and web. Use v1.1 to harden those boundaries and add test infrastructure, not to introduce a new product platform.

| Area | Current state | v1.1 stack direction | Confidence |
| --- | --- | --- | --- |
| Chronicle validation | Zod discriminated unions plus semantic validation in `packages/replay` | Keep Zod, add strict grammar/state-machine validation on top of schema parsing | High |
| Replay fixtures | Web fixture plus guard tests | Prefer engine-generated fixtures from `@cowards/test-utils`; keep any hand-authored fixtures behind legality tests | High |
| Visual checks | Playwright E2E smoke exists | Add focused Playwright screenshot checks with deterministic data, fixed viewport, disabled animation, and pixel-tolerant assertions | High |
| Runtime isolation | Node `worker_threads` with `resourceLimits`, empty env, timeout, and output validation | Keep worker thread path as compatibility/prototype layer; add subprocess adapter spike with process-level timeout/output limits and documented container/WASM direction | High |
| Container isolation | Compose currently starts Postgres and Redis only | Add app/worker Docker dev path only if it stays boring; for strategy runtime, prefer a separate constrained execution process/container design over in-process hardening alone | Medium |
| Local no-Docker path | `scripts/dev-local-postgres.sh` exists | Preserve and test no-Docker startup; improve diagnostics and parity with Docker startup | High |

## Runtime Isolation Findings

Node's `node:vm` remains explicitly unsuitable for hostile Strategy code. Do not introduce it.

The current `worker_threads` implementation can set V8 limits, and the existing code already uses `resourceLimits`. Official Node docs are clear that those limits only affect the JS engine and may not cover external allocations or global out-of-memory conditions. Treat this as a resource-control layer, not a security boundary.

Node's stable Permission Model is useful defense-in-depth for a subprocess adapter, but Node's own docs say it is not a malicious-code sandbox. If used, it should run in a separate process under minimal grants and preferably a separate OS/container boundary.

Best v1.1 runtime path:

1. Keep current worker-thread runtime green and covered.
2. Add an explicit `StrategyExecutionAdapter` seam that can select `worker-thread` or `subprocess`.
3. Implement or spike a subprocess harness that accepts only JSON input over stdio, returns only schema-validated JSON, has a wall-clock timeout, stdout/stderr byte caps, empty env, no inherited stdio, and deterministic violation mapping.
4. Document the production path as constrained process/container or WASM/WASI, not `node:vm` or same-process Workers.
5. Add hostile Strategy tests that prove failures become runtime violations or system failures without entering web/API processes.

## Chronicle Grammar Findings

Zod discriminated unions are appropriate for event payload shape. They are not enough for Chronicle truth. v1.1 should add grammar validation that checks:

- `MATCH_STARTED` is first and `MATCH_ENDED` is last.
- Round, Activation, Cycle, Action, Advance, Backstab, Contraction, and terminal events occur only in legal windows.
- Event context fields are required by event type and consistent with payload fields.
- Snapshot kinds are required at canonical boundaries and reference valid event sequences.
- Snapshot boards are consistent with the previous snapshot plus intervening events.
- Public projection never exposes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details by default.
- Version incompatibility and unsupported migration produce explicit non-rendering failure states.

## Visual Regression Findings

Playwright screenshot assertions are a good fit for board-scale and callout regression because they wait for two stable screenshots before comparison. Keep the test set small and deterministic:

- Canonical demo Match gallery: push, fall, contraction, legal Backstab, runtime failure, endgame.
- Board scale at desktop and mobile widths.
- Piece position snapshots for selected event sequences.
- Contraction boundary visibility.
- Event callout emphasis for push, fall, Backstab, runtime violation, and Match end.

## Local/CI Reliability Findings

Current `compose.yaml` provides Postgres and Redis, while `dev:local` starts a local Postgres without Docker. v1.1 should make both paths first-class:

- `pnpm dev:full` should verify dependent service health before app/worker assumptions.
- `pnpm dev:local --setup-only` should remain the no-Docker service setup path.
- Service-backed E2E should have a preflight script that reports missing Postgres, migrations, worker readiness, and fixture seed state clearly.
- CI should run at least one service-backed edit -> submit -> execute -> replay test, plus a visual replay fixture suite.

## Sources

- Node `vm` docs: https://nodejs.org/api/vm.html
- Node `worker_threads` docs: https://nodejs.org/api/worker_threads.html
- Node Permission Model docs: https://nodejs.org/api/permissions.html
- Node `child_process` docs: https://nodejs.org/api/child_process.html
- Docker resource constraints: https://docs.docker.com/engine/containers/resource_constraints/
- Docker Compose docs: https://docs.docker.com/compose/
- WebAssembly security docs: https://webassembly.org/docs/security/
- WASI overview: https://wasi.dev/
- Playwright screenshot assertions: https://playwright.dev/docs/api/class-pageassertions
- Zod discriminated unions: https://zod.dev/api?id=discriminated-unions
