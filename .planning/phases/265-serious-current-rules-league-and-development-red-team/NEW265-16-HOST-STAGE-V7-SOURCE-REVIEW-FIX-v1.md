---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
fixed_at: 2026-10-06T13:38:55Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
source_commit: 15a2adbdfda547b4b1cdc2a49afc0e63cef57873
source_root: sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4
manifest_entries: 888
independently_reviewed: false
empirical_credit: false
phase_complete: false
---

# Plan 265-16 Host-Stage V7: Source Review Fix Report

Fixed CR-01 and WR-01 only. Both require independent human/source verification before admission; this report is implementation evidence, not independent review acceptance.

## Fixed Issues

### CR-01: V7 drops live engine/runtime closure from its fixed-source authority

**Status:** fixed: requires human verification  
**Commit:** c034d1f5  
**Files modified:** `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-host-stage-v7.test.ts`

V7 now starts from the current `leanBaselineSourceManifest()` full factory/engine/runtime closure and adds the exact existing 20-entry supplemental inventory, deduplicated and sorted. V1-v6 manifest definitions are unchanged. The actual source-review admission function is exposed without changing its legacy path; v7 additionally rejects a stale full source root before invoking Git comparison. Dispatch, parent and reader holds still recompute this same full manifest.

Four virtual read-only byte mutations of `packages/engine/src/backstab.ts`, `packages/strategy-lab/src/runtime-bridge.ts`, `packages/runtime-js/src/subprocess-ipc.ts` and `scripts/lib/v1-38-lean-baseline-reuse.ts` change the v7 root and reject stale reviewed-source admission with the same synthetic fixed HEAD. No dependency bytes or real Git state are mutated by these tests. The original RED run had five expected custody/inventory failures; GREEN passed 19/19 dedicated cases.

### WR-01: Stage and successful-reader tests bypass connected boundaries

**Status:** fixed: requires human verification  
**Commit:** 15a2adbd  
**Files modified:** `scripts/run-v1-38-lean-baseline.ts`, `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-host-stage-v7.test.ts`

Extracted only the existing charged evidence/result publication catches and parent receipt handler into small functions used by their actual production call sites. The v7 baseline carry join also has a small testable function, called after actual diagnostic-check authentication, which verifies allocation/version/final-close/closed-time/29-charge bindings. These seams grant no runtime or allocation authority. No general fixture framework or additional source file was created; the complete dedicated fixture remains 307 lines.

Connected tests exercise:

- Actual Match wrapper source/scenario and provider preparation catches, composition catch, and cleanup of both opened mocked providers.
- Actual replay write, slot-terminal append, observation and origin publication, and final result publication catches.
- Actual child classifier -> production parent message handler on a controlled EventEmitter -> optional receipt failure -> mandatory real terminal publication in a fresh synthetic store.
- Parent rejection of stale charge/foreign slot, duplicate, legacy and extra-field receipts, and torn retained charge custody.
- Hostile Strategy getters remain unread at the actual composition catch/classifier; finite receipts contain no private error text.
- Actual new source publications, pair and charge, compact retention/replay, observation/origin/result and terminal producers -> ONE ordinary retained reader in a new synthetic store -> actual immutable-check authentication/full audit accepting one success and 29 cumulative charges -> baseline carry from actual final reader-close.
- Rejection of earlier report-observation clock, foreign allocation/source roots, incomplete reader-close custody, legacy check schema, false acceptance and wrong charge count.

The connected RED run had six expected missing-publication-seam failures; GREEN passed 29/29 dedicated cases. No consumed store or old ordinary reader was used.

## Verification

- Exact scoped suite: `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts scripts/run-v1-38-lean-replay-validation-v6.test.ts scripts/run-v1-38-lean-startup-v5.test.ts --maxWorkers=1` — **3 files / 144 tests passed**, no skipped cases.
- Final hostile-getter addition was then checked with `-t 'captures real'` — **3 selected tests passed**; 26 intentionally unselected cases. No production edits followed the full suite.
- `node node_modules/typescript/bin/tsc --noEmit -p packages/strategy-lab/tsconfig.json` — passed.
- Scoped TypeScript program (NodeNext/ES2022, strict, Node types, noUncheckedIndexedAccess, exactOptionalPropertyTypes false) — no changed-file diagnostics; the one inherited `packages/strategy-lab/src/feasibility-protocol.ts:52` optional-object/JsonValue diagnostic remains. That dependency is byte-unchanged from the review base.
- Modified sections re-read; `git diff --check` passed.
- Final complete raw-byte manifest recomputation: **888 entries**, `sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4`.

The isolated worktree initially lacked ignored workspace dependencies/declarations; local symlinks to existing dependencies/declarations restored the same test environment. Initial missing-dist type errors were environmental, not source regressions. Only the two fix commits are made here; MAIN owns the documentation commit and independent re-review/validation/source-verification gates.

## Limits and Preserved Scope

V7 fixtures deny child-process/Worker/native execution; their only Git identity response is controlled in-memory. All stores are newly created isolated synthetic temp directories and cleaned after each case. The existing startup-v5 control retains its trusted Node-only generated-control test.

The inherited sealed-cold validator and request/source/data admission are controlled fixture seams. Actual v7 publication bytes, allocation/audit/version branches, ordinary reader, immutable-check authentication and time/charge joins remain real. This is not full native parent lifecycle execution, a new empirical authorization, or an audit of consumed predecessor payloads; production predecessor inspection remains unchanged except using the tested accepted-diagnostic carry function.

No empirical/native Match, Docker/provider dispatch, helper preparation, private history payload inspection, consumed reader, policy change, push or new allocation occurred. Same finite five-stage vocabulary and private WeakMap brand; v1-v6 routes, policies and manifest definitions remain intact. Approved 57,600,000-ms cumulative cap, prior 41,943,494-ms carry at 1791290048578, 28 spent charges, 15GB/300 and unchanged runtime/reserve bounds remain fixed. One fresh diagnostic and conditional one36 baseline still require MAIN's independent gates. No cause/resource-feasibility/LEAG/freeze/formation/holdout/public/counted/production/Phase265 completion claim follows.

---
_Fixer: /root/fix_265_host_stage_v7 (gsd-code-fixer); iteration 1._

