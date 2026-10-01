---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-10-01T02:17:30Z
reviewer: /root/review_266_06_repairs
depth: standard
status: scoped_clean
source_commit: f10e0a84ed04a1a95e85a2530f70d719f39b9f9f
source_tree: 036385672976bd7dac4e85f220d3f3f5c5449048
diff_base: c6e585917f6c8fa39d26df4c04a2f0ed2885fd73
files_reviewed: 2
files_reviewed_list:
  - scripts/fixtures/current-freeze-assessed-round-target-fixture.ts
  - scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
task3_complete: false
qualifying_48_workload_history_verified: false
full_positive_map_verified: false
empirical_authority: false
---

# Plan 266-06 preliminary repair review: f10e0a84

## Scope

Fresh independent standard-depth review of both complete pinned files, not a carried-forward disposition. The exact repair delta and necessary unchanged admission schema, physical candidate-closure reader, prospective roster validation and ordinary matrix/round/tactical/role contracts were traced. The GSD code-review skill/workflow, AGENTS and authoritative main Plan266-06/latest partial handoff govern this bounded review. Explicit two-file scope overrides broader phase discovery; no fix/all/auto or structural pre-pass was requested. Repo-local skill directories are absent.

The previous `c6e58591` issues-found report remains unchanged, SHA-256 `5e928ad5de99629173c326d3f6e75819d165fed7dc3ce4a5a7b70b7f37448d92`. This report records closure only at the new exact bytes. No final REVIEW, SOURCE-REVIEW, SUMMARY, Task3 or state artifact is altered.

No tests, constructors, assessors, replay/profile, real/private-store reads or operational paths were executed by this reviewer. No source/state edit or commit was made. The sole write is this new report. Root-reported QA below is not independent reproduction.

## Exact source authentication

HEAD, tree and direct parent match the authenticated pins above; the source worktree is clean. The delta changes exactly the two scoped paths. Both complete pinned files match their supplied Git blobs and SHA-256 values, neither path is ignored, and the exact delta passes whitespace checking.

| File | Lines | Git blob | SHA-256 |
|---|---:|---|---|
| `scripts/fixtures/current-freeze-assessed-round-target-fixture.ts` | 172 | `6dc9e9b968fbf74beb7b272ee43c8ea4735975db` | `2fa2beec80c5037bf147e3dbbeafa9a6ef9a7123c4058bdfaf73dab8200abbe9` |
| `scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts` | 391 | `4e4b8bdf30a0be5e250677fe2fcd2a78a96ef936` | `d4d20c8376bf1cbbff50f35b424a055482444ffc352fc0cf0f4562fe9098e6e8` |

Existing history/import/matrix/policy/legacy contracts remain unchanged by this repair. Reference tracing does not constitute broader renewed approval.

## Narrative Findings (AI reviewer)

Zero remaining actionable findings in the exact two-file scope. This disposition follows direct source and edge-case analysis, not an inference from root's passing tests.

### CR-01 closure mapping

| Prior finding | New evidence | Disposition |
|---|---|---|
| `c6e58591` CR-01: source-copy writer could pair a genuine second-candidate closure with the first candidate's admission | Helper lines 66-82 independently parse/reopen and join every candidate before any publication; lines 100-104 publish only retained validated bytes and parsed admissions. Test lines 246-272 cover genuine full/source/publication/last-row substitutions with zero writer calls and unchanged stores. | Closed at `f10e0a84`; previous failing epoch preserved. |

The new complete read-only candidate pass parses `LeagueCandidateAdmissionSchema`, so admission domain roots, candidate metadata, tuple/runtime and embedded evidence must validate independently. `readCandidateClosure` reopens the exact publication, packet, proposal, validation and source bytes, validates their schema/domain/physical identities and returns a fresh source-byte copy. The new consumer then compares the parsed admission candidate with that reopened candidate, joins row publication to closure publication, joins tuple/runtime to allocation, and checks factory/closure/output repository separation (helper lines 69-77).

Source identity is now independently checked against the admission: closure source root, actual SHA-256 digest, admission source root and `sha256`, exact byte length and `utf8` encoding must all agree. The old same-history full closure substitution therefore reaches a real candidate mismatch rather than being labelled from the unrelated outer row. Source-only or publication-only substitutions fail the physical closure contract or the explicit join. No numeric threshold, policy, receipt issuer, private-store validator or operational gate is weakened.

The `candidates.map` validation pass must finish for all three roster members before control reaches retained matrix reading, round declarations or the first `publishFactoryArtifact` at line 101. None of the new pass's callees publishes or repairs a store. A valid early row cannot be published while a later row remains unchecked. The write pass uses only the locally retained parsed admission, validated source root and fresh byte copy; it does not reopen a supplied closure or relabel bytes from an unchecked candidate (lines 100-104).

### Canary is independent of the writer's own throw

The new cheap canary precedes positive round-target construction and reuses the held matrix. It preserves original admission/publication references while replacing the closure in a frozen outer clone. Cases include the original genuine full second-candidate closure swap, source-only swap, publication-only swap and a genuine first-candidate closure substituted into the last row (test lines 246-265). The last-row case specifically checks that both preceding valid rows remain unpublished.

