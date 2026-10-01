---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-10-01T01:43:28Z
reviewer: /root/review_266_06_repairs
depth: standard
status: issues_found
source_commit: c6e585917f6c8fa39d26df4c04a2f0ed2885fd73
source_tree: 0379f1d97ef3811f1fb5481632d85689ab1ffa19
diff_base: fa588338ff99dca907316ed95a15142fc9d53520
files_reviewed: 2
files_reviewed_list:
  - scripts/fixtures/current-freeze-assessed-round-target-fixture.ts
  - scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
task3_complete: false
qualifying_48_workload_history_verified: false
full_positive_map_verified: false
empirical_authority: false
---

# Plan 266-06 preliminary constituent review: c6e58591

## Scope

Fresh independent standard-depth review of exactly the new assessed-round-target helper and complete assessed-matrix test file. Both complete pinned Git files were read. Directly necessary unchanged references were traced: ordinary league target-source/development/final-role writers, prospective roster validation, candidate-closure reader, canonical matrix constructor, round declaration/advance, solver result fields, tactical corpus builder/reader and response authoring-role boundary. AGENTS, the fully read GSD review skill/workflow, authoritative main Plan266-06 and latest partial handoff govern this review. Explicit file scope overrides broader phase discovery; no fix/all/auto behavior or structural pre-pass was requested.

No test, constructor, assessor, replay, profile, real/private-store reader or operational path was executed by this reviewer. No source/state edit or commit was made. The sole write is this new report. Every prior report remains unchanged. Root-reported QA is separate from independent static analysis.

## Exact source authentication

HEAD, tree and direct parent match the pins above. The isolated source worktree is clean. The delta changes exactly the two scoped files; independently read committed bytes match the supplied blobs and hashes. Neither path is ignored and the exact delta passes whitespace checking.

| File | Lines | Git blob | SHA-256 |
|---|---:|---|---|
| `scripts/fixtures/current-freeze-assessed-round-target-fixture.ts` | 154 | `e99dea6f5a104e5af463d47da494eb40f92f2d50` | `632bdac989f5309cd7b9557ab148afda281695f26fa38258a930d1ea2773892f` |
| `scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts` | 362 | `358be409600047fc43b08563b87ad5ee0baf80ec` | `b181f0fe4040f3384b56c208dcec89842db4fe84349df02ef4094aa0ae2c6fd1` |

Existing history/import/matrix/policy/legacy source remains unchanged by this delta. Reference tracing is not a renewed whole-module or whole-source approval.

## Narrative Findings (AI reviewer)

### CR-01: Source-copy writer does not join the reopened closure to the candidate admission — BLOCKER

**File:** `/Users/roryquinlan/.codex/worktrees/phase266-context/cowards-game/scripts/fixtures/current-freeze-assessed-round-target-fixture.ts:82-86`

**Issue:** The new writer reopens `candidate.closure`, copies that closure's source bytes, then labels them with `candidate.admission.candidate.root`. Its only source equality at line 84 compares the copied root with the same supplied closure's own source root. It does not check that the reopened closure candidate equals the admission candidate, that the closure publication equals the row publication, or that the source root/length matches the admission.

The earlier prospective validation at line 58 cannot close this gap: `validateProspectiveLeagueInitialCandidates` compares the admission/publication/import evidence with the amendment, not the closure. Lines 59-64 compare only repository directories. Retained matrix checks at lines 65-70 do not consume candidate closure identity either. `Object.isFrozen(held)` checks the outer container, not an immutable issuer brand or every nested join.

**Static counterexample:** Start with a valid held fixture and form a frozen outer clone whose matrix input has a cloned first candidate row with its original admission/publication retained, but `closure` replaced by the second candidate's genuine closure from the same generated history. Keep all allocation, population, snapshot, cells, solver, round and corpus fields unchanged. The prospective admission checks and same-directory checks still pass; the retained matrix and round/corpus joins remain exact. `readCandidateClosure` legitimately reopens the second candidate and its source. Line 84 passes because the copied bytes match that swapped closure. Line 85 nevertheless assigns the first candidate's root. The helper publishes and returns target packets associating candidate1 with source2, while claiming the unchanged imported population. This counterexample was traced statically; it was not executed during review.

The unchanged matrix helper explicitly checks admission candidate equality with the reopened closure candidate (`current-freeze-canonical-matrix-fixture.ts:66-70`), but that earlier constructor check is not re-established at this new publication boundary. The new packet reader only compares physical bytes with the already constructed expected packet (lines 144-153), and the tactical reader checks round/corpus rather than these source-copy rows, so neither is a substitute for this join.

**Impact:** Incorrect retained candidate/source associations in this synthetic constituent. This is a source-identity correctness defect, not a claim that operational/empirical authority was bypassed. The later complete parent-map gate must still reject such associations; its incompleteness does not make this writer's incorrect metadata acceptable.

**Fix:** Before the first publication, perform a complete read-only pass over every candidate. Parse the admission, reopen the closure, and require exact equality of the admission candidate and reopened candidate; exact row-publication/closure-publication identity; exact admission source root/byte length and copied-source digest; and the existing tuple/runtime/repository joins. Only after all rows validate should source copies, allocation/corpus and packets be published. For example, reuse the same admission/closure comparisons as the unchanged matrix helper and retain the validated source bytes for the subsequent write pass.

Add a cheap shared-setup canary that substitutes another valid same-history closure while preserving the original admission/publication, expects rejection before any writer call, and snapshots all three generated stores unchanged. Include publication-only/source-only closure substitutions as appropriate. This needs no second history/import/matrix construction or altered timeout/policy.

