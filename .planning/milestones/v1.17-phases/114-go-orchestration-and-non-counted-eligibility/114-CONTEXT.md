# Phase 114: Go Orchestration and Non-Counted Eligibility - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 114 proves Go can orchestrate Matches with registered Python runtime metadata through the runtime-service envelope while keeping Python out of counted/ranked gates. Users should be able to create a non-counted Workshop or normal unranked exhibition-style MatchSet with a valid Python Strategy Revision.

This phase does not add ranked/ladder counted Python play, Go execution of Python, TypeScript backend fallback, or runtime-service bypasses.

</domain>

<decisions>
## Implementation Decisions

### Go Runtime-Service Contract
- **D-01:** Go accepts Python runtime metadata only when it matches the registered broker/runtime ABI contract exactly.
- **D-02:** Go must invoke runtime execution only through schema-validated runtime-service envelopes.
- **D-03:** Stopped Python runtime, stopped runtime service, registry mismatch, unsupported artifact, or ABI drift must fail closed without JS/TS fallback, TypeScript backend fallback, or Go execution.

### Eligibility Policy
- **D-04:** Python is allowed in Workshop and normal unranked exhibition-style MatchSet creation only when the result is explicitly non-counted/experimental.
- **D-05:** Python remains rejected for ranked ladder, counted MatchSet, counted gauntlet, normal counted eligibility, and any path that affects official standings.
- **D-06:** Existing JS/TS counted eligibility remains unchanged.

### User-Facing Classification
- **D-07:** Public classification should call Python results non-counted and experimental without changing existing JS/TS evidence semantics.
- **D-08:** Prefer a normal unranked option over a hidden developer-only proof route for the exhibition visibility decision.

### the agent's Discretion
The agent may choose exact names for eligibility flags and UI labels, provided the counted/non-counted distinction is unambiguous and monitored.

</decisions>

<specifics>
## Specific Ideas

The user explicitly chose the "Normal unranked option" for exhibition visibility, rather than a hidden/dev-only proof flow, while still requiring Python to remain non-counted.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - GO requirements.
- `.planning/ROADMAP.md` - Phase 114 scope and success criteria.
- `.planning/phases/110-broker-registry-baseline-and-contract-hardening/110-CONTEXT.md` - Registry fail-closed decisions.
- `.planning/phases/111-strategy-artifact-language-metadata-and-eligibility/111-CONTEXT.md` - Artifact eligibility metadata.
- `.planning/phases/113-python-runtime-execution-behind-broker-abi/113-CONTEXT.md` - Python runtime execution path.

### v1.16 Boundary
- `.planning/artifacts/v1.16-selected-go-route-manifest.json` - Go route ownership baseline.
- `.planning/artifacts/v1.16-no-typescript-backend-topology.json` - Topology baseline.
- `.planning/artifacts/v1.16-final-typescript-surface-labels.json` - TypeScript role baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/go-backend/runtime_service_client.go`: Runtime-service client validation.
- `apps/go-backend/**`: Go MatchSet orchestration and route ownership.
- `packages/persistence/src/competition.ts`: MatchSet creation and eligibility handling.
- `apps/web/app/exhibitions/new/exhibition-client.tsx`: Exhibition creation client and current eligible revision filtering.
- `apps/web/app/api/exhibitions/**`: Exhibition API surfaces.

### Established Patterns
- Go owns Match lifecycle, orchestration, persistence handoff, scoring/status refresh, and public evidence paths.
- Runtime service owns only Strategy execution.
- Eligibility checks must be explicit and fail closed.

### Integration Points
- Phase 115 will use the normal unranked exhibition path for the Python starter proof.
- Phase 116 will add monitors that prevent Python counted/ranked promotion.

</code_context>

<deferred>
## Deferred Ideas

- Hidden developer-only proof route.
- Python ranked/ladder counted promotion.
- Python official gauntlet support.
- Python owning any backend or persistence responsibility.

</deferred>

---

*Phase: 114-go-orchestration-and-non-counted-eligibility*
*Context gathered: 2026-05-25*
