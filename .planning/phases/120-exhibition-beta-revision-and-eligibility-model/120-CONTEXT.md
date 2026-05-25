# Phase 120: Exhibition Beta Revision and Eligibility Model - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 120 makes Python representable as account-owned immutable Strategy Revisions for non-counted exhibition beta use, while preserving JS/TS counted eligibility and public privacy.

</domain>

<decisions>
## Implementation Decisions

### Revision Model
- **D-01:** Python should use normal account-owned immutable Strategy Revision semantics where practical.
- **D-02:** Python revisions must carry language/runtime/adapter/package/validation/artifact hash metadata.
- **D-03:** Python compatibility keys must include behavior-significant runtime/package/validation metadata.

### Eligibility
- **D-04:** Python is eligible for non-counted exhibition beta only.
- **D-05:** Python must be rejected from ranked ladder, counted MatchSet, counted gauntlet, and broad production multi-language gates.
- **D-06:** Existing JS/TS counted eligibility must remain intact.

### Labels And Privacy
- **D-07:** User-facing labels should say "non-counted exhibition beta."
- **D-08:** Public summaries may show safe language/runtime labels, but not source, StrategyMemory, SoldierMemory, objective payloads, stderr, stack, host/package paths, tokens, DB DSNs, or private runtime internals.

### the agent's Discretion
The agent may decide exact UI copy variants as long as "non-counted" and "exhibition beta" remain clear.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Revision And Eligibility
- `.planning/REQUIREMENTS.md` - BETA requirements.
- `.planning/ROADMAP.md` - Phase 120 scope and success criteria.
- `packages/spec/src/runtime.ts` - Runtime metadata, product semantics, and eligibility helpers.
- `packages/spec/src/types.ts` - Strategy Revision types and language/source format fields.
- `packages/runtime-python/src/validation.ts` - Python revision construction and validation reports.
- `apps/web/app/account/page.tsx` - Account revision display surface.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` - Exhibition selection and counted/non-counted UI.
- `.planning/milestones/v1.17-phases/111-strategy-artifact-language-metadata-and-eligibility/111-CONTEXT.md` - Artifact metadata decisions.
- `.planning/milestones/v1.17-phases/114-go-orchestration-and-non-counted-eligibility/114-CONTEXT.md` - Non-counted eligibility decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.17 already added Python runtime metadata and non-counted semantics.
- Existing Strategy Revision and runtime compatibility key schemas should remain canonical.
- Existing exhibition counted/unranked controls should be reused for non-counted beta eligibility.

### Established Patterns
- Public summaries may expose safe runtime labels but not owner-private Strategy data.
- JS/TS counted behavior is a regression boundary.

### Integration Points
- Phase 121 uses these saved revisions for the signed-in proof.
- Phase 122 enforces eligibility and privacy with monitors.

</code_context>

<specifics>
## Specific Ideas

v1.18 should strengthen persistence/account ownership and product labels rather than inventing a separate Python artifact model.

</specifics>

<deferred>
## Deferred Ideas

- Separate Python marketplace/library model.
- Broad multi-language docs and tutorials.
- Ranked Python eligibility.

</deferred>

---

*Phase: 120-exhibition-beta-revision-and-eligibility-model*
*Context gathered: 2026-05-25*
