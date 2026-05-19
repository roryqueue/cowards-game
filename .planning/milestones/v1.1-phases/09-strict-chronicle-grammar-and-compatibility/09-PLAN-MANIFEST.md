# Phase 9 Plan Manifest: Strict Chronicle Grammar and Compatibility

## Phase Goal

Reject invalid, impossible, private-leaking, or incompatible Chronicles before replay rendering.

## Wave Structure

| Wave | Plans | Dependency Reason |
| --- | --- | --- |
| 1 | `09-01`, `09-02` | Compatibility/error contracts and privacy projection are disjoint. |
| 2 | `09-03`, `09-04` | Event grammar and snapshot boundary modules depend on the error-code contract but do not touch the same files. |
| 3 | `09-05` | Integrates grammar and boundary modules into `validateChronicle` and adds transition contradiction gates. |

## Plan Index

| Plan | Objective | Requirements | Files |
| --- | --- | --- | --- |
| `09-01` | Validation error contract and compatibility gate | GRAM-01, GRAM-06 | `packages/spec/src/schemas.ts`, `packages/spec/src/types.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/validate.test.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/server.test.ts` |
| `09-02` | Public projection privacy hard gate | GRAM-07, GRAM-08 | `packages/replay/src/project.ts`, `packages/replay/src/project.test.ts`, `apps/web/app/matches/replay-fixture.test.ts` |
| `09-03` | Semantic event grammar state machine | GRAM-01, GRAM-02, GRAM-03, GRAM-08 | `packages/replay/src/grammar.ts`, `packages/replay/src/grammar.test.ts` |
| `09-04` | Snapshot boundary grammar | GRAM-04, GRAM-05, GRAM-08 | `packages/replay/src/snapshot-boundaries.ts`, `packages/replay/src/snapshot-boundaries.test.ts` |
| `09-05` | Integrated validation gate and provable board contradictions | GRAM-01, GRAM-02, GRAM-03, GRAM-04, GRAM-05, GRAM-08 | `packages/replay/src/validate.ts`, `packages/replay/src/validate.test.ts`, `packages/replay/src/replay-transition.ts`, `packages/replay/src/replay-transition.test.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/reconstruct.test.ts`, `packages/test-utils/src/replay-scenarios.legality.test.ts` |

## Source Coverage Audit

| Source | ID | Requirement or decision | Plan | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| GOAL | Phase 9 | Reject invalid, impossible, private-leaking, or incompatible Chronicles before replay rendering. | 09-01, 09-02, 09-03, 09-04, 09-05 | COVERED | Compatibility, privacy, grammar, snapshots, and transition contradiction checks are split by dependency. |
| REQ | GRAM-01 | Validate event payload shape and semantic grammar before replay rendering accepts a Chronicle. | 09-01, 09-03, 09-05 | COVERED | Zod shape parsing remains first; grammar is wired into `validateChronicle`. |
| REQ | GRAM-02 | Invalid event order, missing required events, duplicate terminal events, and illegal windows fail clearly. | 09-03, 09-05 | COVERED | Event state machine and final integration. |
| REQ | GRAM-03 | Required context fields and payload consistency are enforced per event type. | 09-03, 09-05 | COVERED | Context and payload checks live in grammar module. |
| REQ | GRAM-04 | Snapshot boundary rules for Match, Round, Activation, Contraction, and terminal states. | 09-04, 09-05 | COVERED | Snapshot-kind/event matrix and integration. |
| REQ | GRAM-05 | Reject missing snapshot sequences and impossible board transitions where data proves impossibility. | 09-04, 09-05 | COVERED | Boundary missing-sequence checks plus bounded event/snapshot reconstruction comparison. |
| REQ | GRAM-06 | Reject unsupported Chronicle schema, engine, runtime, Strategy Revision, and Arena Variant versions. | 09-01 | COVERED | Compatibility matrix over `COMPATIBILITY_VERSIONS`. |
| REQ | GRAM-07 | Public projection excludes Strategy source, memories, objectives, raw Awareness Grid, and private runtime details. | 09-02 | COVERED | Hostile privacy marker tests in replay and web fixture path. |
| REQ | GRAM-08 | Negative fixtures for corrupted, impossible, private-leaking, and version-incompatible Chronicles. | 09-01, 09-02, 09-03, 09-04, 09-05 | COVERED | Each negative class has a focused package or web gate. |
| RESEARCH | R-01 | Build semantic grammar in `packages/replay` after Zod parsing and before rendering. | 09-03, 09-05 | COVERED | `grammar.ts` and `validateChronicle` integration. |
| RESEARCH | R-02 | Add stable grammar-specific error codes instead of raw Zod UX. | 09-01 | COVERED | Error contract expanded in `@cowards/spec`. |
| RESEARCH | R-03 | Reuse reconstruction/snapshot comparison for board contradictions; do not build a second engine. | 09-05 | COVERED | Transition checks are bounded to event/snapshot contradictions. |
| RESEARCH | R-04 | Keep public/owner projection privacy centralized in `packages/replay`. | 09-02 | COVERED | No web-layer sanitizer duplication is planned. |
| RESEARCH | R-05 | Use table-driven Vitest negative fixtures. | 09-01, 09-02, 09-03, 09-04, 09-05 | COVERED | Each plan includes focused table-driven tests. |
| CONTEXT | D-01 | Chronicle validation strict by default. | 09-03, 09-04, 09-05 | COVERED | Grammar and snapshots reject illegal structures. |
| CONTEXT | D-02 | Invalid/impossible sequences fail closed; escape hatches explicit and version-gated. | 09-01, 09-05 | COVERED | Compatibility gate and transition validation. |
| CONTEXT | D-03 | Validate impossible board transitions where snapshots/events prove impossibility. | 09-05 | COVERED | Event/snapshot contradiction checks. |
| CONTEXT | D-04 | Do not build a second engine or re-run Strategy source. | 09-03, 09-05 | COVERED | Plans explicitly bound validation to Chronicle data. |
| CONTEXT | D-05 | Support `chronicle-v1` and current compatibility versions. | 09-01 | COVERED | Current versions remain accepted. |
| CONTEXT | D-06 | Unsupported future or legacy versions produce explicit unsupported-version failures. | 09-01 | COVERED | `VERSION_INCOMPATIBLE`/`UNSUPPORTED_MIGRATION` tests. |
| CONTEXT | D-07 | Public projection privacy is a hard gate. | 09-02 | COVERED | Package and web fixture gates. |
| CONTEXT | D-08 | Tests prove public projection excludes required private data categories. | 09-02 | COVERED | Serialized marker scans. |
| CONTEXT | D-09 | Add negative fixtures that intentionally try to leak private data. | 09-02 | COVERED | Hostile marker fixture. |
| CONTEXT | D-10 | Validation returns stable error codes and clear messages. | 09-01, 09-03, 09-04, 09-05 | COVERED | Exact-code tests. |
| CONTEXT | D-11 | Raw Zod-only messages are not the primary user-facing failure output. | 09-01 | COVERED | Normalized `SCHEMA_INVALID` shape and replay loading diagnostics. |

## Phase Verification Gate

Run after all plans complete:

```bash
pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts
pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts
pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts
pnpm --filter @cowards/replay typecheck
pnpm --filter @cowards/test-utils typecheck
pnpm --filter @cowards/web typecheck
```

## Notes for Executors

- No game rules in React.
- No Strategy execution in web/API process.
- Semantic Chronicle grammar belongs in `packages/replay` after Zod parsing and compatibility checks.
- Board transition validation is bounded to event/snapshot contradictions.
- Public projection privacy is a hard gate.
