---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "07"
subsystem: integrity-authority
tags: [candidate, kernel, chronicle, arena, event-vocabulary, postgres]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: one-kernel authority marker and non-export Wave-0 boundary from Plan 01
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: locked valid-v1.4 compatibility corpus and KERN-11 gate from Plan 03
provides:
  - Inactive exact engine-kernel, Chronicle/current-event, and semantic-arena candidate tuple
  - Deterministic valid, mixed, partial, and old-current candidate vectors
  - Real-PostgreSQL zero-publication and zero-receipt rejection proof
  - Locked current-authority byte-invariance evidence
affects: [257-12, 257-19, atomic-authority-flip, event-vocabulary, publisher]
tech-stack:
  added: []
  patterns: [non-exported candidate namespace, two-mode artifact generator, transactional non-publication proof]
key-files:
  created:
    - packages/spec/src/integrity-authority-candidate-v1-37.ts
    - packages/spec/src/integrity-authority-candidate-v1-37.test.ts
    - scripts/generate-v1-37-kernel-integrity-candidate.ts
    - scripts/generate-v1-37-kernel-integrity-candidate.test.ts
    - packages/spec/artifacts/v1.37-kernel-integrity-candidate.json
    - packages/spec/artifacts/v1.37-kernel-integrity-candidate-hash-vectors.json
  modified:
    - packages/persistence/src/runtime-evidence-authority-publisher.test.ts
key-decisions:
  - "The future engine, Chronicle/current-event, and arena components are minted together while rules, runtime ABI, and Set policy remain exact v1.4 identities."
  - "The candidate is a direct-import-only module with every activation/publication/receipt/counted flag false; it is deliberately absent from the spec barrel and current registry."
  - "Publisher rejection is proved with a real candidate-tuple certificate inside PostgreSQL so the current parser fails CLOSED_GRAPH and rolls back publication, source, receipt-event, and generation-head effects."
patterns-established:
  - "Candidate preparation: deterministic reviewable bytes exist under a candidate-only schema/path without changing any current pointer or artifact."
  - "Atomic-version vector set: valid inactive, mixed, partial, and old-current inputs state both candidate and current acceptance explicitly."
requirements-completed: [KERN-03, KERN-09, KERN-10, KERN-11]
coverage:
  - id: D1
    description: The exact candidate changes engine, Chronicle/current events, and semantic arena together while preserving v1.4 rules, runtime ABI, and Set policy.
    requirement: KERN-09
    verification:
      - kind: unit
        ref: "packages/spec/src/integrity-authority-candidate-v1-37.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Missing, mixed, duplicate, current-branded, or partially activated candidate values fail closed and current tuple resolution rejects the candidate.
    requirement: KERN-11
    verification:
      - kind: unit
        ref: "packages/spec/src/integrity-authority-candidate-v1-37.test.ts#rejects missing, mixed, duplicate, exported-as-current, and partial activation values"
        status: pass
    human_judgment: false
  - id: D3
    description: Candidate artifacts and the four required vector classes are deterministic under write/check mode.
    requirement: KERN-10
    verification:
      - kind: contract
        ref: "scripts/generate-v1-37-kernel-integrity-candidate.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: The current publisher rejects an inactive candidate tuple with zero publication, source, receipt-event, head, revision, or conformance change.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#inactive candidate"
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 07: Inactive Kernel Integrity Candidate Summary

**The complete future engine-kernel, Chronicle/current-event, and semantic-arena identity is now reviewable as deterministic candidate bytes, while every current authority and publication surface remains unchanged and unable to execute it.**

## Performance

- **Duration:** 8 min
- **Completed:** 2026-07-13
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Defined one exact inactive tuple that changes the engine kernel, Chronicle recorder/current-event contract, and semantic arena catalog together.
- Preserved `cowards-rules-v1.4`, `strategy-runtime-abi-v1.14`, and `canonical-set-policy-v1.4` exactly.
- Named the future real `runMatch`, transition recorder, current Chronicle validator, and semantic arena validator without exporting or activating those names.
- Represented removal of `PUSH_ATTEMPTED` only in candidate metadata; current types, schemas, OpenAPI, artifacts, registry, publications, installed head, and receipts are untouched.
- Generated deterministic candidate and hash-vector artifacts covering valid inactive, mixed, partial, and old-current identities.
- Proved against real PostgreSQL that candidate evidence reaches the current semantic-tuple gate, fails `CLOSED_GRAPH`, rolls back the transaction, and creates no publication or receipt evidence.

## Task Commits

The TDD task commits were atomic:

1. **Task 1 RED: Define the inactive exact contract** - `641f14f` (test)
2. **Task 1 GREEN: Implement the non-exported candidate** - `435b2fe` (feat)
3. **Task 2 RED: Define deterministic and non-publication proof** - `a9b63c4` (test)
4. **Task 2 GREEN: Render candidate artifacts** - `734623b` (feat)

## Files Created/Modified

