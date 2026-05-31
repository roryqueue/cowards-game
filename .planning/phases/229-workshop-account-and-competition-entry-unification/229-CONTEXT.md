# Phase 229: Workshop, Account, and Competition Entry Unification - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 229 moves authoring, saved revision, and entry surfaces onto shared provider-derived language labels and eligibility. It focuses on Workshop, Account, competition entry, exhibition controls, Strategy cards, player pages, Watch/discovery reads, and competition pages.

</domain>

<decisions>
## Implementation Decisions

### Product Semantics
- **D-01:** Product surfaces must consume provider/registry labels and eligibility instead of locally branching on language ids.
- **D-02:** Counted/unranked controls should use shared counted eligibility so all four languages can enter counted paths once provider proof passes.
- **D-03:** Account and public reads must remain source-free by default.

### UI Scope
- **D-04:** Keep UI changes utilitarian and integrated into existing screens. This phase is not a marketing redesign.
- **D-05:** Tests must cover label and eligibility consistency across Workshop, Account, entry, Strategy cards, player pages, MatchSet results, replay, Learn/docs, and public discovery where relevant.

### The Agent's Discretion
- Choose whether to replace `runtime-labels.ts` outright or keep it as a thin wrapper over provider semantics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PROD-01..PROD-05`.
- `.planning/ROADMAP.md` - Phase 229 success criteria.
- `.planning/phases/223-unified-supported-language-registry-and-eligibility-model/223-CONTEXT.md`
- `.planning/phases/228-cross-language-golden-strategy-corpus-and-parity-matrix/228-CONTEXT.md`

### Code
- `apps/web/app/workshop/workshop-client.tsx` - Workshop editor and language controls.
- `apps/web/app/workshop/server.ts` - Workshop data and validation plumbing.
- `apps/web/app/workshop/types.ts` - Workshop DTO shape.
- `apps/web/lib/runtime-labels.ts` - Existing label helper.
- `apps/web/app/account/page.tsx` - Account revision labels.
- `apps/web/lib/account-revision-write-boundary.ts` - Account save source format handling.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` - Counted/unranked entry controls.
- `apps/web/app/competitions/[competitionId]/enter/page.tsx` - Signed-in competition entry.
- `apps/web/lib/public-discovery-service.ts` - Discovery labels and eligibility.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Current screens already expose language selection, runtime cues, saved revisions, and entry eligibility.
- Existing tests cover Workshop, account adapters, public discovery, and exhibition proofs.

### Established Patterns
- Public and account-safe DTOs should not expose source by default.
- Product copy should preserve canonical Coward's Game terms.

### Integration Points
- Workshop validation/save, account revision writes, Go backend create revision, competition entry dashboard, public discovery DTOs, and runtime labels.

</code_context>

<specifics>
## Specific Ideas

The aim is consistency, not flash. If a player sees Python as counted in Workshop, Account, entry, and results, those labels must all come from the same underlying capability decision.

</specifics>

<deferred>
## Deferred Ideas

New competition formats, ratings, governance, search, or filters remain outside this phase.

</deferred>

---

*Phase: 229-Workshop, Account, and Competition Entry Unification*
*Context gathered: 2026-05-31*
