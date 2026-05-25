# Phase 119: Python Validation and Public-Safe Diagnostics - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 119 upgrades Python validation from v1.17's conservative static proof toward real AST/compile validation where practical, while keeping validation non-executing and public-safe.

</domain>

<decisions>
## Implementation Decisions

### Validation Mechanism
- **D-01:** Use a Python AST/compile host for parse/compile checks where practical.
- **D-02:** Validation must not call `select_activations`, `soldier_brain`, or any Strategy behavior.
- **D-03:** Keep package policy self-contained: no arbitrary PyPI, declared dependencies, native extensions, dynamic package resolution, filesystem, or network.

### Diagnostics
- **D-04:** Diagnostics should identify issue category and safe location/remediation, not echo source or raw traceback.
- **D-05:** Public validation output must omit source, memory, objectives, stderr, stack, host paths, package paths, environment, tokens, DB DSNs, and private runtime internals.
- **D-06:** Validation and runtime execution imports must remain separated so web/page validation does not import execution adapters.

### the agent's Discretion
The agent may choose exact validation code names and diagnostics codes if they map cleanly to existing Strategy Revision validation semantics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation And Privacy
- `.planning/REQUIREMENTS.md` - PYVAL requirements.
- `.planning/ROADMAP.md` - Phase 119 scope and success criteria.
- `packages/runtime-python/src/validation.ts` - Current Python validation behavior.
- `packages/runtime-python/src/python_runtime_host.py` - Existing Python runtime host.
- `packages/spec/src/runtime.ts` - Runtime metadata and validation code vocabulary.
- `packages/spec/src/public-output-privacy.ts` - Public-output deny-list.
- `.planning/milestones/v1.17-phases/112-python-submission-validation-and-diagnostics/112-CONTEXT.md` - v1.17 validation decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.17 validation already includes source size, required function, forbidden pattern, and source hash behavior.
- Existing validation report schemas should be reused rather than inventing a Python-only report shape.

### Established Patterns
- Validation import boundaries matter because v1.17 audit found runtime adapter code being pulled into Next page evaluation.
- Public diagnostics must be normalized and should not echo raw interpreter output.

### Integration Points
- Phase 120 consumes validation results for account-owned immutable Python revisions.
- Phase 122 should monitor validation privacy and import-boundary regressions.

</code_context>

<specifics>
## Specific Ideas

The AST/compile host is for syntax/shape validation only. Runtime execution remains exclusively behind the runtime-service/broker ABI.

</specifics>

<deferred>
## Deferred Ideas

- Running validation inside a full production sandbox.
- Auto-fixing user Python source.
- Package dependency support.

</deferred>

---

*Phase: 119-python-validation-and-public-safe-diagnostics*
*Context gathered: 2026-05-25*
