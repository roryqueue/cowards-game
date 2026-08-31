---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "142"
reviewed: 2026-08-31T14:12:25Z
review_type: open_plan_source_fix_rereview
prior_review: 262-142-CODE-REVIEW.md
reviewed_worktree: /private/tmp/sv-262-142-reviewfix-z0iT5d
subject_commit: 61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3
subject_tree: 2a9c91f3d17884529fc5bf0d3a5233dbbb844c62
subject_parents:
  - 87466749708bc90bb829848bae14d792b9dc26aa
fix_commits:
  - 918b6f32fe78d23fd201b8e169b0cf13c3e94eb2
  - 87466749708bc90bb829848bae14d792b9dc26aa
  - 61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts
  - scripts/check-v1-38-plan-262-142-live-v13-custody-v10.test.ts
source_blob: cf839872092ffa1a135a8b0a5452122a5957b5a6
source_sha256: 902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1
test_blob: 7a70bace6ed5833f2613389743d46a314d3a91d3
test_sha256: b7bbdcc45a23c49a095d654509cf53db849c8fd1fd997ccd2a0eccd0dcf546ea
resolved_findings:
  - CR-01
  - WR-01
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
independent_targeted_tests:
  passed: 2
  skipped: 7
full_suite_status: pending_separate_frozen_source_run
---

# Phase 262 Plan 142: Source Fix Re-review V2

## Summary

No remaining or new findings were established in the focused deep re-review of the two fixes at the exact frozen commit above. The previously demonstrated redirected-absence lookup is replaced by an authenticated retained-directory lookup, and the formerly masked semantic tests now reach the pure genuine-to-stable validation boundary with repaired enclosing digests. Both independently selected cheap regressions passed.

This clean **source-review** disposition is not a full-suite pass, Plan142 Task3 closure, Plan143 execution, publication, or live authority. The separate nine-test frozen-source run was still pending when this report was written. Its final result must be joined to these exact source/test identities before closure; the main checkout had not been assumed to contain the fixes.

## Narrative Findings (AI reviewer)

No outstanding BLOCKER or WARNING findings were found in this re-review scope. The original report remains immutable history; its two findings are resolved for this subject commit only.

## Prior Finding Dispositions

| Prior finding | Disposition | Evidence |
| --- | --- | --- |
| CR-01 — redirected final absence lookup | Resolved | Source lines 389-411 call the existing retained-directory batch reader for all eleven destinations, authenticate the reader/bootstrap bytes before and after, reject a symlinked supplied root, and compare the batch device/inode with both the sampled and authenticated root identities. The targeted actual-native ABA regression passed. |
| WR-01 — masked semantic mutation tests | Resolved | Source lines 624-638 expose a pure validator without provenance or eligibility authority. Test lines 113-178 repair observation/aggregate digests, directly exercise ten semantic mutations, assert intended error codes, and independently compute ordered stable record and aggregate roots. The targeted structural-fixture matrix passed; test lines 356-372 apply that same matrix to a captured genuine transcript in the separately running full suite. |

## Retained-Directory Boundary and Custody

- Traced the new call through `readV138WorkspaceBatch` in `scripts/lib/v1-38-secure-workspace-path-v6.ts` to the unchanged `scripts/native/v1-38-secure-manifest-reader-v6.c`. The batch opens/retains the root, duplicates it into child fd 3, acquires each ancestor with `openat(..., O_DIRECTORY | O_NOFOLLOW)`, retains the ancestor descriptors, and performs final `fstatat(..., AT_SYMLINK_NOFOLLOW)` checks accepting only exact ENOENT. Directory-generation and absence checks surround the batch work.
- The supplied root is checked before helper canonicalization. Batch root device/inode is compared with the pre-call identity and, for builder/authenticator paths, the freshly authenticated root identity. The named root's complete recorded identity is checked again afterward. Descriptor-bound absence is not represented as a promise that named filesystem state cannot change after return.
- The three reused helper identities are checked against the immutable executor archive and against supplied-root bytes, while the actually imported implementation-root helper bytes are checked around each batch call. Independently recomputed their SHA-256 values and matched all three pins: reader wrapper `f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49`, private bootstrap `165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78`, native reader `fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1`.
- Read the existing bootstrap's compiler/source/output custody and explicit single-operator local-seal limitations. The fix reuses that existing path; it does not claim hostile-same-UID pathname-launch isolation or introduce a new native helper.
- The native regression at test lines 279-334 starts from the pinned C source and inserts a test-only scheduler around the actual final `fstatat`. On call 44 (the last lookup of four eleven-destination passes), it performs real rename/symlink operations, verifies that the named ancestor is a symlink and the retained descriptor still identifies the renamed original directory, calls real `fstatat`, restores the ancestor, and requires the scheduler marker. The surrounding wrapper receives the real child result and unchanged eleven-path batch input. Thus the test permits safe retained-directory resolution, not the prior erroneous lookup through the temporary symlink. The uninstrumented absence control and explicit supplied-root symlink rejection also execute in this test.

