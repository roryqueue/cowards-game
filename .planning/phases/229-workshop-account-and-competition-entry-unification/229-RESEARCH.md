# Phase 229 Research: Workshop, Account, and Competition Entry Unification

## Inputs Reviewed

- Phase 229 context and discussion log.
- Shared supported-language registry in `packages/spec/src/runtime.ts`.
- Existing web `runtime-labels.ts` helper.
- Workshop UI, Workshop server, Workshop API routes, Account page, exhibition entry client, competition entry page, MatchSet result page, persistence Workshop summaries, and account revision semantics.

## Implementation Direction

The lowest-risk path is to keep `apps/web/lib/runtime-labels.ts` as the web-facing adapter, but make it consistently provider-derived. Product code can then consume source-format labels and editor source-format lists without repeating local language switches.

## Boundary Notes

Provider-specific execution and validation branches remain allowed at runtime boundaries. Product display branches should use registry/provider semantics wherever they are only selecting labels or eligibility copy.

