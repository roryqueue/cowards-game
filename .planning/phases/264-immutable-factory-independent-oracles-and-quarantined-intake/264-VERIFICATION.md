---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
verified: 2026-09-14
status: human_needed
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
human_verification:
  - test: "After final source review of the client prompt-echo and response-size repairs, approve continuation of at most the two unused authoring attempts before further authoring."
    expected: "No failed slot, workload, or unavailable usage is silently reused; any renewed route is separately authorized and remains bounded."
    why_human: "The updated client supports the chosen model, but the agreed stop-on-system-failure rule requires renewed operator continuation."
---

# Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake Verification

**Phase Goal:** Researchers can produce immutable, diverse Strategy candidates through genuinely independent automated and human response channels without weakening hostile-source or production boundaries.

**Verified:** 2026-09-14

**Status:** human_needed — The client update resolved Sol support; a fresh provider turn completed but our local checker rejected its prompt echo. This second charged attempt remains a system failure. No teacher search, workload, threshold or independence result followed. Final compatibility source `f2f14864` is independently clean with 77/77 main tests, strict types, builds and boundary checks passing. The agreed terminal-stop rule requires renewed operator continuation before another authoring turn; no client setup or source-review blocker remains.

**Re-verification:** Current Task04 addendum below; the original source/mechanics review is retained verbatim as historical context.

## Current client-update outcome

Final source review and outcome-accounting audit are both clean. `264-CLIENT-ECHO-REVIEW.md` records all original source findings and their verified closure at `f2f1486428e6e237e5a9ed5c01c2ac7fbf8ea755`. This is source verification only, not a revised terminal, admitted Strategy, real independence result or Phase 264 completion.

The exact-source reviewed continuation used Codex0.154.0 and the unchanged selected Sol model. One fresh attempt (cumulative2) consumed9,767tokens over54,751ms, retained its complete raw response and completed SIGTERM cleanup. A normal `userMessage` was rejected by the item whitelist; the terminal is not reclassified from `system_failure`. Outcome `sha256:3f624715ffff0c569b02b4123705e777c864b34830e94af5b5db3b2dd3a8c9bf` preserves the previous failure and exact two-chunk raw reconstruction. Two authoring slots and48workloads remain unused. See264-CLIENT-CONTINUATION-OUTCOME.md for details and repair status. Current score remains4/5; actual three-mechanism independence is unverified and Phase265 remains ineligible.

## Historical first Task04 Addendum — Retained Bounded Failure

The actual bounded route prepared frozen roots and then charged exactly one authoring attempt. A-01 terminalized `system_failure` after the selected model/client combination was unavailable. The immutable corrected outcome root is `sha256:86afd06a8e66f8d54dbee6f2484e67d7573435e0869f000e6f9aaef5097281a6`, which additively preserves predecessor `sha256:e76142f8e3c9e612d9f9829d5c7a70f0a953ae5f751d2ebf0ab68a24575fc19c`.

| Current fact | Retained disposition |
|---|---|
| Authoring | One A-01 start/terminal/cleanup; three slots unused and not automatically reusable. |
| Usage/protocol | `unavailable`, not zero; the retained response is zero bytes and is explicitly incomplete provider evidence. `reportedThreadModel` is `null` and effective negotiation evidence is unavailable. |
| Source/bundle | No valid source or frozen bundle. |
| Human/external intake | Unused; no participant, submission, or external provenance was opened. |
| Teacher/tactical/workloads | 0 teacher searches, 0 tactical emissions, 0 workloads started/completed. |
| Assessment/readiness | Actual blocked readiness is retained: no threshold or assessment root; independence remains `unresolved`; no counted/public/production/formation/holdout authority. |
| Cleanup | Retained SIGTERM cleanup completed. |

