---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 49
subsystem: integrity
tags: [local-seal, git-identity, freeze-binding, ast, privacy, lifecycle, tdd]
requires:
  - phase: 262-45
    provides: single-operator local-seal mechanics and frozen protocol-v1 evidence
  - phase: 262-46
    provides: byte-preserved independent FAIL findings requiring corrective work
provides:
  - clean Git checkout derivation with full commit, tree, carrier, and current-league freeze identities
  - independent commit-to-arm checkout recheck before any evaluation callback is reachable
  - exact six-state Phase 262 plan-index lifecycle validation
  - TypeScript-AST privacy leak classification with executable true-leak seeds
  - additive non-authorizing local-seal protocol-v2 evidence
affects: [262-50, 262-47, 262-48, MEAS-10, SEAL-01, DECI-02]
tech-stack:
  added: []
  patterns: [Git-derived freeze identity, noncompensating lifecycle state machine, AST output-shape privacy classification]
key-files:
  created:
    - .planning/artifacts/v1.38-local-seal-protocol-v2.json
  modified:
    - scripts/lib/v1-38-local-seal.ts
    - scripts/evaluate-v1-38-local-seal.ts
    - scripts/evaluate-v1-38-local-seal.test.ts
    - scripts/verify-v1-38-local-seal.ts
    - scripts/verify-v1-38-local-seal.test.ts
    - scripts/check-v1-38-dependency-revision-boundaries.ts
    - scripts/evaluate-v1-38-dependency-revision.test.ts
key-decisions:
  - "Derive the freeze carrier and current-league freeze identities only from a clean full Git HEAD commit/tree, then bind and independently recheck them at commitment and arming."
  - "Treat Phase 262 progress as six explicit noncompensating lifecycle states, including a canonical Plan 262-50 FAIL branch without a summary."
  - "Classify executable privacy carriers through the TypeScript AST while allowing only the canonical privacy validator seam and internal non-output storage mechanics."
patterns-established:
  - "Caller-provided freeze roots are comparison inputs only; Git-derived identity is the authority."
  - "Repair evidence remains non-authorizing until a separately authored independent review produces a fresh verdict."
requirements-completed: []
coverage:
  - id: D1
    description: "Clean exact Git identity and derived freeze root are mandatory and independently rechecked before opening can arm."
    requirement: MEAS-10
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-local-seal.test.ts#derived clean checkout and commit-to-arm drift fixtures"
        status: pass
    human_judgment: false
  - id: D2
    description: "Phase 262 accepts only the six declared plan-index lifecycle states and rejects compensating drift."
    requirement: DECI-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-dependency-revision.test.ts#six declared lifecycle states"
        status: pass
    human_judgment: false
  - id: D3
    description: "AST privacy classification removes the canonical false positive while retaining executable Strategy-private leak detection."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-dependency-revision.test.ts#AST projection shapes"
        status: pass
    human_judgment: false
duration: 15min
completed: 2026-08-13
status: complete
---

# Phase 262 Plan 49: Local-Seal Review Gap Repair Summary

**The local seal now binds a clean full Git checkout through commitment and arming, while exact lifecycle and AST privacy checks close every frozen Plan 262-46 implementation finding without granting authority.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-13T02:16:00Z
- **Completed:** 2026-08-13T02:31:00Z
- **Tasks:** 3 TDD tasks
- **Files modified:** 8

## Accomplishments

- Added a closed Git derivation that rejects non-Git roots plus staged, unstaged, and untracked state; binds full HEAD commit/tree, a domain-separated carrier identity, and the derived current-league freeze root; and repeats the exact derivation before arming.
- Replaced the stale plan-count heuristic with six exact lifecycle states covering pre-49, post-49, Plan-50 PASS, Plan-50 FAIL, post-47, and post-48 progress, including exact inventory and wave-order checks.
- Replaced file-wide privacy text matching with TypeScript-AST inspection of public projection shapes and tainted aliases, preserving comments, descriptive strings, the canonical privacy seam, and private internal storage mechanics while detecting real leaks.
- Published additive protocol-v2 root `sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a` with every downstream authority false.

## Task Commits

