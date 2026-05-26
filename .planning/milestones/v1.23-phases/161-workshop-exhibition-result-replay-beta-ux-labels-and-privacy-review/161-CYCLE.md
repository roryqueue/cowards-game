# Phase 161 Cycle: Workshop/Exhibition/Result/Replay Labels and Privacy

## Execution

Centralized runtime label copy in `apps/web/lib/runtime-labels.ts` and updated Workshop, account, exhibition creation, MatchSet result, replay evidence copy, persistence samples, and spec/runtime copy to use non-counted exhibition beta labels for promoted Rust/Zig.

## Code Review

Reviewed UI label paths for overclaiming, privacy leaks, and counted/ranked wording. No private Strategy source, memory, objective payload, host path, env, token, DB, raw stream, or runtime internals exposure found.

## Validation

Validated by web typecheck/tests, signed-in proof page checks, and browser inspection of result/replay pages.

## Verify Work

Passed. Result pages show Rust/Zig non-counted exhibition beta evidence; replay pages show public evidence and plausible board/timeline state.
