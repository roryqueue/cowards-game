# Phase 229 Validation: Workshop, Account, and Competition Entry Unification

## Nyquist Validation

| Risk | Coverage |
| --- | --- |
| Workshop language controls drift from supported registry | Controls render from `WORKSHOP_EDITOR_SOURCE_FORMATS` in `runtime-labels.ts`. |
| Counted languages disappear from revision labels | `sourceFormatExhibitionLabel` returns provider public labels for supported source formats, and saved Workshop rows prefer provenance-aware `runtimeSemantics`. |
| Stale provider revisions appear counted from source format alone | Workshop revision summaries downgrade invalid, missing-proof, or mismatched provider revisions before they reach the UI. |
| Workshop/API errors use stale local language names | Errors derive labels with `getSupportedStrategyLanguageBySourceFormat`. |
| Account summaries expose source | Only source hash/bytes and provider semantics remain in summary DTOs; source loading remains explicit. |
| MatchSet results reintroduce local language switches | Runtime labels call `runtimeExhibitionStatusLabel` with runtime language id and counted status. |

## Validation Result

Pass. Remaining broad active-surface drift detection belongs to Phase 231 monitors.
