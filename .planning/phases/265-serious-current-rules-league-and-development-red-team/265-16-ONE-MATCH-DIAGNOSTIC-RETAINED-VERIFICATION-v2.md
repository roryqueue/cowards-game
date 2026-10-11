---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
verified: 2026-10-11T17:24:48Z
timestamp_basis: post_reader_hash_and_head_observation
status: passed
scope: actual-retained-integrity-only
empirical_disposition: feasibility_not_established
empirical_success: false
actual_reader_count: 1
actual_reader_exit: 0
allocation_commit: 30d61b7df02f594f4fda226bffcaeb101cae64dc
source_head: 165cead9cd236452bc49b6cc45ca19fcd7b8da99
allocation_root: sha256:8ddf0092116ac00397e500ddf897ee14f2038256e7e064f97053859c7cb47f6a
result_root: sha256:b7a87f9a24a6b3918b45e5c424ce345fba4fafea15f502e73b81331258d67ac8
attempted: 1
unused: 0
cumulative_charged: 42
fullChronicleVerified: false
requirements_completed: []
---

# Unique Actual One-Match Retained Verification v2

**Integrity accepted; game failed.** Exactly one assigned ordinary ACTUAL V2 retained-reader invocation closed exit0. This is not the inert fixture reader or a source gate. Its output was verified=true, attemptedCount=1, stopCode=CLEANUP_STOP, fullChronicleVerified=false, feasibilityEstablished=false, resultRoot as above. The native failure is terminal, single-use and consumed: no resume, refund, retry, second game or unused slot exists.

## Actual command

```text
./node_modules/.bin/tsx scripts/run-v1-38-lean-private-matches.ts verify-v2 --allocation-commit 30d61b7df02f594f4fda226bffcaeb101cae64dc --allocation-path .planning/artifacts/v1.38-phase-265-private-match-allocation-v2.json --store .strategy-lab/lean-private-matches-v2/8ddf0092116ac00397e500ddf897ee14f2038256e7e064f97053859c7cb47f6a
```

Reader session73167 closed exit0 after one invocation; polling the same process did not invoke another reader. ROOT entry36488 had already closed exit0 at17:23:17UTC with the one charged result. No runtime or Match was started by this verifier. The actual read-only verifier authenticates allocation/direct-child commit/current HEAD, bounded carried custody, source/runtime identities, pair/debit/ledger and unique failed-row joins, terminal/result raw anchors, finite schema/privacy, resource observations and exact inventory. Acceptance is integrity, never success classification.

## Preserved bytes and HEAD

Before and after the actual reader, HEAD was exactly30d61b7df02f594f4fda226bffcaeb101cae64dc. All following SHA256 byte hashes matched in both snapshots. Canonical allocation and store allocation bytes match.

| File | SHA256 before = after |
|---|---|
| canonical allocation-v2.json; allocation.json | a67980a982c801d36e490a1305457cf7c2c5b5cb63a09c73c44dd6b3c15708db |
| entry.json | b3a2a06ef68a4153ada490d2390035fe7cf345be05872314a107073c08f54769 |
| ledger.ndjson | 1cd50a2df25633f3e88792186e35415da65ed0d006621674dc142547b3e9b8fd |
| pair-0.json | ab7d8722ab998a2dd46ecc0c1826551061243938ca935bd77f2ee10190ecc7f8 |
| debit-0.json | 06fdd8501a82ef78a692b7cf7f9efab536f1413b483e8b6a718c56bf5b27d9c4 |
| terminal-0.json | b161e5e670fa31f121b7ff6815fafa0edd0483cb1158ac6dc7f3e8a7dedbdb2c |
| replay-0.ndjson | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| result.json | 2244c3ce896c77c357e97e6de471df6d59ebe22a0f3b577f692e68c2eedba436 |

