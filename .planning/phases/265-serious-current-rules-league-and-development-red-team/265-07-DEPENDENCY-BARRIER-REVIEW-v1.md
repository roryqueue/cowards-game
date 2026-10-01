---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-01T23:28:25Z
depth: deep
source_commit: e28f29a06664059cc9f495f1030581ea7835504a
diff_base: 59317b5eed1ed98d3043e5a870718eebe1eb7422
files_reviewed: 4
files_reviewed_list:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
empirical_authority: false
---

# Phase 265 Plan 07: Dependency Barrier Code Review

**Reviewed:** 2026-10-01T23:28:25Z  
**Depth:** deep  
**Files reviewed:** 4  
**Status:** clean within the exact submitted change

## Summary

Independent adversarial review of commit `e28f29a06664059cc9f495f1030581ea7835504a` over `59317b5eed1ed98d3043e5a870718eebe1eb7422`. Read all four scoped files, the exact diff, AGENTS.md, Phase 265 CONTEXT/LEAN-AMENDMENT/Plan 07, and the v3 lifetime diagnosis. Traced the publication primitive, retention accounting, runtime retain-before-return callback, graph reader, terminal/failure paths, implementation inventory, and private import boundaries. Neither project-local skill directory exists; the scoped source files are not Git-ignored.

No actionable introduced correctness, security, or robustness defect was established. This result is not an endorsement of unrelated historical implementation, an empirical result, full source-gate completion, or Phase 265 completion. Phase 266 worktree code is outside scope.

## Narrative Findings (AI reviewer)

No BLOCKER, WARNING, or Info findings.

### Durability and failure analysis

- `repository.ts:75-89,104-115`: fresh dependencies retain their individual file fsync, exclusive/no-follow temporary creation, immutable hardlink publication, temporary unlink, and fresh-target charging. The shared directory barrier follows all dependency publications. Any validation, charge callback, open/write/fsync/close/link/unlink, or dependency-barrier exception exits before successful group return. No error is swallowed by the new helper. Existing-identical dependencies undergo the unchanged bounded type/content check and still require the group directory barrier, including all-existing groups; conflicting bytes/types cannot receive a successful group result. Concurrent target collisions retain the original hardlink failure behavior rather than overwrite or automatic retry.
- `run-v1-38-serious-league.ts:123-147`: batching applies only to `runtime-invocation`, no execution-stream artifacts, and exactly one canonical payload chunk. The payload and its chunk node are the only grouped dependencies; their barrier completes before publishing the unchanged descriptor via the ordinary single-artifact path. Descriptor file fsync and its own directory barrier precede `latestRoot` advancement and append return. Existing descriptor reuse also keeps that final barrier. Other record kinds, multichunk records, execution streams, composed artifacts, journals, starts, and terminals keep their former sequence.
- `run-v1-38-serious-league.ts:63-83,127-133`: prepublication capacity checks, artifact bytes/roots, descriptor links, fresh-target charge order, ordinary-pool accounting, terminal reserve, and charged-but-absent republication rejection are unchanged. The group helper neither refunds nor grants dispatch authority. Directory synchronization has no publication charge, so sharing this barrier does not change the charged resource vector.
- `run-v1-38-serious-league.ts:443-453` and `scripts/lib/v1-38-league-response-runtime.ts:46-54`: the runtime record must be retained before the wrapped evidence is marked issued or returned to the kernel. A failed group therefore cannot become a successful runtime-accounting result; existing enclosing failure/cleanup handling remains in force. Failed descriptor publication does not replace the prior graph head. Content-addressed graph reopening continues to authenticate the descriptor, payload/node chain, and linked closure (`run-v1-38-serious-league.ts:150-190`).

### Interruption residue and frozen policy

Partial residue is intentionally not syscall-for-syscall equivalent: an interruption after the payload hardlink but before the grouped directory barrier can retain fewer orphan names than the old per-artifact sequence. No descriptor has been published by this append at that point. This alters uncommitted residue, not successful-return record durability or an authoritative head. A surviving uncertain descriptor after its final barrier fails is likewise not returned or credited, as before. Later failure writes may flush orphan names; they do not thereby add those records to a successful invocation or create retry authority.

The allocation reservation and durable cell-start journal remain outside batching and precede provider work. Consumed-route, no-refund, unresolved-charge, fail-closed, and inspection-only semantics are not relaxed by this patch. Under the repository's existing file-fsync/directory-fsync contract, no committed-record durability weakening requiring a new frozen-policy decision was found. This conclusion does not assert exact orphan preservation or hardware power-loss certification. New source identities still must flow through the existing reviewed-source/amendment/allocation/capacity gates; the consumed v3 route remains immutable history.

### Validation performed and limits

Executed only the following narrowly selected source-only/injected tests:

```text
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/repository.test.ts scripts/run-v1-38-serious-league.test.ts -t 'graph dependency durability|immutable private league evidence'
```

Result: **2 test files passed; 19 tests passed; 76 skipped**. The tests delegate actual temporary-store filesystem operations and exercise all five fresh-group/descriptor fsync failure positions, mixed/all-existing dependency reuse, conflict rejection, barrier errors, retained charges, exact artifact bytes, unchanged prior head, successful graph reopening, and nonbatched large/other-kind publication.

These tests establish observed syscall ordering and synchronous exception behavior, not simulated hardware crash persistence. Write/link/unlink faults, process interruption, and concurrent publishers were traced in the reused primitive rather than separately fault-injected in this review. No live Match, runtime/provider/model, Docker operation, real preflight/capacity observation, allocation, historical graph verifier, or complete source gate was run. No source file was edited and no commit or push was performed.

---

_Reviewer: independent gsd-code-reviewer_  
_Depth: deep; exact four-file source-change scope_
