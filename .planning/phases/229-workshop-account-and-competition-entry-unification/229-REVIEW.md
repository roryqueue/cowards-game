# Phase 229 Code Review: Workshop, Account, and Competition Entry Unification

## Review Scope

- Web runtime label helper.
- Workshop editor/source-format controls.
- Workshop server and API validation copy.
- MatchSet result runtime labels.
- Persistence Workshop and account summary semantics.

## Findings

No open local findings.

## Fixes Made During Review

- `sourceFormatExhibitionLabel` now returns provider public labels for all supported counted source formats instead of `null`.
- Workshop language controls now render from `WORKSHOP_EDITOR_SOURCE_FORMATS`.
- Template chips, Workshop server errors, Workshop API errors, MatchSet runtime labels, Workshop summary source formats, and account downgrade labels now use provider registry labels.
- Workshop revision summaries now include provenance-aware `runtimeSemantics` so stale, missing-proof, or invalid provider revisions do not display as counted eligible from `sourceFormat` alone.

## Residual Risk

Older historical E2E proof specs still contain old phase-specific beta copy as historical artifacts. Later monitor phases should distinguish historical proof specs from active product surfaces.
