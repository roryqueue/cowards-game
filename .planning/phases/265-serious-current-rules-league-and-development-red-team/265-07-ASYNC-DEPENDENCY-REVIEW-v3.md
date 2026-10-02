---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-02T07:36:15Z
depth: standard
iteration: 2
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
base_commit: 195aff3ad74e37fc76b5a4b237e7b5a74504df33
source_commit: 0f4983bb9efa02f1e28dd281d3e064eaf625729b
checkout_head: 0f4983bb9efa02f1e28dd281d3e064eaf625729b
six_file_diff_sha256: c565c91c3fc83e78a5e4b463a22fff0b4661e56d4ec08d7524c5d149cbdb9c11
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Plan 265-07 asynchronous dependency repair: exact-source rereview v3

## Summary

One **BLOCKER** remains: swallowing a transient response-terminal publication failure can return a durable failure head whose ledger claims an unretained terminal. CR-03's original-error replacement is corrected, but the resulting failure-head consistency must be fixed before the root-owned source gate. No broader phase verdict or historical authority is replaced.

Prior six-file full source/test inspections are carried forward after independently measuring all six current raw hashes: repository and response-runtime pairs are unchanged from v2. This focused rereview inspected the entire `b58b8674..HEAD` runner/test fix diff (111 insertions/13 deletions), affected caller control flow and retained-reader structural requirements. AGENTS.md, current STATE, the GSD review skill and new uncommitted review-fix-v2 were read; the checked repair contract, execution note and v1/v2 reviews remain context. No structural pre-pass was supplied.

## Narrative Findings (AI reviewer)

### CR-04 — BLOCKER: transient terminal fault leaves a returned failure head inconsistent with its claimed ledger

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:742-744`, `:790-792`, `:815-820`; reader consequence `:1099`, `:1151`.

**Issue:** Both response-job failure catches assign the terminalized ledger **before** publishing its `red-team-terminal` graph record. The new catch suppresses a secondary terminal-write fault and rethrows the original error. The outer catch decides which starts still need terminal evidence solely from that already-mutated ledger, so it skips this start. If the storage fault is transient, final `run-failure` publication succeeds and the public runner returns a head whose `ledgerRoot` includes the terminal, but whose reachable graph has a charged start and no corresponding terminal.

Concrete source trace: original dependency error A reaches the development catch; `red-team-process-failure` succeeds; line 742 advances the in-memory ledger; line 743's first fresh terminal file fsync fails with B; line 744 suppresses B; the outer catch receives A; line 815 excludes the start because its terminal is already in `ledger.terminals`; line 819 persists a failure head and line 820 returns it. The independent-response path is identical at lines 790-792. The retained reader requires equal start/terminal counts at line 1099 and exact reconstructed ledger/head binding at line 1151, so this claimed failure head fails the existing structural contract. Merely persisting the final descriptor does not make its claimed ledger consistent.

The new `red-team-terminal` transient-fault tests actually select this path: they inject one fresh file-fsync failure for that append and then permit final publication. Their success assertions at runner test lines 468-471 inspect the head kind, primary error message and process validity, but do not assert terminal coverage or its ledger binding. Thus the reported nine-case GREEN does not establish a structurally sound returned failure head.

**Fix:** Do not allow outer failure-head return after an incomplete inner response failure/terminal publication sequence. A minimal safe option is a call-local failure-evidence fault latch set by either inner secondary catch; after the existing outer settlement gate, reject with the initiating object when that latch is set, leaving charges/residue and the last credited head unchanged. Alternatively stage the ledger update until terminal publication is durable, but ensure this does not introduce retry/uncertain-republication or changed publication semantics. Preserve the uninterrupted durable failure-head sequence, original error identity, owned-provider close attempts and all existing budgets/barriers. Do not fabricate a terminal or head, refund, overwrite or retry dispatch.

**Regression required:** Extend the existing bounded actual-public-runner tests for both development and independent transient terminal faults. Under the minimal safe approach assert the identical A rejection and no returned head/credited `run-failure`; retain conservative charges/residue and existing settlement/close assertions. Any case intentionally returning a durable failure result must structurally assert one terminal per charged red-team start, matching start roots and terminal evidence roots, and exact terminalized ledger/head binding—not just the final head's fields. Keep the untouched ordinary successful failure-head regression. The synthetic matrix/probe prerequisites need no expansion into a historical retained-verifier or empirical run.

## Prior findings and preserved boundaries

CR-01 remains corrected: preparation and eligible synchronous fallback failures latch dispatch, while concurrent pending refusal stays outside the catch. CR-02's owned-provider/response cleanup and original-error preservation remain corrected. CR-03 is corrected: development/independent secondary failure writes are guarded, the outer failure-retention catch rethrows its initiating object, and normal complete failure retention still returns `process_invalid`. CR-04 is the specific inconsistent-state edge still present when continuing after a terminal-write failure.

No other actionable defect was found in this bounded rereview. The four unchanged source/test hashes match v2, so the prior two-snapshot/all-settlement fd cleanup, ordered precharges/no refunds, dependency barrier then serial descriptor/final barrier, awaited root/WeakMap issuance, whole-wrapper and synchronous close guards are carried forward. No resource, gameplay, capacity cadence, provider ownership, retry or authority expansion was observed in the two-file fix.

## Independently measured exact source identity

| File | Raw SHA-256 |
| --- | --- |
| `packages/strategy-lab/src/league/repository.ts` | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| `packages/strategy-lab/src/league/repository.test.ts` | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| `scripts/run-v1-38-serious-league.ts` | `a1c66f47e36c6b1fe88acc41b54481f1b6228b8b1f4cf8db9bceb2434ed0a786` |
| `scripts/run-v1-38-serious-league.test.ts` | `c3a3b505a0178ec2175c304d4bb8a8701081ac2e97085c1c0a39bbcc68df2fbe` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `ad75540ffe6853728b69acff058948537ddda564018a540abec1fc2290944c92` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `57bb57d6bd9315ae305684bda5b0736584c76274220d4d97a63218047a39fcfa` |

The six-file diff hash is measured from raw `git diff 195aff3a HEAD --` with paths in frontmatter order. Cumulative six-file diff: 707 insertions/66 deletions. Tracked checkout is clean at the stated HEAD; unrelated work and earlier reports are preserved.

## Evidence and authority limits

The author's genuine RED, final nine-case GREEN (41.58s) and strict type result are reported proof in review-fix-v2, not independently rerun here. Reviewer actions were source/git/filesystem reads and creation of only this report. No source edit, test/import/typecheck/build, profiler, retained verifier, provider/Match/model/Docker execution, capacity measurement, commit or push occurred. No full-gate, speedup, LEAG completion, freeze/formation/holdout, new human literal, revived closed route or production certificate is claimed. All earlier reviews, failed routes and completed profilers remain immutable.

_Reviewer: gsd-code-reviewer; standard scoped source rereview; reviewed 2026-10-02T07:36:15Z._
