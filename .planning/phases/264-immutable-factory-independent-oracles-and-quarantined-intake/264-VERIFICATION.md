---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
verified: 2026-09-15T01:27:30Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 4/5
  gaps_closed:
    - "The stopped route now has a retained valid authoring attempt and all 48 approved workloads."
    - "The formerly absent assessment/threshold is a root-bound affirmative assessment with exact read-only reopening."
  gaps_remaining: []
  regressions: []
---

# Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake Verification Report

**Phase Goal:** Researchers can produce immutable, diverse Strategy candidates through genuinely independent automated and human response channels without weakening hostile-source or production boundaries.

**Verified:** 2026-09-15T01:27:30Z
**Status:** passed
**Re-verification:** Yes — the previous `human_needed` report predates the valid retained calibration and is historical only.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Every source is hostile and executes only through the existing supervised boundary with exact success/player-violation/system-failure semantics and no coordinator/web/API/Go fallback. | ✓ VERIFIED | `admitFactory` treats source as bytes and never evaluates it (`admission.ts:36-47`); only `superviseFactory` reaches `runCanonicalLabMatch` (`:203-230`); the three outcomes are preserved (`:195-201`). The 48 retained supervised workloads have no system or player failure. |
| 2 | Candidates and attempts are immutable, fully bound, and every disposition is charged and retained. | ✓ VERIFIED | Content-addressed publish-once reads verify digest; starts precede terminals; resume rejects uncertain coverage (`repository.ts:59-77`). The retained reopening confirms ledger `sha256:bf42…9f575`, 48 workload entries, and zero extra Matches. |
| 3 | Six source/lineage/dependency/legal-input/Chronicle/matchup fingerprints detect cosmetic/correlated variants without accepting labels or hashes as diversity evidence. | ✓ VERIFIED | The assessor derives receipt-backed observations, freezes controls before base-edge calculation, and returns unresolved on incomplete evidence (`assess-v1-38-factory-independence.ts:163-202`). Assessment `sha256:25913…e43f8` has six informative dimensions per comparison: three cosmetic controls correlated, latent divergence distinct, both borderlines unresolved, and three base edges distinct. |
| 4 | Tactical optimizer, teacher/distiller, and frozen-bundle model synthesizer are materially independent mechanisms under helper/dependency/authorship/behavior/correlation/clone/failure-mode review. | ✓ VERIFIED | Separate leaf emitters produce only `FactoryOraclePacket` data. The recursive monitor rejects oracle cross-routes, factory-to-oracle reachability, unresolved loaders, hostile execution, and undeclared manifests (`check-v1-38-factory-boundaries.ts:159-227`). The current assessment reports zero strategic-sharing violations and distinct S01/S03, S01/S05, and S03/S05 edges. |
| 5 | Human/external source can enter only by a quarantined frozen-disclosure/provenance/budget/reviewer channel; failed/rejected work remains private evidence and only validated deterministic source reaches common admission. | ✓ VERIFIED | Intake charges before validation, checks provenance/source/budgets/conflict/review, then uses common admission only after acceptance (`intake.ts:195-240`); reopen requires one retained accepted ledger record and creates no second allocation (`:243-259`). The approved experiment allocated human/external effort as explicit zero—truthful unused channel, not fabricated participation. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified).

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/strategy-lab/src/factory/{contracts,identity,ledger,repository,admission}.ts` | Immutable factory, charged ledger, supervised-only admission | ✓ VERIFIED | Substantive and wired; current private API reads verified corrected assessment/threshold roots by digest. |
| `packages/strategy-oracle-tactical/src/{selector,scoring,search,emit}.ts` | Owned tactical selector/scoring/search and legal deterministic emission | ✓ VERIFIED | Separate packet-producing leaf; boundary monitor denies cross-oracle strategic imports. |
| `packages/strategy-oracle-teacher/src/{teacher,distill,emit}.ts` | Offline canonical teacher and legal-information student | ✓ VERIFIED | Retained evidence records one bounded 70-node/depth-3 search and one distillation. |
| `packages/strategy-oracle-model/src/{bundle,emit}.ts` and author command | Frozen provider-neutral bundle and isolated capture | ✓ VERIFIED | Two immutable historical failures plus one valid third attempt; request/response/identity/settings/usage/source are private and root-bound. |
| `packages/strategy-lab/src/factory/{fingerprint,calibration,intake,intake-protocol}.ts` | Six-dimension evidence/calibration and quarantined intake | ✓ VERIFIED | Assessment and threshold are current content-addressed records; intake is wired to `admitFactory`. |
| `scripts/{prepare,run,assess}-v1-38-factory-*.ts` | 48-cell preparation, terminal/pair/candidate retention, root-matched assessment | ✓ VERIFIED | Manifest `sha256:a1b808…8cfde` is `factory-calibration-manifest-v1` with 48 workloads; assessment validates its matching manifest/evidence/ledger. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- |
| Oracle leaf emitters | Factory packet/admission | `FactoryOraclePacket` data contract | ✓ WIRED | Exact bytes and packet roots are validated before supervised admission. |
| Factory admission | Existing supervised runtime | `superviseFactory` → `runCanonicalLabMatch` | ✓ WIRED | Documented sole execution seam binds provider identity before and after invocation. |
| Preparation | Runner | Immutable manifest and workload references | ✓ WIRED | Read-only API opened the manifest artifact and confirmed all 48 references. |
| Runner | Fingerprints/candidates | terminal → pair → receipt-derived fingerprints → publication | ✓ WIRED | Runner persists terminals before pairing and compares both graph roots in pair equality; assessor requires 24 pairs and 48 candidate receipts. |
| Assessor | Frozen controls/readiness | Root-matched threshold/assessment | ✓ WIRED | Controls freeze before base comparisons; `verifyRetainedFactoryAssessment` recomputes the assessment identity without persistence (`assess…ts:187-212`). |
| Quarantined intake | Common hostile admission | explicit deterministic source → `admitFactory` | ✓ WIRED | Invalid/rejected/weak/retried records terminalize privately; only acceptance reaches common admission. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Calibration manifest | 12 slots / 48 workloads | retained manifest root `sha256:a1b808…8cfde` | Yes — 12 source slots, 48 immutable workload refs | ✓ FLOWING |
| Assessment + threshold | controls/base edges/six dimensions | retained replay/receipt/ledger observations | Yes — assessment `sha256:25913…e43f8`, identity `sha256:0446…ecea1`, threshold `sha256:f609…8fa72` | ✓ FLOWING |
| Candidate/replay inspection | 48 supervision/replay chains | immutable private artifact store | Yes — 1,768 reopened artifacts / 164,389,603 bytes; 16 ACTIVE initial Soldiers per board; zero reported integrity/board violations | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command / evidence | Result | Status |
| --- | --- | --- | --- |
| Corrected assessment is retained evidence, not narrative | Read-only current factory repository API opened assessment and threshold roots | `factory-independence-assessment-v2`, `affirmed`, no reasons; threshold root-bound | ✓ PASS |
| Exact reopening does not add execution | `corrected-assessment-reopened-v2.json` | Identical affirmed identity/threshold; unchanged 48-entry ledger; `extraMatches: 0` | ✓ PASS |
| Actual replay/board validity | retained inspection result | 48 chains / 1,768 artifacts; zero byte-root, transition, reconstruction, or board violations | ✓ PASS |

No broad test suite, provider, install, old selector, or empirical command was run during this verification. Retained source evidence in `264-VALIDATION.md` records 231/231 pre-correction tests, 31/31 correction tests, 4 equality tests, types/builds, and the 1,296-file clean boundary monitor.

## Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| FACT-05 | ✓ SATISFIED | Root-bound candidate/source/lane/lineage/fingerprint contracts plus 48 retained candidate publications. |
| FACT-06 | ✓ SATISFIED | Charge-first immutable ledger and exact retained 48-entry reopen. |
| FACT-07 | ✓ SATISFIED | Hostile bytes reach only selected supervision with three-way failure semantics and no fallback. |
| FACT-08 | ✓ SATISFIED | Six receipt-derived signals and frozen control threshold; labels/hashes alone are insufficient. |
| ORCL-01 | ✓ SATISFIED | Three retained automated mechanisms pass the development assessment; separately controlled intake exists and is explicitly unused. |
| ORCL-02 | ✓ SATISFIED | Tactical owned selector/scoring/search emitted retained legal deterministic source. |
| ORCL-03 | ✓ SATISFIED | Teacher ran once within 70-node/depth-3 bound and emitted distilled legal-information student. |
| ORCL-04 | ✓ SATISFIED | Frozen model provenance records requested/reported IDs, settings, usage, response/source, and unavailable snapshot. |
| ORCL-05 | ✓ SATISFIED | Quarantined protocol/admission/ledger path is complete; no imaginary participant or submission was created. |
| ORCL-06 | ✓ SATISFIED | Recursive audited allowlist/boundary monitor reports 1,296 files and zero violations. |
| ORCL-07 | ✓ SATISFIED | Retained authorship/source/dependency/legal-input/Chronicle/matchup/counterfactual/clone/failure evidence supports all automated mechanisms; historical failures remain preserved. |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | No current `TBD`, `FIXME`, `XXX`, placeholder, empty-data, or direct-source-execution marker in reviewed Phase 264 paths | — | No blocker |

## Historical Review Disposition

Earlier workload/factory integration reviews correctly identified then-current graph-pair and empirical-input gaps. They are not current blockers: the runner now compares both graph roots; the retained manifest contains all 48 source-backed cells; and the corrected assessment reopens the unchanged ledger. Those reports and both authoring/assessment failures remain preserved history.

## Scope Boundary

This is private, fixed-opponent, one-Phase, two geometry/side-block development calibration. Arena and side are deliberately confounded; mean agreement is neither win rate nor confidence. It is not competitive proof, causal arena/side evidence, production readiness, certification, or authorization to execute Phase 265. Phase 265, holdout, formation, counted/public/production behavior, and rules changes remain gated.

## Gaps Summary

No Phase 264 goal gap remains. The prior human continuation gate was consumed within approved bounds, and retained evidence proves all five roadmap truths. No human verification remains for this private offline phase.

---

_Verified: 2026-09-15T01:27:30Z_
_Verifier: the agent (gsd-verifier)_