## Semantic Test Boundary and Regression Scan

- The new exported seam calls the same private `validateExecution` function used by the genuine builder, validates the supplied root-hash syntax, returns only normalized stable records, and returns false Plan143/Plan110/execution authority. It neither runs an executor nor inserts entries into the private provenance tables. Generic errors are normalized through the existing public error sanitizer.
- Mode/order/status, reduced value, native order/omission/root, producer guard, producer calls, and execution authority are mutated at that pure boundary. Enclosing observation and aggregate roots are repaired; the native-order case also repairs native and local-execution roots, so it reaches the actual ordered native-path predicate. Expected semantic error codes distinguish these refusals from stale-hash or provenance failures.
- Independently inspected the final test-only delta `87466749..61c8ff9e`: it extracts `repairExecutionClosure`, has native omission repair both native and local-execution roots, and has the deliberately incorrect native root repair only its enclosing local-execution root. The outer observation/aggregate repair remains in place. This removes the two remaining stale nested-digest rejection paths without repairing away the defect each fixture intends to test. The production source blob and SHA-256 are unchanged.
- The test's `baseline()` calls the real process launcher and captures its actual successful Plan142 runner stdout in memory without changing that result. `GENUINE` is not populated by the structural fixture. The same mapping assertions are applied to that genuine capture in the full suite, with equality against the builder's stable records/aggregate. This genuine-case execution is **pending external suite evidence**, not claimed as independently rerun here.
- Clone tests now include an unmodified clone negative control and repair payload/carrier roots for modified clones, asserting the precise provenance refusal. Separate stale-hash and authority cases assert payload rejection. The genuine test enumerates fixed zero-effect/false-authority outputs and verifies that a pure semantic result is not accepted as a prospective provenance token.
- Inspected the complete source/test fix diff against the reviewed original, the affected callers, and the final additive test-only correction. Existing runtime inventory pins, private launcher/cache handling, six-mode execution, immutable snapshot logic, native mapping formulas, prospective payload/carrier roots, and provenance issuance remain unchanged except for the narrowly scoped descriptor gate and more specific semantic error codes. No additional concrete regression was established.

## Independent Verification Performed

- Verified final frozen HEAD `61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3`, tree `2a9c91f3d17884529fc5bf0d3a5233dbbb844c62`, parent `87466749708bc90bb829848bae14d792b9dc26aa`, and the source/test blobs and SHA-256 values above. Parent `87466749` has tree `c7fdc4c0e42ee85cfcf76465f16418c4186d62bb` and parent `918b6f32fe78d23fd201b8e169b0cf13c3e94eb2`. The CR-01 commit has tree `52dd1359986938a627a4a2a8d74bc92d2872fd8b` and parent `99fdd53ad34da87e40e7e5607d1488843739f2a2`.
- Independently ran only the two existing targeted regressions on the final commit, using the exact pinned Node v24.15.0 and already installed Vitest entrypoint with caches disabled:

```text
/usr/local/Cellar/nvm/0.40.4/versions/node/v24.15.0/bin/node node_modules/vitest/vitest.mjs run scripts/check-v1-38-plan-262-142-live-v13-custody-v10.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --no-cache --testTimeout=60000 -t 'pure mapping|anchors the actual'
```

Result: **2 passed, 7 skipped; 1 test file passed; 2.51 seconds** (test execution 2.25 seconds). This independently executes the finally repaired structural semantic matrix and existing deterministic actual-native ABA case. It does not execute the genuine six-mode baseline, cross-root rebuilds, runtime mutation matrix, or distinct-root process comparison. A prior 2.25-second run against `87466749` used bare Node and is not the pinned-runtime final verification cited here.

- An initial `pnpm exec` attempt for the same two selected tests triggered pnpm's dependency precheck and aborted with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` before running tests. No dependency installation or purge was approved or performed. The direct installed entrypoint above avoided that precheck.
- `git diff --check` passed, and the frozen worktree remained git-clean after the targeted checks. No source file or repository effect artifact was changed, and no full-suite rerun or commit was performed by this reviewer. Disposable native test files were confined to temporary directories and cleaned up by the test.
- The fixer separately reported an exact-Node two-test pass and direct source/test typecheck pass for final `61c8ff9e`; those reported results are not represented as this reviewer's own typecheck. The orchestrator reported a source-only pass with unchanged production source and runtime count `3931`/root `132282ee…`. The restarted full nine-test suite for final `61c8ff9e` (session 51107) remains pending external evidence. No full-suite result is inferred from either the prior source review or these focused tests.
- The GSD review procedure supplied the artifact/severity format; no new workflow phase or authority was inferred.

---

_Reviewer: gsd-code-reviewer_
_Depth: deep, focused fix re-review_
