# Phase264 Development Evaluation Reference

This is the16-fixture reference set specified by264-AI-SPEC.md:4accepted/rebuilt identities,4malformed/unavailable identity blocks,3legal-input/execution denials,3clone cases and2quarantine/ledger cases. Fixtures live in the executable tests below; no second copy, provider participation, human review or empirical record is manufactured by this index. Where one test has multiple assertions, the named branch is one reference fixture. The larger regression suite remains additional coverage.

All16fixtures are development-only mechanics. Model and participant identifiers in those tests are synthetic. Expected dispositions are code assertions, not judge labels or a calibration threshold freeze. The separate six-category comparison corpus is a different inventory: it provides paired projection records for D-12, not the entire six-dimension evaluation strategy.

## Reference fixture index

Paths below are repository-relative test locations.

| ID | Category | Executable fixture and exact test/branch | Expected disposition and required evidence |
|---|---|---|---|
| E01 | accepted/rebuilt | `packages/strategy-lab/src/factory/contracts.test.ts` — `admits a strictly bounded private packet through the noncircular candidate stages` | Exact packet, proposal, validation and candidate roots; private-only schema. |
| E02 | accepted/rebuilt | `packages/strategy-lab/src/factory/identity.test.ts` — `is stable for canonical input and changes for source, provider, prompt, validation, correction, or lineage` | Same canonical bytes preserve root; every changed identity dimension changes its root. |
| E03 | accepted/rebuilt | `packages/strategy-lab/src/factory/repository.test.ts` — `publishes bytes once, charges before terminal publication, and resumes conservatively` | Immutable source artifact plus bound start, terminal and inventory roots. |
| E04 | accepted/rebuilt | `scripts/ingest-v1-38-factory-packet.test.ts` — `ingests and reloads a nonempty canonical-search teacher student as inert source data` | Real owned emitter called as data; exact packet/source reopen; duplicate publication refused; zero runtime attempts. |
| E05 | identity block | `packages/strategy-oracle-model/src/model.test.ts` — `fails closed for missing accounting and retains charged unavailable or drifted identities`, missing-accounting branch | `MODEL_BUNDLE` rejection; missing usage is not zero usage. |
| E06 | identity block | Same test, exact model-version drift branch | Rooted `blocked`, `charged:true`, `identity_drift`, original attempt/budget retained. |
| E07 | identity block | Same test, unavailable-provider branch | Rooted `blocked`, `charged:true`, `provider_unavailable`; distinct from drift. |
| E08 | identity block | `packages/strategy-oracle-model/src/model.test.ts` — `rejects unknown or malformed provenance fields before root conversion`, wrong response/source commitments | `MODEL_RESPONSE`/`MODEL_SOURCE` rejection; no substituted source or bundle root. |
| E09 | legal/execution denial | `packages/strategy-oracle-teacher/src/teacher.test.ts` — `rejects unknown records, extra legal-input data, malformed Actions, policy extras, and forged roots`, evaluator-extra branch | `TEACHER_TRAINING_ACTIVATION` denial; privileged/evaluator input is not distilled. |
| E10 | legal/execution denial | `packages/strategy-lab/src/factory/admission.test.ts` — `rejects another source, lane, validation, or candidate before invoking supervision` | Exact source/lane/proposal/validation mismatch rejected before selected invocation. |
| E11 | legal/execution denial | `scripts/check-v1-38-factory-boundaries.test.ts` — parameterized `rejects hostile execution` | Static graph denial for direct evaluation of source; no source is executed by the test. |
| E12 | clone signal | `packages/strategy-lab/src/factory/calibration-corpus.test.ts` — `recognizes cosmetic rewrites, a shared selector, and reflected opaque-id fixtures`, semantic-rewrite pair | AST structure equality, full projected agreement, correlated mechanics signal; independence remains unresolved. |
| E13 | clone signal | Same test, shared-selector pair | Different source structure but matching dependency/behavior; correlated signal, not diversity. |
| E14 | clone signal | Same test, symmetry/opaque-ID pair; near-identical control in `derives all six dimensions and actual agreement counts from concrete paired records` | Renamed/reflected fixture is correlated; near-identical control has3/4agreement and stays borderline. |
| E15 | quarantine/ledger | `packages/strategy-lab/src/factory/intake-protocol.test.ts` — `projects only verified source/provenance roots to an authorized reviewer` | Exact roots-only disclosure; holdout, memory, objectives, host, credentials and unknown reviewer denied. |
| E16 | quarantine/ledger | `packages/strategy-lab/src/factory/intake.test.ts` — `charges and retains invalid, incomplete-provenance, conflict, weak, duplicate, and retry outcomes` | Every input attempt charged and terminal retained; conflict/rejection cannot disappear from the same inventory. |

## Execution and limits

The named `Private factory source and evaluation checks (no experimental runs)` step in `.github/workflows/ci.yml` runs the exact test files containing these fixtures, the connected runner/retention regressions and the recursive boundary monitor. It reuses the workflow's existing dependency installation, adds no service/credential/provider or package, has a5-minute step ceiling, and never calls an empirical prepare/run command. The same direct installed-tool commands are used locally; no broad historical suite is needed for this reference set.

The CI definition is source-reviewed; a local passing suite is not a claim that a remote CI run has already passed. The existing product CI jobs, branch-protection settings, runtime policies and default production build graph are unchanged. A missing real Plan07 input remains missing after any green CI result.