The local diagnostic roots the requested-model/client incompatibility, but lost raw protocol capture means it does **not** establish a successful thread-start identity, measured provider-turn duration, or provider token usage. The failed record is retained as a failure, not backfilled or reclassified. Current score is **4/5**: Truths 1–3 remain source/mechanics-verified and Truth 5 has a retained actual-or-blocked readiness plus unused intake disposition; Truth 4, actual three-mechanism independence, remains unresolved. RUN-01 (advertised-model precheck) and RUN-02 (failure protocol/elapsed retention) received a clean exact-source recheck at `f9f0cd63adeabc9c29ac3defbb259b4c3a318ab0`; the route remains stopped pending the separately required operator-only stop/model decision.

## Historical Verification (Pre-Task04)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Every emitted source is hostile and can reach execution only through the existing supervised boundary, with explicit success/player-violation/system-failure handling and no coordinator/web/API/Go fallback. | ✓ VERIFIED (bounded implementation) | Factory admission accepts source as data, the runner uses `runCanonicalLabMatch`/the selected supervised adapter, and the boundary monitor covers recursive private/production edges. Factory/runtime, admission, and boundary tests cover invalid lanes, source/identity drift, failure classification, cleanup, and no fallback. No generated source was executed in this verification, so this is a code-contract result rather than a live-run claim. |
| 2 | Candidate and attempt artifacts are immutable, root-bound, and charged/retained across accepted, rejected, invalid, duplicate, weak, retried, player-violation, and system-failed outcomes. | ✓ VERIFIED | Factory contracts/identity, repository, ledger, supervision-artifact, intake, preparation, and runner source form the packet → proposal → validation → supervision → fingerprint → candidate chain. Charge/start occurs before work and terminal publication precedes pairing; storage/reopen preserves ordered private records without renewing execution authority. Recorded final evidence is 156/156 focused/injected tests, four private-package builds, and the independent storage/workload reviews. |
| 3 | Six source/lineage/dependency/legal-input/Chronicle-behavior/matchup-response dimensions are rederived and cosmetic/correlated variants remain unresolved rather than being accepted from labels or hashes. | ✓ VERIFIED (mechanics) | `deriveFactoryFingerprints` rederives dimensions from retained artifacts; the concrete six-case corpus derives agreement from paired records and marks every observation `mechanics_only`/`unresolved`; exact pairing now includes both optional graph roots. Candidate independence remains quarantined when thresholds or evidence are missing. |
| 4 | At least three materially independent automated mechanisms pass the audited shared-helper, authorship, behavior, correlation/clone, and failure-mode gates as an actual independence result. | ⚠️ UNCERTAIN — human/external decision required | Tactical, teacher, and frozen-model packages have separate strategic cores, strict closure checks, source manifests, and boundary reviews. However, all current fixtures/receipts are mechanics-only or unresolved, clone/correlation thresholds are null, and no fresh provider/model bundle or supervised candidate corpus exists. Source review proves implementation boundaries, not the required genuine independence result. |
| 5 | Human/external submissions enter through the frozen quarantined channel and the phase has a truthful readiness result for real inputs, without invented provenance or empirical acceptance. | ⚠️ UNCERTAIN — late decision required | Intake code implements explicit participant/reviewer identifiers, disclosure/provenance/conflict/acceptance budgets, pre-validation charging, retained failure dispositions, and roots-only reviewer projection. The channel may truthfully be unused/blocked; actual human participation is not required merely to implement it. However, no `264-READINESS-DECISION.md`, fresh calibration manifest/allocation, genuine participant/external submission, or `264-CALIBRATION-READINESS.md` exists. The runner intentionally remains `not_ready` with `calibration_thresholds_not_frozen`. |

**Score:** 3/5 truths verified (2 present but awaiting human/external evidence and authority; 0 behavior-unverified code truths).

## Deferred / Pending Late Gate

The following are explicit Phase 264 Plan 07/08 work, not missing implementation in Plans 01–06:

| Item | Addressed by | Current evidence |
|---|---|---|
| Fresh provider/model/version/settings bundle, authorized human/external protocol, and finite development allocation | Plan 07 | No readiness decision or fresh roots are present. Phase context explicitly requires an operator decision and prohibits inventing or reusing Phase 263 resources. |
| Actual or explicitly blocked calibration readiness, retained roots, and frozen thresholds | Plan 08 | No calibration-readiness artifact is present. Existing calibration source returns `authorization_required`; runner readiness remains `not_ready`, and all synthetic corpus observations remain mechanics-only/unresolved. |

