# Phase 225 Summary: Python Production Support Path

## Accomplished

- Promoted Python in `SUPPORTED_STRATEGY_LANGUAGES` to counted eligible and normal-play enabled.
- Promoted the Python provider adapter to a production-candidate counted path while keeping package policy `none`, no required capabilities, no filesystem, no network, and runtime-service ownership explicit.
- Kept the legacy adapter id `runtime-python-subprocess-experimental` for compatibility while making the provider registry the eligibility source of truth.
- Removed Python `NON_COUNTED_RUNTIME` validation warnings and updated Python example references.
- Updated Go backend runtime semantics, revision tags, counted eligibility gates, and tests so Python can enter counted MatchSets only through exact Python provider metadata.
- Updated Workshop templates, samples, tags, ladder, and competition tests so Python is no longer treated as beta while Rust/Zig remain evidence-gated.
- Updated active web labels, Workshop language buttons, exhibition copy, Strategy cards, MatchSet result/evidence copy, and learn copy so Python appears as counted eligible.
- Updated match execution runtime evidence so the counted path is `javascript-typescript-python` and only Rust/Zig remain non-counted exhibition beta.
- Fixed review blockers by moving Python save validation to runtime-service, removing the Go local Python scanner, softening adapter isolation claims to evidence-scoped counted support, and preserving historical non-counted MatchSet governance.
- Fixed second-pass review blockers by requiring Python provider-validation provenance for counted entry and making Python runtime helper functions visible inside the constrained namespace.
- Fixed final review blocker by routing Python Workshop submissions through runtime-service validation and refusing submitted Python Workshop saves without runtime-service provider provenance.
- Removed local provider-provenance minting from Python and Workshop builders so `providerValidation` means runtime-service validation.
- Added HMAC-backed provider-validation proof and constant-time verification across runtime-service, TypeScript persistence gates, and Go counted-entry gates, with no public fallback signing secret.
- Added source hash/byte recomputation for Python Workshop saves and revision-aware account/listing semantics so historical Python beta revisions are not shown as counted selectable.

## Behavior Changes

- Valid Python Strategy Revisions no longer carry non-counted warnings.
- Counted entry gates now allow Python provider metadata with package mode `none` and no required capabilities.
- Public result and evidence summaries count Python entrants as counted entrants.

## Boundary Notes

Python counted support is intentionally narrow: self-contained source, no packages, no imports, no host capabilities, runtime-service provider validation and execution only, HMAC-backed provenance proof for counted entry using configured provider secret, public-safe diagnostics only. This phase does not claim broad sandbox certification for arbitrary Python programs.

## Verification

- `pnpm --filter @cowards/spec typecheck` passed.
- `pnpm --filter @cowards/spec test` passed: 4 files, 55 tests.
- `pnpm --filter @cowards/runtime-python typecheck` passed.
- `pnpm --filter @cowards/runtime-python test` passed: 1 file, 8 tests.
- `pnpm --filter @cowards/runtime-service typecheck` passed.
- `pnpm --filter @cowards/runtime-service test -- execute-match server` passed: 3 files, 26 tests.
- `pnpm --filter @cowards/persistence typecheck` passed.
- `pnpm --filter @cowards/persistence test -- workshop ladder competition` passed: 12 files, 58 passed, 1 skipped.
- `pnpm --filter @cowards/web typecheck` passed.
- `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model` passed: 25 files, 171 tests.
- `PATH=/usr/local/go/bin:$PATH go test ./...` passed in `apps/go-backend`.
