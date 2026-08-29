---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "111"
review_type: final_independent_code_review
reviewed_commits: [aba19c2c, 84dad7aa, 9331d59c]
status: blocked
prior_findings_resolved: 2
new_finding_count: 1
critical_count: 1
plan_262_112_eligible: false
reviewed: 2026-08-28
---

# Phase 262 Plan 111 Final Independent Code Review

## Verdict

**BLOCKED WITH ONE NEW CRITICAL FINDING.** Both findings from `262-111-REVIEW.md` are now functionally resolved: the reviewed CLI exposes the exact closed readiness and single-live selectors, and post-run custody accepts both a complete non-pass without reproduction and the matching successful disposition/reproduction-presence tuple. The successful artifact itself, however, is not authenticated exactly. The historical outcome validator checks a handful of fields and trusts the artifact's stored `receiptRoot`; it neither recomputes that root from the artifact body nor rejects changed/additional privacy or authority fields. live-v9 then reduces the result to disposition/presence booleans. A modified reproduction-v17 can therefore retain the original receipt root, add an authority grant, and pass the claimed exact-success custody boundary.

Plan 112 must not publish a zero-finding executable-custody review until live-v9 independently authenticates the exact reproduction-v17 schema, bytes, root, privacy projection, frozen runtime fields, counts, and exhaustive false authorities.

## Scope and Targeted Verification

- Reviewed planning correction `aba19c2c`, source/test fix `84dad7aa`, and fix record `9331d59c` against Plan 111, revised Plan 110, `262-111-REVIEW.md`, `262-111-REVIEW-FIX-REVIEW.md`, AGENTS.md, and the unchanged historical producer.
- `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --hookTimeout=180000 --bail=1`: passed, 9/9 tests.
- `pnpm exec tsx scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts --check-source-only`: passed with the exact corrected Plan-108 roots, zero counters, no live invocation, and downstream authority denied.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- No readiness or production mode was invoked; no live artifact was created.

## Prior Finding Closure

| Finding | Final result | Evidence |
|---|---|---|
| `F-262-111-01` | Resolved | The exact readiness and production selectors are committed. Readiness performs the published Plan-112/supplement-v2 pre-effect gate; production calls the single-argument closed owner directly once, with no producer/gate replacement seam. |
| `F-262-111-02` | Resolved for output topology | Reproduction-v17 is pre-effect forbidden but post-effect producer-owned. The materialized checker requires complete journal/private/terminal presence, no stale lock/downstream artifact, complete cleanup, non-active disposition, exact equality between file presence and authenticated outcome presence, and success iff reproduction is present. Valid non-pass and successful tuples are both covered; mismatch directions fail. |

## New Finding

### F-262-111-FINAL-01 — Successful reproduction bytes and authority fields are not bound to the trusted receipt root

**Severity:** critical  
**Location:** `scripts/run-v1-38-bounded-retry-envelope-v3.ts:1173-1190,1586-1636,1885-1913`; `scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts:1013-1064`

`buildV138ReproductionV17` computes `receiptRoot` from the canonical artifact body, which contains the exact schema, 540 charged/accepted counts, cleanup, execution/runtime/sampling fields, privacy projection, non-reuse flag, and seven false authority fields. But `validateSuccessArtifact` does not reconstruct that body or root. It only compares the artifact-supplied `receiptRoot` with the journal-supplied root and checks status, accepted count, and cleanup. It does not check exact keys, schema, charged count, admitted calibration, execution root, runtime route, sampling, partial-evidence policy, privacy projection, or any authority field.

This permits a byte-level mutation that needs no journal, private receipt, or terminal rewrite: add `publicAuthorized:true` (or change a privacy/frozen field) to reproduction-v17 while leaving its old `receiptRoot` untouched. JSON parsing preserves the mutation, but `validateSuccessArtifact` still sees the original matching root plus `passed_exact`, 540 accepted cells, and cleanup true. `checkV138PublishedRetryV3Outcome` returns only disposition, roots, cleanup, presence, and its own constant downstream denial; live-v9 therefore never sees or rejects the mutated field and reports `bounded_success`.

That violates the revised contract's exact matched 540 tuple, exhaustive false authority, public-safe evidence, and fail-closed post-run custody. Atomic initial publication does not repair later current-byte drift, which the post-run checker is specifically expected to detect.

**Required fix:** without changing protected historical producer bytes, make live-v9 read reproduction-v17 no-follow on the successful post-run branch and independently validate an exact-key schema. Remove `receiptRoot`, recompute `sha256("v138-current-matrix-reproduction-v17\\0" + canonical(body))`, and require equality to both the artifact root and authenticated journal outcome. Require exact schema/status, admitted-calibration and execution SHA forms, 540 charged/accepted, cleanup true, frozen runtime route/200 ms/non-reuse, every privacy flag false, and every authority flag false. Reject added keys and any current-byte mutation. Add adversarial disposable or value-level tests for an added true authority, privacy mutation, frozen-field mutation, rerooted substitute, stale-root mutation, and exact valid body.

## Confirmed Properties

- Exact corrected Plan-108 semantics and prospective Plan-112/supplement-v2 wiring remain intact.
- Pre-effect custody rejects all producer-owned outputs, including reproduction-v17.
- Post-effect topology correctly distinguishes no effect, complete non-pass, and successful reproduction presence.
- Producer error identity and simultaneous custody failure aggregation remain correct.
- Supplement-v1, stale lock, receipt manifest, adjudication, correction, activation, readiness, lifecycle, and downstream destinations remain denied.
- No other new issue was identified in the three reviewed commits.

## Non-Authority

This final review grants no Plan-112 eligibility and no review publication, supplement, execution, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, or Phase-263 authority. The sealed-inactive pair remains unchanged and unconsumed at zero counters.
