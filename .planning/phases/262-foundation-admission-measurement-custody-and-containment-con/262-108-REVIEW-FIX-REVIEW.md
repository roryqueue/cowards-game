---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "108"
review_type: fresh_review_of_corrected_v9_chain
reviewed_commits: [4537f3f6, 2639ff3b, 285908ec, b720c278]
status: blocked
original_findings_resolved: 4
new_finding_count: 2
critical_count: 2
plan_262_109_eligible: false
reviewed: 2026-08-28
---

# Phase 262 Plan 108 Corrected v9 Chain Re-Review

## Verdict

**BLOCKED WITH TWO NEW CRITICAL FINDINGS.** The v9 implementation resolves the four mechanisms identified in `262-108-CODE-REVIEW.md`: it owns the protected-history and root contracts independently, renders a deterministic blocked branch, authenticates the committed trio's raw Git custody, and contains the required adversarial/mode matrix. The exact committed v9/v2 trio also passes its current checker. However, that checker accepts arbitrary self-consistent zero/eligible semantics, and the corrected v9/v2 evidence is not the evidence exercised or consumed by the Plan-107 adapter.

Plan 109 must not consume the corrected trio until both new findings are closed and independently re-reviewed.

## Scope and Targeted Verification

- Reviewed corrective commits: `4537f3f6`, `2639ff3b`, `285908ec`, and `b720c278`.
- Reviewed corrected reviewer, regression tests, payload v9, REVIEW-FIX, carrier v2, fix record, and additive summary evidence.
- Canonical `--check-review`: passed at publication commit `2639ff3b42e2a238919a3104c9fa8c785c69b93d` with zero findings and `plan109Eligible:true`.
- Publication commit inspection: exactly three additive `100644` entries for payload v9, REVIEW-FIX, and carrier v2.
- Targeted blocked-branch construction: one injected finding produced `findingCount:1`, `reviewStatus:"blocked"`, `verdict:"blocked"`, and `plan109Eligible:false`.
- Targeted adversarial custody proof: a newly committed, internally self-consistent trio claiming source commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` was accepted with `plan109Eligible:true`.
- The long disposable matrix was not redundantly rerun. Its committed implementation and tests were inspected, including all twelve protected branches, eleven named boundary groups, and seven CLI dispatches.
- Seal-v13 and retry-envelope:v3 SHA-256 values remain `99af87f24b059713fb3a553a45ff55606c3813a8062fd756578e77f412ec5bb6` and `7fe327f0049efc7896e62d02560120f3703e1efbb4931ce6afd6c2fc710103cc`.
- The canonical supplement, journal, private receipts, terminal, reproduction, activation, readiness, and lifecycle destinations remain absent. No live mode was invoked.

## Original Finding Resolution

| Original finding | Re-review result | Evidence |
|---|---|---|
| `F-262-108-01` | Resolved | v9 locally defines the twelve-branch protected inventory, independent pair semantics, and payload/carrier/supplement domains. The sole Plan-107 subject import is the producer-incapable synthetic exercise. |
| `F-262-108-02` | Resolved | Findings are sorted records with deterministic detail/finding roots; eligibility is computed from exact zero plus four modes and one synthetic observation. A non-zero finding renders a blocked trio. |
| `F-262-108-03` | Resolved for raw custody | Publication authentication proves a three-file additive commit, `100644` modes, raw blobs, current bytes/modes, ancestry, carrier hashes, and no successor rewrite. Semantic authentication remains incomplete as new finding `F-262-108-R2-01`. |
| `F-262-108-04` | Resolved | The matrix covers a non-entry recursive dependency, omission, substitution, mode drift, every protected branch, root aliasing, self-custody, pair/counter/authority changes, forbidden effects, and all seven CLI dispatches. Real write/check modes commit and authenticate a disposable trio. |

## New Findings

### F-262-108-R2-01 — Corrected trio custody authenticates self-consistency, not the independently observed semantics

**Severity:** critical  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v9.ts:691-729,760-765`

`authenticateV138Plan262108CorrectedTrioCustody` proves the publication shape, blobs, modes, working bytes, no rewrite, payload/carrier roots, carrier byte hashes, and the presence of the claimed review root. It does not require the payload's source commit/tree/parent, checkout paths, recursive root, protected-history root, finding inventory/root, actual-mode counts, zero counters, eligibility predicate, or authority fields to equal the independent observations.

`resolveV138Plan262108CorrectedPublication` scans history and accepts the first commit whose three files satisfy those self-consistency checks. A disposable proof published a fresh three-file trio generated with an arbitrary `aaaaaaaa...` source commit, empty checkout paths, fabricated roots, four claimed modes, zero claimed findings, and `plan109Eligible:true`; the custody function accepted it. The `--check-review` command then trusts the accepted payload fields directly.

This reopens an elevation path at the final consumer boundary despite the stronger raw Git custody.

**Required fix:** pin the exact corrected publication commit and validate exhaustive payload/carrier/REVIEW schemas and semantics against independently derived Plan-107 source, pair, protected history, findings, and actual-mode evidence. At minimum require the exact source/tree/parent/paths/full and recursive roots, exact protected-history root, independently computed empty-finding root, `4/4`, one producer-incapable observation, zero charges, false execution/authority, and the exact expected review bytes/root. Do not discover and accept an arbitrary later self-consistent additive trio.

### F-262-108-R2-02 — The corrected review/supplement chain is not exercised by or consumable through the Plan-107 adapter

**Severity:** critical  
**Location:** `scripts/check-v1-38-plan-262-108-live-controller-custody-v9.ts:438-455,473-541`; `scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts:48-53,107-153,316-320`

The v9 reviewer derives and briefly writes a corrected supplement-v2 that binds payload v9, REVIEW-FIX, and carrier v2. But the synthetic no-effect adapter exercise does not pass that supplement or corrected review bundle to Plan 107. Instead, `compatibilityBundle` reconstructs the old payload-v8/REVIEW/carrier-v1 bundle and a supplement-v1, then passes those old-compatible values to `checkV138LiveV8SyntheticCustodyForReview`.

The Plan-107 adapter remains hardcoded to the old v8 payload, original `262-108-REVIEW.md`, carrier-v1, and supplement-v1 schemas and paths. It cannot authenticate the corrected payload-v9, REVIEW-FIX, carrier-v2, or supplement-v2. Repository search finds no consumer of the corrected paths outside the v9 reviewer/tests.

Consequently, the four-mode claim proves only that corrected supplement bytes can be written/read and that the obsolete compatibility chain can reach the producer-incapable seam. It does not prove that the corrected literal-zero chain can gate the real adapter. Publishing supplement-v2 in Plan 109 would fail the existing adapter; publishing supplement-v1 would bind the blocked historical trio instead of the corrected review.

**Required fix:** define one non-recursive corrected chain that the actual closed adapter can authenticate, and exercise that exact payload/REVIEW/carrier/supplement through the producer-incapable adapter branch. If this requires an additive adapter revision, review that new executable closure independently before Plan 109 eligibility. Do not bridge the corrected review to execution through the historical blocked v8/v1 evidence.

## Confirmed Non-Authority

This re-review grants no Plan-109 eligibility and no supplement, execution, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. The sealed-inactive pair remains unchanged and unconsumed at zero counters.
