# Phase 265 Plan 16 — Retained Verification v2

**Scope:** One independent invocation of the current v1 retained verifier for the fixed four-probe allocation. No ordinary old reader, source edit, store write, preparation, runtime/provider/container call, Match, test, or history scan was performed. Private strategy/objective/runtime-I/O payloads and raw error details were not read or emitted.

## Invocation and identity

```text
node_modules/tsx/dist/cli.mjs scripts/run-v1-38-lean-private-probe.ts verify --source-root sha256:1ac048cc2f2cbd9c8df497fc56af18be2861adf24a8f33450744f603ba9d62ed --store .strategy-lab/lean-private-probe-v1/17ea1073af11097956b919cbe4e5fc06faef624d815a093413bb222505ea7dd7 --allocation-commit dd67460e6628aebff6bc35c253adaa2cdfea284e --allocation-path .planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json
```

The invocation was made exactly once. **Verifier exit: 1 (refused).** No refusal code was persisted in the canonical records, and verifier output was suppressed to avoid exposing raw errors; therefore no more specific observed refusal code is claimed. The bounded terminal record has `failureCode: null`, `cleanupComplete: false`, `attemptedCount: 1`, and `matchCount: 0`. The sole attempted ordinal 0 is `system_failure` with `cleanupComplete: false`; ordinals 1–3 were not attempted. The initiating cause is unknown, and cleanup is not proven. This is not an empirical pass.

Allocation metadata binds source root `sha256:1ac048cc2f2cbd9c8df497fc56af18be2861adf24a8f33450744f603ba9d62ed`, allocation root `sha256:17ea1073af11097956b919cbe4e5fc06faef624d815a093413bb222505ea7dd7`, fixed source HEAD `8bed800f753235deaea1956d1166080973c9bba0`, allocation commit/current HEAD `dd67460e6628aebff6bc35c253adaa2cdfea284e`, and `matchCount: 0`. The allocation working-tree bytes and bytes read from the named commit both hash to `70cfd1476ab3ead999c126235b8b2e7518193e887d75477e1e4132f918f3b565`.

## Read-only post-check

HEAD remained `dd67460e6628aebff6bc35c253adaa2cdfea284e`. The store inventory remained exactly `allocation.json`, `entry.json`, `ledger.ndjson`, `probe-00.json`, `request.json`, `result.json`, and `terminal.json`; no files were added or changed by the verifier. SHA-256 hashes:

| Record | SHA-256 |
|---|---|
| `request.json` | `9f937071d774eb788a6fa0629c11b5bb4b084267766bcb5d89f928e9ee241955` |
| `allocation.json` | `70cfd1476ab3ead999c126235b8b2e7518193e887d75477e1e4132f918f3b565` |
| `ledger.ndjson` | `4b21d070d9f351eb6b8b531d7a0f1eb00197a296ff8632f59380d2c5e1d8c27a` |
| `entry.json` | `9a7eca48abebb6369c2b047b33c8ea4c8eb3a0091e3a3d226b93e26aa9028c25` |
| `probe-00.json` | `4dac2e8ad6d5f87f64171f6f18e14428db78c1eb5af8c0db510b027e4f6bfc49` |
| `terminal.json` | `cf85c582d0cb9eb94de950e232bc06ee65a9cd32958f7d97b8d7eee1aad8d842` |
| `result.json` | `52755f198838ce8b1e99b8d9dbf5fdbb10c759b8051583f8d3d778238c6cc9ee` |

## Disposition

Retained verification **FAILED**. One system-failure attempt and incomplete cleanup cannot establish four-probe feasibility; the other three probes produced no evidence. Preserve the pinned allocation, private records, and fixed HEAD. Do not retry this verifier or fabricate a result. The source/HEAD hold is **not release-eligible**: although the terminal/result were closed and the unique verifier check was performed, the retained terminal explicitly records incomplete cleanup. A new decision/authorization is required before any further operation.

_Verified: 2026-10-10_
_Verifier: independent retained verifier_
