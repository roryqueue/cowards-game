---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 51
subsystem: integrity
tags: [local-seal, verifier, canonical-json, lifecycle, tdd, fail-closed]
requires:
  - phase: 262-49
    provides: repaired local-seal mechanics, lifecycle, privacy checks, and protocol-v2 evidence
  - phase: 262-50
    provides: immutable v2 FAIL evidence identifying V2_VERIFIER_MODE_MISSING
provides:
  - deterministic read-only verification of the exact canonical v2 FAIL artifact
  - closed mutation-tested v3 PASS or bounded FAIL verification seam
  - exact six-state 42-plan lifecycle for repair, review, ADMIT route, and activation
affects: [262-52, 262-47, 262-48, MEAS-10, SEAL-01, DECI-02]
tech-stack:
  added: []
  patterns: [versioned canonical evidence verification, read-only CLI modes, noncompensating lifecycle state machine]
key-files:
  created: []
  modified:
    - scripts/verify-v1-38-local-seal.ts
    - scripts/verify-v1-38-local-seal.test.ts
    - scripts/check-v1-38-dependency-revision-boundaries.ts
    - scripts/evaluate-v1-38-dependency-revision.test.ts
key-decisions:
  - "Treat v2 as immutable FAIL evidence: --check-v2 validates and reports it without rebuilding, upgrading, or rewriting it."
  - "Permit a v3 verdict only at the exclusive canonical path and validate it through an injected byte-only library seam before live evidence exists."
  - "Model the successor route as six exact 42-plan states, including a Plan 262-52 FAIL state with no summary."
patterns-established:
  - "Versioned evidence roots use the artifactManifest identity domain and an explicit version-specific domain separator."
  - "Author-side repair tests cannot grant SEAL-01 or downstream authority; only the source-separated Plan 262-52 verdict can do so."
requirements-completed: []
coverage:
  - id: D1
    description: "The canonical v2 FAIL artifact is checked read-only with exact schema, identity, root, history, finding, and authority joins."
    requirement: SEAL-01
    verification:
      - kind: integration
        ref: "scripts/verify-v1-38-local-seal.test.ts#v1.38 local-seal versioned read-only verification"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/verify-v1-38-local-seal.ts --check-v2"
        status: pass
    human_judgment: false
  - id: D2
    description: "The v3 verifier accepts only canonical zero-finding PASS or bounded FAIL bytes and rejects mutations, wrong domains, and authority upgrades."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/verify-v1-38-local-seal.test.ts#checks canonical v3 PASS or bounded FAIL fixtures"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 262 accepts only six exact 42-plan successor states and cannot treat FAIL evidence as a summary."
    requirement: DECI-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-dependency-revision.test.ts#six declared Phase 262 v3 lifecycle index states"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
duration: 6min
completed: 2026-08-13
status: complete
---

# Phase 262 Plan 51: Versioned Verifier and v3 Lifecycle Repair Summary

**The exact v2 failure is now reproducibly checkable without mutation, while a closed v3 verifier and six-state 42-plan lifecycle prepare an independently reviewed successor without granting authority.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-08-13T02:50:37Z
- **Completed:** 2026-08-13T02:55:47Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 4

## Accomplishments

- Added exact read-only `--check-v2` validation for the immutable Plan 262-50 FAIL evidence, including canonical bytes, versioned root, protected evidence hashes, source/reviewer identities, the one frozen finding, reduced assurance, and every false authority.
- Added `--check-v3` with no caller-selected path or write behavior, plus a byte-only library seam that proactively tests canonical PASS, bounded FAIL, wrong-domain, mutation, and verdict-upgrade cases before live v3 evidence exists.
- Replaced the 41-plan v2 lifecycle with six exact 42-plan states covering pre-51, post-51, Plan-52 PASS, Plan-52 FAIL without summary, post-47, and post-48 progress.

## Task Commits

1. **Task 1 RED: Missing versioned verifier regression** — `4ed0a07d`
2. **Task 1 GREEN: Read-only v2 and v3 verifier modes** — `cb0b641d`
3. **Task 2 RED: Exact 42-plan lifecycle regressions** — `3eccd6ee`
4. **Task 2 GREEN: Six-state v3 review lifecycle** — `59153728`

## Files Created/Modified

