---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "31"
review_status: resolved
resolved: 2026-07-17
fix_commits: [cf18693, 2660b59, 9ed78db, a88bfc4]
---

# Phase 260 Plan 31 Review Fix — Executable Activation Evidence

## Disposition

The independent reviews' activation-seam findings are resolved. The coordinator and evaluator now reject declaration-only, forged, stale, partially restored, wrong-token, and cross-store evidence. A production-adapter integration suite exercises the real Git and PostgreSQL transition seams without mutating the development selection head.

## Finding resolutions

1. **Plan 14 CLI mismatch:** every coordinator command now uses explicit `--mode` and one fixed `--activation-id`; the evaluator receives the same ID. Exported parser tests cover all seven literal invocations, while production subprocess tests prove both CLIs reject the former `--parse-only` bypass.
2. **Runtime-service gate scope:** the production receipt command targets the complete `apps/runtime-service/src` tree. It uses one worker because the default parallel invocation produced three 5-second timeout failures under contention; the exact recorded command passes all 154 tests.
3. **Build side effect:** the production adapter captures `apps/web/next-env.d.ts` as exact bytes-or-absence and restores it after both success and failure. Present/absent unit cases and a real `pnpm build` invocation prove restoration.
4. **Protected baseline by execution:** postactivation collection runs `scripts/capture-v1-37-protected-baseline.ts --check` and binds the returned receipt instead of trusting the committed artifact's self-description.
5. **Exact proof receipts and preimage:** validation and rollback receipts require the exact closed field set, gate ID, production command, zero exit, SHA-256 stdout/stderr digests, and parseable completion time. The six-path preimage root is recomputed from proof contents and compared with the durable intent.
6. **Complete compensation evidence:** compensated evaluation binds all six current bytes-or-absence states to the original proof preimage, the exact bounded compensation ID, source activation ID, reverse commit/tree/parent, proof removal, selector restoration, and a recomputed recovery-receipt digest.
7. **Recovery token and retry safety:** pending reverse recovery, compensation, and terminal idempotent retries require the caller's exact source activation token and revalidate current Git, proof, tree, and byte bindings before accepting the retry.
8. **Bounded compensation identity:** the compensation activation ID is a fixed-format SHA-256 derivation of the source ID and remains valid when the source uses the maximum admitted activation-ID length.
9. **Real cross-store integration:** five tests use the production adapter, temporary Git repositories, and isolated PostgreSQL schemas to cover finalize then compensate, exact committed-unfinalized recovery, staged precommit restore/abort, durable reverse-intent forgery, and pre-prepare gate failure.
10. **Regression closure:** coordinator, evaluator, database selection-head, runtime-service, build, typecheck, lint, formatting, protected-baseline, and development-state checks are green. The seam is ready for independent rereview.

## Second rereview closure

1. **No production bypass:** `--parse-only` was removed from both production CLIs and their return types. Literal Plan 14 parsing is tested through the exported pure parsers; a bypass supplied to either executable is a usage error.
2. **Durable receipt authenticity:** candidate selectors and all validation gates now run before database prepare. The coordinator restores and unstages the raw six-path preimage, executes rollback, constructs the final proof bytes, and persists one domain-separated commitment over the raw preimage root plus exact proof digest. Only then are selectors and proof reinstalled. Validation, staging, committed recovery, terminal checks, and evidence collection recompute the commitment. The postactivation evaluator reads the historical prepared intent from PostgreSQL rather than accepting a declaration in the proof. Well-formed receipt hash/date rewrites fail even when paired with a rewritten finalization digest. A pre-prepare failure restores all paths and leaves no pending intent; a post-prepare reinstall crash remains exactly recoverable.
3. **Reverse recovery derivation:** before finalizing a recovered reverse commit, the coordinator now rederives the activation six-path snapshot/root and restored five-selector manifest/root from the actual activation and reverse commit ancestry. It compares every value with the pending reverse intent and rejects forged manifest or preimage values. Unit mutation cases cover both bindings, and isolated PostgreSQL integration mutates the durable pending intent and proves rejection.

## Third rereview closure

