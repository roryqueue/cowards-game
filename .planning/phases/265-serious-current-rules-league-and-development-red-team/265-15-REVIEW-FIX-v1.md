---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-10-03T13:41:04Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-REVIEW-v1.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
verification_disposition: source_only_requires_independent_recheck
---

# Plan 265-15 code review fix report

All six findings were addressed in five scoped commits. This is source-only repair, not an empirical pilot or completion claim. Logic fixes remain **fixed: requires human verification**, satisfied operationally by the main workflow's independent reviewer/verifier rather than a new operator authorization checkpoint.

## Fixed issues

### WR-01: Complete exclusive and append writes

Commit `b50e87a7`. A shared write-all loop advances by the actual returned length, rejects zero/invalid progress, and fsyncs only after completion. Ledger, replay, CLI publication and interval writes use it. Injected short-write and zero-progress tests pass.

### CR-01: Account failed entry and unique verifier intervals

Commit `15d11ac6`, plus final CLI accounting seams in `345321d7`. New `time.ndjson` is append-only and separate from immutable outcome roots. The main entry begins before request/source/candidate work and closes in `finally`, after result or failure publication and provider cleanup. The unique retained verifier gets a separate interval and closes on success or failure. An interrupted/ambiguous active interval conservatively exhausts the remaining shared allowance; a fresh stage cannot reset it. Live charge checks include actual cumulative interval time. Tests retain a failed charge, add verifier duration, reject duplicate/competing intervals and preserve the charge.

### CR-02: Bound allocation, scratch and publication before work

Commit `7fd20f5e`, plus CLI/reconstruction seams in `345321d7`. Frame generation is lazy; unsampled successful executions never construct redacted replays. Conservative bounded traversal occurs before serialization/redaction, checks cumulative frame bytes, and reserves simultaneous buffers/gzip allocations before allocation. Decode is bounded too. Host RSS/high-water plus a conservative 512 MB external runtime/scratch allowance stays within the existing 2 GB transient envelope. Every replay, ledger, interval and CLI durable publication checks remaining retained bytes with block/metadata allowance before writing. Oversized streams stop before exhausting their generator; near-cap publication refuses before writes; unsampled success uses a generator that would throw if touched.

The external scratch allowance is a conservative reservation for the two bounded supervised runtime/broker lanes, not a claim that all unrelated laptop processes or historical stores are charged to the new experiment. Oversized legal executions may be refused honestly; no cap is relaxed. The implementation still retains bounded runtime results in memory, not an exhaustive historical invocation transcript.

### CR-03: Bind native authority to the allocated retained source

Commit `c21fd1c4`, CLI call and fixture correction in `345321d7`. Issuance rereads the actual candidate publication/source/packet/proposal/validation closure, re-admits supervision, derives the Strategy Revision/executable/runtime binding, and compares all fields against the supplied native binding. The selected seat is derived from the immutable slot condition and sorted allocated candidates. Tests use two distinct valid retained candidates and reject candidate B's runtime under A's charge and B in A's scheduled seat, while preserving factory→planner→session claim ordering.

### CR-04: Authenticate a real fixed-source independent review

Commit `345321d7`. The request now requires `reviewPath` as well as its raw-byte `reviewRoot`. Admission reads a bounded no-symlink report from the phase directory, authenticates bytes, requires clean independent local role provenance and the exact source root, and checks that the reviewed commit's complete implementation inventory is unchanged. Imported factory/planner/session/lifetime/serious-league execution paths are explicitly included; planning reports/artifacts are excluded, avoiding circular source hashes. Missing reports, fabricated roots and another-source reports are rejected by tests.

The independent re-review report must include these frontmatter fields (using actual values): `status: clean`, full forty-character `source_commit`, `source_root`, distinct `/root/...` values for `reviewer_agent` and `author_agent`, and `independently_reviewed: true`. This authenticates the actual local reviewer artifact under the approved single-operator workflow; it is not external cryptographic custody or a new authorization literal.

### CR-05: Close canonical retained result and source/HEAD/count joins

Commit `345321d7`. Reader admits bounded canonical result and entry files without symlinks, reopens the exact committed allocation at the current HEAD, requires the closed producer interval and stopped ledger, and derives every expected result field including HEAD, successful count, all measurements and tier. Exact-key/full-value comparison rejects extra fields. Compact record admission enforces classification/code/outcome/cleanup consistency. Tests reject changed HEAD/count/cleanup/extra fields, oversized files and symlinks. Result roots remain immutable while verifier time is recorded separately.

## Actual checks

- Compact and CLI suites: **15 passed**, no skipped tests, synthetic/source-only fixtures.
- Factory and planner regression suites: **124 passed** in the same batch.
- Container-session regression suite: **108 passed** after resolving the isolated worktree's existing workspace dependency links. Total: **247 passed** across five suites.
- Focused strict TypeScript check passed using `tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --strict --esModuleInterop --types node` on the compact module/test and CLI/test.
- `git diff --check` passed; changed sections reread.

The worktree's `pnpm exec` freshness hook initially refused symlinked dependency directories; no installation occurred. Existing direct `node_modules/.bin/vitest` and `tsc` binaries were used. Missing isolated package links initially prevented module resolution; adding ignored links to the existing main-checkout dependency directories resolved this without source/dependency changes.

## Scope and handoff

No real preparation/allocation/capacity mode, provider, Docker/container, Strategy/Match/model execution, holdout, formation materialization, counted/public/production route or empirical reader was run. Historical readers/defaults/policies/failed routes/zero-byte reservations are unchanged. Plan 265-16 still owns matched stage extension, carrying forward every pilot/failure/verifier interval and charge; it must never initialize another budget or reinterpret the pilot as competition evidence. Independent re-review and applicable source gates precede the root-only actual pilot.

Source commits are on `gsd-reviewfix/265-lean-15`, based on `006407a153ed7a193f924a18fa5963822b76d77c`, final source `345321d725923dd151a6b9094d81fae588f5a3f6`. This report is intentionally uncommitted for the root workflow.
