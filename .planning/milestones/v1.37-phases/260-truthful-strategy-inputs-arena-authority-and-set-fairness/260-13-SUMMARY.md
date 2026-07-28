---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "13"
subsystem: inactive-observation-language-certificates
tags: [typescript, python, rust, zig, runtime-v1.19, certificates, append-only-ledger]

requires:
  - phase: 260-19
    provides: Four exact reviewed candidates backed by twelve fresh contained real-language runs
provides:
  - Strict managed-signature verifier for the exact observation-v1.19 candidate graph
  - Four inactive append-only certificates and twelve immutable run-provenance rows
  - Fixed public-safe install receipts with no Phase-259 selector mutation
affects: [260-14, 260-21, runtime-conformance, runtime-evidence-authority]

tech-stack:
  added: []
  patterns: [exact-candidate-certificate, distinct-producer-operator-trust, inactive-append-only-import]

key-files:
  created:
    - packages/spec/src/runtime-conformance-certificate-v1-19.ts
    - packages/spec/src/runtime-conformance-certificate-v1-19.test.ts
    - packages/persistence/migrations/0027_inactive_runtime_conformance_v1_19.sql
    - scripts/sign-import-v1-37-observation-v1-19-certificates.ts
    - scripts/sign-import-v1-37-observation-v1-19-certificates.test.ts
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json
  modified:
    - packages/spec/src/index.ts
    - packages/persistence/src/migrations.ts
    - packages/persistence/src/migrations.test.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.test.ts

key-decisions:
  - "A v1.19 certificate is valid only for the complete reviewed candidate payload and its exact corpus-v3, trace-v4, Workshop-v1.19, ABI, catalog, Set-policy, tuple, runtime, toolchain, budget, containment, and three-run identities."
  - "Successor evidence reuses the existing serializable append-only ledger under registry generation candidate-0; it never enters the Phase-259 current-candidate table."
  - "Certificate production trust and operator import trust are distinct managed Ed25519 identities, and either collision or revocation fails before durable mutation."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-05]

coverage:
  - id: D1
    description: "The verifier rejects current, old, substituted, stale, partial, skipped, fallback, synthetic, mixed-identity, or wrong-lane evidence."
    requirement: STRAT-03
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-conformance-certificate-v1-19.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four exact certificates and twelve run rows import idempotently under distinct producer and operator roots while all v1.19 current-registry rows remain absent."
    requirement: STRAT-04
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts and live PostgreSQL install query"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fixed receipt manifest contains exactly four inactive allowlisted receipts and no signature, key, source, artifact, memory, objective, host, path, credential, or diagnostic material."
    requirement: STRAT-02
    verification:
      - kind: integration
        ref: "pnpm exec tsx scripts/sign-import-v1-37-observation-v1-19-certificates.ts --check"
        status: pass
    human_judgment: false
  - id: D4
    description: "Current Phase-259 reviewed lane evidence remains exact and the observation-v1.19 lane inventory remains explicitly non-current."
    requirement: SET-05
    verification:
      - kind: integration
        ref: "current and observation candidate reviewed-lane checkers"
        status: pass
    human_judgment: false

duration: 29min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 13: Inactive Observation-v1.19 Certificate Summary

**Four exact managed-signed observation-v1.19 certificates now exist as inactive append-only evidence with twelve immutable provenance rows, fixed public-safe receipts, and zero successor rows in any current Phase-259 selector.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-17T08:12:10Z
- **Completed:** 2026-07-17T08:41:10Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Added a strict v1.19 certificate envelope and verifier that binds the exact reviewed candidate payload, all successor authority pins, and exactly three fresh complete real runs without consulting a current registry or implicit default.
- Extended the existing serializable append-only evidence ledger to accept the exact v1.19/candidate-0 pair, verify distinct producer and operator signatures, persist three provenance rows per lane, and reject substitution, revocation, staleness, identity collision, or premature-current installation.
- Ran the managed signer/importer for TypeScript, Python, Rust, and Zig and wrote one fixed allowlisted receipt per lane. The durable install contains four certificates and twelve run rows; the current v1.17 candidate registry contains zero v1.19 rows.

## Task Commits

1. **Task 1 RED: exact successor verification contract** - `831e7fe`
2. **Task 1 GREEN: strict v1.19 certificate verifier** - `a44eb8f`
3. **Task 2 RED: inactive import contract** - `d0f88a0`
4. **Task 2 GREEN: append-only inactive import and signer** - `6e2a12b`
5. **Task 3: four public-safe install receipts** - `c797ac2`

