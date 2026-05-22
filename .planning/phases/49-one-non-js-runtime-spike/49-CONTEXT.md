# Phase 49: One Non-JS Runtime Spike - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 49 adds one deliberately small experimental non-JS runtime spike through the Phase 46 ABI. It should prove the ABI can support a non-JS language without turning Python into a production-supported Strategy language, widening Workshop scope, or weakening hostile-code boundaries.

</domain>

<decisions>
## Implementation Decisions

### Spike Language
- **D-01:** Use Python as the one non-JS runtime spike.
- **D-02:** Python is chosen for likely player reach, approachable Strategy authoring, and proving the ABI is genuinely language-neutral.
- **D-03:** Go is not the runtime spike language in Phase 49 because Phase 50 already covers Go as backend/service proof, and compiled Strategy workflow is less aligned with quick programmable-strategy iteration.
- **D-04:** Rust and other languages are out of scope for this spike.

### Execution Model
- **D-05:** Use a plain subprocess/dev-test execution path first. Do not claim production container or hostile-code isolation.
- **D-06:** The Python adapter must use the Phase 46 ABI envelope and Phase 48 registry metadata.
- **D-07:** No package installation, dependency resolution, network access, filesystem access beyond the controlled source/harness path, inherited environment, shell execution, database access, system time, randomness, or live model inference.
- **D-08:** Package metadata may exist in the ABI, but Python package execution remains disabled by v1.7 policy.

### Python Strategy API Shape
- **D-09:** The Python spike should mirror the Strategy concepts with simple functions such as `select_activations(input)` and `soldier_brain(input)` in a source file/module.
- **D-10:** The Python harness should translate between snake_case Python function names and canonical ABI method names without changing game terminology in DTOs.
- **D-11:** Python Strategy inputs and outputs must be JSON-only and schema-validated against the same ABI/game schemas used by JS/TS.

### Test And Visibility Boundaries
- **D-12:** Python adapter use is tests/dev only in v1.7.
- **D-13:** Python experimental results must not become public counted MatchSet, ladder, analytics, or gauntlet evidence by default.
- **D-14:** Do not add a normal Workshop language selector or public user-facing Python submission path in Phase 49.
- **D-15:** Fixture tests must cover valid output, invalid output, timeout, thrown exception, stdout/stderr cap, metadata, and public-safe failure projection.
- **D-16:** Python runtime failures follow the Phase 46 split: Strategy-accountable runtime violations versus host/infrastructure system failures.

### Carried Forward From Earlier Phases
- **D-17:** Experimental adapters are registry-visible but disabled for normal play.
- **D-18:** Experimental adapter results are dev/test only, not public counted results.
- **D-19:** Behavior-significant versions and limits fail closed; no compatibility ranges.
- **D-20:** Public failure output is a safe summary only; private diagnostics must not leak into public replay, MatchSet, analytics, or export DTOs.

### the agent's Discretion
- The planner may choose exact Python harness file layout and adapter package location.
- The planner may decide whether the Python subprocess reads a source file path or inline source payload, provided it preserves ABI metadata and avoids shell/env hazards.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — v1.7 runtime and backend stabilization goal.
- `.planning/REQUIREMENTS.md` — Phase 49 requirements `SPIKE-01` through `SPIKE-04`.
- `.planning/ROADMAP.md` — Phase 49 goal, success criteria, canonical refs, and sequencing after ABI/registry/golden fixtures.
- `.planning/research/SUMMARY.md` — Non-JS runtime spike recommendation and constraints.
- `.planning/research/STACK.md` — Python subprocess research and no-shell guidance.
- `.planning/research/PITFALLS.md` — Shell/environment hazards, false confidence, and sandbox caveats.
- `.planning/phases/46-strategy-runtime-abi/46-CONTEXT.md` — ABI envelope, metadata, version, failure, and privacy decisions.
- `.planning/phases/47-golden-parity-harness/47-CONTEXT.md` — Golden fixture/test expectations for runtime success/failure.
- `.planning/phases/48-runtime-adapter-registry/48-CONTEXT.md` — Experimental adapter registry and compatibility policy.

### Runtime Code
- `packages/runtime-js/src/subprocess-adapter.ts` — Current subprocess execution, timeout, stdio cap, shell-disabled behavior, and system failure mapping.
- `packages/runtime-js/src/subprocess-ipc.ts` — Current JSON IPC guards and failure codes.
- `packages/runtime-js/src/subprocess-harness.ts` — Current JS subprocess harness and capability-blocking model.
- `packages/runtime-js/src/adapter.ts` — Adapter metadata and runtime controls.
- `packages/runtime-js/src/subprocess-adapter.test.ts` — Existing subprocess tests for valid output, process settings, stdio caps, timeout, and failures.
- `packages/spec/src/schemas.ts` — ABI/game schemas and memory/source/objective limits.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Current subprocess adapter provides the host-side pattern for shell-disabled spawn, stdin/stdout JSON, timeout, and stdio cap handling.
- Current subprocess IPC code provides system failure categories that Python should mirror through the ABI.
- Golden fixtures from Phase 47 should give Python a tiny valid/failure fixture set.

### Established Patterns
- Runtime execution must be outside web/API process.
- Runtime adapters should be explicit about readiness and isolation boundary.
- Experimental adapters do not imply production hostile-code isolation.
- Public outputs must never expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, or private runtime internals.

### Integration Points
- Python adapter metadata should register through Phase 48 registry records as experimental.
- Python execution should be validated by Phase 46 ABI schemas.
- Tests should live near the runtime adapter package or golden fixtures, but must consume committed golden artifacts where practical.

</code_context>

<specifics>
## Specific Ideas

- Python function names should be Pythonic (`select_activations`, `soldier_brain`) while ABI method names remain canonical (`selectActivations`, `soldierBrain`).
- Keep the first Python Strategy sample tiny and deterministic.
- The spike should prove shape and failure behavior, not performance, package management, or production isolation.

</specifics>

<deferred>
## Deferred Ideas

- Production-supported Python Strategy submission is deferred.
- Workshop language selection is deferred.
- Python package dependency support is deferred.
- Container/microVM/WASM production sandboxing is deferred.
- Public non-counted experimental runtime displays are deferred.

</deferred>

---

*Phase: 49-One Non-JS Runtime Spike*
*Context gathered: 2026-05-22*
