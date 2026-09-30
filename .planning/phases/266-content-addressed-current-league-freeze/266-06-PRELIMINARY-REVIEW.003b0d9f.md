---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-09-30T19:08:59Z
reviewer: /root/review_266_06_repairs
depth: standard
status: issues_found
source_commit: 003b0d9f56cfd160349c6d3d0e1a53f2b758197b
source_tree: 4547550e24c008eb506d43be6c815d7a5aa527cd
diff_base: 88b7d695c0d43e1b2a43bfec5c123e8db0ce1485
files_reviewed: 2
files_reviewed_list:
  - scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts
  - scripts/fixtures/current-freeze-canonical-factory-workload-fixture.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
task3_complete: false
full_positive_map_verified: false
empirical_authority: false
---

# Plan 266-06 preliminary constituent review: 003b0d9f

## Scope

Independent standard-depth static review of the two new canonical factory-workload fixture files at the exact commit above. Both complete pinned Git files were read, with directly relevant unchanged workload/start/admission contracts, factory Match construction and fixed-opponent evidence, the production outcome projector, canonical admission, and the kernel/runtime bridge consulted as references. Main AGENTS instructions, authoritative Plan266-06 and the current partial handoff govern this review.

This is not the final Plan06/Task3 source gate, a qualifying 48-workload history, a checked whole-map proof, or empirical approval. No source files, operational routes or policies were changed. No actual private store, provider, guest, Strategy, model, operational Match, formation or holdout was opened or run. No duplicate tests were run.

## Exact source authentication

The isolated source worktree was clean and HEAD, tree and parent matched the supplied pins. The delta adds only the two files below. SHA-256 values were independently computed from `git show` bytes.

| File | Git blob | SHA-256 |
|---|---|---|
| `scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts` | `bf3e23fc470e10af92e0fabc9c3e179bd6b065bd` | `9dfd6e62d4dc707d64e2a8104c951407690ef5cbccc84d780b935c3c3ca09ccc` |
| `scripts/fixtures/current-freeze-canonical-factory-workload-fixture.test.ts` | `f43d439a5dd0ee15710d9819498084ded2ac079d` | `8d5355f1bfef55f36fbbc60ca73772ccd5c1fe648f2312b6ed274a21e864009f` |

## Narrative Findings (AI reviewer)

Two actionable findings remain on these exact bytes. Neither is a claim that a real store or operational authority was compromised.

### CR-01 — BLOCKER: Sparse retained sequences can receive a false replay-equality result

**File:** `/Users/roryquinlan/.codex/worktrees/phase266-context/cowards-game/scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts:217-226`

**Issue:** `sequenceSame` checks equal lengths and then calls `left.every(...)`. JavaScript `every` skips holes. An otherwise genuine fixture can replace `execution.transitions`, `execution.result.events`, or `execution.accounting` with `new Array(original.length)`. Every indexed retained entry is then absent, yet the comparison succeeds. The replay record list and terminal state can remain intact, allowing the verifier to return `replayEqual:true` at line 227 without equality of the retained execution sequences. There is no preceding whole-sequence admission that rejects these sparse arrays. An overridden array `every` method also must not become the comparison authority.

**Fix:** Require a dense, ordinary retained sequence and compare each integer index using an implementation-owned loop. Validate own indexed data descriptors before reading values, reject holes/accessor indexes or unexpected array properties, and retain the existing per-row canonical comparison and bounds. Add isolated negative tests replacing each of the three execution sequences with a same-length sparse array; all must refuse rather than return replay equality. This fixes the data-only fixture contract without granting source, supervision, import or empirical authority.

### WR-01 — WARNING: Outer binding accessors execute before canonical admission

**File:** `/Users/roryquinlan/.codex/worktrees/phase266-context/cowards-game/scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts:191-194`

