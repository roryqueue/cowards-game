---
phase: 265
plan: 16-first-preparation-continuation-source
verified: 2026-10-08T21:03:34Z
status: gaps_found
scope: first_v13_1_source_only
score: 5/6 scoped truths verified
behavior_unverified: 0
overrides_applied: 0
source_commit: 1baed2eef4d274769e29e1e480590ff39d5550cb
observed_head: e0db8ff6279e509adb4cc33a917e15c2487f7d03
source_root: sha256:880d55e93a4ba5ed417f39720457edabb8d2af9116d203066a478113be84a4ae
source_manifest_entries: 930
source_review_v2_raw_root: sha256:b609ee8f27605af9bcc29cca34cdb24918d3c4289854d4771fdf991ee422595c
verifier_agent: /root/verify_supervisor_retest_v12_source
phase_complete: false
empirical_admission: false
gaps:
  - truth: "The explicit first v13-1 parent produces the reason contract required by its ordinary and entered-terminal consumers."
    status: failed
    severity: BLOCKER
    reason: "Actual parent selects reason-v2 only for v12-1; authenticated v13-1 therefore publishes reason-v1, which strict v13 reason-v2 consumers reject."
    artifacts:
      - path: scripts/run-v1-38-lean-baseline.ts
        issue: "Line365 excludes v13-1 from authenticated reason-v2 selection; lines434-438 choose the legacy v1 publisher."
      - path: scripts/run-v1-38-lean-preparation-continuation-v13.test.ts
        issue: "Lines58/299 inject v2 bytes; line227 substitutes the actual parent, leaving this producer-consumer join unexercised."
    missing:
      - "Include only the authenticated first-v13 allocation family in actual reason-v2 publication, preserving strict v12 predicate and legacy opt-in semantics."
      - "Add a source-only HOST regression through actual parent publication and real strict v13 reason consumers; retain legacy/v12 controls."
      - "Fresh independent review and re-verification bound to repaired source; preserve v1/v2 reviews and positively charge new downstream report versions."
human_verification: []
---

# First v13-1 continuation — independent SOURCE verification

**GAPS FOUND: one BLOCKER;5/6 scoped source truths verified.** CR-01/WR-01 repairs are substantively wired and tested, but the adjacent actual parent cannot produce the reason schema required by the new route. No actual preparation, capacity probe, helper/request/allocation, old/new empirical reader, terminal check, provider or Match was invoked. Only this report was written; no source edit or commit.

Read source summary, findings-bearing REVIEW-v1, clean REVIEW-v2, REVIEW-FIX-v1, actual MAIN VALIDATION-v1, approved TIME-SUPPLEMENT-v2, preparation approval and explicit time approval. Verified current source equality to1baed2ee and raw source/review bytes; did not treat summary/test counts as proof of unexercised wiring. This is not canonical whole-Phase265 verification.

## Goal-backward source truths

| # | Truth | Verdict | Evidence |
|---|---|---|---|
| 1 | Explicit firstv13-1, fresh domains and actual parent→retained/terminal contract; no old-route revival. | FAILED — BLOCKER | Parser/mode/routes are fresh and ordinals2–5 reject, but authenticated parent emits legacy reason-v1 while v13 ordinary/entered custody requires v2. Exact counterexample below. |
| 2 | Exact165600000 cap, full108M plus ALL wall from1791455941097, deadline02:39 Oct9,31min reserve and all other bounds unchanged. | VERIFIED | `lean-experiment.ts:131-144,166-168,1365-1369` binds exact approved extension/admission/caps and unchanged clock formula; prior34,excludedIdle0,reserve1860000/floor21020672 remain. Tests344-390 reject reset/cap/idle mutations; actual MAIN48/48 passed. |
| 3 | Failed historical carry is finite pinned nonauthorizing custody, never old-reader acceptance/current-source reinterpretation. | VERIFIED | `preparation-continuation-v13.ts:5-46` checks eight canonical/raw pin pairs and all start/close/refusal/report/carry/seal joins, including null entry/ledger allocation, accepted=false/FINALfalse/current0/cumulative34. Pure validator has no IO/reader/source gate; bounded caller supplies those pins only. Tests403-426 cover tampering/domain misuse. No actual private historical bytes were opened here. |
| 4 | Actual composed preparation/CLI positive and negative paths preserve zero-dispatch and finite original-refusal custody. | VERIFIED | Actual preparation/setup/request/authorization/history/predecessor/allocation/admission declarations are HOST-composed in test350-462; direct fresh CLI defers initialization, guards spend fresh destinations, original errors remain opaque and exclusive sidecar failures do not mask refusal. MAIN48/48 supplies passing current-source behavior; it does not test native parent execution. |
| 5 | Terminal publication projects/rechecks all storage/time/scratch bounds, even without ledger; saved closure/carry authentication stays fail-closed. | VERIFIED | CR-01: `correction-retained.ts:1381-1434` measures complete no-refund inventory, checks block-rounded bytes+65536 headroom,retained/scratch/total/time+reserve, projects carry+hold together and guards each write before/after. Actual ledger is supplied; no-ledger path independently derives inventory. Terminal start/close/report/refusal use same guard; saved hold rechecks it. Shared publisher `correction.ts:350-365` applies v13-only pre/post checks to ordinary report/FINAL. WR-01 tests248-335 exercise actual owners/publishers/authenticators, no-ledger/allocated refusal, entered absence, near-cap success/refusal, final exhaustion and publication/semantic tampering. |
| 6 | Own accepted check and actualFINAL alone gate exactly36 baseline; current v2 review/raw bytes and new report costs stay strict. | VERIFIED | `correction.ts:1656-1706` calls full saved closure authentication, requires own accepted/FINAL/current1/cumulative35/source/committed lineage and exact request/helper/authorization/reviews. Docs82 selects current v2; `lean-experiment.ts:1818-1825` charges both review versions and verification/report costs outside functional source. Tests248-272/463-492 exercise full own audit/FINAL/carry and conditional36 join with synthetic v2 input. Strict gate is correct; actual parent cannot currently supply its input. MAIN91065 accepted actual v2 raw/current-source gate; not empirical authority. |

