---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "46"
subsystem: candidate-activation-dependency-and-trace-authority
tags: [activation, dependency-containment, conformance-traces, semantic-validation]
requires:
  - phase: 260-45
    provides: Load-independent queued-job eligibility proof
provides:
  - Clone-local candidate workspace-package dependency ownership
  - Version-dispatched released-v3 and reviewed-v4 committed trace oracle
  - Nine-path selector seam with full runtime-service and PostgreSQL Go proof
  - Forty-seven-input preactivation readiness evidence
affects: [260-14]
requirements-completed: [STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 46: Candidate Dependency and Trace Authority Summary

**Candidate gates now import only clone-local v1.19 workspace packages, validate the reviewed v4 bundled trace oracle semantically, and reproduce a zero-finding readiness proof without changing the live v1.17 authority.**

## Accomplishments

- Replaced whole-directory `node_modules` symlinks with platform-bounded copy-on-write/reflink materialization and recursively rejected dependency symlinks whose real path escaped the disposable candidate root.
- Added the runtime-service conformance runner as the ninth selector-sensitive seam and retained the PostgreSQL-backed TypeScript/Go four-condition proof under a v1.19-file/v1.17-database zero-write disposition.
- Preserved the released v3 directory-per-trace loader while adding explicit selected-version dispatch for the reviewed v4 bundle, exact registry and evidence hashes, recomputed manifest/bundle/diff/disposition/trace roots, ordered case/result validation, and immutable trace storage.
- Added byte-verified oracle reuse: every access rereads and hashes all committed evidence before an already validated immutable oracle can be reused, so mutation or symlink replacement still fails closed.
- Reconstructed and compared the ordered canonical input plus states, events, memories, objectives, terminal, and failure projections for every v4 record. Seven independent mutation classes prove inconsistent projections are rejected.
- Bound the loader implementation, golden export, executable test, nine-seam artifact, and all other activation inputs directly into a 47-input preactivation proof.

## Review findings resolved

- Added direct preactivation hashes for `four-language-conformance-runner.ts` and `packages/golden/src/index.ts`; the executable test alone was not a sufficient drift binding.
- Replaced shape-only bundled evidence validation with canonical reconstruction equivalence for every full-trace projection and canonical input.
- Final independent re-review returned PASS with no remaining actionable issue.

## Verification

- Candidate activation adapter: 24/24 tests passed with clone-local dependency resolution.
- Runtime-service conformance runner: 9/9 tests passed, including exact-byte cache invalidation and seven semantic projection mutation classes.
- Seam auditor: 18 passed and one intentional environment-only skip; independent production `--check` reproduced nine declared paths with zero findings.
- Preactivation evaluator: 26/26 focused tests passed; independent `--check` reproduced 14 passing gates and the 47-input candidate-only proof.
- Full workspace typecheck and lint passed.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Database remained `active-v1.17-bootstrap`, revision `0`, with no pending intent, finalization, or compensation.

## Key commits

- `7b284bd` — `fix(260-46): contain candidate dependencies`
- `92232d8` — `fix(260-46): validate bundled candidate trace oracle`
- `d988e76` — `perf(260-46): reuse byte-verified trace oracle`
- `433a806` — `test(260-46): bind trace oracle implementation readiness`
- `684f772` — `fix(260-46): validate bundled trace projections`
- `8962a97` — `test(260-46): bind semantic trace projection seam`
- `c51bdd7` — `test(260-46): bind reviewed semantic oracle readiness`

## Boundary disposition

No selector, database authority, valid v1.4 Match state, Action legality, event order, outcome, Strategy observation semantics, public output, protected user file, or live dependency installation changed. Plan 14 remains the sole authorized activation path.
