# Phase 222 Plan: Language Surface Inventory

## Objective

Create a downstream-ready inventory of every active and historical language, runtime, eligibility, product-label, validation, ABI, evidence, docs, and monitor surface that affects JS/TS, Python, Rust, and Zig support before any v1.32 behavior changes.

## Requirements

- INV-01: List active language/runtime/eligibility/label/ABI/validation/template/product/public/docs/monitor surfaces.
- INV-02: Classify each surface as source of truth, active consumer, stale historical artifact, approved provider boundary, or drift risk.
- INV-03: Identify every active product/UI/API special case for `typescript`, `python`, `rust`, or `zig` with owner and remediation phase.
- INV-04: Record every non-promotion monitor, non-counted assertion, exhibition beta label, and JS/TS-only counted gate for conversion or preservation.
- INV-05: Answer the promotion question and name monitors needed to prevent future drift.

## Tasks

1. Inventory canonical spec and runtime/provider surfaces.
   - Inspect `packages/spec/src/runtime.ts`, `packages/spec/src/runtime-execution-service.ts`, schemas, runtime packages, and runtime-service routing.
   - Classify source-of-truth candidates and approved execution boundaries.

2. Inventory product, persistence, API, UI, public evidence, and docs consumers.
   - Inspect Workshop, Account, competition entry, result, replay, public discovery, strategy pages, Learn/docs, and e2e proof surfaces.
   - Identify direct language-id branching and label/eligibility special-casing.

3. Inventory monitors and historical evidence.
   - Inspect boundary monitor checks, runtime evidence generators, proof artifacts, and historical milestone artifacts.
   - Separate active gates from archived baseline evidence.

4. Write the inventory artifact.
   - Create `.planning/artifacts/v1.32-language-surface-inventory.md`.
   - Include owner, current behavior, classification, drift risk, target remediation phase, and verification notes.

5. Verify Phase 222 without behavior changes.
   - Re-run targeted searches for language ids, non-counted labels, runtime eligibility, and monitor assertions.
   - Run a no-code-change verification command that exercises the existing language semantics tests.

## Non-Goals

- Do not promote Python, Rust, or Zig.
- Do not change counted eligibility, labels, runtime adapters, ABI, product UI, tests, or monitors.
- Do not rewrite historical artifacts; classify them for downstream conversion only.

## Verification

- `rg -n "non-counted|exhibition beta|enabledForNormalPlay|countedPlayEligible|sourceFormat|python|rust|zig" packages apps scripts .planning/research/v1.32-SUMMARY.md`
- `pnpm --filter @cowards/spec test`

