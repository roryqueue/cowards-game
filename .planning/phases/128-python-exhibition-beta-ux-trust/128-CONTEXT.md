# Phase 128: Python Exhibition Beta UX Trust - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 128 improves user-facing Python exhibition beta trust. It clarifies Python creation, labels, validation messages, sample Strategies, and eligibility explanations while preserving JS/TS authoring, validation, counted eligibility, and exhibition behavior.

</domain>

<decisions>
## Implementation Decisions

### Labels And Eligibility
- **D-01:** Use compact persistent labels, not modal warnings: `Python · non-counted exhibition beta`.
- **D-02:** The label should appear anywhere Python Strategy creation, selection, validation, MatchSet creation, result, or replay evidence appears.
- **D-03:** Explain that Python is eligible for non-counted exhibition beta but not ranked, ladder, counted, or gauntlet evidence.

### Validation And Samples
- **D-04:** Improve validation copy to be actionable and public-safe for imports, packages, dynamic execution, filesystem/network/process/env access, source size, syntax/compile failures, and missing Strategy API functions.
- **D-05:** Add 2-3 credible safe Python sample Strategies using only Strategy input data.
- **D-06:** Samples must feel tactically plausible, not merely toy syntax examples.

### Boundaries
- **D-07:** Preserve JS/TS authoring, validation, counted eligibility, and exhibition behavior unchanged.
- **D-08:** Do not add package installs or broad language marketplace semantics.

### the agent's Discretion
The agent may choose the exact sample Strategy names and tactics, provided they are safe, credible, validated, and useful in signed-in proof flows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### User-Facing Python Beta Surfaces
- `apps/web/app/exhibitions/new/exhibition-client.tsx` - Exhibition selection labels and counted/unranked controls.
- `apps/web/app/account/page.tsx` - Account revision summaries and source/metadata cues.
- `apps/web/app/workshop/workshop-client.tsx` - Workshop authoring and validation UX.
- `packages/runtime-python/src/validation.ts` - Python validation issue mapping and warnings.
- `packages/runtime-python/src/python_validation_host.py` - Python AST/compile validation behavior.
- `apps/go-backend/main_test.go` - Python metadata, validation, and eligibility tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `runtimeDisplayLabel` already shows Python non-counted exhibition beta in exhibition selection.
- Python validation warnings already include `NON_COUNTED_RUNTIME`.
- Go backend tests already assert Python metadata remains non-counted exhibition beta.

### Established Patterns
- Product labels should be concise and repeated where trust matters.
- Validation diagnostics must not expose source, host paths, package paths, stacks, stderr, env, tokens, or DB DSNs.
- Python remains self-contained-source-only.

### Integration Points
- Phase 129 should reuse label wording in result/replay evidence panels.
- Phase 130 should use the credible safe sample set in the signed-in proof where practical.

</code_context>

<specifics>
## Specific Ideas

The UI tone should be calm and persistent rather than alarmist: small labels, concise helper text, and clear reasons when Python is excluded from counted play.

</specifics>

<deferred>
## Deferred Ideas

- Python package/dependency UI.
- Python ranked/counted enablement.
- Broad language picker or language marketplace.
- Large warning-heavy redesign.

</deferred>

---

*Phase: 128-python-exhibition-beta-ux-trust*
*Context gathered: 2026-05-25*
