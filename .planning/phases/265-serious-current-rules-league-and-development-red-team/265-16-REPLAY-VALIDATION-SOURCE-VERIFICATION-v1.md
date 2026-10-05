---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: replay-validation-source-only
verified: 2026-10-05T23:54:31Z
status: passed
scope: completed_two_task_source_supplement_only
score: 4/4 source must-haves verified
behavior_unverified: 0
overrides_applied: 0
source_commit: e6382a12ed169fb6785bc9b34d19af810704521a
raw_source_root: sha256:6372438dbf0fe8257cc9b6fd84cab89eb0878e31a7040079ccdddee3d4dff222
fixture_root: sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382
execution_authorized: false
empirical_credit: false
phase_complete: false
requirements_completed: []
gaps: []
human_verification: []
---

# Plan16 replay-validation supplement — source verification

All four source must-haves are VERIFIED at the identified HEAD. No concrete in-scope source gap remains. This is not a Phase265/LEAG pass, replay-capacity/RSS guarantee, successful baseline, or renewed empirical envelope.

## Contract and method

Read the checked REPLAY-VALIDATION-PLAN, plan check, source summary, clean independent source review, validation audit and MAIN gates. Verified the actual complete production diff, dedicated fixture, canonical parser/decoder/guard/allocation/evidence path and unchanged caller/manifest source. Summary assertions were not accepted as implementation evidence. This new report had no prior verification/overrides; earlier source and failed empirical reports remain separate and unchanged.

The supplement goal is validation of every canonical replay frame without returned decoded frames/full-text/line collections, selected only by fully admitted prospective supervisor v5. Original roadmap empirical-game/matrix/solver/response/report/pure-outcome/attack criteria remain incomplete and outside this completed source supplement; the score below does not subtract them or certify Phase265. No project-local skills were previously discovered; AGENTS.md privacy/pure-engine/hostile-execution constraints remain applicable.

## Observable source truths

| # | Truth | Status | Actual code and behavioral evidence |
|---|---|---|---|
|1|Every retained replay frame is canonically parsed and all existing replay integrity checks remain enforced.|VERIFIED|`lean-experiment.ts:892–909` checks exact metadata/roots/natural counts/compressed size/hash/envelope root, unchanged4× transient guard and bounded gzip, inflated size/hash, terminal newline and complete delimiter count. A second scan calls existing `parse` (`:20`, require-canonical admission) on each individual UTF-8 decode/re-encoded line and discards its result. Passing differential fixtures exercise malformed first/middle/last fully rehashed frames, every multibyte/escaped parser visit, blank/empty frames, malformed/truncated UTF-8 parity, gzip corruption and exact/over limits. No full text/line/offset/frame array is retained or returned; void completion follows all frames.|
|2|Only strictly admitted prospective v5 diagnostic/baseline allocations select validation without a returned frame array.|VERIFIED|`verifyLeanEvidence:1356–1376` checks exactly the two supervisor v5 schema discriminants, calls full `admitLeanAllocation`, confirms admitted mode v5, then calls `validateLeanReplay` on every selected replay. Actual synthetic diagnostic/baseline evidence fixtures reach real admission/reader/gzip/parser without stubbing those functions; all selected sample/failure frames are visited. Caps/approval/supplement/policy/root/slot/extra mutations and unsupported retained labels refuse before inflate. A non-v5 passed label never selects the new branch; inherited default behavior is deliberately not generalized into a new unknown-label rejection contract.|
|3|Default/legacy decoder paths, evidence roots, sealed policy roots and all bounds remain unchanged.|VERIFIED|Production diff adds only the validator and narrow reader branch. Decoder and cap/policy/replay-guard byte pins pass. Default/legacy0–4 fixtures observe the original full-text decoder path and independently assembled identical records/evidence roots. Missing selected/failure replay, charged-without-terminal and unexpected unselected replay still refuse. Encoder, canonical parser, all full-audit callers/cadence, manifest logic, sealed STARTUP documents and runtime/engine/solver/search owners are unchanged.|
|4|Synthetic proof cannot authorize another Match, retry, historical reader or downstream phase.|VERIFIED|Neither implementation addition returns authority or changes admission/resource/runtime/empirical owners. Evidence output still has `issued:false`/`feasibility_only`, unchanged statuses/charges/unused records/root. Dedicated fixtures deny child-process/Worker creation and historical/private reads, permit only tiny synthetic gzip and registered owner-only temporary ledgers, and restore resource mocks. Source reports keep execution/empirical/phase/requirement credit false. Failed baseline envelope remains ended; future Match requires new bounded human approval.|

**Score:4/4 source truths;0behavior-unverified,0overrides.** Passing tests exercise the actual behavior-dependent canonical/reader invariants; presence alone was not used to mark them verified. Native feasibility/performance is not one of these narrowed source truths.

## Artifacts and key links

