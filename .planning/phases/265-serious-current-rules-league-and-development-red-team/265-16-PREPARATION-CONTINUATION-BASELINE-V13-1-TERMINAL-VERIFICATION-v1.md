---
phase: 265
plan: 16
verified: 2026-10-08T21:58:24.323Z
status: gaps_found
scope: actual_baseline_entered_without_result
route: baseline
mode: v13-1
attempt_ordinal: 1
verifier_agent: /root/verify_supervisor_retest_v12_source
terminal_only_invocations: 1
ordinary_reader_invocations: 0
terminal_verifier_session: 30548
terminal_verifier_exit: 0
saved_authentication_session: 15455
saved_authentication_exit: 0
accepted: false
authorizing: false
final_reader_close: false
current_charges: 0
cumulative_charged: 35
entry_head: 5b01e62eec1554f68dce6f80dd24d41646dc50d8
source_root: sha256:e7d8bf583b09828a34f5cd79d81cb0220242b093dd26e6026b30705347d5b442
allocation_root: sha256:5edd320e53cba57dcbf38f0a4fa170e5f5be5527f932735264c2121ec9a9cd81
terminal_report_root: sha256:ac0c2cf0734fdfd5f2405912a64603abb746cd45fd79ac084074e55de97272b6
terminal_carry_root: sha256:b80d8ad678f6d2ee81c999905d46256c482a8665e9c9f6aa10b9f125ef726169
supervisor_reason: resource_threshold
initiating_cause: unknown
envelope: ended
phase_complete: false
gaps:
  - truth: "The conditional baseline produces accepted current retained baseline results."
    status: failed
    reason: "Actual baseline entry ended child_failed/SIGKILL before any recorded slot charge; result and accepted check are absent. Terminal verification closes failure custody, not baseline acceptance."
    missing:
      - "Accepted baseline results are absent; no automatic retry or unused preparation authority remains after this failed entry."
      - "Initiating native cause is unestablished; any materially new investigation or empirical attempt needs separately scoped authority."
---

# Actual first v13-1 baseline — terminal failure verification

**Failure custody authenticated; baseline not accepted; approved envelope ENDED.** Terminal-only checker exit0 means the failed entry/absence/accounting/hold joins verified, not a successful baseline. Actual baseline child_failed/exitnull/SIGKILL, result/check absent,0 current charges,35 cumulative charges. No ordinary reader, invented result, fake HEAD/FINAL or additional checker was used.

## One actual invocation; precise closure

Initial light check1ff56a: actual heldHEAD5b01e62e… matched entry; parent25850/child25991 absent in `ps`; entry/terminal existed; result/check and terminal-verifier-start/close/report/carry/hold absent. MAIN42019 CLOSED1 and its withheld CLI failure are attributed run evidence, not reproduced. The recorded actual child terminal closes at1791496569736 (**2026-10-08T21:56:09.736Z**),elapsedUpperBound117165ms.

