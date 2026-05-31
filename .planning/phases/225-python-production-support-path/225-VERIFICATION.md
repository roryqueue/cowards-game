# Phase 225 Verification: Python Production Support Path

## Commands

| Command | Result |
| --- | --- |
| `pnpm --filter @cowards/spec typecheck` | Passed |
| `pnpm --filter @cowards/spec test` | Passed: 4 files, 55 tests |
| `pnpm --filter @cowards/runtime-python typecheck` | Passed |
| `pnpm --filter @cowards/runtime-python test` | Passed: 1 file, 8 tests |
| `pnpm --filter @cowards/runtime-service typecheck` | Passed |
| `pnpm --filter @cowards/runtime-service test -- execute-match server` | Passed: 3 files, 26 tests |
| `pnpm --filter @cowards/persistence typecheck` | Passed |
| `pnpm --filter @cowards/persistence test -- workshop ladder competition` | Passed: 12 files, 58 passed, 1 skipped |
| `pnpm --filter @cowards/web typecheck` | Passed |
| `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model` | Passed: 25 files, 171 tests |
| `PATH=/usr/local/go/bin:$PATH go test ./...` from `apps/go-backend` | Passed |

## Follow-Up

Run the live signed-in four-language proof in Phase 232 after Rust and Zig are promoted and the parity matrix is complete.
