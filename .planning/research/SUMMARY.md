# Research Summary

**Project:** Coward's Game
**Date:** 2026-05-18
**Milestone context:** v1.1 Trustworthy Simulation Beta

## Key Findings

**Stack:** Keep the TypeScript monorepo and current package boundaries. Add strict Chronicle grammar, engine-generated replay fixtures, targeted Playwright screenshot checks, runtime adapter hardening, and shared local/CI preflight tooling. Do not introduce a new app framework or ranked infrastructure.

**Runtime:** The current `worker_threads` runtime is useful prototype isolation, especially with V8 `resourceLimits`, but it is not the final hostile-code boundary. Node docs explicitly reject `node:vm` for untrusted code, and Node's Permission Model is defense-in-depth rather than a malicious-code sandbox. v1.1 should add an adapter boundary and subprocess/container/WASM direction with concrete tests.

**Replay:** Zod event schemas validate shape, not truth. v1.1 should add semantic Chronicle grammar: allowed event sequences, required event context and payloads, snapshot boundaries, privacy constraints, and version compatibility behavior. Invalid Chronicles should fail before rendering.

**UX:** Debugging should explain doctrine outcomes without moving rules into React. Owner-only replay overlays can answer "why did this Soldier do nothing?" if the explanation is generated from replay/engine data and privacy projection is tested.

**Reliability:** Docker and no-Docker local development both exist but need shared preflight and clearer service-backed E2E. CI should verify edit -> submit -> execute -> replay and focused visual replay regressions.

## Prescriptive Direction

1. Start v1.1 with engine-generated replay scenarios and visual regression checks, because they create the legal demo corpus used by later grammar and UX work.
2. Build strict Chronicle grammar in `packages/replay`, layered after Zod schema parsing and before replay rendering.
3. Add runtime execution adapter hardening in `packages/runtime-js`; treat Worker execution as a compatibility adapter and add subprocess/container/WASM guidance plus hostile-code tests.
4. Improve Workshop/replay debugging only after replay data has stronger legal/grammar guarantees.
5. End with local/CI reliability so the whole trust loop is repeatable in Docker, no-Docker, and service-backed CI paths.

## Requirements Implications

Recommended v1.1 requirement categories:

- Replay Fidelity
- Chronicle Grammar
- Runtime Isolation
- Doctrine Debugging
- Local/CI Reliability

## Roadmap Implications

Recommended phase continuation after v1.0 Phase 7:

1. **Phase 8: Replay Fixture Fidelity and Visual Regression**
   Engine-generated legal scenario fixtures plus screenshot checks.
2. **Phase 9: Strict Chronicle Grammar and Compatibility**
   Exhaustive event grammar, snapshot validation, privacy checks, and explicit failure states.
3. **Phase 10: Runtime Isolation Hardening**
   Runtime adapter boundary, subprocess/container/WASM spike or implementation, hostile-code tests, failure taxonomy.
4. **Phase 11: Doctrine Debugging UX**
   Better validation messages, sample strategies, replay links, runtime explanations, owner-only debug overlays.
5. **Phase 12: Local and CI Reliability**
   Docker/no-Docker parity, service preflight, broader service-backed edit -> submit -> execute -> replay E2E.

## Watch Out For

- Rendering parsed-but-impossible Chronicles.
- Calling Worker threads or Node permissions a sandbox.
- Letting helpful debug overlays leak private Strategy data.
- Writing rule explanations in React instead of replay/engine-derived DTOs.
- Letting screenshot tests become broad and flaky.
- Pulling ranked ladders into v1.1 before trust foundations are sharp.

## Sources

- `.planning/research/STACK.md`
- `.planning/research/FEATURES.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
