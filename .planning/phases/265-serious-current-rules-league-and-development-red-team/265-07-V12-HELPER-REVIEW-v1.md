---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-03T03:31:14Z
depth: standard
scope: source_only_private_v12_helpers
status: issues_found
source_reviewed: 9ffde3ffafd23c6508766e15c05b5004c0fe030f
implementation_root: sha256:552bba3d794cf902d12282ac453434fe74569a9d56870a655ba5b9a3e61a0aa8
source_root: sha256:defe5024690baceb2128cbd370f6c24f86e8301dcec2e816eff57d1eabea73e2
author_agent_id: /root/265_host_receipt_v12_helper_prepare
reviewer_agent_id: /root/265_host_receipt_v12_helper_review
empirical_credit: false
league_credit: false
freeze_credit: false
prepare_helper_raw_sha256: b04cfe344b0aa5972cdf40d7f19db15a11ac2814ea558e6958877e9524135b8e
run_helper_raw_sha256: ef73d38fd7069f5745d0319d0e96eea0e5466c0e8547a83c3cc886d1c31bc539
files_reviewed: 2
files_reviewed_list:
  - .strategy-lab/league-265-prospective-v12-20261002-a/prepare-data.ts
  - .strategy-lab/league-265-prospective-v12-20261002-a/run-entry.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
---

# Phase 265 Plan 07 — Independent V12 helper source review

## Summary

Standard-depth adversarial source review of exactly the two fresh, ignored private V12 helper files. The reviewer is not their author. One BLOCKER and one WARNING were established in preparation; no additional actionable finding was established in the entry helper. This is **not a clean helper gate** and must not be supplied to a future helper invocation as one.

Required project, phase-plan, prospective-approval, source-review/gate, scoped verification/summary and draft-report context was loaded. Large project status files were used for current scope/dependencies rather than a fresh bulk review of archived history. No project-local `.codex/skills` or `.agents/skills` inventory was available. No structural pre-pass was supplied.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 — BLOCKER: compilation can publish different request bytes from the independently reviewed per-job files

**File:** `/Users/roryquinlan/runtime/cowards-game/.strategy-lab/league-265-prospective-v12-20261002-a/prepare-data.ts:217`–`:230`.

**Issue:** Each request has two representations: an embedded `drafts.jobs[index]` and a standalone `jobs/<id>.json`. The completion inventory checks each representation's independent digest, and the independent review row binds the standalone file's `requestRawRoot` at line 226. However, line 230 publishes `job.producerRequest`, disclosure and provenance from the **embedded draft**, without checking that the embedded job encodes to the standalone bytes whose digest the reviewer accepted.

Consequently, a crossed or modified draft prepared before review can contain request A in the per-job file and different request B in `request-drafts.json`, with an internally matching completion inventory and a review that binds the draft digest plus accepted A's per-job digest. Every current compile check can pass, but B is compiled. The generated review artifact then binds B's newly published disclosure/provenance roots and labels them accepted, even though the row's exact accepted request bytes were A. Producer admission can validate B's shape and budgets later; it cannot reconstruct the missing independent A-to-B equality. This is an incorrect independent-review identity join, not a request to add external custody or distrust the repository operator.

The ordinary `draft` function emits identical representations initially; the defect is the missing fail-closed join when `compile` admits those separately reopened artifacts. No helper mode or negative live operation was invoked to discover it.

**Fix:** Before creating `factory-response` or publishing anything, canonical-encode every embedded job and compare its exact bytes/digest against the corresponding standalone file already bound by the review row. Prefer using that admitted standalone canonical job as the sole compilation input, with exact ID/order/equality checks against the embedded draft. Carry the same joined representation into packet summary/allocation preparation. A bounded source-only negative regression should reject a changed embedded producer/disclosure/provenance with an unchanged accepted standalone job and no publication; the equal normal draft should remain admissible. No source policy/resource value needs to change.

## Warnings

### WR-01 — WARNING: early freshness guard checks different model-context names from the ones it creates

**File:** `/Users/roryquinlan/runtime/cowards-game/.strategy-lab/league-265-prospective-v12-20261002-a/prepare-data.ts:167`; actual path construction at `:186`, `:194`.

**Issue:** The absence check probes `<namespace>-job-<ordinal>-state` and `-disclosed`. Actual IDs include the role suffix, for example `<namespace>-job-03-model`, so actual contexts are `<namespace>-job-03-model-state` and `-model-disclosed`. The early guard therefore misses every actual pre-existing model-context path and may write a supposedly fresh draft into a namespace that already contains those contexts.

Production `preflightLeagueAuthoring` does check the actual `stateDirectory`/`disclosedDirectory` for existence, and `prepareLeagueRunInputs` calls that preflight for all jobs before capacity/reservation/Match dispatch. Thus this is not evidence of accepted context reuse or a proven live authority bypass. It is a broken early freshness promise that needlessly permits preparation to progress until a later refusal. The actual new helper directory currently contains only the two helper files, so no stale context was observed.

