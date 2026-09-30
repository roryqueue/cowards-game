---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-09-30T19:39:31Z
reviewer: /root/review_266_06_repairs
depth: standard
status: scoped_clean
source_commit: a9cde354467a82b0bb3d508318c8f8446fe7bdcc
source_tree: 96b02017591240593c39b55ab7a7376aaec78aa9
diff_base: 003b0d9f56cfd160349c6d3d0e1a53f2b758197b
files_reviewed: 2
files_reviewed_list:
  - scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts
  - scripts/fixtures/current-freeze-canonical-factory-workload-fixture.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
prior_findings_closed:
  - CR-01
  - WR-01
task3_complete: false
full_positive_map_verified: false
empirical_authority: false
---

# Plan 266-06 preliminary constituent rereview: a9cde354

## Scope

Fresh independent standard-depth static review of both complete pinned canonical factory-workload fixture files and their direct delta from the failing `003b0d9f` epoch. Directly necessary unchanged workload/start/admission contracts, canonical encoding, ordinary factory Match construction, fixed-opponent evidence and the production outcome projector were consulted as references. Main AGENTS instructions, authoritative Plan266-06 and the partial handoff govern this bounded review. The failing `266-06-PRELIMINARY-REVIEW.003b0d9f.md` remains unchanged.

No source files or policies were edited; no commits or duplicate costly tests were made. No real private stores, operational Match runner, provider, guest, Strategy, model, formation, holdout, counted/public route or operational authority were used. This constituent is not a qualifying 48-workload history, source/compiler/supervision proof, checked whole map, final Plan06/Task3 approval or empirical result.

## Exact source authentication

The isolated worktree was clean. Independently read HEAD, tree and direct parent match the supplied pins. The changed-path set contains only the two scoped files. Both supplied Git blobs and SHA-256 hashes match independently read pinned Git bytes.

| File | Git blob | SHA-256 |
|---|---|---|
| `scripts/fixtures/current-freeze-canonical-factory-workload-fixture.ts` | `36a7c7473a44e5727f15aaf7c51a8d42eae4e537` | `f6420de134785f23172a22fc977cb0d17ac9bf27d45843ad65facdc229a28722` |
| `scripts/fixtures/current-freeze-canonical-factory-workload-fixture.test.ts` | `22b314dfaac0da9fcdab48495be5512e44dc94f8` | `c67d097b1a4c18e58061574eccc1ab9b16b5106d52be477b348a1ea72baeb096` |

## Narrative Findings (AI reviewer)

Zero new or unresolved actionable findings in this two-file scope. The prior findings were independently traced on the new bytes, not presumed closed from test results.

### Prior-finding closure mapping

| Prior finding | Disposition at this exact commit | Source and test evidence |
|---|---|---|
| CR-01 — BLOCKER, sparse retained sequences falsely passed replay equality | Closed in the bounded fixture verifier | Source lines 30-39 require an ordinary array, bounded own length, exactly length-plus-one own keys and an enumerable own data descriptor at every index. Lines 271-284 gate all four sequence containers, inspect every row and canonically admit rows before the pump. Lines 295-301 compare every integer index; no caller array method decides equality. Test lines 207-235 refuse sparse transitions/events/accounting/records, accessor indexes, hidden/symbol properties, custom prototypes, nonenumerable indexes, overridden `every`, and nested row accessors. |
| WR-01 — WARNING, outer accessors ran before binding admission | Closed in the bounded fixture entrypoint | Source lines 16-27 inspect the original object's prototype, full own-key set and enumerable data descriptors before extracting values. Lines 248-252 apply this to both outer input and trusted issuer container before function use or metadata spread. Recursive descriptor inspection at lines 44-67 and 110 precedes canonical metadata admission. Test lines 156-197 assert outer and issuer getters are never called and hidden/symbol/prototype/nonenumerable substitutions refuse without issuance. |

The dense gate cannot trade a missing index for an extra property: every own integer index is required after the exact own-key count check. The verifier first validates fixture, execution and result envelopes without evaluating accessors (lines 264-270). All sequence containers are checked before any row encoding; every row's descriptor traversal is then completed before encoding preceding valid rows or entering the replay pump. This is the specific ordering repair underlying the grouped negative test; no timeout or runtime-policy widening was introduced.

