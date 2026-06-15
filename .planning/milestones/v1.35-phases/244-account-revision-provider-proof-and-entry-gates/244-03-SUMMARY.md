# Phase 244 Plan 03 Summary: Entry Gates and Public Labels

## Status

Complete.

## What Changed

- Go counted entry now requires TypeScript JS/TS provider validation proof, matching the existing Python/Rust/Zig proof-backed behavior.
- Go non-counted exhibition entry is metadata/source-identity aware for TypeScript, Python, Rust, and Zig; non-counted status no longer bypasses provider proof.
- Public Strategy cards now include proof-aware `runtimeSemantics` from Go and the spec DTO/schema.
- Go entrant snapshots now include `runtimeSemantics`, and public result/replay-facing web labels prefer stored proof-aware semantics instead of recomputing counted readiness from raw runtime alone.
- Updated parity fixtures and fixture generation for the new public semantics field.

## Verification

- `cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Semantics|Test.*PublicStrategy|Test.*Runtime.*Play|Test.*Entry|Test.*LoadOwnedEntrants|Test.*Ownership'` — passed.
- `pnpm --filter @cowards/spec test -- schemas.test.ts service.test.ts` — passed.
- `pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts` — passed.
- `pnpm --filter @cowards/web test -- public-go-read-client.test.ts result-view-model.test.ts` — passed.
- `pnpm go:parity` — passed.

## Deviations from Plan

**[Rule 2 - Fixture compatibility] Historical Go parity fixtures lacked entrant runtime semantics** — Found during: Task 4 | Issue: schema validation failed before Go parity could run because generated/committed fixture entrants did not include `runtimeSemantics`. | Fix: updated the fixture generator, regenerated Go parity fixtures, and added compatibility fallback in service/persistence projection paths for older snapshots. | Files modified: `scripts/generate-go-parity-fixtures.ts`, `apps/go-backend/testdata/service-fixtures/*`, `packages/persistence/src/competition.ts`, `packages/spec/src/match-execution-contract.ts`. | Verification: `pnpm go:parity`, spec, persistence, and web focused tests passed.

**[Rule 2 - Built-in fork compatibility] Starter/Advanced manifest artifacts do not carry account provider proof metadata** — Found during: `pnpm go:parity` full Go suite. | Issue: making TypeScript counted checks proof-backed caused built-in artifact fork lookup to fail. | Fix: kept built-in manifest forkability scoped to registry/runtime semantics, while account save and entry gates remain provider-proof-backed. | Files modified: `apps/go-backend/live_backend.go`. | Verification: `pnpm go:parity` passed.

**Total deviations:** 2 auto-fixed. **Impact:** Positive; entry gates are stricter for account-owned revisions while existing built-in fixture/fork compatibility remains scoped and explicit.

## Notes

- Persistence competition and ladder tests remained green as the stricter reference.
- No Strategy execution moved into web/API/Go, and no package/TinyGo/sandbox claim expansion was introduced.
