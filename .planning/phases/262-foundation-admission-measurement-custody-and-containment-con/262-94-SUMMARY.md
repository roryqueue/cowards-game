---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "94"
subsystem: admission-evidence
tags: [privacy, hmac, aggregate, review-gate, non-authorizing]
requires:
  - phase: 262-147
    provides: one exhausted retry-v4 producer terminal and retained owner-local custody
provides:
  - closed admission derivation with independent producer and assurance outcomes
  - dormant Plan123-review-gated Plan124 publisher and retirement selectors
  - privacy-safe keyed aggregate over retained v4 custody and protected history
affects: [262-123, 262-124, ADMIT-03]
tech-stack:
  added: []
  patterns: [domain-separated HMAC aggregate, exact future-review carrier, file-backed pure effect tripwire, public post-retirement validation]
key-files:
  created:
    - scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.ts
    - scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.test.ts
    - .planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-94-SUMMARY.md
  modified: []
key-decisions:
  - "Classify producer success independently from later assurance validity so valid reproduction evidence is preserved on a later assurance non-pass."
  - "Expose only versioned aggregate counts and domain-separated HMAC roots; retain the fresh non-holdout key and raw custody locally through Plans 123 and 124."
  - "Keep disposition, correction-v12, Route-12, and retirement dormant until an exact committed literal-zero Plan123 review binds the closed source and aggregate bytes."
requirements-supported: [ADMIT-03, ADMIT-04, MEAS-02, MEAS-04, MEAS-09, MEAS-10, SEAL-01]
requirements-completed: []
coverage:
  - id: D1
    description: "Actual exhausted v4 custody derives a clean empirical non-pass without correction, Route-12, or reproduction."
    requirement: ADMIT-03
    verification:
      - kind: integration
        ref: "--derive-no-publish and --check-private-aggregate"
        status: pass
    human_judgment: false
  - id: D2
    description: "Public aggregate schema contains only counts, keyed roots, the reduced assurance limitation, and false authority."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "13 focused Vitest cases plus clean-checkout --check-public-aggregate"
        status: pass
    human_judgment: false
  - id: D3
    description: "Missing, false, stale, or mismatched Plan123 review fails before any publisher or retirement effect."
    requirement: SEAL-01
    verification:
      - kind: unit
        ref: "pure review-gate and file-backed effect-tripwire cases"
        status: pass
    human_judgment: false
duration: 18 min
completed: 2026-08-31
status: complete
---

# Phase 262 Plan 94: Closed Admission Derivation and Keyed Aggregate Summary

**A closed admission checker now derives the exhausted retry-v4 branch as a non-pass and commits only privacy-safe keyed aggregate counts and roots, while every authority-bearing effect remains gated on future independent Plan123 review.**

## Performance

- **Duration:** 18 min
- **Tasks:** 2
- **Files created:** 4 tracked files plus one retained owner-local key
- **Focused tests:** 13/13 passed

## Accomplishments

- Implemented pure producer/assurance branch derivation. Producer success controls reproduction preservation; later assurance findings can force non-pass without erasing valid producer evidence. Route-12 is absent on every non-pass.
- Froze the exact future Plan123 carrier contract: source commit/tree, exact source/test file custody, aggregate SHA-256, literal zero findings, Plan124 eligibility, false execution authority, and a domain-separated review root.
- Implemented dormant Plan124-only disposition/correction-v12/Route-12 publication and post-adjudication retirement selectors. No publisher, retirement, readiness, lifecycle, live, producer, correction, or Route-12 selector ran in Plan94.
- Generated one fresh 256-bit non-holdout key in the existing owner-only private-v4 namespace. It is a regular no-follow `0600` file and remains local with the raw evidence for Plans123 and124.
- Published a canonical non-authorizing aggregate with only generation/cumulative counts, six domain-separated HMAC-SHA256 commitment roots, the exact `single_operator_local_seal_v1_no_hostile_same_uid` limitation, and false authority.

## Actual Branch and Aggregate

