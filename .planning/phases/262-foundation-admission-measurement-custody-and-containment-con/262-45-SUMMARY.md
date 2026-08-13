---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 45
subsystem: integrity
tags: [local-seal, one-shot, filesystem, hmac, hash-chain, privacy, tdd]
requires:
  - phase: 262-44
    provides: binding single_operator_local_seal_v1 contract and denied downstream authority
provides:
  - compatibility-free local-seal state machine with durable pre-launch opening consumption
  - fixed owner-only secret-file ingress with no CLI, environment, log, artifact, or return-value secret seam
  - fsynced hash-chained event ledger, exact request/root joins, contamination, and retirement
  - bounded privacy-checked receipt projection and deterministic synthetic protocol artifact
affects: [262-46, 262-47, 262-48, MEAS-10, SEAL-01]
tech-stack:
  added: []
  patterns: [fixed-file secret ingress, exclusive durable writes, pre-launch burn, opaque evaluation roots, honest reduced assurance]
key-files:
  created:
    - scripts/lib/v1-38-local-seal.ts
    - scripts/evaluate-v1-38-local-seal.test.ts
    - scripts/evaluate-v1-38-local-seal.ts
    - .planning/artifacts/v1.38-local-seal-protocol-v1.json
  modified: []
key-decisions:
  - "Consume secret bytes only from the exact owner-only local file, unlink and fsync its parent before accepted commitment evidence, and expose no secret or absolute local path."
  - "Persist open_consumed before evaluation launch; callback crash or uncertainty is a charged terminal system failure with no retry or replacement."
  - "Claim only single-operator procedural sealing; independent custody, comprehensive host monitoring, forensic erasure, and malicious-owner resistance remain explicitly unsupported."
patterns-established:
  - "Repository-safe local-seal results contain only opaque roots, bounded counts, coarse states, approved aggregate metrics, and denied authority."
  - "Every state transition is joined to a sequence-numbered SHA-256 event chain and a separately durable state root."
requirements-completed: []
coverage:
  - id: D1
    description: "Fixed owner-only secret ingress, closed one-shot lifecycle, tamper detection, privacy projection, and exact request/root joins"
    requirement: MEAS-10
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-local-seal.test.ts#v1.38 single-operator local seal"
        status: pass
    human_judgment: false
  - id: D2
    description: "Deterministic synthetic protocol evidence with honest single-operator assurance exclusions and no downstream authority"
    requirement: SEAL-01
    verification:
      - kind: integration
        ref: "pnpm exec tsx scripts/evaluate-v1-38-local-seal.ts --check"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-08-13
status: complete
---

# Phase 262 Plan 45: Single-Operator Local Seal Mechanics Summary

**A fixed-file, one-shot local seal now burns opening authority before evaluation, detects ledger tampering, and publishes only bounded non-authorizing evidence under an explicitly limited assurance class.**

## Performance

- **Duration:** 12 min
- **Completed:** 2026-08-13
- **Tasks:** 1 TDD task
- **Files created:** 4

## Accomplishments

- Added a compatibility-free local-seal module with exact-key request parsing, domain-separated roots, a closed state machine, exclusive/durable writes, and an fsynced hash-chained event ledger.
- Restricted commitment material to the exact out-of-repository `input/commitment-secret.bin` seam: owner-only directories, owner-only regular non-symlink file, 32–4096 bytes, no-follow open, exact bounded read, Buffer zero-fill, unlink, and parent fsync before accepted evidence.
- Made `open_consumed` durable before the evaluation callback. Callback failure produces a charged terminal system-failure event and cannot be retried or replaced.
- Replaced raw evaluation return values with an opaque evaluation root; only an exact bounded allowlisted projection can cross into a receipt.
- Published deterministic protocol root `sha256:0d7f7ec3edd89638226105b7ae035330265f19634bb7acfc58fb204dba157e62` using synthetic source fixtures only, with `realHoldoutMaterialPresent: false` and all candidate, phase, formation, holdout-opening, public, production, and downstream authority denied.

## Task Commits

1. **RED: Add failing local-seal protocol contract** — `48e67622`
2. **GREEN: Implement single-operator local seal** — `410e6261`
3. **REFACTOR: Freeze terminal evaluation semantics** — `29af1045`

## Files Created

- `scripts/lib/v1-38-local-seal.ts` — closed local-seal state machine, secret ingress, ledger, projection, contamination, and retirement.
- `scripts/evaluate-v1-38-local-seal.test.ts` — lifecycle, crash, filesystem, tamper, privacy, export, and claim-boundary tests.
- `scripts/evaluate-v1-38-local-seal.ts` — deterministic exclusive `--write` and byte-identical `--check` artifact tool.
- `.planning/artifacts/v1.38-local-seal-protocol-v1.json` — synthetic-only, non-authorizing protocol capability evidence.

## Decisions Made

- Filesystem modes and the tool-mediated ledger are procedural and accidental-exposure controls. They do not establish organizational separation or prevent the repository/machine owner from bypassing the tool.
- Buffer zero-fill and unlink are best-effort hygiene only; they do not prove removal from OS caches, swap, backups, snapshots, copies, or malicious-owner access.
- The callback result remains inside the restricted store until it passes the safe-projection parser; the command result exposes only an opaque evaluation root.
- Mechanics alone do not complete MEAS-10 or SEAL-01. Plan 262-46 must independently verify the evidence and claim boundary before either can receive credit.

## Verification

- `pnpm exec vitest run scripts/evaluate-v1-38-local-seal.test.ts --maxWorkers=1` — 14 passed, 1 platform-conditional wrong-UID fixture skipped because the current process cannot safely reassign ownership; the effective-UID check itself is active.
- `pnpm exec tsx scripts/evaluate-v1-38-local-seal.ts --check` — passed byte-identically at protocol root `sha256:0d7f7ec3edd89638226105b7ae035330265f19634bb7acfc58fb204dba157e62`.
- `pnpm turbo typecheck --concurrency=1` — 27/27 tasks passed.
- `git diff --check` — passed.

## Deviations from Plan

None - the TDD task executed as specified. The explicit failure-injection object can only force short-read, unlink, or parent-fsync failures; it cannot supply secrets, bypass validation, or create successful evidence.

## Authentication Gates

None.

## Known Stubs

None. The one skipped wrong-owner fixture is intentionally conditional on safe UID reassignment; production ownership validation is implemented and enforced.

## Live Truth Preserved

- ADMIT-03 remains blocked.
- MEAS-10 and revised SEAL-01 remain pending independent verification.
- The new artifact contains no real holdout material and grants no opening authority.
- Candidate search, Phase 263, formation materialization, public exposure, activation, production, and downstream authority remain false.
- Historical synthetic custody code/artifacts, stopped routes, charged attempts, and terminal evidence were not modified.

## Next Phase Readiness

Plan 262-46 can independently reproduce the non-secret protocol root, mutate every joined boundary, check clean-checkout behavior and assurance wording, and decide whether the mechanical portion of revised SEAL-01 is proven. Plan 262-47 remains separately authorization-gated and receives no execution authority from this plan.
