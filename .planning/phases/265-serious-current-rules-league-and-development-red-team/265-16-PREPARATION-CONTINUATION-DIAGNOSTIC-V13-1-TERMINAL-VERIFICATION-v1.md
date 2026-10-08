---
phase: 265
plan: 16
verified: 2026-10-08T21:47:27.885Z
status: accepted_limited_exploratory
route: diagnostic
mode: v13-1
attempt_ordinal: 1
verifier_agent: /root/verify_supervisor_retest_v12_source
ordinary_reader_invocations: 1
ordinary_reader_session: 63890
ordinary_reader_exit: 0
saved_authentication_session: 12330
saved_authentication_exit: 0
accepted: true
final_reader_close: true
current_charged: 1
cumulative_charged: 35
entry_head: 514985e079df3e1800d94e8b65d9e477227d5236
source_root: sha256:e7d8bf583b09828a34f5cd79d81cb0220242b093dd26e6026b30705347d5b442
allocation_root: sha256:df5f9449934dbd0895676688ebfbdf59d1a9e1b0e4bd9af7aadc16b2a9bc2dcd
check_root: sha256:b6dc30d566894a84c22ccad0ecdacea6c085de846f383d36c4cce84f64f4f5e7
final_closure_root: sha256:b09f70b529bbd0d61f427ed28dd7e6529372c3e58b42fd3d205aaf31f0b4add4
reader_close_ms: 1791495944960
closed_elapsed_ms: 148003863
phase_complete: false
public_authorized: false
counted_authorized: false
production_authorized: false
---

# Actual first v13-1 diagnostic — unique retained verification

**Accepted limited exploratory diagnostic; actual own FINAL authenticated.** One successful retained cell, cleanup complete, one current charge and35 cumulative charges. This is actual current-route acceptance, not a source-only test or an old accepted reader reused as authority. No full36-baseline fit, robust pure claim, native cure, Phase265/LEAG/freeze/formation/holdout/public/counting/production completion is established.

## Exact invocation and actual process closure

Initial light check chunk47cb69: current HEAD matched actual entryHEAD above; actual parent76616 and child76664 were absent from `ps`. Entry/child-terminal/result existed; accepted check/carry/hold did not. MAIN's unique run54112 CLOSED0/577420ms is attributed entry evidence, not another run by this verifier. Actual child terminal is child_exited/exit0/signalnull as accepted by the reader.

