# Phase 160 Cycle: Signed-In Multi-Compiler Proof

## Execution

Added and ran `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts`.

The proof:

- Created a signed-in account.
- Saved JS/TS, Rust, and Zig Strategy Revisions.
- Saved companion Rust/Zig revisions because same-language exhibitions require distinct revision ids.
- Ran JS/TS-vs-Rust, Rust-vs-Rust, Rust-vs-Zig, and Zig-vs-Zig non-counted exhibitions.
- Opened MatchSet result and replay pages.
- Scanned public pages for private markers.

## Code Review

Finding fixed: the first proof attempted compiled revision saves in parallel and hit the selected Go backend write timeout. The proof now saves revisions sequentially, and selected Go backend ownership routes use a 30s default timeout with `COWARDS_GO_BACKEND_SERVICE_TIMEOUT_MS` override so slower Rust/Zig compile validation can complete without changing public read budgets.

Finding fixed: early proof strategies could complete Matches without activation events, producing replay validation failure. Rust and Zig proof strategies now issue at least one activation order when a Soldier is available, giving replay pages plausible public Chronicles.

## Validation

Validated by:

- `pnpm e2e:v1.23-proof`
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.json`
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md`

## Verify Work

Passed. Four required MatchSets completed with two complete Matches each.