These are not silently treated as passed. They require the human/operator decision described above before the automated Plan 08 follow-on can run and before Phase 264 can become phase-complete or authorize later empirical work. The separately controlled human/external channel may remain unused; that is a truthful blocked/unused disposition, not a requirement to invent or obtain human participation for implementation closure.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/strategy-lab/src/factory/{contracts,identity,ledger,repository,admission}.ts` | Immutable private roots, charged ledger, hostile admission | ✓ VERIFIED | Substantive and wired through the private factory subpath; focused tests/builds and foundation review pass. |
| `packages/strategy-oracle-tactical/src/*` | Independent tactical selector/scoring/search and packet emitter | ✓ VERIFIED (mechanics) | Owned strategic core, static exact-controller bundle, closure checks, and packet root tests. |
| `packages/strategy-oracle-teacher/src/*` | Canonical counterfactual search, legal distillation, same tested emitted controller | ✓ VERIFIED (mechanics) | Repaired teacher readiness review reports 7/7 focused tests and package build; no generated-source execution. |
| `packages/strategy-oracle-model/src/*` | Frozen bundle admission and exact data-only model packet | ✓ VERIFIED (mechanics) | Repaired model review reports 7/7 tests; companion binds complete bundle provenance, with no provider call. |
| `scripts/{prepare-v1-38-factory-calibration.ts,run-v1-38-factory-calibration.ts}` | Fresh-root preparation and terminal-retaining private runner | ✓ VERIFIED (mechanics) | Workload closure recheck at `f7395d8a` passed 6/6 focused tests; pair graph roots and canonical outcome mapping are fail-closed. |
| `packages/strategy-lab/src/factory/{fingerprint,calibration,intake,intake-protocol}.ts` | Six dimensions, bounded corpus, quarantined intake | ✓ VERIFIED (mechanics) | Independent fingerprint/corpus/intake reviews pass; evidence remains unresolved until real late inputs. |
| `264-READINESS-DECISION.md` | One fresh authorization or explicit blocked decision | ⚠️ MISSING — pending Plan 07 | The plan intentionally requires operator/external input; absence prevents a genuine readiness claim. |
| `264-CALIBRATION-READINESS.md` | Actual or blocked Plan 08 readiness report | ⚠️ MISSING — pending Plan 08 | No empirical run or explicit blocked report has been created yet. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Oracle leaf emitters | Factory ingestion | Named `emitTacticalFactoryPacket`, `emitTeacherFactoryPacket`, `emitModelFactoryPacket` APIs and strict packet schema | ✓ WIRED | Leaf tests exercise packet emitters; ingestion/manifest code binds producer identity, source root, native lane, and provenance. |
| Factory admission | Supervised runtime | `admitFactory` → issued supervision → `runCanonicalLabMatch` / selected adapter | ✓ WIRED (mechanics) | Source is data-only until the supervised seam; runtime and runner tests cover identity/lane/budget/failure checks. |
| Runner | Evidence/fingerprint/candidate | terminal publication → pairing → `deriveFactoryFingerprints` → unresolved candidate finalization | ✓ WIRED | Runner publishes terminals before pairing and never promotes unresolved/mechanics-only evidence to ready. |
| Plan 07 decision | Plan 08 preparation/runner | fresh protocol/allocation/provider/participant roots | ⚠️ NOT WIRED — artifact absent | No decision record or fresh manifest exists, so the late empirical path is intentionally unopened. |

## Data-Flow Trace

| Artifact | Data source | Produces real data | Status |
|---|---|---|---|
| Factory candidate/fingerprint descriptors | Retained packet, validation, supervision, graph, and corpus projections | No genuine provider/human/candidate data currently; synthetic/injected inputs are explicitly labeled | ⚠️ QUARANTINED, truthful |
| Calibration readiness | Fresh Plan 07 decision and Plan 08 retained run | None currently | ⚠️ DISCONNECTED BY DESIGN until authority exists |

## Behavioral / Source Checks

| Check | Result |
|---|---|
| Final workload closure test | PASS — exact two-file Vitest command, 2 files / 6 tests, including graph-root pairing, paired-but-borderline correlation, WIN/DRAW/unknown mapping. |
| Recorded final bounded regression | PASS — 156/156 tests, four private package builds, 1,271-file source-only boundary scan with zero violations, and four script type checks as recorded in `264-05-SUMMARY.md`; no guest/provider/network execution. |
| CLI help paths | PASS — recorded real `ingest`, `prepare`, and `run` help paths; no experiment effects. |
| Empirical calibration/provider/human channel | NOT RUN / NOT AVAILABLE — correctly not substituted with fixtures. |

## Requirements Coverage

| Requirement | Status | Evidence / limitation |
|---|---|---|
| FACT-05 | PARTIAL — mechanics verified | Immutable candidate/source/lane/lineage/fingerprint artifacts exist; actual candidate completion remains unresolved. |
| FACT-06 | VERIFIED — bounded implementation | Charged append-only ledger and all declared dispositions are retained by source/tests; no live attempt claimed. |
| FACT-07 | VERIFIED — bounded implementation | Hostile source is admitted only toward selected supervision; three-way failure semantics and boundary checks are present; no generated source execution claimed. |
| FACT-08 | PARTIAL — mechanics verified | Six dimensions and quarantine are implemented; thresholds and genuine calibration are absent. |
| ORCL-01 | UNCERTAIN | Three source-separated automated leaves and the separately controlled intake exist. The channel may be unused, but genuine materially independent automated evidence and any human/external evidence remain unresolved. |
| ORCL-02 | VERIFIED — mechanics | Tactical owned selector/scoring/search and packet source-closure tests pass; no candidate-strength claim. |
| ORCL-03 | VERIFIED — mechanics | Canonical bounded search, legal distillation, and shared emitted controller pass source/mechanics review; no empirical quality claim. |
| ORCL-04 | UNCERTAIN | Frozen-bundle schema/emitter is verified, but no genuine provider/model bundle exists. |
| ORCL-05 | UNCERTAIN | Quarantined intake mechanics are verified, but no actual authorized human/external protocol/submission exists. |
| ORCL-06 | VERIFIED — source boundary | Audited shared-helper policy and recursive boundary checks pass; this is not runtime sandbox certification. |
| ORCL-07 | UNCERTAIN | Evidence structures and mechanics corpus exist, but all current independence receipts remain unresolved and no thresholds are frozen. |

## Anti-Patterns / Integrity Notes

No unresolved source `TODO`/`FIXME`/`XXX` blocker was found in the reviewed Phase 264 implementation paths. The important anti-pattern risk—promoting synthetic or injected fixtures into genuine evidence—is explicitly prevented by `mechanics_only`, `unresolved`, `not_ready`, and `calibration_thresholds_not_frozen` states. Historical initial review findings are retained in their plan-specific reports and were rechecked as resolved where applicable.

## Human Verification Required

1. Capture the single late Plan 07 decision with either exact fresh roots/limits or an explicit blocked/unavailable disposition.
2. After that decision, let the automated Plan 08 path run only from a fresh manifest and inspect retained private roots and all terminal dispositions; if blocked, publish the blocked readiness report without launching.
3. Document the human/external channel as available, unused, or blocked. An unused channel is allowed for implementation closure, but it is not human participation and cannot support a genuine human/external evidence claim.

## Gaps Summary

The implementation goal for Plans 01–06 is achieved at the private infrastructure and source/mechanics boundary. The overall Phase 264 goal is not yet fully verified because the repository contains neither the required late readiness decision nor actual provider/human/external calibration evidence. This is an Escalation Gate, not a source defect: no authority, allocation, provider, participant, or empirical result should be inferred or fabricated. Phase 265/formation/holdout/production authority remains blocked.

_Verified by independent bounded source review; no source edits, guests, providers, network, installation, historical selectors, or empirical calibration run._