Exact eight-file inventory contains no ordinal1, retry or extra artifact. Store directory0700; all eight regular files0600/singlelink; canonical allocation0644/singlelink. Terminal rootsha256:2be5fc99bd89aadabcd1060d7feb3616bc688b71d6af83ffd8ef88f695c4a8e3 joins the result anchor and raw hash above. Allocation/source/debit/provider identities are not replaced by caller-generated verification input.

## Finite observed outcome

Terminal classification system_failure, elapsed27696ms, cleanupComplete=true, boardEvidenceAvailable=false, zero replay bytes/rows and no completed outcome. Result attemptedOrdinals=[0], unattemptedOrdinals=[], cumulativeCharged42, stopCode=CLEANUP_STOP. The closure code does not negate terminal cleanupComplete=true or imply observed physical cleanup failure; it also does not make the failed game successful.

Authenticated diagnostic availability=available, originAvailability=available, finite codeSUBPROCESS_EXIT, methodsoldierBrain, provider-local ordinal81, stageexecutor, reasonunknown. Independent bounded projection counted164 accounting rows, exactly one charged system_failure; identity/invocation/request/input/method/ordinal diagnostic joins all equal that row. Diagnostic1917UTF8bytes below4096. The runtime code/origin capture is more informative than generic SUPERVISOR_FAILURE, but **initiating physical cause remains UNKNOWN**. No timeout, resource, native-process root-cause or Strategy fault attribution is inferred.

## Costs and bounds

Actual surviving store332836 logical bytes/352256 allocated bytes; canonical allocation21023 logical/24576 allocated bytes; together376832 allocated bytes. This is a post-run physical inventory, not a historical peak or complete work-directory cost. All old41 charges, aggregate29970432B/probe65536B/old route360448B and committed source-prefix1830912B remain carried with no refund.

Entry observation: wall1791739364769, cumulative391423672ms, retained upper116400128B, aggregate memory upper1786941440B. Debit: wall1791739369096, cumulative391427999ms, retained upper116404224B, aggregate memory upper1793576960B. Terminal: wall1791739396682, cumulative391455585ms, retained upper116416512B, parentRSS501575680B, aggregate memory upper1885990912B, available disk197151670272B. These are finite conservative recorded observations, not proven historical peaks. New retained bytes at terminal observation precede final terminal/result writes; post-run physical inventory above therefore must not be mistaken for that earlier value.

Recorded entry/debit are before17:32:01UTC and satisfy unchanged31-minute reserve/600000ms Match allowance under anchor1791738781000/deadline1791742381000/carry390839903/cap394439903. RAM3GB/scratch2GB/retained12GB/total15GB and guest1000/startup2500/host5000/Match600000ms remain unchanged. Later verification/wait/closure time continues counting; hardstop18:13:01UTC is not extended. Historical peaks remain unknown.

## Privacy, limitations and release

Strict actual reader accepted exact finite schemas and whitelists. Additional read-only recursive key scan of retained JSON found no raw source, StrategyMemory, SoldierMemory, objective/payload, input/output, stdout/stderr, raw error/stack fields. Report exposes finite diagnostics, commitments and accounting only; no private code/objectives/memory/IO/stdio/errors. A first supplemental JSON scan mistakenly included empty replay.ndjson by suffix and exited1 on empty JSON; corrected extension-only inspection exited0. This was not a retained-reader invocation or retry and changed no bytes.

No tests, probes, source edit, metadata/preparation/allocation, provider/container/Strategy/Match, old reader, broad historical assessment, commit or push performed by this verifier. The actual assigned reader's own bounded custody authentication is not a repeated old empirical reader. No LEAG/full baseline/fullChronicle/freeze/formation/holdout/public/counting/production/Phase265/milestone credit. All prior consumed evidence and strict inherited diagnostics remain unwaived.

Only this owned report was created. All verifier commands and the unique actual reader are CLOSED. Source+HEAD hold and actual retained-verification ownership released to ROOT after byte/head preservation and report closure. The one actual failed attempt remains immutable and consumed.
