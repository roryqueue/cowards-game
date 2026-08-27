---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: false
wave_0_complete: true
created: 2026-07-28
last_audited: 2026-08-27
---

# Phase 262 — Validation Strategy

> Post-summary audit at 64 active plans / 64 summaries. Archived Plan 74 remains byte-authenticated, excluded from active discovery, intentionally unsummarized, and absent from active paths.

## Test Infrastructure

| Item | Value |
|---|---|
| Framework | Vitest 4.1.6 and TypeScript/tsx integration checkers |
| Focused runner | `pnpm exec vitest run <files> --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1` |
| Accounting | Filesystem-derived identities; archived directories excluded; no copied plan counts |
| Auditor constraint | Implementation and immutable live evidence were read-only; implementation failures are escalated rather than repaired here. |

## Requirement-to-Task Coverage

| Requirements | Primary plans | Current status | Behavioral evidence |
|---|---|---|---|
| ADMIT-01, ADMIT-02 | 262-01, 262-23, 262-28..34, 262-60..68, 262-81 | COVERED | Historical admission, exact identity joins, Git/blob custody, and lifecycle conjunction remain exercised by the focused correction/disposition chain. |
| ADMIT-03 | 262-02, 262-08..33, 262-53..83 | ESCALATED — BLOCKED | The empirical result is exhausted at fresh 0/540 with reproduction-v15 and Route-9 activation absent. The protected-input drift test also fails 3/3. |
| ADMIT-04 | 262-01, 262-15..34, 262-53..83 | ESCALATED — BLOCKER | `enumerateV138CurrentMatrix` accepts a dirty protected compatibility fixture after a prior pass instead of throwing `MATRIX_ADMISSION_INVALID`. |
| MEAS-01..MEAS-10 | 262-35..39, 262-44..52, 262-60, 262-75..83 | PARTIAL — ESCALATED | Component and bounded-retry behavior is covered, but the aggregate pre-search policy generator rejects the current committed supersession artifact because it pins an obsolete manifest root. |
| SEAL-01 | 262-44, 262-45, 262-49, 262-52, 262-53, 262-60, 262-63..68, 262-75, 262-78..81 | COVERED WITH REDUCED ASSURANCE | The checked chain preserves `single_operator_local_seal_v1`, claims no independent custody, and grants no opening or downstream authority. |
| DECI-02 | 262-37, 262-39, 262-49, 262-51, 262-52, 262-60, 262-63..65 | PARTIAL — ESCALATED | Classifier fixtures remain historical component evidence; their current aggregate pre-search root cannot regenerate until the supersession-root join is repaired and revalidated. |

## Behavioral Runs

### Green: bounded retry, correction, disposition, and lifecycle

Command:

```bash
pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope.test.ts scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.test.ts scripts/check-v1-38-plan-262-post-run-audit-correction.test.ts scripts/check-v1-38-plan-262-80-bounded-retry-admission.test.ts scripts/check-v1-38-plan-262-81-lifecycle.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1
```

Result: **5 files passed, 78/78 tests passed**. The suite proves finite bounds, durable reservations, crash recovery, OS-lock ownership, correction tamper rejection, effective Plan-83 blockage, Plan-80 non-pass, and zero lifecycle mutation.

Canonical read-only checks also passed:

- Correction v2: `verified_integrity_non_pass`, root `sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026`.
- Effective Plan-83 review: `blocked`, 13 findings, source review false, execution false.
- Plan-80 disposition: `non_pass` / `exhausted`, activation absent.
- Terminal: `exhausted`, cleanup complete, reproduction absent, downstream denied.
- Plan-81 post-summary: `gaps_found`, 64/64, `lifecycleMutated:false`.

## Escalated Behavioral Gaps

### BLOCKER V262-NYQ-01 — protected matrix input drift is accepted

Requirement: ADMIT-03, ADMIT-04.

Command, executed three times total (once in the broad suite and twice isolated):

```bash
pnpm exec vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t 'matrix admission rechecks protected inputs after a prior pass' --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1
```

Expected: after appending to `packages/engine/src/compatibility-fixtures.test.ts` in a detached checkout, `enumerateV138CurrentMatrix(checkout)` throws `MATRIX_ADMISSION_INVALID`.

Actual: enumeration succeeds; Vitest reports `expected [Function] to throw an error` at `scripts/evaluate-v1-38-foundation-contract.test.ts:2871` on all 3/3 attempts.

Implementation boundary: `scripts/lib/v1-38-current-matrix-reproduction.ts` rechecks only the historical foundation admission, while `scripts/lib/v1-38-foundation-admission.ts` does not include the compatibility fixture in its live protected-source set. This is an implementation bug and was not changed by the auditor.

### BLOCKER V262-NYQ-02 — aggregate pre-search root is pinned to obsolete supersession

Requirement: MEAS-01..MEAS-10, DECI-02.

Command, executed three times total (once in the broad suite and twice isolated):

```bash
pnpm exec vitest run scripts/evaluate-v1-38-pre-search-policy.test.ts -t 'joins the exact policy components' --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1
```

Expected: the generator authenticates the current committed `v1.38-phase-262-plan-supersession-v1` artifact and regenerates the non-authorizing pre-search policy root.

Actual: `V138_PRE_SEARCH_POLICY_SUPERSESSION_INVALID` on all 3/3 attempts. The generator pins supersession root `sha256:5a98bda88cbd2316faa0279d6a22e1f0c1cee3439a3e5f997ea31f217832c8a6`, while the current committed artifact records `sha256:d13f48fe05dc8968de15b973948fdcb2abd5dc2670372afb257c6b1020545c57`.

This is an implementation/lineage integration bug and was not changed by the auditor.

## Current Admission Evidence

| Field | Result |
|---|---|
| Active plans / summaries | 64 / 64 |
| Archived Plan 74 | `sha256:9fc59c094d5423830500c383c1a7613e54a0d2dc6e0ee1a00f4882981f16913d` |
| Plan-74 active path / summary | absent / absent |
| Plan-80 status | non_pass |
| Terminal | exhausted |
| Fresh accepted | 0/540 |
| Reproduction-v15 | absent |
| Route-9 activation root | absent |
| Effective integrity | false |
| Downstream authority | denied |

## Validation Audit 2026-08-27

| Metric | Count |
|---|---:|
| Focused behavioral tests passed | 78 |
| Canonical read-only checks passed | 5 |
| Escalated implementation blockers | 2 |
| Debug iterations per blocker | 3/3 |
| Fresh accepted | 0/540 |

The immutable empirical result remains exhausted at 0/540, and the additive correction remains an effective integrity non-pass. This validation created no reproduction, activation, lifecycle mutation, formation material, holdout opening, public/product/production exposure, counted play, or gameplay-change authority. Phase 262 is not Nyquist-compliant and Phase 263 remains denied.
