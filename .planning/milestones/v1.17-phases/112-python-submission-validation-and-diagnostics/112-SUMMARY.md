# Phase 112 Summary: Python Submission Validation and Diagnostics

**Status:** Complete
**Completed:** 2026-05-24

## One-Liner

Added experimental Python Workshop validation and submission with public-safe diagnostics and no Strategy execution in web/API/Go.

## Delivered

- Added `validatePythonStrategySource` and `buildPythonStrategyRevision`.
- Added Python source size, syntax-shape, required function, forbidden capability, package-policy, and non-counted diagnostics.
- Added Workshop API and UI state support for `sourceFormat: "python"`.
- Split Python validation exports from runtime execution adapter imports to keep web validation side-effect-light.

## Verification

- `pnpm --filter @cowards/runtime-python typecheck`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`
- Browser page smoke for `/`

## Notes

Review found stale validation could cross language switches and that validation imports pulled runtime adapter code into Next render; both were fixed.