No additional actionable finding was proven in this bounded scope. The passing ordinary-path tests do not cover or resolve CR-01.

## Other bounded review observations

The ordinary target formats match the unchanged producer: source-copy fields include `disclosedFile`; development packets include the round-bound target/weights; tactical packets are confined to job ordinals 0/3/6; final-role packets contain only `roundRoot`, `candidateRoot` and source rows, with no development `targets` or tactical feedback. Their independent-evaluation roots match the ordinary allocation/role/final-snapshot domain, and `authoringTargetArtifactRoot:null` preserves the actual response author's final-role omission (helper lines 105-123, 141-153).

Four round declarations use the same unchanged snapshot/solver/population but distinct response-allocation roots. Empty admissions produce three continue results and one data-only closed result through the actual round API, while `metadataOnly:true`, absent terminals and `leagueClosureVerified:false` explicitly deny actual league closure (lines 71-79, 124-137). Round0 equality plus its physically reopened corpus protect the original branch; later corpora are rebuilt using the actual retained canonical cells and each new round root, not relabelled round0 bytes (lines 88-103). No accepted counter or successful response terminal is manufactured.

Only the already generated response store receives source-copy/corpus/target metadata writes. History and league paths are checked as resolved fixture paths; neither is written or removed by this helper (lines 39-70). The new helper performs no cleanup; existing teardown owns exact generated roots. All authority/source/compiler/native/custody/clock/probe/evaluation/report/run/formation/holdout/public/counting limitations remain explicit. These boundaries do not excuse the missing candidate/source join above.

The complete test file preserves its five existing checks and deadlines, adds authoring/response operational-denial spies, and constructs the metadata once on the shared held matrix. New positives check all eleven role packets, four empty-admission rounds, three distinct corpora, source fields and unchanged prior target/history/league bytes (test lines 245-324). Reopening checks exact packet bytes and the actual later tactical contexts once each with three-store byte snapshots (lines 326-344). Cheap negatives check premature closure, stale-round packets, final-role authoring feedback and unknown jobs (lines 346-361). They exercise packet-role boundaries, not a hostile candidate/closure join at the new writer. Diagnostics expose bounded roots/counts/roles, not source, private memory or objectives.

## Independent checks

Read-only commands included:

```text
git rev-parse HEAD HEAD^{tree} HEAD^
git status --short
git diff --name-only fa588338ff99dca907316ed95a15142fc9d53520..c6e585917f6c8fa39d26df4c04a2f0ed2885fd73
git ls-tree c6e585917f6c8fa39d26df4c04a2f0ed2885fd73 <both scoped paths>
git show c6e585917f6c8fa39d26df4c04a2f0ed2885fd73:<each scoped path> | shasum -a 256
git show c6e585917f6c8fa39d26df4c04a2f0ed2885fd73:<each scoped path> | nl -ba
git check-ignore <both scoped paths>
git diff --check fa588338ff99dca907316ed95a15142fc9d53520..c6e585917f6c8fa39d26df4c04a2f0ed2885fd73
```

Authentication, exact scope, hashes and whitespace pass. No QA or fixture/store reader was independently executed.

## Root-reported QA, not independently reproduced

Root reports the sole serialized one-test-file gate passed 8/8, exit 0, in 1238.22 seconds:

```sh
pnpm exec vitest run scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts --maxWorkers=1 --reporter=verbose --disableConsoleIntercept
```

It uses one shared v3 history/import/matrix setup; all five preceding assertions and deadlines remain unchanged. Reported old-test durations are 23 ms, 60 ms, actual matrix/tactical reopening 137319 ms, identity negatives 1199 ms and physical-parent negatives 3041 ms. New metadata creation took 37612 ms and later tactical reopening 36658 ms under the predeclared 600000 ms bounds; cheap denials took 1018 ms under the ordinary 5000 ms default.

Reported diagnostics are three imports, 24 fixed `TURN_TO_STONE` genuine pure-kernel WIN outcomes, 552 accounting entries, nine development/two final-role packets, three distinct round-bound corpora and zero accepted/eleven unfilled metadata slots. History/league bytes reportedly remain unchanged across response-only metadata writes; all three generated stores remain byte-stable across readers; no instrumented operational API is called.

Root-owned two-file extra-strict non-emitting TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), staged whitespace and lab boundaries reportedly pass, with 1361 files and zero violations. The optional added `noUnusedLocals`/`noUnusedParameters` probe exited 2 on ten existing transitive unused declarations, none in the owned paths; that optional probe is not a passing selected gate. These are root-reported results, not independent reproduction or proof against CR-01.

## Disposition and remaining boundaries

`issues_found`: one BLOCKER, zero WARNING, one total actionable finding in this exact two-file preliminary constituent. Repair CR-01, add its refusal/unchanged-store canary, commit changed bytes, run the appropriate frozen gates and seek a fresh exact-source review. No passing disposition is carried across a successor epoch.

This is not final Plan06 Task3, qualifying operational 48-workload history, source/compiler/custody/clock proof, actual response execution/terminal or league closure, probes/evaluation/report/marker, whole-map derivation/rederivation, complete store union, Plan02 consumption, empirical approval or freeze authority. Real operational Match/preflight/route/native/provider/Strategy/model/holdout/formation/public/counting paths remain closed. Root reports source remains isolated, unmerged and unpushed; consumed Plan265-07/09 and human Plan265-12 boundaries remain unchanged. No prior report, final review, source review, summary or state is altered. Review slot/source freeze is released when this report is returned; the reviewer makes no commit.