- `scripts/verify-v1-38-local-seal.ts` — strict versioned schemas, root calculation, byte-only validation, and canonical read-only CLI routes.
- `scripts/verify-v1-38-local-seal.test.ts` — exact missing-mode regression plus v2/v3 no-write, mutation, domain, and disposition checks.
- `scripts/check-v1-38-dependency-revision-boundaries.ts` — exact 42-plan inventory, waves, v2 history, v3 evidence/review, and no-summary FAIL lifecycle enforcement.
- `scripts/evaluate-v1-38-dependency-revision.test.ts` — all six lifecycle fixtures and one-input or compensating drift mutations.

## Preserved Evidence

- Protocol-v1 bytes: `sha256:0db2b18d7e09894d52856478415889748802b745f1a36ca0d1bc1fcb39ecec5e`.
- Independent-verification-v1 bytes: `sha256:01a7e1e8e5534a762845cf39be3ed4c79ff98c6cda8bcd3e86f7ffaafe1c6c3e`.
- Protocol-v2 bytes: `sha256:b6c087a10d17eb1a8361b0beea728f5c987cd7b8e3a73f417c98c97aed1995c9`.
- Independent-verification-v2 bytes: `sha256:277b20a6149947e73532c83a92205621108a0afe804c10115c8eccb74185c8e6`.
- Plan 262-46 review bytes: `sha256:d23272bc13a6f35c9158dae3b9da881deffcf13a490c627c60f4cc3e227bb96b`.
- Plan 262-50 review bytes: `sha256:704148d7882277fc7b033756879dd6afe9226edc5583c6de14cf01c7cfa4c8ba`.
- Archived Plan 262-46 bytes: `sha256:ebe4a0a03768ed47984058d5ba1166c861d4d70e6bf95ac17799ab36bae87f41`.
- Archived Plan 262-50 bytes: `sha256:e7ebdabdd057c541b09ab2337cd5f9fc505212f2b965a70aa042f8d0dcda81c8`.

## Verification

- Focused verifier and lifecycle suites: 22/22 passed.
- Exact `--check-v2`: passed and returned immutable FAIL root `sha256:e55933eb22d7bf028d3eb25f64861b8be078776a4c97156761977efdabf33b34` with `satisfiesRevisedSeal01: false`.
- Boundary checker: passed with zero findings, 145 protected paths, 12 scanned sources, blocked matrix admission, and downstream authority denied.
- Full typecheck: 27/27 tasks passed.
- Pre-summary phase index: exact 42 plans / 38 summaries / incomplete `262-47,262-48,262-51,262-52`.
- Canonical v3 artifact remains absent.
- `git diff --check`: passed.

## Decisions Made

- The v2 verifier validates the evidence that actually exists. It does not rebuild the artifact from current source or reinterpret its one finding.
- The v3 library seam accepts caller-provided bytes only for disposable unit fixtures; live CLI mode is bound to the single canonical repository path.
- A v3 FAIL artifact and review do not count as Plan 262-52 completion and cannot substitute for a summary.

## Deviations from Plan

None - both tasks followed strict RED then GREEN commits in the declared files.

## Authentication Gates

None.

## Known Stubs

None. The live v3 artifact is intentionally absent and owned exclusively by Plan 262-52.

## Threat Flags

No new network, authentication, persistence, runtime execution, public product, or production surface was introduced. The new CLI branches are read-only and closed to alternate paths or caller identities.

## Live Truth Preserved

- Revised SEAL-01 remains unmet; this author-side repair grants no requirement credit.
- ADMIT-03 remains blocked.
- Candidate search, Phase 263, formation materialization, holdout opening, public exposure, activation, production, and downstream authority remain false.
- No v3 verdict, candidate, formation, Match, replay, holdout opening, activation root, or production artifact was created.

## Next Phase Readiness

Plan 262-52 may now review the exact clean Plan 262-51 source through a source-separated full rerun. Only its exclusive zero-finding v3 evidence and summary may satisfy revised SEAL-01; a finding must remain an unsummarized stop.

## Self-Check: PASSED

All four task commits exist; all declared source and test files exist; protected v1/v2 evidence and Plan 262-46/50 review/archive bytes remain exact; the focused suites, canonical v2 check, 42-plan index, boundary checker, typecheck, and diff checks passed.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-13*
