# Phase 112: Python Submission Validation and Diagnostics - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 112 adds submission-time validation for Python Strategy source in an explicitly experimental Workshop path. Validation may parse, compile, inspect AST/package declarations, check required Strategy functions, enforce source-size and capability policy, and return public-safe diagnostics. It must not execute Strategy logic in web/API/Go.

This phase does not implement full Python Match execution, counted eligibility, arbitrary packages, or production sandbox promotion.

</domain>

<decisions>
## Implementation Decisions

### Submission Semantics
- **D-01:** Invalid Python validation may produce a validation report, but submission stores only valid Strategy Revisions.
- **D-02:** Valid Python submissions produce immutable Strategy Revision artifacts with Python language/runtime metadata and non-counted experimental eligibility.
- **D-03:** Python validation must be explicit in the Workshop path; it must not silently reinterpret JS/TS source as Python or vice versa.

### Validation Depth
- **D-04:** Use parse/compile checks and AST denylist checks where practical.
- **D-05:** Reject forbidden imports/capabilities, unsupported package metadata, oversized source, missing required functions, and dynamic escape patterns where they can be detected safely.
- **D-06:** Do not execute Strategy functions during validation in web/API/Go.

### Diagnostics
- **D-07:** Diagnostics should include public-safe category, message, severity, and line/column where safe.
- **D-08:** Diagnostics must not echo Strategy source, stack traces, stderr, host paths, environment data, tokens, DB DSNs, package paths, or private runtime internals.
- **D-09:** Diagnostic wording should be useful enough for a Workshop user while still hostile-code safe.

### the agent's Discretion
The agent may choose whether validation runs in a dedicated validation helper inside the runtime package or in a runtime-service-adjacent module, provided no Strategy logic runs in Go/web/API and diagnostics remain redacted.

</decisions>

<specifics>
## Specific Ideas

The user accepted the recommended path: store only valid revisions, use parse/compile/AST validation, and return safe line/column hints when possible.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - PYVAL requirements.
- `.planning/ROADMAP.md` - Phase 112 scope and success criteria.
- `.planning/phases/110-broker-registry-baseline-and-contract-hardening/110-CONTEXT.md` - Broker boundary.
- `.planning/phases/111-strategy-artifact-language-metadata-and-eligibility/111-CONTEXT.md` - Artifact metadata and eligibility decisions.

### Source Specs And Non-Negotiables
- `AGENTS.md` - Hostile Strategy validation and no web/API/Go execution constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Runtime isolation architecture.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/runtime-js/src/strategy-runtime.ts`: Existing JS/TS validation and runtime behavior examples.
- `packages/runtime-python/src/python_runtime_host.py`: Existing experimental Python host seed.
- `packages/runtime-python/src/python-subprocess-adapter.ts`: Existing subprocess adapter seed.
- `packages/persistence/src/workshop.ts`: Workshop validation and revision creation.
- `apps/web/app/api/workshop/validate/route.ts`: Workshop validation API.
- `apps/web/app/api/workshop/revisions/route.ts`: Workshop submission API.

### Established Patterns
- Validation responses should be public-safe and source-free by default.
- Runtime/package authority needs a manifest-like policy rather than ad hoc exceptions.
- Existing JS/TS revision submission should remain unaffected.

### Integration Points
- Phase 113 will execute only artifacts that pass this metadata/validation contract.
- Phase 115 will expose the starter Strategy through the Workshop path.

</code_context>

<deferred>
## Deferred Ideas

- Executing Python in validation.
- Installing or resolving packages.
- Rich Python IDE/language-server support.
- Persisting invalid revisions as playable artifacts.

</deferred>

---

*Phase: 112-python-submission-validation-and-diagnostics*
*Context gathered: 2026-05-25*