Invoked exactly once from repository cwd:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-terminal-supervisor-baseline-v13-1 --request .strategy-lab/lean-correction-supervisor-baseline-request-20261008-v13-1.json
```

Chunk2086a6 returned session30548; resumed only that session (00be33,c320a3), final41aae4 **ACTUALLY CLOSED exit0**. Wrapper published its authentic terminal report/carry/completed-hold evidence. Its report contains only finite failure custody/inventory, not private Strategy payload; inventory rows are not republished here. Actual terminal-verifier start1791496618346; close1791496635485 (**2026-10-08T21:57:15.485Z**),17139ms; cumulativeElapsed148694388. No accepted check/FINAL exists for this baseline.

After closure, invoked only dedicated saved-current `authenticateLeanPreparationContinuationTerminalVerificationV13` and `authenticateLeanPreparationContinuationTerminalCarryV13`, plus finite reason/terminal/accounting projection. Chunk40a055 returned session15455; final46690e **ACTUALLY CLOSED exit0**. These saved-record authenticators do not repeat an ordinary reader or terminal check. Terminal report accepted/authorizing/finalReaderClose=false; carry outcome=entered_without_result,accepted/authorizing=false,current0/cumulative35,closedAt=actual verifier close,elapsed148694388,allocatedDiskBytes22777856. Ledger events0,currentcharges0,active=false; no slot charge was recorded. This does not assert nothing ran inside the released child.

## Authentic saved roots

All values below are SHA-256 (`sha256:` prefix).

| Record | Canonical root | Raw root |
|---|---|---|
| Terminal verification | ac0c2cf0734fdfd5f2405912a64603abb746cd45fd79ac084074e55de97272b6 | 08c0738c01cb634572675a4a8f639acfa44bd7bda3d26242cee08d85f0a6f5a3 |
| Terminal carry | b80d8ad678f6d2ee81c999905d46256c482a8665e9c9f6aa10b9f125ef726169 | fc01e8d7e4a19de3574e91f3f4114879918e52c1e0c037ead8ca113c10d405eb |
| Completed hold seal | d9c0628b0e3a74fc9f3f621dae78ec1f43da6e161c5567198172b88f55d9d5bb | a3c5f5e88297319b972425a60e09770b6702bedbbeef1cb7609b8a2b0aacbf14 |
| Verifier start | 0af1fd0825c29abbc12b0b4b03fb8cb06b31065f7aba45fc4f7db50c5ff3098f | ac4a20cd582bb59174f8dca5674f58a105034e5054707f52bdc34f22106d5479 |
| Verifier close | 8103ab88689747426274dcf06832c08d28b496dfe10745def12f41488b30ab86 | 78b67985323d04b501d997f07de6710ba8de9f0d5ba22416b092d41abe818824 |
| Actual allocation | 5edd320e53cba57dcbf38f0a4fa170e5f5be5527f932735264c2121ec9a9cd81 | 5f7f963cb62d0cc947e80461da9161b22be9ca10bca0d5032554042751589e47 |
| Actual supervisor reason-v2 | 260d42eccc9dde78ff096978dca807405d67a0c0351e35d02a1adc906e2bdb50 | 27af8629fee9aab9d36f83513dc767d1991c610cceecc2188bb1a95dddee8caa |

Actual request raw2143bd25f3050d589c870c9fe58533d8d72afa1868f2633f6e1525a4dd8c1b50; entry raw969f81a367a9853e58ac0c3cbd7ffd0f452e9dbe21e3f17a9603e345e83ef9ea; terminal raweb1cacea90dc26d225abe994c55d6fec47e12043e8d3bbf7757fea94c1a17bf7. Authenticated report/carry/seal bind this actual allocation/source/entryHEAD/request/entry/terminal and each other's canonical/raw roots. Allocation raw remains canonical and identical to committed HEAD bytes; terminal raw remains equal to authenticated report pin. Source scripts/packages remain equivalent to repaired ee085181 (own read-only diff exit0); HEAD stayed5b01e62eec1554f68dce6f80dd24d41646dc50d8. No consumed bytes were edited.

## Observed reason versus unestablished cause

Actual reason-v2 records uncertain=true,reasons=[resource_threshold],resourceSampling=observed,first-exception operation=none/sequence0/exitObserved=false,entry=published,childReady=observed,finalIdentity=matched,cleanup=child_exit_observed,failureReceipt=absent,initiatingCause=unknown. No sampling-exception or raw error detail is invented.

Terminal retained parentRss552525824,childRssObserved630501376,physical22740992,free198894841856 bytes. Terminal parent RSS + retained child maximum + external reserve512000000 + fixed guard335544320 = **2030571520 bytes**, above unchanged2000000000 scratch cap. This is a post-exit parent observation plus child maximum, **not a simultaneous threshold sample**. The supervisor's resource_threshold code covers memory-or-time checks; it does not retain the exact threshold operands. Thus this composite is consistent with pressure but does not prove the exact kill-trigger operands, why RSS rose, or an initiating native cause. Historical peak RSS/disk remain unknown.

## Ended envelope and ownership release

Final light check8b516e: parent25850/child25991 absent; actualHEAD unchanged; result/check/ordinary-reader-closure/hold-refusal absent. Saved authentic carry/completed hold are present. No baseline acceptedFINAL was fabricated from the earlier accepted diagnostic. Failed entry ends the approved envelope: unused preparations do not authorize a restart, new pair, new Match or retry. Phase265/LEAG/freeze/formation/holdout/public/counting/production remains incomplete/gated.

All35 charges, unknown peaks, surviving artifacts, this verifier/authentication/report wall and physical costs carry without refund. Exact165600000ms/full108000000 plus ALL wall since1791455941097/deadline2026-10-09T02:39:01.097Z/1860000reserve/15GBtotal/12GBretained/300/2GBscratch/768MiB/guest1000/host5000/startup2500/Match600000/parent250 unchanged. No sourcefix/test/provider/Match/newroute/authority/old-reader/commit/push/STATE action. Only actual reviewed canonical wrapper evidence and this safe allowlisted report written; no private source/objective/memory/runtime IO/error payload publication.

**ACTUALLY CLOSED.** Sessions30548 and15455 completed; no active verifier-owned process/child. Ownership released to ROOT to release the workflow source/HEAD hold and report the honest ended/gaps outcome. Existing canonical failure/carry/hold markers remain immutable; this report grants no further execution authority.
