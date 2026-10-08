---
scope: v11-1-baseline-entry-terminal-only
verified: "2026-10-08T00:19:49.383Z"
verifier: /root/verify_v11_1_baseline_terminal
status: terminal_custody_verified
actual_verifier_exit: 0
accepted: false
authorizing: false
final_reader_close: false
current_charges: 0
cumulative_charged: 33
empirical_phase_credit: false
---

# Independent v11-1 baseline terminal verification

Exactly one new retained ENTRY-terminal-only check ran and closed with actual exit 0. This proves finite failed-entry custody, not baseline acceptance or empirical completion. The ordinary empirical reader was not invoked; no result, HEAD, acceptance, journal closure, retry, provider call, or Match was fabricated.

## Actual invocation and closure

`sh scripts/run-v1-38-lean-correction.sh verify-terminal-supervisor-baseline-v11-1 --request .strategy-lab/lean-correction-supervisor-baseline-request-20261007-v11-1.json`

The exact CLI ran once through a finite-output capture wrapper; exec session 33115 actually closed with exit 0 and no stderr. Private raw output was not published. MAIN entry run 43067's reported exit 1 is contextual parent evidence; the independent code/files prove `child_failed`, null child exit, and `SIGKILL`.

| Check | Independently observed finite evidence | Verdict |
| --- | --- | --- |
| Entry and child terminal | Entry parent PID 91143 / child PID 91268; both absent in pre/postclosure process checks; authentic child terminal exists | VERIFIED |
| Result and current charges | No `result.json`; `ledger.ndjson` remains 0 bytes; predecessor 33 plus current 0 equals cumulative 33 | VERIFIED |
| Failed-entry outcome | Terminal `child_failed`, exit null, signal `SIGKILL`, elapsed upper bound 111109 ms | VERIFIED |
| Source/HEAD hold | Before and after the unique check, source root recomputed from 910 entries and exact HEAD matched entry | VERIFIED |
| Non-authorizing carry | Actual outcome `entered_without_result`; accepted false / authorizing false / result root null | VERIFIED |
| Initiating cause | Parent observation explicitly `unknown`; failure receipt absent | UNCERTAIN — no causal attribution |

Verifier start root `sha256:98ba6c1d4f670e40742c8560c267269c2cdbab8aaa36b7df32b2c8ca20c23fc1` joins actual close root `sha256:564196063ec073f8e0c04e73da950c0d030c0660e613f351c19ac9b591264683`. Actual close time is 1791418748495 ms; verifier interval upper bound 14290 ms. All four recorded ledger intervals have matching closes; no active interval remains. No current entry/reader process was found after closure.

## Exact identity joins

- Held HEAD: `5a53c5824cc6d8d39f52ca10f30b476f75b1b935`.
- Recomputed source root: `sha256:da8d54020c36e0008a0800ac5c87e7fe790757cc364b12bb4b0405f61a841945` / 910 entries.
- Allocation root: `sha256:d2302741c57959f209607282659dded60bbea3a9733a456e366b3b21dc0fb1a5`; actual allocation-byte hash `sha256:692285013a9931186b45082883acbeb12e6558ae74428daf5899b8e90d62dd1f`.
- Request-byte hash: `sha256:de5b35b466b9676af50764d8cd339c46f0a490811e8f1cd811494c6f27adbce8`.
- Entry-byte hash: `sha256:5a2d0c5b96c25349cbd736a22811f496d8989103fb58817c6c7fa7dfd535ba3c`.
- Child-terminal-byte hash: `sha256:879d1f46cb0ab0d5fd5cf71d058f55fd8861cad048a76bb63e6b8cfbd102f3c6`.
- Actual `terminal-verification-v11.json` root: `sha256:eeafead7e10d09978ca2e9363974145039ff6db6f150f1c0134b74ec53425fa4`; byte hash `sha256:9006ca62d7a2577d29fe374f7ea65fc65c8dfae42ec5d97a94b704b65f8f4f49`.
- Actual `terminal-carry-v11.json` root: `sha256:2005a7df3780fca69d15d86b7a09d85b994ed777cb5f6df9bda54f0012c31519`; byte hash `sha256:95fa233c27849da241fb8ba145aa0d196a0401435b4f2d1d2c62230c93466d15`.
- Actual `terminal-hold-complete-v11.json` root: `sha256:1c8379430e0e583b8da07c79c4bb452584d7fd1cc10da92d408fa874010f91bd`.

All five rooted verifier-start/close/report/carry/hold-complete digests were independently recomputed using their schema-domain root function. Carry→report root/bytes and hold-complete→carry root/bytes match exactly. Entry, terminal, report, carry, and hold-complete source/HEAD/request/allocation joins agree. No hold-refusal file exists. The store is an owned, real, nonsymlink directory with mode 0700.

## Finite failure predicate and accounting

Actual parent reasons receipt records `resource_threshold`, resource sampling observed, final identity matched, cleanup `child_exit_observed`, terminalization unobserved, failure receipt absent, and initiating cause unknown. This is an authentic resource stop with no retained result, not successful baseline completion.

Finite terminal observations: parent RSS 557600768 B, observed child RSS high-water 640552960 B, physical bytes 19410944 B. The reviewed parent formula adds external reserve 512000000 B and guard 335544320 B: total 2045698048 B, above the unchanged 2000000000 B scratch cap by 45698048 B. These retained terminal/high-water observations are not a simultaneous failure-time sample and do not prove the exact initiating throw or native cause.

Actual carry records 19427328 allocated disk bytes, cumulative 33 charges, zero current charges, and cumulative elapsed 102937757 ms. Independent continuous-clock arithmetic confirms 93600000 old ms + (1791418748495 − 1791409410738) = 102937757 ms. At that actual carry closure, 5062243 ms remained under the unchanged 108000000 ms cap; subtracting the unchanged 1860000 ms reserve left 3202243 ms. This is a historical finite observation, not a current capacity promise; all subsequent wall time/files remain chargeable. The absolute deadline remains `2026-10-08T01:43:30.738Z`; 15 GB / 300 Matches and guest/host/startup/Match/scratch bounds remain unchanged.

## Hold release and boundaries

Source/HEAD hold was eligible for release only after the actual verifier process closed, actual carry and hold-complete appeared, independent finite joins passed, source/HEAD still matched, and no active entry/reader remained. That completed condition was communicated to MAIN after closure. This report changes no source or historical evidence and does not commit anything.

Pair 1 baseline ended without a result or acceptance. Distinct pair 2 remains separately subject to authentic closed-pair-1 custody and fresh same-process remaining capacity; no accepted diagnostic or baseline authority is reused. No empirical LEAG, Phase 265, freeze, formation, holdout, public/counting, production, archive-success, or tag credit is established.
