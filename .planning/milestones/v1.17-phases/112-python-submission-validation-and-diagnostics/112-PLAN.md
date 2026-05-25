---
phase: 112-python-submission-validation-and-diagnostics
plan: 1
type: execute
wave: 1
depends_on: [111]
files_modified:
  - packages/runtime-python/src/validation.ts
  - packages/runtime-python/src/python_validation_host.py
  - packages/runtime-python/src/validation.test.ts
  - packages/runtime-python/src/index.ts
  - packages/runtime-python/package.json
  - packages/persistence/src/workshop.ts
  - packages/persistence/src/workshop.test.ts
  - apps/web/app/api/workshop/validate/route.ts
  - apps/web/app/api/workshop/revisions/route.ts
  - apps/web/app/workshop/types.ts
  - apps/web/app/workshop/workshop-client.tsx
autonomous: true
requirements: [PYVAL-01, PYVAL-02, PYVAL-03, PYVAL-04, PYVAL-05, PYVAL-06]
---

<objective>
Allow explicit experimental Python Workshop validation/submission using parse/compile/static checks and public-safe diagnostics.
</objective>

<tasks>

1. Add a Python validator that performs parse/compile/AST required function and capability checks without executing Strategy functions.
2. Normalize diagnostics into `StrategyRevisionValidationReport` with safe code/message/severity and optional safe line/column.
3. Add Workshop `sourceFormat` support for validate and submit; store only valid Python revisions with Python runtime metadata.
4. Add a Python template entry with explicit experimental/non-counted labeling for later proof work.
5. Test invalid Python rejection, valid Python revision creation, and diagnostic redaction.

</tasks>

<verification>

- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`

</verification>