## BLOCKER: producer emits v1; consumers demand v2

The static production call chain is deterministic:

1. `lean-experiment.ts:805-817`: an exact v13 extension/ordinal1 allocation resolves to **v13-1**. `isLeanSupervisorRetestMode` at76 remains strictly **v12-1**.
2. `correction.ts:1515`: actual v13 run calls `runLeanBoundedParent` with only the legacy `supervisorObservation:true` flag; no authenticated new selector is supplied.
3. `baseline.ts:365-366`: `reasonV2 = isLeanSupervisorRetestMode(leanSupervisorAllocationMode(allocation))` is false for v13; observation is still enabled. At434-438 the false branch publishes rooted **lean-parent-supervisor-reasons-v1**, without finite v2 fields.
4. Actual ordinary retained audit `correction-retained.ts:108` selects strict v2 validation for v13; entered carry derivation1346 and dedicated reason join1512-1517 call `assertLeanSupervisorReasonCustodyV2` (`baseline-retained.ts:30`). The producer's v1 bytes cannot pass. This also prevents authentic entered terminal carry closure after a no-result entry.

This is observable missing wiring, **not UNCERTAIN**, an intentional alternative, native-cause inference or a requested resource relaxation. A clean native exit would not repair schema mismatch. The test fixture builds v2 bytes at58; entered fixture injects them at299. Its HOST dependency replaces `runLeanBoundedParent` with a forbidden-dispatch stub at227. Thus48 passing source tests legitimately prove the described composed preparation/custody behavior, but not this parent-to-consumer seam. No override or later phase excuses it.

**Required scoped fix:** select v2 for authenticated v13 allocations in the actual parent without broadening the v12 predicate or legacy opt-in; add actual parent-HOST publication→strict v13 consumer regression with v12/legacy controls. Rebind new source through fresh independent review/re-verification and explicit positive downstream report debit; preserve earlier reports and all consumed authority/evidence. No live route is needed to prove this fix.

## Evidence, limitations and closure

Own read-only `git diff --exit-code 1baed2ee -- scripts packages` and `git diff --check` passed. HEAD remained e0db8ff6. Actual raw hashes: correction.ts `91289a7124e1adb46ebc1a6c664e020826766271e7b335089afa70056c7847ab`; correction-retained.ts `d68e2ce057348cf3364c9fd691ee62cf998483f42a8ba1d766619f49b53c7a81`; history module `29b1ce40e75fb5749032576287322f4059bc25a9d0185cc6aaff9a7f28124221`; v13 test `dc0267cfb00474492aae0224047209ffb1e0c1e583c09fcebe36968728a2c29c`. Actual review-v2 raw matches frontmatter. MAIN67397's closed public snapshot establishes880d55e9…/930/zero private entries; not regenerated or substituted for old custody here.

Actual MAIN3556 CLOSED0:48/48,zero skips,119.05s,768MiB/one worker; type21722, shell/diff and factory4077/1422files/zero violations passed. These current-source results and reviewer19487's4 selected passing CR/WR tests are attributed, not rerun or summed as independent coverage. Six inherited strict diagnostics remain **NOT PASS** (feasibility-protocol52;missions52,60,66,68,69). No CPU-heavy tests/scans, active child, capacity/authentication operation or private payload read was performed by this verifier. No scoped human checkpoint is required for this actionable source defect.

Original historical cause remains UNKNOWN; oldv12 pair ENDED/immutable;0 of5 new preparations have begun per assigned frontier. All34 charges/surviving files/full108M plus every wall cost carry under exact165600000/deadline2026-10-09T02:39:01.097Z/1860000reserve/15GB/12GBretained/300/2GBscratch/768MiB and unchanged runtime/rules/privacy bounds. No Phase265/LEAG/freeze/formation/holdout/public/counting/production completion or formal release assurance. Fresh MAIN data/helper, committed allocation, unique entry, SAME-PROCESS capacity and held source/HEAD through one actual verifier remain later gates **after source gap closure**.

**ACTUALLY CLOSED.** No verifier-owned process or child remains; root may resume the scoped source repair. This report adds no execution authority and was not committed.