**Issue:** The entrypoint accesses `input.candidateIssuer` and destructures/spreads `input` before `admitBinding(raw)`. `exactLabKeys` checks only `Object.keys`; it does not validate own data descriptors or the prototype. An enumerable outer `workload`, `recipe` or other metadata getter therefore executes before canonical admission and its return value is materialized as ordinary data. An outer custom prototype is likewise lost during the spread; hidden fields can be discarded without detection. The original hostile outer object is never admitted, contradicting the before-traversal/accessor-refusal boundary stated at lines 52-53. The trusted issuer seam does not require metadata getters to be executed.

**Fix:** Before reading any outer value, validate the outer prototype, complete own-key set and own enumerable data descriptors. Extract metadata only from those validated descriptor values, then canonical-admit it. Inspect the issuer container's exact data descriptors before reading `issue` and `verify`, while preserving those explicitly trusted functions. Add cheap getter-not-called, hidden-field, symbol-key and custom-prototype refusal canaries, with issuer calls absent on refusal. Do not relax the existing metadata or issuance checks.

## Other traced boundaries

No additional actionable issue was identified in the bounded review. Workload and attempt roots are revalidated and joined to the canonical workload artifact bytes; candidate packet/source/native-lane identity, authorization, tuple/image/runtime limits, attempt and budget metadata are joined before the pump. Admission issuance, physical source custody and compiler behavior remain expressly unverified.

The pump uses ordinary `buildFactoryCalibrationMatchInput` and pure `MATCH_KERNEL.createMachineV119`/`stepMatch`, not an operational runner. Fixed-opponent identity, empty activation selection, invocation domain, output-byte accounting and ordinal behavior match the unchanged producer. Candidate results parse canonical ABI and Action schemas. Both advance and resume calls pass through the actual 512-call counter; both participants share the 24-request ceiling before issuance. These fixture caps do not rewrite the production workload's 256-invocation/120-second policy or certify wall-clock lifetime.

The terminal is produced by the kernel and passed through unchanged `deriveFactoryCalibrationOutcome`; missing, foreign, FAILED and MAX_PHASES outcomes are not relabelled as DRAW or success. Events are accumulated from actual transition records, not fabricated terminal fields or copied matrix streams. The helper retains private-offline data and its diagnostics print bounded family/side/count/outcome labels only. Every output authority flag remains false; recorded-effect equality is the narrower claim affected by CR-01.

## Independent checks

Read-only commands included:

```text
git rev-parse HEAD HEAD^{tree} HEAD^
git status --short
git diff --name-only 88b7d695c0d43e1b2a43bfec5c123e8db0ce1485..003b0d9f56cfd160349c6d3d0e1a53f2b758197b
git ls-tree 003b0d9f56cfd160349c6d3d0e1a53f2b758197b <both scoped paths>
git show 003b0d9f56cfd160349c6d3d0e1a53f2b758197b:<each scoped path> | shasum -a 256
git show 003b0d9f56cfd160349c6d3d0e1a53f2b758197b:<each scoped path> | nl -ba
git diff --check 88b7d695c0d43e1b2a43bfec5c123e8db0ce1485..003b0d9f56cfd160349c6d3d0e1a53f2b758197b
```

Pins, scope, hashes and source whitespace checks passed. The two findings are statically traced; their focused regressions were not independently executed in this review.

## Owner-reported evidence, not independently reproduced

Root reported 6/6 focused tests in 7.82 seconds with `--disableConsoleIntercept`; each bottom MOVE/top LEFT workload logged 24 mock requests (20 candidate/4 opponent), 145 actual `stepMatch` calls, 121 transitions and a genuine opponent WIN. Root also reported owned non-emitting strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, lab boundaries over 1,354 files with zero violations, and whitespace success. These results do not cover the sparse-sequence and outer-descriptor cases above and are not independent reproductions by this reviewer.

## Disposition

`issues_found`: one BLOCKER and one WARNING require a narrowly repaired successor, focused negative gates and fresh review of its exact bytes. No passing disposition carries over to changed source. Qualifying complete history, whole-map derivation/rederivation, the full applicable suite and final Task3 source review remain open; Plan02 consumption and all empirical/freeze/formation/holdout/counted/public/production authority remain closed.
