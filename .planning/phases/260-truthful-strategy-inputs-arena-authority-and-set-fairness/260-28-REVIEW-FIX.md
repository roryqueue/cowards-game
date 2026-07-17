# Plan 260-28 Review Fix

## Finding

An idempotent abort retry checked only the transition kind, direction, and
activation ID after the pending intent had already been cleared. A caller that
supplied the wrong parent HEAD or selector-manifest root could therefore receive
the already-aborted head as a successful retry. The path could not mutate state,
but it weakened the recovery binding contract.

## Fix

The idempotent abort path now reloads and parses the append-only prepared
transition and compares every supplied parent/manifest binding before accepting
the retry. A regression test proves a misbound retry fails closed after the
original abort.

## Verification

- `36/36` focused migration and selection-head tests passed.
- Persistence typecheck passed.
- Changed-file ESLint and Prettier checks passed.
- Diff check and protected working-tree baseline passed.

## Follow-up Lint Closure

The full repository gate later reached the previously documented
`consistent-type-imports` finding in `matchset-status.ts`. The arena catalog
version symbol is now imported as a type, matching its only use and changing no
runtime behavior.
