---
status: resolved_source_only
trigger: Fresh v7 diagnostic refused after first broker exchange and cleanup failure
created: 2026-10-06
updated: 2026-10-06
---

## Symptoms

Expected: one successful private diagnostic with complete cleanup, followed by accepted retained check before any baseline.
Actual: unique MAIN49207 exited0; actual one Match system_failure/CLEANUP, cleanupfalse, one invocation. ONE ordinary reader8637 refused acceptance and is closed; no accepted check.
Finite diagnostic: native_response/stream_exchange/MALFORMED_IPC, selectActivations ordinal0. Not proof of guesttimeout or causal root. Entry-failure receipt absent. Old/result/authority/reader immutable, baseline denied; approved envelope ended.
Timeline: fresh v7 on2026-10-06 after independently reviewed host-stage repair; prior v6 diagnostic accepted but baseline failed later with unknown cause.
Reproduction: no rerun authorized. Source-only investigation and isolated fake-transport tests may diagnose a definite defect; native/provider/Match execution forbidden.

## Current Focus

hypothesis: v7 host computes the request digest with the v5 domain, while the generated v7 broker requires the v7 domain; first request is rejected before Worker construction and response emission.
test: completed static producer/consumer, authority-version and held-source comparisons; no tests or native/Worker execution.
expecting: confirmed request-root domain mismatch explains first broker rejection; actual finite broker exit is not separately retained in reviewed allowlist.
next_action: source repair independently verified; await new prospective empirical authority, never reopen the failed route or reader.

## Evidence

- Independent NEW265-16-HOST-STAGE-V7-DIAGNOSTIC-VERIFICATION-v1.md establishes exact refusal: successful0 and cleanupCompletefalse.
- Parent/child absent and source/HEAD fixed through unique reader and closure audit; hold released.
-29 spent remain carried. All current costs41943494+now−1791290048578 under cumulative57600000ms/15GB300. No refunds, retries, invented result/check, freeze/formation/holdout/public authority.
- timestamp: 2026-10-06
  checked: scripts/lib/v1-38-lean-container-match-session.ts:252,289,444
  found: v7 broker builder replaces v1.38-lean-startup-v5: with v1.38-lean-startup-v7: in its digest validation; host requestRoot chooses v6 only for version 6 and v5 otherwise, including version 7.
  implication: A genuine version-7 request cannot satisfy the broker requestRoot digest check; the check precedes Worker construction and superviseLeanStartupV5.
- timestamp: 2026-10-06
  checked: NEW265-16-HOST-STAGE-V7-DIAGNOSTIC-VERIFICATION-v1.md plus bounded git source comparisons
  found: The verified actual v7 invocation is bound to held HEAD 1583d2dcdd72c601a06447b25bf8c19cca09a6c7 and sourceRoot sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4. Live HEAD has advanced to 9e61911b38d31db6d683b3c049d4e5b7d07e57a8 with only three planning files changed from held HEAD; bounded comparisons show session, authority and supervisor source unchanged against held HEAD and reviewed source commit 15a2adbdfda547b4b1cdc2a49afc0e63cef57873.
  implication: This is the actual consumed static source contradiction, not a later working-tree source regression. No full manifest or private artifact was reopened.
- timestamp: 2026-10-06
  checked: scripts/lib/v1-38-lean-experiment-authority.ts:121, scripts/lib/v1-38-lean-container-match-session.ts:386,431,444
  found: v7 allocation mode issues startup version 7; session claims that descriptor and chooses buildLeanContainerBrokerSourceV7, but its requestRoot construction still falls through to domain v5.
  implication: The v7 producer/consumer discrepancy is active on the actual route; it is not dead code or a hypothetical version value.
- timestamp: 2026-10-06
  checked: scripts/lib/v1-38-lean-container-match-session.ts:289,290,170,175,311,334,454; scripts/lib/v1-38-planner-supervised-runtime.ts:160-162
  found: Binding mismatch throws before superviseLeanStartupV5/Worker construction; queue catch exits broker 73 without an outer response. Stream child exit with exchange pending reports state -6; transact throws TypeError with stream_exchange/non_success_state. Provider preserves finite origin but defaults a non-SubprocessSystemFailure to MALFORMED_IPC.
  implication: The observed stream_exchange/MALFORMED_IPC can be a wrapper classification for broker rejection, not malformed guest bytes, a guest timeout, or failed Atomics guest waits. First stream completion and broker exit code remain inferred from source rather than directly read from private data.
- timestamp: 2026-10-06
  checked: scripts/lib/v1-38-lean-container-match-session.ts:312,342,408-421,492; scripts/run-v1-38-lean-experiment.ts:314
  found: After a nonzero broker child exit has settled the exchange, pending is null and forced stays false. A subsequent close against exited code 73 returns -6, making stream.close return an error; remove requires streamClosed AND removedClean AND absent AND no startup uncertainty, so it caches cleanupComplete false even if rm and absence succeed. The caller propagates the false close receipt.
  implication: The mismatch predicts the cleanupfalse cascade without proving an actual surviving container or Worker. The actual rm/absence subpredicates are unknown, and the coarse orphanedChild true flag is not independent proof of an orphan.

## Eliminated

- hypothesis: First invocation reaches startup/guest Atomics waits and needs a speculative timing or performance-bound change.
  evidence: Active v7 digest check rejects before superviseLeanStartupV5 and Worker construction; source failure is deterministic and independent of runtime bounds.
  timestamp: 2026-10-06
- hypothesis: MALFORMED_IPC necessarily proves malformed guest response contents.
  evidence: Provider maps stream TypeError to MALFORMED_IPC at planner-supervised-runtime.ts:162; the source mismatch prevents broker response emission entirely.
  timestamp: 2026-10-06

## Resolution

root_cause: Confirmed static v7 request-root domain mismatch. Host startupBinding hashes v1.38-lean-startup-v5:<requestId>: for version 7 (session.ts:444), while buildLeanContainerBrokerSourceV7 rewrites the broker's expected domain to v7 (:252,:289). Actual route issues version 7 (authority.ts:121). First request is rejected before Worker construction; broker exits 73 without response and stream failure is classified MALFORMED_IPC. That nonzero exit also predicts stream-close rejection and cleanupfalse; actual cleanup suboperation outcomes remain unknown.
fix: Source-only repair5077e3ac aligns the host v7 digest domain with selected generated broker. REDecd7f16f fails preciselyv7 whilev5/v6pass; GREENconnected32/32/labtypespass. Independent source reviewclean, validation3/3versions and verification4/4; MAINboundary1410zero. No bounds, cleanup or game semantics change. The consumed failed run remains failed; no native feasibility or cleanup success is inferred.
verification: Static source/authority/producer-consumer and rejection/cleanup control-flow inspection only; relevant source matches consumed held HEAD and reviewed source commit. No tests, private runtime/Strategy payload reads, native/provider/Worker/Match/Docker execution, or accepted-check simulation. Single most useful missing finite host observation is the first docker-exec broker child's exit code/signal, specifically whether exit 73/null occurred before any response frame.
files_changed: [.planning/debug/v7-first-exchange-cleanup.md]
