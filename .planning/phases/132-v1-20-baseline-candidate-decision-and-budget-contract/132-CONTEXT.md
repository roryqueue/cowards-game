# Phase 132: v1.20 Baseline, Candidate Decision, and Budget Contract - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 132 locks the v1.20 baseline before any runtime candidate or reliability implementation begins. It treats v1.19 as the floor for topology, eligibility, privacy, no-fallback behavior, and evidence wording, then records the Docker/container subprocess candidate decision and a layered timeout/reliability budget contract.

</domain>

<decisions>
## Implementation Decisions

### Baseline
- **D-01:** v1.19 remains the minimum contract: normal topology is web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s).
- **D-02:** Strategy code must not execute in web/API/Go, and Go continues to own orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, and promotion decisions.
- **D-03:** JS/TS remains intact as the counted Strategy path; Python remains non-counted exhibition beta only.
- **D-04:** Public MatchSet/replay outputs must remain private-data safe and avoid Strategy source, memory, objectives, env values, host paths, package paths, stderr, stack traces, sessions, tokens, DB DSNs, and private runtime internals.

### Candidate Decision
- **D-05:** Docker/runc container subprocess is the primary stronger sandbox candidate lane for v1.20 because Docker is locally available and the repo already has a `container-subprocess` adapter.
- **D-06:** The Docker lane is required when available; if Docker, the image, controls, adapter, or evidence fail, the lane must fail loudly or record non-promotion evidence.
- **D-07:** Do not download or install `runsc` during proof. gVisor/runsc remains a host-runtime preflight that fails loudly when `runsc` is not installed as a host Docker runtime.
- **D-08:** No production sandbox certification is claimed unless executable evidence genuinely supports it.

### Timeout And Reliability Budgets
- **D-09:** Define separate named budgets for Strategy call, whole Match execution, MatchSet/job orchestration, runtime-service HTTP, and browser proof.
- **D-10:** Preserve deterministic per-Strategy execution caps. v1.20 may tune outer budgets and proof timeouts, but must not loosen per-call caps to hide latency.
- **D-11:** Latency evidence should distinguish JS/TS-vs-Python and Python-vs-Python exhibitions, with bounded repeat counts and no unbounded stress tests.

### the agent's Discretion
The agent may choose exact artifact filenames and schema field names, but they must be v1.20-specific, monitor-readable, human-readable where useful, and preserved alongside archived v1.19 artifacts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Baseline
- `.planning/PROJECT.md` - Active project and milestone contract.
- `.planning/REQUIREMENTS.md` - v1.20 requirement ids and constraints.
- `.planning/ROADMAP.md` - Phase 132 scope and downstream dependencies.
- `.planning/STATE.md` - Active milestone state and v1.19 baseline.
- `.planning/research/v1.20-SUMMARY.md` - v1.20 research and selected candidate direction.
- `AGENTS.md` - Runtime, engine, privacy, and workflow non-negotiables.

### v1.19 Baseline Evidence
- `.planning/milestones/v1.19-ROADMAP.md` - Archived prior milestone roadmap.
- `.planning/milestones/v1.19-REQUIREMENTS.md` - Archived prior milestone requirements.
- `.planning/artifacts/v1.19-runtime-isolation-readiness.json` - Prior runtime readiness evidence.
- `.planning/artifacts/v1.19-runtime-isolation-readiness.md` - Prior human-readable readiness evidence.
- `.planning/artifacts/v1.19-exhibition-beta-proof.json` - Prior signed-in proof evidence.
- `.planning/artifacts/v1.19-promotion-decision.md` - Prior promotion stance.

### Runtime Candidate Code
- `packages/runtime-js/src/sandbox-evaluation.ts` - Candidate taxonomy and evaluation model.
- `scripts/evaluate-runtime-sandbox.ts` - Sandbox evaluation artifact writer/checker.
- `packages/runtime-js/src/container-subprocess-adapter.ts` - Docker adapter implementation.
- `packages/runtime-js/src/container-subprocess-adapter.test.ts` - Existing container control tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` already exposes `sandbox:evaluate`, `sandbox:evaluate:container`, `sandbox:evaluate:runsc`, and `sandbox:evaluate:check`.
- The current sandbox evaluation still uses v1.19 schema names and artifact wording.
- Docker/runc is available locally; `runsc` is not on PATH and is not an installed host Docker runtime.

### Integration Points
- Phase 133 consumes the candidate decision and artifact naming.
- Phase 135 consumes the timeout budget contract.
- Phase 139 consumes the baseline and promotion wording.

</code_context>

<specifics>
## Specific Ideas

The central Phase 132 output should be a small, boring baseline package: what v1.20 inherits from v1.19, what stronger candidate is selected, what `runsc` absence means, and which timeout layers future phases may adjust.

</specifics>

<deferred>
## Deferred Ideas

- Production hostile-code sandbox certification.
- Python ranked, ladder, counted, gauntlet, or broad production multi-language support.
- Arbitrary PyPI/package install support.
- Host-side `runsc` installation automation.
- Cloud/Kubernetes/service-mesh runtime deployment.

</deferred>

---

*Phase: 132-v1-20-baseline-candidate-decision-and-budget-contract*
*Context gathered: 2026-05-25*