- Producer disposition: `exhausted`.
- Fresh accepted: `0 / 540`.
- Fresh v4 custody: `15` private receipt units.
- Cumulative aggregate: `9` route starts, `9` preflight observations, `72` calibration identities, `0` reproduction identities, and `0` accepted cells.
- Generation counts: v1 `15`, v2 `15`, failed-bootstrap v3 `0`, fresh v4 `15`.
- Effective disposition: `non_pass`.
- Correction-v12 required: `false`.
- Route-12 required/present: `false` / `false`.
- Reproduction-v18 present: `false`.
- Downstream authority: denied.

## Exact Source and Manifest Custody

- Closed source commit: `19fc78554d5be35dce520aea93ca3925cad4af40`.
- Source tree: `ffc179104b4b0faa6a9ebd5759ad767df03df56e`.
- Source blob / SHA-256: `ac7ef6798b0253afc17914410b43a446eca627b5` / `sha256:56d1dc2023b3d3a00d9d289d2e0228fe618e37110fe2765182133dcc06d21774`.
- Test blob / SHA-256: `8d7d29d209c09ffb302ef2546f22e6c366a22151` / `sha256:dd5b472a075a0977df6417be702cf16b676ef3eb34e60e0eb98fcab3114c3182`.
- Aggregate commit: `cbd4d7cb050cf8c4239beb543663b5d36d179657`.
- Aggregate SHA-256: `sha256:a7e056f810e7e9edb85736899d5b2b5c232ea510309ea070ca9ba9d0af384117`.

No key bytes, raw private payloads, receipt identities, paths, filenames, per-receipt hashes, lengths, ordinals, or reversible low-entropy handles appear in the aggregate.

## Verification

- Focused Vitest: **13/13 passed** under serialized forks.
- Private retained-key recomputation: passed.
- Actual source-only derivation: exhausted, non-pass, no correction, no Route-12.
- Public aggregate schema/root check: passed in the owner checkout and from a detached clean checkout without the key preimage or raw v4 evidence.
- Detached clean-checkout privacy suite: **13/13 passed**.
- Text privacy scan for path, filename, length, ordinal, payload, per-receipt hash/identity, and private-v4 handles: passed.
- Targeted TypeScript diagnostics for the checker/test: zero.
- `git diff --check`: passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoid freezing private byte views**
- **Found during:** Task 2 first aggregate writer invocation.
- **Issue:** Recursive metadata freezing attempted to freeze non-empty Buffer views and failed closed after the key was durably created but before any manifest existed.
- **Fix:** Treat byte views as opaque immutable inputs while recursively freezing derived metadata. The already-created valid owner-only key was retained; no second key was generated.
- **Files modified:** `scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.ts`
- **Commit:** `19fc7855`

No scope, scientific, resource, privacy, gameplay, assurance-class, or execution-authority boundary changed.

## Known Stubs

None. The reviewed publisher and retirement selectors are intentionally dormant security boundaries whose future invocation belongs exclusively to Plan124 after Plan123 review.

## Threat Flags

None beyond the planned owner-local-evidence and later-review trust boundaries. No network endpoint, auth path, schema trust boundary, Strategy execution, gameplay, persistence, replay, or public surface was added.

## Authority and Next Plan

Plan94 grants no execution or downstream authority and performs no cleanup. Raw owner-local v4 journal/private receipts and the fresh key remain intact through adjudication. Plan123 alone is next; it must independently pin and review the exact closed source/test/summary/aggregate bytes before Plan124 can publish any disposition or retire local evidence.

ADMIT-03 remains blocked at `0/540`. Phase263, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, and tag authority remain denied.

## Self-Check: PASSED

- All four plan-owned tracked files exist.
- RED `f18abfd1`, source GREEN `05fcdf53`, byte-view fix `19fc7855`, and aggregate `cbd4d7cb` resolve in Git history.
- Source/test and aggregate SHA-256 values match the bytes on disk.
- Owner-local v4 journal/private evidence and the fresh `0600` key remain present and uncommitted.
- Disposition-v4, correction-v12, Route-12, readiness-v4, and lifecycle-v4 remain absent.
- Pre-existing root lockfiles remain untracked and untouched.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-31*