**Fix:** Derive prospective IDs and the actual model `stateDirectory`/`disclosedDirectory` first, then check those exact paths before the first draft output write. Reuse one path-building function rather than a second approximate spelling. Treat any directory entry, including a dangling symlink, as occupied; retain the later production preflight as defense in depth. Cover a pre-existing actual model-role context in a source-only guard regression, without invoking a provider/model/Match.

## Inspected boundaries and identities

- Independently recomputed both helper raw SHA-256 values shown in frontmatter. Both are regular nonsymlink mode-0600 files in a realpath-equal mode-0700 fresh directory; its actual entries remain exactly `prepare-data.ts` and `run-entry.ts`.
- Inspected the entire two helper files, the selected V3 constructors/admission, repository constructors, main CLI branch and static authoring/run preflight as supporting context. No imported production source is reported as a newly reviewed implementation scope or changed by this reviewer.
- Independently hashed the actual three approval files: standing `8c7f03b2beff2c7a4ce5b9d7cf169b12575fb948d772828173806e46119fd8e7`, lifetime `7c316dcb60e570d41d5629c4ffe35705ad5b4c0b8005acb3063d7b44a1b5cc64`, host receipt `4ba373411a4f24b1464f27954959c72205ab88695bbd318f64af8a4686a80ddf`. All match the helper pins; no prior authorization bytes were rewritten.
- The source review raw digest `766da0edb2351d387960c7abbd8e35c2408a3963834b360bfc3568e809368a96`, source-gate report `56b74c2a70b7347a349a7d5dce6051b5d1cbc1007565b48aecca28f0accf0c5e`, gate helper `6a1f4390fe04fc40ca7814ffbc500d325008bf0892a022e07007546d377fb4d0`, start `a7643d35a33f1adeaf5e084bc73b0e11a27359f6162587c80e9211bf402858f0`, completion `b209bce85a6850283720a15f3284fa9411642e727ac3919596aec08eef6148ea`, and CI `899aaab02e55f54152db38ce0859c6bfba01c7d09ff2cd00c62578fa933d9e12` match actual raw files.
- Read actual safe start/completion metadata: common exact schema/source/review/helper/command bindings; ordered steps 1–8, every status `passed`, exit 0 and null signal; `all_eight_passed`, `sourceOnly: true`, and false league/freeze credit. The helper selects each private log by step and checks its digest/mode. It selects the exact current CI command list, not an obsolete gate schema. Start/end timestamp difference is 2368952 ms; pinned marker elapsed remains 2368951 ms. Its existing observed 1 ms difference is not normalized or rewritten, and both remain inside 45 minutes.
- V3 policy construction uses exact approved policy objects/admission, not caller-provided runtime knobs: additional private host receipt 5000 ms, selected legacy guest1000 ms, alternative V1.17 50/100 ms and Match600000 ms remain as accepted. Existing admission retains the other resource/channel/final-quality bounds. No repeated human literal, new phase/numbered plan or authority/custody chain is introduced by these findings.
- Entry uses a read-only exact HEAD committed-allocation byte check before result reservation and its unique entry write; canonical destinations are the new V12 paths. It passes `--capacity-input` to the same-process production `run` path. Static all-job preflight and fresh capacity precede durable run reservation and charge/dispatch. Its league-store guard checks empty realpath-equal nonsymlink mode0700, and entry/result/terminal publication uses exclusive creation. Imports are guarded; no helper mode was invoked here.
- Eleven fresh prospective IDs/actual author and future reviewer are specified; the immutable template contains only producer requests/disclosure/provenance, not accepted reviews or model/runtime outputs. The copied template's raw root was independently checked, and its correction/retry-parent roots are null. Fresh model context/dependency paths are assigned rather than importing old accepted review/timing/result authority, subject to WR-01 and CR-01 above.

## Verification and historical limits

This review executed only reads, stat/hash inspections and read-only Git identity/status checks. **No helper invocation or import, test/typecheck, capacity observation, Docker/native Worker/provider/model/Match, allocation publication, empirical retained reader, holdout, formation, public or production operation ran.** Production closure roots in this report are the accepted independently computed source snapshot, also explicitly pinned by both helpers; this reviewer did not import/call the source manifest function again. Actual HEAD was `5d3544d8d5d1b582133f1e0e1a7177e28d6ccab5`, the existing source-acceptance descendant, with no tracked source changes observed.

The historical two CR-01 native-construction attempts/Docker-launch outcome unknown remain explicitly flagged in the scoped source verification. This review does not resolve that old fact, silently relabel the verifier, or introduce it as a new prospective prerequisite.

Only this uncommitted review report was written. Every consumed V11/older allocation/result/diagnostic/authority/verifier, old authorization byte, the unrelated empty V8 result and other existing work remain untouched. No LEAG-01–09, full Plan07/Phase265, freeze, formation, holdout, public, counted or production credit follows.

## Handoff

Bounded helper fixes and an independent exact-new-byte re-review are required before supplying a clean helper review root to any future mode. Source-only acceptance does not itself authorize a run; standing human approval and the existing committed-allocation, fresh-store and fresh same-process capacity requirements remain unchanged.

_Reviewer: /root/265_host_receipt_v12_helper_review. No commit was created._