## Files Created/Modified

- `packages/spec/src/runtime-conformance-certificate-v1-19.ts` - Exact candidate-only certificate discriminator, signature verification, freshness, run, identity, and pin enforcement.
- `packages/persistence/src/runtime-evidence-authority-publisher.ts` - Serializable idempotent v1.19 inactive import under distinct managed producer/operator roots.
- `packages/persistence/migrations/0027_inactive_runtime_conformance_v1_19.sql` - Additive constraint extension for the exact v1.19/candidate-0 ledger pair.
- `scripts/sign-import-v1-37-observation-v1-19-certificates.ts` - Managed four-lane sign, immediate verify, import, fixed receipt, and checker command.
- `.planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json` - Four canonical public-safe inactive installation receipts.

## Decisions Made

- The certificate signs the reviewed candidate payload itself. It cannot resolve, inherit, or relabel a current corpus, trace, Workshop default, tuple, lane selector, or evidence selector.
- Successor certificate records use `candidate-0` in the established evidence tables. No parallel certificate registry was introduced, and the current v1.17 candidate table remains the only current-selection substrate.
- Public receipts expose only exact candidate authority, run roots and IDs, certificate identity, import-envelope hash, registry generation, and inactive status. Signatures and operational material remain private.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended the existing ledger constraint for exact v1.19 inactive rows**
- **Found during:** Task 2
- **Issue:** Migration 0023 admitted only certificate v1.17 with ABI v1.18, so the otherwise reusable append-only ledger correctly rejected the new exact v1.19 record shape.
- **Fix:** Added constraint-only migration 0027 permitting either the unchanged v1.17/v1.18 pair or the exact v1.19/v1.19 pair with registry generation `candidate-0`. It creates no table, registry, or selector.
- **Files modified:** `packages/persistence/migrations/0027_inactive_runtime_conformance_v1_19.sql`, migration registry and tests.
- **Verification:** Migration, import, idempotency, substitution, revocation, and premature-current PostgreSQL tests all pass.
- **Committed in:** `6e2a12b`

**Total deviations:** 1 auto-fixed missing ledger constraint. **Impact:** The additive constraint enables only the planned inactive successor evidence; current v1.17 records and selectors are unchanged.

## Issues Encountered

- The final formatter has no SQL parser configured, so SQL was validated by migration execution, PostgreSQL tests, and `git diff --check`; every supported TypeScript, JSON, and Markdown file passed Prettier.

## User Setup Required

None. The local PostgreSQL evidence ledger and existing toolchain completed the managed fixture-trust installation and all proof checks. Production activation remains owned solely by Plan 260-14.

## Verification

- Exact certificate verifier, migrations, persistence publisher, and signer/importer: 66/66 tests passed with serialized PostgreSQL execution.
- Durable ledger inspection: 4 v1.19 certificates, 12 provenance rows, 0 v1.19 rows in `runtime_evidence_v1_17_candidates`.
- Fixed receipt checker: `{"status":"passed","receipts":4}`.
- Current Phase-259 reviewed lane checker: `{"status":"passed","lanes":4}`.
- Observation-v1.19 candidate checker: `{"status":"passed","lanes":4,"runs":12,"current":false}`.
- Repository typecheck: 27/27 tasks passed.
- ESLint and supported-file Prettier checks passed; migration SQL executed successfully.
- Protected baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- RED `831e7fe` failed because the exact v1.19 verifier did not exist; GREEN `a44eb8f` passed 13 strict candidate-certificate tests.
- RED `d0f88a0` failed because inactive v1.19 ledger import and managed signing did not exist; GREEN `6e2a12b` passed the full migration, append-only import, signature, revocation, idempotency, privacy, and premature-current suite.

## Next Phase Readiness

- Plan 260-21 can prove complete preactivation readiness from four exact installed inactive certificates and the frozen revision dispositions.
- Plan 260-14 remains the sole owner of selector, pin, default, lane-control, and database-current activation. This plan changed none of them.

## Self-Check: PASSED

- All twelve implementation, test, migration, receipt, and summary files exist and all five task commits are present.
- Unit, PostgreSQL, current/candidate lane, receipt, typecheck, format, lint, privacy, and protected-baseline gates pass.
- Only the two protected user files remain dirty.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
