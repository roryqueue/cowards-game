# Phase 110: Broker Registry Baseline and Contract Hardening - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 110 establishes v1.17's baseline and makes the Strategy Execution Service / Runtime Broker contract concrete before Python runtime expansion begins. It must preserve the v1.16 backend-retirement floor: normal topology stays `web frontend -> Go backend -> isolated runtime service(s)`, JS/TS Strategy execution remains intact through the existing isolated runtime service, and Python is only an experimental runtime implementation behind the same language-neutral contract.

This phase does not implement the full Python runtime path, Workshop submission UX, or non-counted MatchSet proof. It creates the registry/interface baseline and enforcement shape that later phases consume.

</domain>

<decisions>
## Implementation Decisions

### Broker Shape
- **D-01:** Promote the Runtime Broker from naming to a concrete interface and registry contract inside the existing isolated Strategy Execution Service.
- **D-02:** Do not introduce a separate broker service for v1.17; the runtime service owns runtime selection while Go remains the Match orchestration owner.
- **D-03:** Broker selection must be language-neutral and schema-driven, not Python-specific branching scattered through Go, web/API, or persistence code.

### Runtime Registry Matching
- **D-04:** Use exact matching for runtime target, adapter id/version, ABI version, and package policy.
- **D-05:** Allow only explicit legacy JS/TS normalization where existing behavior already requires it; do not add silent fallback or fuzzy matching.
- **D-06:** Unknown language ids, unsupported adapters, stale registry entries, ABI drift, unavailable targets, and authority creep fail closed.

### v1.16 Baseline Preservation
- **D-07:** Treat v1.16 as the non-negotiable backend-retirement baseline; TypeScript remains allowed only for frontend and isolated runtime service/runtime adapter roles.
- **D-08:** Python must not become a backend, persistence owner, route owner, worker owner, Match completion owner, scoring owner, public evidence owner, or fallback path.
- **D-09:** JS/TS runtime support must remain intact through the existing isolated runtime service while the broker contract is hardened.

### the agent's Discretion
The agent may choose exact registry artifact field names, code module boundaries, and monitor implementation details, provided the source of truth is deterministic, schema-validated, reviewable, and consumable by later phases.

</decisions>

<specifics>
## Specific Ideas

The user confirmed that future similar decisions can generally inherit this default: exact registry matching, no separate broker service, no silent fallback, and broker behavior implemented inside the existing runtime-service boundary.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/PROJECT.md` - Current project and milestone state.
- `.planning/REQUIREMENTS.md` - v1.17 requirements, especially BASE and BROKER groups.
- `.planning/ROADMAP.md` - Phase 110 scope, dependencies, and success criteria.
- `.planning/STATE.md` - Current workflow state.
- `.planning/research/SUMMARY.md` - Research summary and recommended implementation direction.

### v1.16 Baseline
- `.planning/milestones/v1.16-ROADMAP.md` - Archived backend-retirement milestone scope.
- `.planning/milestones/v1.16-REQUIREMENTS.md` - Archived v1.16 boundary requirements.
- `.planning/milestones/v1.16-MILESTONE-AUDIT.md` - v1.16 completion evidence.
- `.planning/artifacts/v1.16-runtime-service-boundary.json` - Runtime service boundary evidence.
- `.planning/artifacts/v1.16-runtime-service-boundary.md` - Human-readable runtime boundary.
- `.planning/artifacts/v1.16-no-typescript-backend-topology.json` - Topology baseline.
- `.planning/artifacts/v1.16-final-typescript-surface-labels.json` - Final TypeScript surface labels.
- `.planning/artifacts/v1.16-promotion-decision.md` - v1.16 promotion decision.

### Source Specs And Non-Negotiables
- `AGENTS.md` - Determinism, hostile Strategy isolation, schema validation, and privacy constraints.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical game terminology and deterministic rules.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Architecture and runtime/backend separation constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/runtime.ts`: Existing runtime metadata and language registry seed.
- `packages/spec/src/runtime-execution-service.ts`: Existing runtime ABI envelope definitions and schemas.
- `apps/runtime-service/src/execute-match.ts`: Current isolated runtime-service Match execution entry point.
- `apps/go-backend/runtime_service_client.go`: Go runtime-service envelope validation and client behavior.
- `scripts/check-boundary-monitors.ts`: Existing boundary monitor pattern.
- `scripts/check-local-topology.ts`: Existing topology checker pattern.

### Established Patterns
- v1.16 artifacts use machine-readable JSON plus markdown explanations for monitor-readable and human-readable evidence.
- Runtime service code may execute Strategy runtime adapters; Go and web/API must not execute Strategy source.
- Existing monitor scripts are expected to fail on drift rather than merely document it.

### Integration Points
- Registry contract changes should connect spec metadata, runtime-service selection, Go validation expectations, and monitor artifacts.
- Later phases will consume the registry for Python artifact metadata, validation, runtime execution, eligibility, and promotion gates.

</code_context>

<deferred>
## Deferred Ideas

- Production sandbox promotion is out of scope.
- Arbitrary PyPI/package installs are out of scope.
- WASM/WASI/component-model runtime promotion is out of scope.
- Python ranked/ladder counted play is out of scope.

</deferred>

---

*Phase: 110-broker-registry-baseline-and-contract-hardening*
*Context gathered: 2026-05-25*
