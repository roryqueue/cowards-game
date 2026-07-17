---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "31"
review_status: resolved
resolved: 2026-07-17
fix_commit: cf18693
---

# Phase 260 Plan 31 Review Fix — Executable Activation Evidence

## Disposition

The independent review's ten activation-seam findings are resolved. The coordinator and evaluator now reject declaration-only, forged, stale, partially restored, wrong-token, and cross-store evidence. A production-adapter integration suite exercises the real Git and PostgreSQL transition seams without mutating the development selection head.

## Finding resolutions

1. **Plan 14 CLI mismatch:** every coordinator command now uses explicit `--mode` and one fixed `--activation-id`; the evaluator receives the same ID. Parse-only subprocess tests execute all seven literal coordinator invocations without opening the database or mutating files.
2. **Runtime-service gate scope:** the production receipt command targets the complete `apps/runtime-service/src` tree. It uses one worker because the default parallel invocation produced three 5-second timeout failures under contention; the exact recorded command passes all 154 tests.
3. **Build side effect:** the production adapter captures `apps/web/next-env.d.ts` as exact bytes-or-absence and restores it after both success and failure. Present/absent unit cases and a real `pnpm build` invocation prove restoration.
4. **Protected baseline by execution:** postactivation collection runs `scripts/capture-v1-37-protected-baseline.ts --check` and binds the returned receipt instead of trusting the committed artifact's self-description.
5. **Exact proof receipts and preimage:** validation and rollback receipts require the exact closed field set, gate ID, production command, zero exit, SHA-256 stdout/stderr digests, and parseable completion time. The six-path preimage root is recomputed from proof contents and compared with the durable intent.
6. **Complete compensation evidence:** compensated evaluation binds all six current bytes-or-absence states to the original proof preimage, the exact bounded compensation ID, source activation ID, reverse commit/tree/parent, proof removal, selector restoration, and a recomputed recovery-receipt digest.
7. **Recovery token and retry safety:** pending reverse recovery, compensation, and terminal idempotent retries require the caller's exact source activation token and revalidate current Git, proof, tree, and byte bindings before accepting the retry.
8. **Bounded compensation identity:** the compensation activation ID is a fixed-format SHA-256 derivation of the source ID and remains valid when the source uses the maximum admitted activation-ID length.
9. **Real cross-store integration:** three tests use the production adapter, temporary Git repositories, and isolated PostgreSQL schemas to cover finalize then compensate, exact committed-unfinalized recovery, and staged precommit restore/abort.
10. **Regression closure:** coordinator, evaluator, database selection-head, runtime-service, build, typecheck, lint, formatting, protected-baseline, and development-state checks are green. The seam is ready for independent rereview.

## Verification evidence

- `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run scripts/activate-v1-37-observation-v1-19.test.ts scripts/activate-v1-37-observation-v1-19.integration.test.ts scripts/evaluate-v1-37-observation-v1-19-postactivation.test.ts packages/persistence/src/semantic-authority-selection-head.test.ts --maxWorkers=1` — 49/49 tests passed.
- `pnpm exec vitest run apps/runtime-service/src --maxWorkers=1` — 154/154 tests passed across 16 files.
- Production adapter `runGate("build")` — `pnpm build` passed and the tracked `next-env.d.ts` blob remained `7506fe6afbc69878107523a1a6aa3409b65bde64` before and after.
- `pnpm typecheck` — 27/27 tasks passed.
- `pnpm lint` — 15/15 tasks passed after the unrelated Plan 27 type-only import correction in `3dc7b0e`.
- `pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check` — verified baseline `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Development selection head remained `active-v1.17-bootstrap`, revision `0`, root `sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a`, with no pending intent.

## Boundary disposition

No live selector, activation proof, activation commit, or development database transition was created. The integration schemas are uniquely named and dropped in cleanup. The protected user-owned files remain unstaged and unchanged by Plan 31. No Match state, Action legality, event order, outcome, Strategy observation, gameplay rule, arena geometry, Chronicle, or historical evidence changed.
