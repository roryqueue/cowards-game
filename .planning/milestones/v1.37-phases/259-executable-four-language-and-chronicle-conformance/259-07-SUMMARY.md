---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "07"
subsystem: runtime-conformance-authority
tags: [ed25519, three-run-proof, freshness, four-language, fail-closed]
requires:
  - phase: 256-counted-safety-and-canonical-authority
    provides: exact runtime evidence DAG, signed authority bundles, and reference-only certificate transport
  - phase: 259-executable-four-language-and-chronicle-conformance
    provides: immutable mandatory four-language corpus identity from Plan 01
provides:
  - pure exact-shape Ed25519 verifier for three-run per-lane conformance certificates
  - branded immutable lane snapshots bound to the exact expected mandatory inventory/count/result root
  - completion-anchored freshness with immediate identity staleness and a 30-day maximum
  - production-only all-four closure plus a distinctly branded fixture-only predicate
affects:
  - 259-language-certifiers
  - runtime-evidence-authority-publisher
  - counted-eligibility
  - phase-259-final-closure
tech-stack:
  added: []
  patterns:
    - verifier-branded immutable snapshots
    - minimum-bound freshness with a hard 30-day cap
    - independent lane eligibility plus stricter all-four release closure
key-files:
  created:
    - packages/spec/src/runtime-conformance-certificate-v1-17.ts
    - packages/spec/src/runtime-conformance-certificate-v1-17.test.ts
  modified: []
key-decisions:
  - "A certificate requires exactly three canonically ordered runs with distinct run, workspace, and process identities; every run is complete, fresh, passed, non-fallback, and non-synthetic."
  - "Every run binds the same complete lane identity and evidence root plus the caller-supplied exact current inventory digest, mandatory case count, and expected canonical result root."
  - "Per-lane verification is independent, while production Phase 259 closure additionally requires four production-trusted lanes under one registry generation and identical corpus, inventory, ABI, JSON, budget, containment, and semantic-tuple criteria."
patterns-established:
  - "Freshness: min(requested validity, all run evidence validity, issuedAt plus 30 days, every run completion plus 30 days), with stale-at-issuance rejection and immediate staleness on current binding change."
  - "Authority: shape-compatible caller objects cannot substitute for verifier-branded certificate snapshots."
requirements-completed: [CONF-04, CONF-05]
coverage:
  - id: D1
    description: "Only three complete fresh independent runs with identical bound identities, case counts, result roots, and evidence roots yield a branded lane certificate."
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-conformance-certificate-v1-17.test.ts#runtime conformance certificate v1.17"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Any identity, policy, corpus, tuple, freshness, signature, completeness, unsupported-tool, fallback, or synthetic-evidence fault fails closed or becomes stale."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-conformance-certificate-v1-17.test.ts#field mutation and freshness matrix"
        status: pass
    human_judgment: false
  - id: D3
    description: "Lanes verify independently while milestone closure requires current TypeScript, Python, Rust, and Zig certificates under the same common criteria."
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-conformance-certificate-v1-17.test.ts#promotes lanes independently but closes the phase only with all four current lanes"
        status: pass
    human_judgment: false
duration: 9min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 07: Three-Run Lane Certificate Summary

**Exact Ed25519 certificate verification now turns only three complete, independent, identity-equal runs into a current branded lane snapshot, with no production trust activated.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-16T10:14:46Z
- **Completed:** 2026-07-16T10:23:45Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added a closed language-neutral certificate payload binding lane, corpus, case inventory, fixture, artifact, adapter, runtime, toolchain, ABI, policies, semantic tuple, identity DAG, and behavior settings.
- Required three distinct fresh workspaces/processes with identical complete case counts and full result/evidence roots; skips, unsupported capability, fallback, synthetic evidence, and system-failed runs cannot mint authority.
- Bound the signed claims to an explicit exact expected inventory/count/result root so a one-case or arbitrary-root run cannot self-declare completeness.
- Added a branded freshness evaluator and production-only all-four-lane closure, plus a distinctly branded fixture helper, without enabling production producer trust.

## Task Commits

1. **Task 1 RED: Three-run certificate and mutation contract** - `0477435` (test)
2. **Task 1 GREEN: Exact certificate verifier and closure predicate** - `ed9d96e` (feat)
3. **Review BL-03: Exact inventory/count/result-root binding** - `5e912e3` (fix)
4. **Review BL-04: Completion-anchored freshness** - `afa2b23` (fix)
5. **Review BL-01: Production/fixture closure separation** - `762160e` (fix)

## Files Created/Modified

- `packages/spec/src/runtime-conformance-certificate-v1-17.ts` - Pure certificate encoding, strict verification, freshness evaluation, branding, and all-four closure.
- `packages/spec/src/runtime-conformance-certificate-v1-17.test.ts` - Exact-run, every-field mutation, unavailable-tool, freshness, signature, branding, and four-lane closure proof.

## Decisions Made

- Kept the production trusted-producer registry empty; later reviewed trust installation remains necessary before a real lane can become counted.
- Used each run's `validUntil` as the already-reduced validity of its complete bound evidence, then capped the certificate from both issuance and actual run completion.
- Required an explicit expected-run binding for exact case-inventory digest, mandatory count, and canonical result root in addition to three-run equality.
- Required common criteria only for semantic/corpus/policy fields across languages; fixture, artifact, adapter, runtime, toolchain, sysroot, and graph identities remain exact per lane.
- Required production closure snapshots to carry production trust under one exact registry generation; fixture closure has a distinct schema and cannot substitute.

## Deviations from Plan

### Code-review remediation

- Caller-trusted fixture snapshots could previously satisfy the nominal phase-closure predicate. Production closure now rejects them and the fixture-only helper emits a distinct schema.
- Positive equal case counts and arbitrary equal result roots could previously self-declare completeness. Verification now requires the exact external current inventory/count/result-root binding without introducing a spec-to-golden dependency.
- Freshness could previously be reset by issuing a new certificate over old executions. Each run must now still be inside its completion-derived 30-day window at issuance and throughout certificate validity.

## Issues Encountered

None in the certificate implementation. Combined verification found and separately fixed a Plan 259-01 package-working-directory test issue (`348543f`).

## User Setup Required

None - no production key or trusted producer was configured.

## Next Phase Readiness

- Real lane runners and signers can now provide the exact three-run payload consumed by this verifier.
- Persistence can import only verifier-derived certificate ID/hash/generation/lane/freshness/source identity.
- Phase closure can require all four independently current certificates without weakening any lane's criteria.
- No Match state, Action legality, event order, outcome, Strategy observation, public output, or historical evidence changed.

## Self-Check: PASSED

- Both planned source/test files exist and both RED/GREEN commits exist in order.
- Focused certificate suite passes: 1 file, 26 tests.
- Full `@cowards/spec` package suite passes: 12 files / 222 tests plus 3 root suites / 33 tests.
- `@cowards/spec` typecheck, focused ESLint, and Prettier checks pass.
- Production trusted producers remain exactly empty.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
