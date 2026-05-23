# Phase 70 Research: Boundary Debt Rebaseline and v1.11 Scope Lock

## Findings

- `pnpm boundary:imports` is the canonical current offense source. At milestone start it reports `strict_offenses=0 report_only_offenses=30`.
- The 30 report-only offenses are exact import fingerprints, not surface counts. They include broad competitive, matches, and Workshop server/type imports.
- The selected v1.11 read routes are not themselves current report-only fingerprints because `workshop/server` is not a forbidden pattern. The real burn-down must therefore come from source-free type cleanup or removal of exact Workshop broad import fingerprints after service migration.
- `scripts/check-boundary-monitors.ts` stores the known baseline as exact keys and must be updated only after real fingerprint removal.
- `pnpm topology:check -- --require-go --json` already has required-Go semantics, but Phase 70 should record only baseline/optional topology evidence; required live Go belongs to Phase 74.

## Implementation Notes

- Capture baseline evidence in `.planning/artifacts/v1.11-baseline-boundary-evidence.md`.
- Capture offense ownership classification in `.planning/artifacts/v1.11-ownership-boundary-matrix.md`.
- Call out the count-reduction wrinkle explicitly so Phase 73 cannot claim success from strict route additions alone.