- `packages/spec/src/integrity-authority-candidate-v1-37.ts` - Strict immutable candidate contract and byte baseline; deliberately not barrel-exported.
- `packages/spec/src/integrity-authority-candidate-v1-37.test.ts` - Exact component, owner, vocabulary, rejection, non-export, and current-byte tests.
- `scripts/generate-v1-37-kernel-integrity-candidate.ts` - Candidate-only deterministic write/check generator.
- `scripts/generate-v1-37-kernel-integrity-candidate.test.ts` - Render, vector, current-byte, and check-mode tests.
- `packages/spec/artifacts/v1.37-kernel-integrity-candidate.json` - Reviewable inactive candidate manifest.
- `packages/spec/artifacts/v1.37-kernel-integrity-candidate-hash-vectors.json` - Valid/mixed/partial/old-current fixed-order hash vectors.
- `packages/persistence/src/runtime-evidence-authority-publisher.test.ts` - Real-PostgreSQL candidate non-publication proof.

## Decisions Made

- The candidate reuses the current fixed-order, NUL-framed, UTF-8-length tuple encoding so activation can be atomic, but its schema, artifacts, trust state, and paths remain candidate-only.
- Candidate activation state has six explicit false values: current tuple pointer, current schema, current artifact, publication, receipt, and counted execution.
- Candidate event vocabulary excludes `PUSH_ATTEMPTED` and contains neither `HOLD` nor `END_ACTIVATION`; current vocabulary remains byte-identical until Plan 19.
- Production conformance remains empty. Documentation, artifact presence, and candidate hash vectors grant no executable or counted authority.

## Current-Authority Byte Invariance

The same SHA-256 values were captured before implementation and after the final write/check and PostgreSQL proof:

| Current file | Before and after SHA-256 |
| --- | --- |
| `packages/spec/src/versions.ts` | `98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821` |
| `packages/spec/src/integrity-authority.ts` | `11ed27e5646f8f908e2d2b9558a144b28f362ebe395c7a66b58c308953ca83b9` |
| `packages/spec/src/index.ts` | `72f499746c548f53c27a5972d9e39463c2d36709611bbd88cde3d9bb1a7b4c16` |
| Current authority artifact | `90bd23acff825349ed80b3df6b8e350ecd91153de44e17c952f5a302c7d3499d` |
| Current authority vectors | `cf8ac66719f06c7ebfb4db987524809495be6b6b5a2cbbb75fefbf1c06daafad` |

The protected consolidated-spec working bytes also remain
`01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`,
and its binary-diff bytes remain
`ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
`.planning/config.json` was never staged or changed by this plan.

## PostgreSQL Non-Publication Proof

The focused test creates a fresh migrated schema, inserts a containment certificate whose lane carries the inactive candidate tuple, and invokes the real publication transaction using the candidate schema label. Current lane parsing rejects the unregistered tuple with stable code `CLOSED_GRAPH`. Before/after queries prove exact equality for:

- authority publications;
- publication sources;
- prepared/installed/uncertain receipt events;
- publication generation head;
- immutable Strategy Revisions; and
- conformance certificate count, which remains zero.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Candidate-only direct imports and Buffer usage needed explicit lint treatment**

- **Found during:** Task 2 targeted lint gate
- **Issue:** The repository normally forbids cross-package internal imports, while this candidate must remain absent from the public spec barrel; root scripts also require an explicit Node `Buffer` import.
- **Fix:** Added a narrowly documented `no-restricted-imports` exception only to the candidate generator/test and imported `Buffer` from `node:buffer`.
- **Verification:** Targeted ESLint, generator tests, write/check, and both package typechecks pass.
- **Committed in:** `734623b`

---

**Total deviations:** 1 auto-fixed blocking issue
**Impact on plan:** No scope expansion. The exception enforces, rather than weakens, the non-export requirement.

## Issues Encountered

The package-wide spec lint command reports pre-existing bare `Buffer` references in current integrity-authority files. None are in Plan 07 files. Targeted lint for every created or modified Plan 07 file passes.

## Verification

- Candidate spec tests — 4/4 passed.
- Candidate generator tests — 3/3 passed.
- Candidate `--write` followed by `--check` — byte-identical and current.
- Real PostgreSQL inactive-candidate publication test — 1/1 passed.
- Existing current integrity-authority generator `--check` — passed.
- Spec and persistence typechecks — passed.
- Targeted ESLint and diff checks — passed.
- Current authority and protected working-byte hashes — exact before/after equality.

## TDD Gate Compliance

Both tasks have a failing RED commit followed by a distinct GREEN commit. Task 1 failed because the candidate module did not exist; Task 2 failed because the candidate generator/artifacts did not exist. The final implementations satisfy only those locked contracts.

## User Setup Required

None. The repository PostgreSQL service at the configured project DSN supplied the isolated proof schema.

## Next Phase Readiness

- Plan 12 can audit future current-event producer/consumer coverage against this explicit candidate vocabulary.
- Plan 19 can activate the complete candidate only as one exact tuple/schema/artifact migration; no partial or mixed activation can validate.
- Current execution remains on the immutable registered tuple and cannot resolve, publish, install, receipt, or count the candidate.

## Self-Check: PASSED

- All seven plan artifacts exist and all four TDD commits are present.
- The candidate is absent from the spec barrel and current registry.
- Deterministic write/check, real PostgreSQL non-publication, typecheck, lint, and current-byte invariance gates pass.
- Only the two protected pre-existing dirty files remain unstaged.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