1. **No live mutation before durable prepare:** selector rendering, validation gates, rollback restoration, and final proof construction now run in a deterministic disposable shared clone rooted at the exact parent commit. The protected-baseline gate remains anchored to the untouched main checkout, while the clone links the exact installed dependency directories required by the production commands. The coordinator reasserts the main checkout and index preimage before persisting the pending database intent; only after that durable prepare does it install candidate selectors and proof in the live checkout.
2. **Crash-safe candidate cleanup:** every advisory-locked coordinator invocation removes the candidate-clone namespace before proceeding. Bootstrap recovery also verifies that the six governed live paths equal the current commit, the staged index is empty, and no pending database intent exists before returning the exact bootstrap head. A SIGKILL can therefore leave only a disposable clone, which the next locked invocation removes without treating candidate bytes as live gameplay state.
3. **True process-death proof:** a direct Node subprocess now changes selectors inside the disposable clone, enters a controlled gate, and is killed with SIGKILL while it owns the advisory lock. The test proves the main Git status, index, six governed paths, proof path, and PostgreSQL selection head remain at the bootstrap preimage with no pending intent. Production bootstrap recovery then removes the stale candidate namespace and leaves no isolated schema or repository artifact behind. The first harness version killed a package-runner wrapper rather than the lock-owning Node process; replacing it with a direct Node launch made the process-death boundary exact and repeatable.

## Fourth rereview closure

1. **Supervisor-first production gates:** the default production gate runner now forks a plain-Node detached supervisor over an exact IPC lease. The supervisor writes a closed-shape activation/workspace/gate identity, spawns the real command with `shell: false` as its own process group, bounds stdout and stderr, and reports a receipt only after output streams close and the whole process group is absent. Coordinator SIGKILL closes the kernel-owned IPC channel, causing the independent supervisor to terminate the exact gate group with TERM/KILL escalation and wait for process-group absence before removing its lease.
2. **Race-free fail-closed recovery:** the coordinator reserves the lease before sending spawn configuration, and the supervisor receives the exact lease paths as fixed arguments so a disconnect before configuration cannot leave an untracked spawn. Leases live in the Git common directory outside disposable clones. Candidate cleanup and recovery never signal a PID read from disk: they wait for every lease to disappear, validate exact closed shapes while waiting, and otherwise refuse clone deletion or reuse. A still-live coordinator may compensate for unexpected supervisor death only when the lease matches its current random nonce and exact activation/workspace/gate identity.
3. **Actual production-boundary proof:** the SIGKILL integration uses the default production runner and a real executable gate command that creates a marker and child process. After the coordinator receives SIGKILL, both gate leader and child disappear from `ps`; neither survives under PPID 1. Recovery then removes the clone while the main Git status, index, six governed paths, proof path, PostgreSQL head, schema count, and bootstrap state remain exact. Separate tests prove normal gate completion removes the watchdog and lease, unexpected supervisor death is closed by the live coordinator, and a stale lease referencing an unrelated live process blocks recovery without signaling that process or deleting the candidate.
4. **Toolchain and cleanup hardening:** the supervisor starts with exact empty `execArgv`, preventing `node --eval` or loader flags from being inherited as a second program. Terminal IPC sends are acknowledged, macOS uses directory-specific removal, and receipts wait for child `close` rather than only `exit`. A late empty-directory residue seen under the earlier startup implementation did not reproduce after guarded cleanup, the exact production candidate test, a 20-second delayed check, the full seam rerun, and a second delayed no-residue check.

## Verification evidence

- `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run scripts/activate-v1-37-observation-v1-19.test.ts scripts/activate-v1-37-observation-v1-19.integration.test.ts scripts/evaluate-v1-37-observation-v1-19-postactivation.test.ts packages/persistence/src/semantic-authority-selection-head.test.ts --maxWorkers=1` — 60/60 tests passed.
- `pnpm exec vitest run apps/runtime-service/src --maxWorkers=1` — 154/154 tests passed across 16 files.
- Supervised production adapter `runGate("build")` — `pnpm build` passed and the tracked `next-env.d.ts` blob remained `7506fe6afbc69878107523a1a6aa3409b65bde64` before and after.
- `pnpm typecheck` — 27/27 tasks passed.
- `pnpm lint` — 15/15 tasks passed after the unrelated Plan 27 type-only import correction in `3dc7b0e`.
- `pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check` — verified baseline `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Development selection head remained `active-v1.17-bootstrap`, revision `0`, root `sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a`, with no pending intent.

## Boundary disposition

No live selector, activation proof, activation commit, or development database transition was created. The integration schemas are uniquely named and dropped in cleanup; the final leftover-schema count was zero. The disposable candidate and gate-lease namespaces were absent after recovery, delayed residue checks, and final verification; no supervisor or gate process remained. The protected user-owned files remain unstaged and unchanged by Plan 31. No Match state, Action legality, event order, outcome, Strategy observation, gameplay rule, arena geometry, Chronicle, or historical evidence changed.
