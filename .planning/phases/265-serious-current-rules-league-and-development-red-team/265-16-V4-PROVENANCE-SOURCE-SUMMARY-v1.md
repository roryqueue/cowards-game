---
phase: 265
plan: 16
scope: source_only_provenance_repair
status: complete
empirical_admission: false
source_commit: b700dacb74099846bbb14cb1939b21df92611a4c
source_root: sha256:2d099e9d85f19cd5c6b49d59bb14599c1d053020b47aa14c869e81d15f8464e7
author_agent: /root/execute_265_fresh_reader_v4
independent_review: pending
key_files:
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-broker-origin-provenance.test.ts
---

# Plan 265-16 V4 provenance source repair

The opted-in session now registers a private, frozen origin on the exact `SUBPROCESS_SIGNAL` exception after the existing finite broker receipt and exact request ordinal/root validation succeed. The finite `executor` reasons distinguish `broker_timed_out` from `broker_changed_without_completion`. The supervised runtime already propagates this typed session origin with its invocation/method/ordinal identity; no runtime or baseline instrumentation change was needed.

Detailed provenance additionally requires null status, synthetic `SIGKILL`, empty output, empty stderr under the unchanged preceding cap check, `broker_synthetic_sigkill`, and completed Worker termination. Changed-without-completion also requires `not_done`. Absent opt-in, unavailable wait disposition, observed rather than synthetic signal, inconsistent status, output, unknown termination or changed-but-done remains unknown. Hostile cross-request or extra-field receipts retain existing fail-closed rejection. This identifies the broker's finite branch only: it proves neither an OS signal nor OOM, a guest-timeout cause, scheduling cause, or performance repair.

## Atomic commits and tests

- RED `371f151d`: the two synthetic correlated branch tests fail because the exact session error has no registered origin; eleven negative/default cases pass.
- GREEN `b700dacb`: minimal source registration and expanded positive/negative synthetic coverage.
- Final focused command: `pnpm exec vitest run scripts/lib/v1-38-lean-broker-origin-provenance.test.ts scripts/lib/v1-38-lean-subprocess-attribution.test.ts`.
- Final result: **34 passed** (18 new, 16 existing cleanup-attribution tests), two files, 3.09 seconds. `git diff --check` passed.

The new cases cover both broker branches and both methods on a second correlated request; frozen exact-error ownership; crossed ordinal/root/outer request and surplus/missing receipt; unavailable/observed/non-signal/stdout/stderr/status/termination/completion-state boundaries; and observer-absent default broker selection. Existing synthetic attribution cases preserve stream-error and outer-frame origins through cleanup failures. No Worker, child process, broker, Docker, provider, Strategy evaluation, Match, importer, helper or private evidence reader runs in these fixtures.

The test fixture asserts unchanged 1000-ms broker request/default stream wait. It does **not** issue host-receipt authority to test 5000-ms wiring: that existing bound and its wiring were not modified, and no claim of fresh native timer proof follows.

## Type-check and proof limitations

Source/test explicit-file check:

`pnpm exec tsc --ignoreConfig --noEmit --module nodenext --moduleResolution nodenext --target es2022 --esModuleInterop --skipLibCheck --types node scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-broker-origin-provenance.test.ts`

It returns exit2 with the same six inherited diagnostics: `packages/strategy-lab/src/feasibility-protocol.ts:52` and `packages/strategy-lab/src/planner/missions.ts:52,60,66,68,69`. No owned source/test diagnostics appeared. This is not a global type-check pass. MAIN owns configured typecheck, independent review, narrow verification and any further gates.

## Preserved boundaries and accounting

Default/legacy broker source bytes, correction clone source and receipt schema, response acceptance, system-failure code/compact normalization, existing route/version/issuer and baseline instrumentation are unchanged. Guest1000ms/host5000ms/Match600000ms and all resource/rule/privacy bounds remain unchanged. No historical authority, allocation, request, result, check, ledger or STATE was modified; no failed evidence was reinterpreted. Source/admin time carries from24910444ms at1791229625398 under the same eight-hour ceiling. No time extension is applied.

This source-only task is complete pending independent review, not empirical repair admission or Plan16/Phase265 completion. The consumed v4 baseline remains incomplete; current-rules freeze, formation and holdout/public/counting/production authority remain gated.

## Deviations / stubs / self-check

No scope deviation, new issuance surface, source stub or broad refactor. The two additive origin enum values are private finite metadata; the existing session WeakMap and request-correlated receipt seam remain the only detailed origin issuer.

Self-check passed: the two named commits exist, both owned source/test files exist, final focused regressions pass, and the source-only current v4 manifest was recomputed after GREEN. No empirical result is claimed.