Per-value descriptor traversal rejects cycles, nonordinary containers, hidden/symbol/accessor fields and sparse nested arrays, bounded by existing canonical node/depth/entry limits. Canonical admission remains responsible for scalar validity and byte limits. Each retained row is processed independently rather than buffering the full execution as one canonical value. Replay still rederives the exact request, participant, identity, input root, ordinal, charged/completed flags, invocation commitment, result and output-byte accounting before accepting evidence.

## Unchanged constituent boundaries

The actual workload/attempt/admission/identity joins remain mandatory. The ordinary `buildFactoryCalibrationMatchInput` is used unchanged, including arena, seed, side, initiative, revision and attempt-derived Match identity. Fixed-opponent identity, empty activation selection, STONE fallback, invocation domain and accounting match the unchanged producer. Candidate recipes remain fixed mock decisions parsed through canonical ABI/Action schemas, not behavior of the admitted inert source.

The same pump counts every advance and resume `stepMatch` call toward 512, and checks the shared 24-request bound before issuance. Caller metadata cannot raise either fixture cap. Production workload limits remain exactly 256 invocations and 120,000 milliseconds; returning these limits does not prove wall-clock lifetime or authorize the real runner.

The pure kernel supplies the complete transitions, terminal state and Chronicle events. The unchanged production projector accepts only genuine WIN/DRAW outcomes for the exact players; FAILED, MAX_PHASES, absent and foreign outcomes remain refusals. No matrix stream is relabelled as a factory stream and no fabricated terminal is attached. Scope/issued/source-behavior/compiler/supervision/import/whole-map/empirical flags remain explicitly non-authorizing, and replay does not call the original issuer again.

## Independent checks

Read-only checks included:

```text
git rev-parse HEAD HEAD^{tree} HEAD^
git status --short
git diff --name-only 003b0d9f56cfd160349c6d3d0e1a53f2b758197b..a9cde354467a82b0bb3d508318c8f8446fe7bdcc
git ls-tree a9cde354467a82b0bb3d508318c8f8446fe7bdcc <both scoped paths>
git show a9cde354467a82b0bb3d508318c8f8446fe7bdcc:<each scoped path> | shasum -a 256
git show a9cde354467a82b0bb3d508318c8f8446fe7bdcc:<each scoped path> | nl -ba
git diff 003b0d9f56cfd160349c6d3d0e1a53f2b758197b..a9cde354467a82b0bb3d508318c8f8446fe7bdcc -- <both scoped paths>
git diff --check 003b0d9f56cfd160349c6d3d0e1a53f2b758197b..a9cde354467a82b0bb3d508318c8f8446fe7bdcc
```

Pin, scope, hash and source whitespace checks passed. No fixture runtime suite, TypeScript gate or boundary scan was independently rerun by this reviewer. Static closure does not substitute for those separately reported gates.

## Root-reported QA, not independently reproduced

Root reports exact-byte focused QA at this commit: 13/13 tests in 9.99 seconds, grouped hostile canaries in 111 milliseconds, positive recorded replay in 5.710 seconds, owned non-emitting strict TypeScript including `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`, zero lab violations across 1,354 files and whitespace success. Both unchanged constructors reportedly retain 24 requests (20 candidate/4 opponent), 145 actual kernel calls, 121 transitions and a genuine fixed-opponent WIN: top for the bottom candidate, bottom for the top candidate.

Root also retains an earlier owner repair epoch of 12/13 tests in 23.48 seconds, with the grouped negative exceeding its ordinary five-second harness deadline. The current source moves all-container/all-row inspection ahead of replay work and the final reported epoch is green without widening that timeout or changing operational policy. These are source-test epochs, not operational runs; no passing result is carried across changed bytes.

## Disposition

`scoped_clean`: CR-01 and WR-01 are closed on authenticated `a9cde354` bytes, with zero additional actionable findings in the two-file constituent. The prior failing report is preserved. Complete qualifying history, positive whole-map derivation/rederivation, the full applicable suite and final Task3 source review remain open. Main Plan265-11/12 gates and consumed routes are not regenerated or reinterpreted; no Plan02 consumption or empirical/freeze/formation/holdout/counted/public/production authority follows.