Invoked **exactly once** from repository cwd:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-supervisor-diagnostic-v13-1 --request .strategy-lab/lean-correction-supervisor-diagnostic-request-20261008-v13-1.json
```

Tool chunk583f2f returned session63890; resumed only that session (3e4d04,8a9069,a4c022). Final chunka36e37 **ACTUALLY CLOSED exit0** returned the finite accepted report: retained_valid,successful1,cleanupComplete=true,accepted=true,currentCharged1,cumulativeCharged35. No refusal/retry or terminal-only checker was invoked. Clean strict reason custody passed; observed origin and initiating native cause remain **unknown**, not inferred from success. Evidence class limited_exploratory; complete=false,claim=no_robust_pure_claimed, all release/phase flags false.

Separately invoked only saved-current-record authenticators `authenticateLeanPreparationContinuationAcceptedJoinV13("v13-1")` and `authenticateLeanPreparationContinuationTerminalCarryV13("v13-1","diagnostic")`, with finite output projection. Chunkbb64d2 returned session12330; resumed same session via b1cf45; final8c310b **ACTUALLY CLOSED exit0**. This finite FINAL/carry/hold audit is not a second ordinary reader and opens no old accepted reader/full historical audit.

## Actual saved identity and FINAL joins

| Record | Canonical root | Raw SHA-256 |
|---|---|---|
| Own accepted check | b6dc30d566894a84c22ccad0ecdacea6c085de846f383d36c4cce84f64f4f5e7 | 13ec9baa4ae55b0117dd84b981a6dcfd9b9cf1ddbaf1923aa213bc1caf237996 |
| Actual `preparation-closure-v13.json` FINAL | b09f70b529bbd0d61f427ed28dd7e6529372c3e58b42fd3d205aaf31f0b4add4 | 9692b5805112d6eaf68f778fbc97858e346a94491eae14e37bbba92b0a05a459 |
| Terminal carry | 42849e70dd8931fbd176c06ebe0d1f4eec6104ef38a624b607d7f254de90a1fc | 93b0fdf05592a66227588bb6f119fb1af22e3fcb3223fd7941c507ebcee059f1 |
| Completed source/HEAD hold seal | ed80366d5fafe8f1c3c3b8cd03ae20a29497542e1639d5f82030088aaa34b9ae | 1a49ff091898e86a1ee98a691736902d17eca25f26ee40b4985df08cb9907f88 |
| Actual diagnostic result | e732b5a339ab959d3f55d939fd8153cc144fb08071aaa2c486658cc2c8507322 | 97faae01dc3f5688cb06640ac69e242662e97d6aa950558771f42e30261a182b |
| Committed immutable allocation | df5f9449934dbd0895676688ebfbdf59d1a9e1b0e4bd9af7aadc16b2a9bc2dcd | 23789846deced15fa13c61a71f318952ff34403128db4b6a47928b70ec105fab |

All hashes in table use `sha256:` prefix. FINAL closureClass=accepted/finalReaderClose=true,acceptedCheckAbsent=false,resultAbsent=false; allocation/source/own actual entryHEAD/ordinal1/check raw/result raw joins authenticate. Request raw06b2f18b94f38ea1d6ace61073163124abf8b0c5e4f5d7da8a4e0a682d12b76c; entry raw55537b4c93e20156c393296ce965c643e64f4775d004479e20dfebf6ed9a2cf7; terminal rawd3e9d9c8047770c071c6638325fd64c97af79c3dad556327283416b13a171060. Reason rooteb35238410899a87ac9a73d713b1a9fc417ff9faebc8324ab2b236accb642894/raw5c539a8c126453c5f2172c718b8704d804dc94d77ca0ea723c235d605ba1ee92.

Reader interval correction-supervisor-diagnostic-v8-verifier began1791495926362; actual FINAL reader-close1791495944960 (**2026-10-08T21:45:44.960Z**),closedElapsed148003863. Check's earlier observed elapsed148003629 is not substituted for FINAL. Carry outcome=closed_result,current1/cumulative35,closedAt=actual reader close,elapsed148003863,allocatedDiskBytes22241280. Carry and FINAL remain authorizing=false; carry accepted=false by design—only the accepted check plus actual own FINAL satisfy the conditional-baseline join. Result raw bytes remained equal to both accepted-check/FINAL pins. Allocation raw is canonical and identical to committed HEAD bytes; no allocation/result mutation or fabricated HEAD.

## Boundaries and release

Final light check7b388d: heldHEAD unchanged514985e0…, parent76616/child76664 absent. Baseline request/allocation/store/temp/entry/result/check all **ABSENT**. No baseline/native/provider/Match/sourcefix/test/new route/old reader/commit/push/STATE action by this verifier. Only reviewed canonical ordinary-wrapper evidence and this allowlisted safe report were written; no raw Strategy/objective/memory/runtime IO/error payload published.

Own accepted check+FINAL permit only the existing **conditional**36 baseline workflow, subject to fresh MAIN data/helper reviews, immutable committed baseline allocation, SAME-PROCESS capacity, unique entry and held-source verification. Full36 completion/fit is not guaranteed; no automatic preparation/run authorized by this report. Old failed pairs/markers/consumed checks remain immutable and nonauthorizing. Exact165600000 cap/full108000000 plus ALL wall since1791455941097/deadline2026-10-09T02:39:01.097Z/1860000reserve/15GBtotal/12GBretained/300/2GBscratch/768MiB/guest1000/host5000/startup2500/Match600000/parent250 unchanged; all35 charges, report/carry/authentication wall and surviving physical costs carry without refund. Actual readerScratchHighWater1107595264 and cumulativePhysical22245376 are finite reader observations, not established historical peaks or future-capacity proof.

**ACTUALLY CLOSED.** Both owned sessions completed; no active verifier-owned process/child remains. Ownership released to ROOT to release the workflow source/HEAD hold and perform only the next approved gates. Saved authentic completed-hold evidence remains immutable.
