# Phase 116: Topology, Monitors, Privacy, and Promotion Gate - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 116 is the final v1.17 gate. It proves Python is runtime-only and non-counted by running topology checks, boundary monitors, registry/ABI drift checks, privacy checks, page smoke, replay evidence checks, and milestone audit/promotion artifacts. It also completes archive requirements when the milestone is done.

This phase does not promote Python to counted/ranked play or production sandbox status.

</domain>

<decisions>
## Implementation Decisions

### Final Gate Strictness
- **D-01:** Final live verification is required; static artifacts alone are insufficient.
- **D-02:** Monitors must fail on runtime ABI drift, runtime registry drift, broker contract drift, stale generated artifacts, Go client drift, and runtime service authority creep.
- **D-03:** Monitors must fail if Python executes outside the runtime-service boundary or if web/API/Go imports, evaluates, transpiles, or executes Python Strategy source.

### Boundary And Privacy
- **D-04:** Monitors must fail on Python backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, Match completion, Chronicle persistence, MatchSet scoring, public evidence delivery, or silent fallback.
- **D-05:** Public-output checks must fail on Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, raw private Awareness Grid, stderr, stack, host path, token, DB DSN, package path, or private runtime leak.
- **D-06:** Tests must prove Python cannot claim counted/ranked/ladder eligibility before explicit future promotion.

### Promotion Decision
- **D-07:** Promotion wording should be "experimental runtime path".
- **D-08:** The final decision must state Python remains non-counted, runtime-only, and behind the broker/runtime boundary.
- **D-09:** v1.17 completion archives requirements/roadmap/phases, removes active `.planning/REQUIREMENTS.md`, updates PROJECT/STATE/MILESTONES/RETROSPECTIVE, and tags `v1.17`.

### the agent's Discretion
The agent may choose exact monitor filenames and evidence artifact names, provided they are deterministic, reviewable, and tied to runnable commands.

</decisions>

<specifics>
## Specific Ideas

The user confirmed that all boundary drift checks are non-negotiable and that the final promotion language should say Python is an "experimental runtime path", not a promoted product/backend language.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - GATE and EXIT requirements.
- `.planning/ROADMAP.md` - Phase 116 scope and success criteria.
- `.planning/phases/110-broker-registry-baseline-and-contract-hardening/110-CONTEXT.md` - Broker and registry contract.
- `.planning/phases/111-strategy-artifact-language-metadata-and-eligibility/111-CONTEXT.md` - Artifact and eligibility contract.
- `.planning/phases/112-python-submission-validation-and-diagnostics/112-CONTEXT.md` - Validation privacy.
- `.planning/phases/113-python-runtime-execution-behind-broker-abi/113-CONTEXT.md` - Execution boundary.
- `.planning/phases/114-go-orchestration-and-non-counted-eligibility/114-CONTEXT.md` - Non-counted eligibility.
- `.planning/phases/115-python-starter-strategy-and-replay-proof/115-CONTEXT.md` - User-facing proof.

### v1.16 Baseline
- `.planning/milestones/v1.16-MILESTONE-AUDIT.md` - Prior milestone audit.
- `.planning/artifacts/v1.16-runtime-service-boundary.json` - Runtime boundary baseline.
- `.planning/artifacts/v1.16-no-typescript-backend-topology.json` - Topology baseline.
- `.planning/artifacts/v1.16-final-typescript-surface-labels.json` - TypeScript role baseline.
- `.planning/artifacts/v1.16-promotion-decision.md` - Previous promotion/defer decision.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-boundary-monitors.ts`: Boundary/privacy/ownership monitor entry point.
- `scripts/check-local-topology.ts`: Topology and page-smoke checks.
- Existing package test scripts in `package.json`.
- v1.16 planning artifacts and monitor evidence as a baseline.

### Established Patterns
- Final milestone artifacts should include JSON evidence plus markdown explanations.
- Completion should archive milestone requirements, roadmap, phase artifacts, audit, and promotion decision.
- Active `.planning/REQUIREMENTS.md` should be removed only when the milestone is complete and archived.

### Integration Points
- This phase consumes all previous phase outputs and should be the final gate before `v1.17` tag.
- Audit-fix should run until no remaining findings are present.

</code_context>

<deferred>
## Deferred Ideas

- Promoting Python to counted/ranked play.
- Production sandbox promotion.
- WASM/WASI/component-model promotion.
- Broad language marketplace support.

</deferred>

---

*Phase: 116-topology-monitors-privacy-and-promotion-gate*
*Context gathered: 2026-05-25*