The writer spy throws `publication forbidden`, while the expected rejection must match `CANDIDATE_CLOSURE|SOURCE_CLOSURE` (lines 256, 266). Thus merely reaching the writer and catching its throw cannot satisfy the expected error. Every case separately asserts that the actual writer spy has never been called, without clearing cumulative call history (line 267). Sorted filename/length/SHA-256 snapshots of all three generated stores must remain unchanged, operational spies remain unused, and the writer spy is restored in `finally` (lines 269-271). This closes both the wrong-source association and early-publication regression checks without a duplicate expensive constructor or enlarged deadline.

### Remaining reviewed boundaries

The full helper still matches the ordinary source-copy and role formats: `disclosedFile`, development target/weights, tactical jobs 0/3/6, and final packets without development/tactical feedback. Final `authoringTargetArtifactRoot:null`, independent-evaluation domain roots and exact packet-byte/role checks remain intact (helper lines 123-141, 159-171).

Four same-population empty-admission rounds remain explicitly metadata-only; three continue and one data-only closed result do not claim actual league closure. Later corpora are rebuilt from retained canonical cells under distinct round roots, not relabelled round0 bytes. Generated response-store metadata is the only write scope; history and league stores remain read-only. No accepted counter, successful response terminal, charged response execution, actual probes/evaluation/report/marker, operational route or checked-map capability is manufactured. Source/compiler/native/custody/clock and all operational/empirical/freeze authority limitations remain false or unverified (lines 142-155).

The complete test file retains the previous five matrix checks, three role/round tests, all setup stages and original deadlines. It adds only the scoped CR-01 refusal canary and writer namespace import. The normal positives still check all eleven role packets, exact source fields, unchanged history/league bytes, distinct round corpora and actual later tactical reopening. Existing negative packet/closure and physical missing/corrupt-parent tests remain present. Teardown still owns only exact generated roots; diagnostics expose bounded metadata rather than source/private memory/objectives.

## Independent checks

Read-only commands included:

```text
git rev-parse HEAD HEAD^{tree} HEAD^
git status --short
git diff --name-only c6e585917f6c8fa39d26df4c04a2f0ed2885fd73..f10e0a84ed04a1a95e85a2530f70d719f39b9f9f
git ls-tree f10e0a84ed04a1a95e85a2530f70d719f39b9f9f <both scoped paths>
git show f10e0a84ed04a1a95e85a2530f70d719f39b9f9f:<each scoped path> | shasum -a 256
git show f10e0a84ed04a1a95e85a2530f70d719f39b9f9f:<each scoped path> | nl -ba
git diff c6e585917f6c8fa39d26df4c04a2f0ed2885fd73..f10e0a84ed04a1a95e85a2530f70d719f39b9f9f -- <both scoped paths>
git check-ignore <both scoped paths>
git diff --check c6e585917f6c8fa39d26df4c04a2f0ed2885fd73..f10e0a84ed04a1a95e85a2530f70d719f39b9f9f
shasum -a 256 <prior c6e58591 report>
```

Pins, scope, hashes, whitespace and unchanged prior report authenticate. No source-test, TypeScript or lab-boundary gate was independently rerun. No fixture/store reader was executed by this reviewer.

## Root-reported QA, not independently reproduced

Root reports the sole serialized one-test-file gate passed 9/9, exit 0, in 1256.58 seconds on these exact bytes:

```sh
pnpm exec vitest run scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts --maxWorkers=1 --reporter=verbose --disableConsoleIntercept
```

One shared v3 history/import/matrix setup is retained. Reported old-check durations are 24 ms, 58 ms, actual matrix/tactical reopening 139424 ms, imported negatives 1259 ms and parent negatives 3051 ms. The new CR-01 canary takes 1331 ms under its unchanged default 5000 ms deadline. Metadata creation takes 37205 ms and later tactical reopening 36882 ms within the original 600000 ms bounds; remaining cheap denials take 1020 ms. No operational spy calls are reported.

Reported diagnostics remain 24 fixed-mock genuine pure-kernel WINs, 552 accounting entries, eleven role packets, four empty-admission metadata rounds, three round corpora, zero accepted counters and eleven unfilled metadata slots. Root reports all specified generated-store byte-stability assertions pass. Extra-strict two-file non-emitting TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), staged whitespace and lab boundaries pass, with 1361 files and zero violations.

The earlier `c6e58591` 8/8 gate and optional no-unused probe failure on ten existing transitive declarations are separate retained evidence. No new no-unused pass, aggregate/full suite or independent QA reproduction is claimed here.

## Disposition and remaining boundaries

`scoped_clean`: CR-01 closed and zero remaining actionable findings in these exact two complete files. The c6 failing review epoch is preserved; closure applies only to the authenticated f10 bytes and tests.

This is not qualifying operational 48-workload history, Strategy behavior/compiler/native/custody/clock proof, actual response/league execution or closure, complete probe/evaluation/report/marker graph, whole-map derivation/rederivation, complete store union, full applicable repository suite, final Plan06 Task3, Plan02 consumption, empirical or freeze approval. All real operational/provider/model/preflight/holdout/formation/public/counting paths remain closed. Root reports the branch remains isolated, unmerged and unpushed; consumed Plan265-07/09 and exact human Plan265-12 boundaries remain unchanged. No source or state commit is made. Review slot/source freeze is released when this report is returned.
