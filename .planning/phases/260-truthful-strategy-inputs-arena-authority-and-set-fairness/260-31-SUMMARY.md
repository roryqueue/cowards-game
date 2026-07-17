---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "31"
subsystem: semantic-activation
tags: [postgresql, git, recovery, compensation, proof, semantic-authority]
requires:
  - phase: 260-27
    provides: Compact five-file semantic selector authority
  - phase: 260-28
    provides: Serializable semantic-authority selection head
  - phase: 260-29
    provides: Runtime and Workshop default delegation
  - phase: 260-30
    provides: Go scheduling head delegation
  - phase: 260-32
    provides: TypeScript scheduling head enforcement
provides:
  - Production two-phase v1.19 activation coordinator
  - Exact precommit and compensation crash recovery
  - Isolated pre-prepare candidate validation with SIGKILL recovery proof
  - IPC-leased production gate process-tree supervision
  - Non-recursive five-selector activation proof
  - External database commit, tree, proof, and smoke validation
  - Production-adapter Git and PostgreSQL recovery integration proof
affects: [260-33, 260-14, 260-15]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 31: Crash-Safe Activation Coordinator Summary

**One coordinator now owns the complete v1.19 activation and compensation state machine, while a separate read-only evaluator proves the finite selector commit against the finalized database head.**

## Accomplishments

- Implemented `prepare`, `validate`, `rollback-drill`, `stage`, `commit`, `finalize`, `smoke`, `recover`, `abort`, and `compensate` under one advisory-locked coordinator port.
- Bound the durable pending intent to the exact parent HEAD, target selection, five-selector manifest, and six-path bytes-or-absence preimage while leaving v1.17 active until finalization.
- Rendered exactly five deterministic v1.19 selectors and kept the proof output outside its own manifest.
- Enforced an exact six-path stage and fixed activation commit; recovery finalizes only a byte-exact direct child or restores and aborts the precommit attempt.
- Added audited reverse preparation, exact activation-parent restoration, a fixed compensating commit, recovery-receipt binding, and final v1.17 compensation state.
- Corrected the postactivation evaluator to bind the real proof digest, activation commit/tree, selector bytes, database finalization, zero pending intent, protected baseline, and live smoke.
- Moved candidate validation before database prepare and durably committed the exact proof bytes with a domain-separated raw-preimage-plus-proof-digest commitment recorded in PostgreSQL history.
- Isolated all pre-prepare selector rendering, validation, rollback, and proof construction in a disposable shared clone so process death cannot expose mixed live selector bytes before a durable database intent exists.
- Added stale-candidate cleanup to every locked invocation and proved direct-process SIGKILL recovery leaves the live Git index, governed paths, proof, and PostgreSQL head at the exact bootstrap preimage.
- Added a supervisor-first default production gate runner whose exact IPC lease turns coordinator death into whole-process-group termination before candidate cleanup can proceed.
- Made recovery fail closed on persistent or malformed leases without signaling disk-recorded PIDs, while current-run nonce binding lets a live coordinator close unexpected supervisor death safely.
- Removed every production parse bypass; Plan 14 argument contracts are exercised only through pure exported parsers, and both executables reject extra bypass arguments.
- Strengthened reverse recovery to rederive the activation preimage and restored manifest from actual commit ancestry before finalization.
- Made compensated v1.17 an explicitly validated safe blocker that can never be reported as a successful v1.19 closure.
- Added a production-adapter integration suite with temporary Git repositories and isolated PostgreSQL schemas for finalize/compensate, committed recovery, and staged abort.
- Kept all test mutation inside model adapters, temporary Git repositories, and dropped schemas; no live selector, activation commit, or development database transition was created.

## Commits

- `f1d8407` — `test(260-31): define activation coordinator contract`
- `fb98230` — `feat(260-31): coordinate crash-safe semantic activation`
- `8bb5aa4` — `test(260-31): correct postactivation proof contract`
- `2a27e11` — `fix(260-31): bind postactivation proof externally`
- `f63f1d9` — `fix(260-31): close activation recovery bindings`
- `cf18693` — `fix(260-31): prove production activation recovery`
- `2660b59` — `fix(260-31): durably commit activation proof evidence`
- `9ed78db` — `fix(260-31): isolate precommit candidate validation`
- `a88bfc4` — `fix(260-31): supervise activation gate process trees`

## Verification

- Coordinator, evaluator, production-adapter integration, and PostgreSQL selection-head gate: 60 tests passed with `DATABASE_URL` and one worker.
- Exact runtime-service production gate: 154 tests passed across 16 files with one worker.
- Real temporary-repository and isolated-schema proof covered exact six-path staging, commit parent/tree, historical proof commitment, finalization, compensation, committed recovery, staged abort, pre-prepare gate failure, forged reverse intent, proof removal, live-head non-mutation, actual production-runner coordinator SIGKILL, whole gate-tree exit, normal watchdog cleanup, unexpected supervisor exit, and stale-lease refusal without unrelated-process signaling.
- The production adapter ran `pnpm build` successfully and restored `apps/web/next-env.d.ts` to the exact tracked blob.
- Standalone script TypeScript compilation, focused ESLint, repository typecheck (27 tasks), repository lint (15 tasks), and focused formatting passed.
- Protected working-tree baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Development database remained `active-v1.17-bootstrap`, revision `0`, root `sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a`, with no pending intent.

## Review Fixes

- Cleared staged activation paths during precommit and reverse abort recovery instead of restoring only working-tree bytes.
- Required reverse commits to restore every activation-parent byte or absence, not merely change the expected path names.
- Rechecked finalized Git/tree/proof/selector bindings on idempotent finalize, smoke, and compensation entry.
- Corrected the production protected-baseline gate to invoke the existing read-only baseline checker.
- Required exact closed-shape validation and rollback receipts, recomputed proof-preimage roots, and executable baseline evidence.
- Bound compensated evidence to all six current path states, exact reverse commit/tree/source identity, proof removal, and a recomputed recovery digest.
- Required exact activation tokens and full binding revalidation for pending reverse and terminal idempotent retries.
- Added fixed-length compensation IDs valid for the maximum admitted source activation ID.
- Corrected every Plan 14 invocation to the explicit coordinator CLI contract and proved both production CLIs reject the former parse-only bypass.
- Bound exact proof bytes to the durable prepared history before any pending selector/proof installation; arbitrary well-formed receipt rewrites now fail that commitment.
- Recomputed reverse activation snapshots and restored manifests from actual commits before recovered compensation finalization.
- Moved every pre-prepare mutation into a disposable exact-parent shared clone, kept protected-baseline verification rooted in the untouched main checkout, and reasserted the main six-path/index preimage before durable prepare.
- Added locked stale-clone cleanup plus a real SIGKILL integration proof that candidate process death cannot mutate the live selectors, proof, index, or database head.
- Replaced unsupervised production gate execution with a detached plain-Node supervisor whose kernel IPC lease owns one exact shell-free gate process group and whose durable identity blocks clone cleanup until absence is proved.
- Added direct process-table proof that coordinator SIGKILL removes the real gate leader and child, plus normal-exit, supervisor-death, stale-PID, PID-reuse-safe refusal, and delayed no-residue coverage.
- Exact `execArgv: []` prevented evaluation or loader flags from becoming a second supervisor program; acknowledged IPC, stream-close receipts, and macOS directory removal closed the remaining toolchain-specific races.
- Repository lint exposed unrelated Plan 27 type-import findings; the final correction landed separately in `3dc7b0e` before final verification.
- Detailed finding-by-finding closure is recorded in `260-31-REVIEW-FIX.md`.
