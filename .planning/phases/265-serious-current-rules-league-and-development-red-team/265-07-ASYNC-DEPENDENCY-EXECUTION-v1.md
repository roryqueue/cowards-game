# Plan 265-07 supplemental asynchronous dependency repair execution

Status: source implementation ready for root review, not phase or empirical completion.

Executed sequentially in the main checkout from `195aff3ad74e37fc76b5a4b237e7b5a74504df33`, without a new numbered plan, worktree, push, allocation, retained verifier or empirical route. Checked supplement raw SHA-256: `418a71ac72d7970038ad7e3ecab42ecf774e086a44c972b9bb6638cc500b49c8`; check-v2 PASS requirements govern this implementation. Existing planning state, roadmap, project, requirements and old summaries were not edited. Unrelated pre-existing untracked files and locks remain untouched.

## Task commits and actual RED/GREEN evidence

| Task | RED commit / result | GREEN commit / result |
| --- | --- | --- |
| 1: repository pair | `7935043d`; 13 new async cases failed on absent publisher, 14 legacy cases skipped; 1.63s | `60cb5ab0`; complete repository file 32/32 passed, 3.07s; final corrected parameter-table rerun 32/32 passed, 3.04s |
| 2: graph append | `50040024`; 7 new graph cases failed on absent appendInvocation, 5 legacy durability cases passed; 4.29s | `3f2e3f9c`; 12/12 selected passed, 4.93s; final expanded graph/adapter selection 20/20 passed, 17.51s |
| 3: awaited provider retention | `afeefc83`; 3 new cases failed on premature issuance/duplicate capacity callback, 3 legacy cases passed; 2.21s | `c58db886`; final host-bound wrapper/response selection 8/8 passed, 9.36s; ordinary adapter races included in the 20/20 runner selection |

An early Task 1 test run overlapped implementation editing and passed; it was not accepted as RED evidence. Only this executor's repository implementation edits were temporarily restored to the prior committed version, the genuine failing RED run above was captured/committed, and the implementation patch was reapplied. No unrelated changes were reverted.

## Implemented boundary

- Exactly two bounded dependency inputs are snapshotted, validated and deduplicated before suspension. All distinct fresh targets are precharged in input order before writes; refusal preserves prior charges without writing. The default async seam delegates real `node:fs.fsync(fd, callback)`; controlled successful test completions also delegate actual fsync.
- At most two dependency file-fsync waits overlap. Every launched operation settles before fd close, error handoff or link publication. Errors are selected by input order. Exclusive no-follow temporaries, owned-name unlinking, no-overwrite hardlinks, conservative accounting and inspection-only failed residue remain in force.
- Both dependency file syncs precede the real dependency directory barrier; the descriptor retains synchronous file fsync and its final directory barrier. Fresh small ordinary/response records therefore retain three file fsyncs and two directory barriers. No descriptor/head is credited after failed/uncertain publication.
- Canonical preparation is shared with the synchronous graph publisher. One active graph append, pending mutation/dispatch guards, a read-only settlement gate and retention-failure dispatch stop prevent overtaking. Prior committed head, links, artifact bytes and successful charges match the synchronous reference. Existing synchronous, large and stream publication routes retain their sequences.
- Full wrapper invocation lifetime is tracked, including guest execution. Same-wrapper races await it and then reject without another guest, capacity or retention call. Retention is awaited before root-array updates and WeakMap issuance. Shared-graph failure adapters await settlement before failure retention, cleanup and terminals.
- Synchronous close remains synchronous and refuses pending wrapper/graph work without underlying close or successful cleanup evidence. Async owned-cleanup paths wait first; initiating dependency errors survive controlled races and response cleanup handling. Optional response async capability and live pending state are forwarded by graph adapters.
- No resource/runtime/rule/cache/capacity-cadence limit changed. Source-only injected fixtures stop at the first response Match on intentional retention failure; they do not execute submitted Strategies or invoke Docker/model/runtime providers.

## Focused commands

```sh
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/repository.test.ts
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'asynchronous invocation graph retention|graph dependency durability'
./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-league-response-runtime.test.ts -t 'host-bound league behavioral probes'
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
git diff --check
```

Final outcomes: 32/32 repository, 20/20 runner selection, 8/8 host-bound selection; strict named-script types exit0, strategy-lab build exit0, whitespace check clean. All completed focused test commands were below60seconds. These are source-level syscall ordering/error and byte-equivalence checks, not simulated power-loss or empirical throughput proof.

Actual intermediate issues were retained honestly: a response fixture spread eagerly evaluated the pending getter and stalled its direct-close assertion; that process was interrupted (exit130), the live getter was forwarded, and both races passed. Strict script types first rejected two legacy Array.push-return callbacks; equivalent explicit-void bodies corrected them. The lab build then exposed an incorrectly shaped Vitest malformed-pair parameter table; object rows fixed argument delivery and strengthened the intended invalid-second-input checks. No timeout or assertion was relaxed. No unresolved source defect is known from these bounded checks; independent review and the unchanged complete source gate remain outstanding.

Node callback semantics were checked against the [official Node24 filesystem documentation](https://nodejs.org/docs/latest-v24.x/api/fs.html#fsfsyncfd-callback). No dependency installation occurred.

## Exact source handoff

Source HEAD: `c58db886` (before this note's documentation commit).

Six-file diff from `195aff3a` to that source HEAD: 495 insertions,42 deletions. Raw SHA-256 of `git diff 195aff3a HEAD --` followed by the six paths in the order below: `de125476634718a3b6b9b835c093e1611f9343921d270ed131374e60ec1160a8`.

| File | Raw SHA-256 |
| --- | --- |
| packages/strategy-lab/src/league/repository.ts | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| packages/strategy-lab/src/league/repository.test.ts | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| scripts/run-v1-38-serious-league.ts | `53534a6d7c467a2606714137096538f5b3698fbdbb31ec2a8705fb09dcfe11e3` |
| scripts/run-v1-38-serious-league.test.ts | `16766e9807d2c6c0c89309eb7eab289402e632f198255b307ea5aeed388f516a` |
| scripts/lib/v1-38-league-response-runtime.ts | `4ac4da2994bb02d57aeedec2396c00540b1083d7ae6dad7646297830d01e4756` |
| scripts/lib/v1-38-league-response-runtime.test.ts | `5d24ddb75818f4c34bdd5315e4bf4682a82d2a6f02917fcb0858d13bfc831584` |

No tracked files were deleted; no new production network/auth/schema surface or unwired implementation stub was introduced. Self-check: all six modified files and all six task commits exist. Root owns independent scoped review/fixes, the complete unchanged gate and any subsequently authorized fresh bounded measurement. No speedup, complete Match, LEAG requirement, freeze eligibility, phase completion or production certification is inferred here.
