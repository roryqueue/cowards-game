---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
reviewed: 2026-10-04T19:11:39Z
depth: standard
scope: fresh_diagnostic_request_data_only
status: issues_found
source_commit: 3a642b015577685d131b51f1190812a51f3b4bb9
source_root: sha256:f95d7257c6ed4d4b5cc883a36674716519b8a30b347b763cc95caeb72d89c879
author_agent: /root
reviewer_agent: /root/review_265_correction_diagnostic_data
independently_reviewed: true
request_root: sha256:1dddd2eb7ba1b56bc6a1ddc4ef47cc048ddeb573139d13b2e823d950974311f4
files_reviewed: 1
files_reviewed_list:
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-CORRECTION-DIAGNOSTIC-REQUEST-DATA-v1.md
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
empirical_execution: not_started
---

# Fresh diagnostic request data review v1

## Narrative Findings (AI reviewer)

### CR-01: BLOCKER — Proposed request-data debit prevents the fresh entry

**File:** `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-CORRECTION-DIAGNOSTIC-REQUEST-DATA-v1.md:18`

**Issue:** The draft promises to import the separately measured request-authoring/data-review interval through `beginLeanInterval` / `closeLeanInterval` after CLI preparation but before entry. This is incompatible with the exact reviewed implementation. `packages/strategy-lab/src/league/lean-experiment.ts:991` rejects every pre-entry correction interval name except `correction-preparation`. Preparation already durably starts/closes that name through `scripts/run-v1-38-lean-correction.ts:72,84-85,245`; `beginLeanInterval` at `lean-experiment.ts:918` rejects reuse of a spent name. A distinct closed request-data interval therefore produces `LEAN_EXPERIMENT_ENTRY`, while choosing the permitted name produces `LEAN_EXPERIMENT_TIME_ACTIVE`. The time cannot simply be omitted: the approved cumulative envelope includes setup/data-authoring costs and the actual start precedes authentication. This is an integration defect in the prospective data/accounting procedure, not a reason to reopen the old route or a new empirical failure.

**Fix:** Before publishing/preparing this request, narrowly support an independently authenticated, uniquely named, fully closed pre-entry request-data debit for new correction allocations, with regression checks for allowed closed custody and rejected open/duplicate/unauthenticated intervals. Preserve existing non-correction behavior, charge emptiness, cumulative caps and no-overlap accounting. Recompute the changed source closure, complete the required independent source gates, then author a distinct updated draft/request-data review binding that closure. Preserve this v1 finding and historical evidence. Do not launch an entry merely to demonstrate the refusal.

## Independently checked data joins

Read AGENTS.md, current STATE frontier, the approved continuation, bounded supplement and plan check, source review v4, source verification 7/7, the exact draft, and the relevant admission/entry/time APIs. No project-local skill directory exists at `.codex/skills` or `.agents/skills`. Code-review evidence/classification conventions were applied to the bounded request-data review, not used to repeat source certification.

The inert exported manifest independently recomputes the exact source root above with 880 entries. Current HEAD is the full commit above; `git diff --quiet b5c7c63b0938bfe256840aeefa627ece3c64a1e0 -- scripts packages` exits 0. No source delta from the reviewed source was found.

The request data root independently matches `sha256:1dddd2eb7ba1b56bc6a1ddc4ef47cc048ddeb573139d13b2e823d950974311f4`. Its derivation excludes only `dataReviewPath` and `dataReviewRoot`, preventing report self-reference. The all-zero data-review root is explicitly an unpublished draft placeholder, not valid final admission evidence. The fixed final request must bind the actual independent report bytes and its clean disposition; this issues-found report cannot be used as a clean permit.

Raw plan, approved amendment and source-review roots independently match the draft:

- plan: `sha256:7b8f8b70a8e71ca9974c161e7b41bdf0e64cc056c24645ea1f25938b1df40108`
- amendment: `sha256:ad8ced715d6d259f0bc4c958ccaae33cfdd1fb3e15220b7f476ab7b231ff68ca`
- source review v4: `sha256:f01627d64e2c2e0a45403c5ed2548ac2b5689fd95803c71cb1992e3813d35419`

Read-only authentication of the exact old pre-training files independently produces reuse grant `sha256:12a039d2693914f9292db9bb67b41a289be8e5090738b080f9e6cb40ca2609f5`, preserving 64 tactical evaluations, 64 teacher nodes and 64 distillation examples already spent, with only 128 response nodes prospective and aggregate 320 channel operations. No builder, search, historical empirical reader or Strategy execution was invoked. Exported candidate-intent derivation matches both draft candidate roots; the exact diagnostic slot derivation matches `sha256:4a7d16474108b93570fdc9e213c7d199e694cddd43944dc514706b2434cf8211`. Snapshot roots are distinct from candidate-intent roots and were not substituted. The diagnostic remains the fixed first-cell tactical-0 bottom / cold-opponent top, old seed, currentSmoke condition 0, with null diagnosis and one prospective cell, not extra tuning or training.

The fixed new request, store and canonical allocation are absent. The fixed scratch path is a real owner-only 0700 directory whose only observed file is owner-only 0600 `request-authoring-start.json` (264 bytes). Its independently recomputed semantic root matches `sha256:03feecdb8fcd522d9f63c7072bab84f52d9b0f4ffc93fe72244377607472d847`; the carrier records `/root`, PID 45959, wall start 1791140910326 and monotonic start 1221683203849080. The author interval remains open pending this review; no close/debit was fabricated. Surviving scratch/request/allocation writes remain within the declared writable accounting namespaces and must count alongside predecessor survivors. Actual elapsed upper-bound closure/import is still prospective and is blocked by CR-01.

## Disposition and limits

One BLOCKER, no WARNING. Do not publish this draft as an admitted request or prepare/enter its route until the identified integration defect is repaired and newly checked. Carry 10 historical charges / 3,319,046 ms plus every new setup, review, preparation, diagnostic and appropriate check cost under unchanged 15 GB / 28,800,000 ms / 300-Match limits; historical disk/RSS peaks remain unknown. A clean data review would still not establish future actual same-process capacity, provider behavior, diagnosis or baseline eligibility.

No actual historical/new empirical reader, cold builder, preparation, allocation publication, provider, Docker, Strategy, Match, capacity admission, formation or holdout was executed. No source edit or commit was made. This report alone is the review output; phase completion, freeze, full LEAG, public/counted/production authority and retrospective crash cause remain unestablished.
