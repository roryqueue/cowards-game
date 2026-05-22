---
phase: 53
plan: 01
slug: runtime-sandbox-hardening-prototype
status: complete
completed: 2026-05-22
---

# Phase 53-01 Summary — Runtime Sandbox Hardening Prototype

## Delivered

- Added `pnpm sandbox:evaluate` and `pnpm sandbox:evaluate:check` for deterministic, public-safe sandbox candidate evaluation.
- Added an evaluation-only candidate matrix covering worker-thread baseline, host subprocess, optional container subprocess, Python experimental evidence, Deno permissions, WASM/WASI, gVisor/runsc, and microVM isolation.
- Added 21 hostile probes covering deterministic API denial, host capability denial, output and memory limits, source limits, malformed IPC, timeout, crash behavior, schema invalid output, and thrown exceptions.
- Generated `.planning/artifacts/runtime-sandbox-evaluation.json` as the committed evidence artifact.
- Preserved the v1.8 no-promotion posture: counted Match defaults and counted-play eligibility remain unchanged.

## Fixes From Review

- Probe pass logic now requires exact result-kind matching, so runtime violations and system failures cannot satisfy each other by code alone.
- Successful adapter outputs are normalized through public Strategy/Soldier result schemas before the evaluation marks them successful.
- Optional executable candidates can run behind explicit availability, while the container subprocess remains skipped by default unless `COWARDS_RUN_CONTAINER_SANDBOX=1`.
- Worker Strategy execution now blocks `console` inside the injected Strategy scope, preventing Strategy stdout/stderr from leaking to the host process.
- Subprocess IPC now carries output byte limits into the harness so oversized Strategy results classify as `OVERSIZED_OUTPUT` rather than IPC buffer failures.

## Verification

- `pnpm sandbox:evaluate && pnpm sandbox:evaluate:check`
- `pnpm --filter @cowards/runtime-js test`
- `pnpm typecheck`
- `pnpm exec prettier --check package.json scripts/evaluate-runtime-sandbox.ts packages/runtime-js/src/sandbox-evaluation.ts packages/runtime-js/src/sandbox-evaluation.test.ts packages/runtime-js/src/worker-harness.ts packages/runtime-js/src/subprocess-harness.ts packages/runtime-js/src/subprocess-adapter.ts packages/runtime-js/src/subprocess-ipc.ts`

## Surprise

The sandbox review exposed two small but useful boundary drifts in existing runtime adapters: worker-thread Strategies could call `console`, and host subprocess output caps were enforced at the IPC stdout layer before the Strategy result cap reached the child harness. Both are now hardened without changing the selected counted adapter or promoting any candidate.
