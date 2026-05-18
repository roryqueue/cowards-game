# Research: Pitfalls

**Project:** Coward's Game
**Date:** 2026-05-18
**Milestone context:** v1.1 Trustworthy Simulation Beta

## Critical Pitfalls

### 1. Confusing valid schema with valid Chronicle

**Risk:** A Chronicle can parse but still describe impossible gameplay.
**Warning signs:** Replay renders after only Zod parsing; event order checks remain shallow; snapshots are accepted without semantic relation to events.
**Prevention:** Add strict grammar validation and fixture tests for impossible sequences, impossible snapshots, missing required contexts, and unsupported versions.
**Phase mapping:** Strict Chronicle grammar phase.

### 2. Replacing hand-authored fixtures with different hand-authored fixtures

**Risk:** The replay gallery looks better but is still not anchored to legal engine output.
**Warning signs:** Demo data is edited directly in web fixtures; legality tests assert visual properties only; Backstab/push/fall beats do not come from the engine.
**Prevention:** Generate canonical scenarios through engine/test-utils and make UI consume projected legal Chronicles.
**Phase mapping:** Replay fixture fidelity phase.

### 3. Over-trusting worker threads

**Risk:** Hostile Strategy code is treated as contained because it runs in a Worker.
**Warning signs:** Worker-thread `resourceLimits` are described as the sandbox; no process boundary exists; hostile tests only check friendly forbidden patterns.
**Prevention:** Document worker threads as prototype isolation, add subprocess/container/WASM direction, and implement or spike a subprocess adapter with explicit failure modes.
**Phase mapping:** Runtime isolation phase.

### 4. Treating Node Permission Model as a sandbox

**Risk:** A subprocess with `--permission` gives a false sense of security against malicious code.
**Warning signs:** Permission flags replace OS/container isolation; subprocesses run under same user with broad filesystem access; debug/inspector edge cases are ignored.
**Prevention:** Use permissions only as defense-in-depth, with separate process/container/user boundaries and no sensitive env/file descriptors.
**Phase mapping:** Runtime isolation phase.

### 5. Letting debug UX infer rules in React

**Risk:** "Why did this Soldier do nothing?" logic diverges from engine truth.
**Warning signs:** Replay components infer legal moves or activation consequences from board position; UI contains Backstab/push/contraction rule code.
**Prevention:** Produce explanation DTOs from replay/engine-derived data and keep React as renderer.
**Phase mapping:** Doctrine debugging UX phase.

### 6. Privacy regression through helpful debugging

**Risk:** Owner debug improvements leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, or raw runtime details into public replay.
**Warning signs:** Public DTO grows new debug fields; projection tests only inspect top-level keys; private refs are dereferenced without viewer checks.
**Prevention:** Add projection-level and browser-level privacy tests for every new debug field.
**Phase mapping:** Chronicle grammar and debugging UX phases.

### 7. Screenshot tests becoming flaky or ornamental

**Risk:** Visual regression tests add CI noise without catching board correctness issues.
**Warning signs:** Full-page screenshots include dynamic text/timers; snapshots depend on local fonts or running animation; tests assert marketing page pixels instead of board state.
**Prevention:** Use deterministic fixture data, fixed viewports, stable selectors, disabled animations, and focused board/callout screenshots.
**Phase mapping:** Replay fixture fidelity phase.

### 8. Docker path and no-Docker path drifting apart

**Risk:** One local setup works and the other rots, causing E2E failures and onboarding pain.
**Warning signs:** `dev:full` assumes Docker Compose but no app container health; `dev:local` only handles Postgres; CI uses a third undocumented setup.
**Prevention:** Add shared preflight checks and document parity expectations. Test both startup modes where feasible.
**Phase mapping:** Local/CI reliability phase.

### 9. Runtime failures classified too coarsely

**Risk:** Strategy violations, system failures, and compatibility failures become indistinguishable in replay and Match status.
**Warning signs:** All failures become `THROWN_EXCEPTION`; timeouts, malformed IPC, subprocess exit, and validation failures share one message.
**Prevention:** Expand failure taxonomy while preserving public/private privacy boundaries.
**Phase mapping:** Runtime isolation and debugging UX phases.

### 10. Pulling ranked ladder into the trust milestone

**Risk:** Competitive surface area appears before replay/runtime foundations can defend it.
**Warning signs:** Ranking/scoring requirements appear before strict Chronicle and runtime isolation completion.
**Prevention:** Keep ladders explicitly out of scope for v1.1.
**Phase mapping:** Milestone scope guard.

## Sources

- Node `vm` docs: https://nodejs.org/api/vm.html
- Node `worker_threads` docs: https://nodejs.org/api/worker_threads.html
- Node Permission Model docs: https://nodejs.org/api/permissions.html
- Docker resource constraints: https://docs.docker.com/engine/containers/resource_constraints/
- Playwright screenshot assertions: https://playwright.dev/docs/api/class-pageassertions
- `.planning/RETROSPECTIVE.md`
- `.planning/STATE.md`
