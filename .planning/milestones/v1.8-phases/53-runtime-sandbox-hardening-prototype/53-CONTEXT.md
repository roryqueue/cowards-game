# Phase 53: Runtime Sandbox Hardening Prototype - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 53 creates an evaluation harness for hostile Strategy sandbox candidates through the existing runtime ABI. It must not change counted Match defaults, worker runtime config defaults, Strategy Revision eligibility, orchestration, or public product semantics. The result is evidence and a decision matrix, not a production promotion.

</domain>

<decisions>
## Implementation Decisions

### Harness Shape
- **D-01:** Add a separate sandbox evaluation command, not a Match/worker execution path.
- **D-02:** Evaluate the current executable candidates: worker-thread baseline, host subprocess, and container subprocess where Docker/image availability permits.
- **D-03:** Record Python subprocess as experimental ABI evidence only; do not make it counted-play eligible.
- **D-04:** Keep Deno-style permissions, WASM/WASI, gVisor, and microVM as documented tradeoff rows unless local tools already exist and a tiny probe can run without widening the phase.
- **D-05:** Report both executable adapter ids (`worker-thread`, `subprocess`, `container-subprocess`) and spec registry ids (`runtime-js-*`) so runtime config selectors do not blur with ABI metadata.

### Safety and Taxonomy
- **D-06:** Reuse the existing StrategyExecutionAdapter boundary, hostile probes, source validation posture, timeout/output caps, and runtime violation vs system failure taxonomy.
- **D-07:** Public evaluation output must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, stderr, stack traces, host paths, environment values, and private runtime internals.
- **D-08:** The harness should fail its tests if it is imported by web/API, persistence, worker runtime config, or counted execution paths.
- **D-09:** Worker-thread remains a local/dev fallback and must be labeled as not production hostile-code isolation.
- **D-10:** No candidate is promoted to production hostile-code isolation or counted-play eligibility by default.

</decisions>

<research_summary>
## Research Findings

- Existing JS worker-thread, host subprocess, and container subprocess adapters already implement the right executable boundary shape under `@cowards/runtime-js`.
- The hostile matrix already covers time/random/global capability probes, filesystem/network/process/Worker access, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions for worker-thread and host subprocess.
- Container subprocess has strong argv/isolation tests but currently fake-spawn tests rather than a real hostile-matrix run in Docker.
- Python subprocess uses the v1.7 ABI and `env: {}` but is intentionally experimental and not counted.
- Local tool availability favors worker-thread and host subprocess always, container subprocess when Docker and the image are present, and tradeoff-only rows for Deno, WASM/WASI, gVisor, and microVM in this phase.
- Official docs reinforce the tradeoffs: Deno recommends layering OS sandboxing or VM/microVM isolation for untrusted code; gVisor integrates via `runsc`/containerd runtime configuration; Firecracker jailer/cgroups are operationally heavier; Wasmtime resource limiting requires host integration and does not cover every host allocation by itself.

</research_summary>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` — Phase 53 goal and success criteria.
- `.planning/REQUIREMENTS.md` — SBX-01 through SBX-06.
- `.planning/STATE.md` — Current milestone position and Phase 52 learning about trusted verifier artifacts.
- `AGENTS.md` — non-negotiables for hostile Strategy code, Node `vm`, runtime validation, and deterministic engine purity.
- `packages/spec/src/runtime.ts` — runtime ABI, adapter registry, failure codes, limits, counted eligibility metadata.
- `packages/runtime-js/src/adapter.ts` — executable StrategyExecutionAdapter metadata and contract.
- `packages/runtime-js/src/executor.ts` — live runtime creation and default worker-thread adapter.
- `packages/runtime-js/src/hostile-matrix.test.ts` — existing hostile probe corpus.
- `packages/runtime-js/src/subprocess-adapter.ts` and `container-subprocess-adapter.ts` — executable subprocess boundaries.
- `packages/runtime-python/src/python-subprocess-adapter.ts` — experimental non-JS ABI spike.
- `apps/worker/src/runtime-config.ts` — counted worker adapter selector and default.

</canonical_refs>

<plan_guidance>
## Recommended Plan

Create one executable plan:

1. Extract or recreate a small shared sandbox evaluation probe set that can run through `StrategyExecutionAdapter`.
2. Add `scripts/evaluate-runtime-sandbox.ts` plus a root `sandbox:evaluate` script that emits deterministic JSON/Markdown evidence under a generated artifact path or stdout.
3. Add tests proving the harness covers candidate metadata, hostile probes, public-safe output, no-promotion wording, and non-import into counted/web paths.
4. Document the candidate matrix and unresolved production risks in Phase 53 artifacts.

</plan_guidance>

<deferred>
## Deferred

- Production hostile-code sandbox promotion.
- Node `vm`/`vm2` security-boundary work.
- Counted non-JS play.
- Package/dependency installation policies.
- Full Deno/WASI/gVisor/microVM implementation.
- Any change to Match orchestration, worker defaults, or Strategy Revision counted eligibility.

</deferred>

---

*Phase: 53-Runtime Sandbox Hardening Prototype*
*Context gathered: 2026-05-22*