1. **Task 1 RED: Clean checkout/freeze binding regressions** — `3567c61c`
2. **Task 1 GREEN: Git-derived commitment and arming join** — `e30c6ef8`
3. **Task 2 RED: Six-state lifecycle regressions** — `def3d25a`
4. **Task 2 GREEN: Exact lifecycle index model** — `85e41dbf`
5. **Task 3 RED: AST privacy regressions and true-leak seeds** — `c19b6089`
6. **Task 3 GREEN: AST privacy classifier** — `00af433f`

## Source and Evidence Roots

| Carrier | SHA-256 |
|---|---|
| `scripts/lib/v1-38-local-seal.ts` | `3eb8cb6d7d91ddc55da11e17a33d9cc7e7ff728bcd7b62723f8ed0bee5d11201` |
| `scripts/evaluate-v1-38-local-seal.test.ts` | `b82deea2ac36b852afc5ab65fe60510f3dab7f9da9bca56bfe2f74d00b3ca92a` |
| `scripts/check-v1-38-dependency-revision-boundaries.ts` | `bdafdac2c3e553627a9d9887381ec4b19507f017758cda3ed19d1d9218a02bf6` |
| `scripts/evaluate-v1-38-dependency-revision.test.ts` | `7bede7588ca0cb213ce005771fe5b388fc5147c5989802cde37fe29d7c651f9c` |
| protocol-v2 artifact bytes | `b6c087a10d17eb1a8361b0beea728f5c987cd7b8e3a73f417c98c97aed1995c9` |

## Preserved v1 Evidence

- Protocol-v1 bytes: `0db2b18d7e09894d52856478415889748802b745f1a36ca0d1bc1fcb39ecec5e`.
- Independent-verification-v1 bytes: `01a7e1e8e5534a762845cf39be3ed4c79ff98c6cda8bcd3e86f7ffaafe1c6c3e`.
- Plan 262-46 review bytes: `d23272bc13a6f35c9158dae3b9da881deffcf13a490c627c60f4cc3e227bb96b`.
- Archived Plan 262-46 bytes: `ebe4a0a03768ed47984058d5ba1166c861d4d70e6bf95ac17799ab36bae87f41`.

## Verification

- Complete focused suites: 39 passed, 1 platform-conditional UID fixture skipped.
- Protocol-v2 byte check: passed at `sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a`.
- Dependency boundary checker: passed with zero findings, 145 protected paths, 12 scanned sources, and all authority denied.
- Phase plan index: exact pre-49 state, 41 plans / 37 summaries / incomplete `262-47,262-48,262-49,262-50` before this summary.
- Full typecheck: 27/27 tasks passed.
- `git diff --check`: passed.

## Decisions Made

- A repository path and claimed freeze root are never evidence on their own. The implementation resolves the exact repository root and derives full Git identities itself.
- A dirty or changed checkout contaminates arming before the evaluation callback is reachable; no retry or compensating evidence exists.
- Protocol-v2 is additive. Frozen v1 evidence remains the truthful failed-review record and is not rewritten or reinterpreted.
- Green author tests grant no revised SEAL-01 credit. Only Plan 262-50 may produce the fresh independent verdict.

## Deviations from Plan

None - all three frozen findings were repaired through separate RED and GREEN commits within the declared files.

## Authentication Gates

None.

## Known Stubs

None. The single skipped wrong-owner fixture remains intentionally platform-conditional; the effective-UID ownership enforcement itself is active.

## Threat Flags

No new network, authentication, persistence, public product, or runtime execution surface was introduced. Git subprocess access is confined to offline integrity derivation and returns stable public-safe error codes without repository paths or raw diagnostics.

## Live Truth Preserved

- ADMIT-03 remains blocked and revised SEAL-01 remains unmet pending Plan 262-50.
- Candidate search, Phase 263, formation materialization, holdout opening, public exposure, activation, production, and downstream authority remain false.
- No real holdout, candidate, formation, Match, replay, live matrix route, or production artifact was created.

## Next Phase Readiness

Plan 262-50 may now independently review the exact clean Plan 262-49 source and produce a fresh v2 PASS or FAIL verdict. Plans 262-47 and 262-48 remain blocked until that independent review has exactly zero findings.

## Self-Check: PASSED

All declared source, test, protocol-v2, and preserved-v1 files exist; all six task commits are present; the focused suites, boundary checker, typecheck, plan index, and diff checks passed.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-13*