| Artifact/link | Verification |
|---|---|
|`lean-experiment.ts`|Exists, substantive and wired: additive exported validator uses actual guarded inflate/hash/canonical parser; real `verifyLeanEvidence` invokes it only after exact v5 full admission.|
|Dedicated replay-validation fixture|Exists, substantive and runnable:70synthetic tests compare unchanged decoder errors/admission, observe per-frame parser visits and actual full-text materialization, test actual temporary-ledger reader, and separately pin compatibility.|
|`verifyLeanEvidence`→`admitLeanAllocation`→v5 selector|Full passed-allocation authentication precedes new replay branch; forged v5 cannot select it.|
|`verifyLeanEvidence`→selected replay bytes→validator→canonical parser|Real tiny gzip files/containers are read, inflated, hashed and completely parsed; late fully rehashed corruption fails without returned evidence. No hardcoded empty data substitutes for this path.|
|Full diagnostic audits→`verifyLeanEvidence`|Unchanged correction runner `:282,493` and retained authenticator `:306` still call the complete diagnostic path; no memoization/cache/status-only bypass or audit omission is introduced.|

Level4 dynamic UI tracing is inapplicable: these are private utilities, not rendered pages. The relevant data-flow trace is the actual synthetic replay container/bytes→guard/inflate/hash→all canonical frames→unchanged evidence records/root above.

## Independent checks and identity

- Ran ONLY `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1`: session94376,exit0,**70passed,0failed/skipped**, one file; start19:54:04 America/New_York,2.33s (tests785ms). No broader/native suite was run.
- Independently hashed both final files: implementation `sha256:6372438dbf0fe8257cc9b6fd84cab89eb0878e31a7040079ccdddee3d4dff222`; fixture `sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382`. HEAD remained `e6382a12ed169fb6785bc9b34d19af810704521a`.
- Compatibility assertions pass: decoder `b2115d6b20d40a213e5d62398c905bfd306e88078f5bfa51b5a145fba0f08b2c`; fixed caps/approval/supplement/startup policy region `5263de232b1da25075e3ccbe016414011b23a93d1d607b7aacdae38366fe8486`; replay ceiling/external reserve/transient guard `a7a80f3082cce78eed4a19b7a01276a82bb49a7170bd114004d2dd2070327792` (all `sha256:`).
- Base `e5545f7d`→HEAD code diff contains exactly the two permitted implementation/fixture files. Only separately named supplemental reports are additional changes. No engine/runtime-core/production/public graph, schema/policy/root widening, dependencies or cold/search/solver changes.
- `git diff --check` passes; scoped debt/stub-marker scan finds no TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER. AST fixture confirms no post-inflate full-text/line/frame collection in the validator. Synthetic zero telemetry/unused records are fixture inputs, not gameplay output.
- MAIN's actual package no-emit typecheck,1407-file/zero-violation boundary scan and70/70 run were read in MAIN-GATES, not rerun or claimed as this verifier's commands. Independent review's70/70 and clean finding record agree with current exact file identities.

No standalone probe is declared. Dedicated behavioral fixtures are the source probe; no empirical helper, real replay/payload/artifact, ordinary/historical reader, Strategy/Match/native Worker/Docker/provider, benchmark or full-manifest command was executed.

The implementation remains an explicit existing runtime manifest entry. `factoryAssessmentImplementationManifest` retains its `.test.` exclusion; correction manifest's unchanged v5 explicit additions do not include the new replay fixture. **Fixture identity is separately hash-bound, not part of the runtime closure.** No manifest repair/recompute or historical reader was attempted. Changed implementation bytes necessarily invalidate reuse of old measured source identity for future modified-code admission.

## Disconfirmation and limitations

Potential hidden failures checked: late-frame corruption hidden by checksum failure (fully rehashed late frames reach canonical rejection); fake v5 label bypassing admission (real passed-allocation mutations refuse); “memory optimization” skipping audits/changing evidence (unchanged call sites and independently assembled evidence-root fixtures). The original buffered decoder and global policies are byte-pinned, not trusted from prose.

The validator **still retains compressed input and the full bounded synchronous inflate Buffer**, plus current-line/parser allocations. It is not streaming decompression, single-frame total RSS, lower-RSS proof, exact historical allocating-cause diagnosis or complete36baseline feasibility. Artificial memory samples prove guard arithmetic only. Native/resource uncertainty stays explicit; it does not require a new human action for this source gate.

## Requirements, accounting and terminal frontier

All LEAG-01–09 are listed for source preservation/traceability, but none is completed here. LEAG-01/02 completeness/no-imputation and LEAG-03/04/05/07 solver/response/qualified evidence/pure separation remain owned by original Plan16. LEAG-06/08 original certification/diversity remain deferred/non-green; LEAG-09 remains superseded by the single-round lean disposition. No omitted/orphaned full-phase requirement is silently satisfied. No override/prohibition block is declared by this supplement.

At finite wall observation1791244460546, supplied conservative custody gives `33812347 + max(0,1791244460546−1791242322180) =35950713ms`, below unchanged43200000ms **at that instant only**. Every later test/report/admin/source cost continues carrying; this arithmetic is not an authenticated new balance or capacity gate. Same15GB/300Matches/24spent charges/surviving bytes and all guest1000/absolutehost5000/Match600000/startup2500/cancel≤100/replay256MB/4×guard partitions/reserves remain unchanged. No accounting journal was edited, reset, refunded or recredited.

No source-specific gap remains. The failed baseline is still failed/consumed, all old bytes/readers remain immutable, and **any future Match requires new bounded human approval** plus separately reviewed source/data and capacity/entry custody. Phase265/LEAG/freeze/formation/private-holdout/public/counting/production remain uncredited. This source pass does not advance a phase or revive the ended envelope.

Only this new report was written; no implementation/fixture edits, commit or empirical operation occurred.

_Verifier: /root/verify_265_startup_v5; completed replay-validation supplement source only._
