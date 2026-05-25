# Phase 112 Execution: Python Submission Validation and Diagnostics

**Status:** Complete
**Date:** 2026-05-24

## Implemented

- Added `validatePythonStrategySource` and `buildPythonStrategyRevision`.
- Added Python source size, bracket/syntax-shape, required function, forbidden import/capability, package-policy, and non-counted diagnostics.
- Added Workshop API support for `sourceFormat: "python"`.
- Added Workshop language state so validation and submission preserve the selected language.
- Split Python validation exports from Python execution adapter imports so Workshop/web code does not import runtime execution machinery.

## Code Review

- Finding: validation state in Workshop was keyed only by source text.
- Fix: validation state is now keyed by source text and source format, preventing stale TS diagnostics from appearing after switching to Python or vice versa.
- Finding: importing Python validation through the package root pulled in subprocess adapter code during Next page render.
- Fix: added `@cowards/runtime-python/validation` subpath and moved runtime metadata to a side-effect-light module.

## Verification

- `pnpm --filter @cowards/runtime-python typecheck`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`
- Browser page smoke: `/` renders Python tactical starter, Python experimental chip, TS/PY language control, and no runtime error.

## Result

Phase 112 is complete. Python can be selected, validated, and submitted through Workshop with public-safe diagnostics and without Strategy execution in web/API/Go.
