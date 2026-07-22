# Plan 260-27 Review Fix

## Finding

After the compact selector made the live runtime ABI a precise v1.17 literal,
the runtime-service helper's unannotated default parameter narrowed to that
literal. Its historical v1.14 verification branch then failed TypeScript
checking even though runtime behavior was unchanged.

## Fix

The helper parameter is explicitly typed as `string` while retaining the
selector-backed v1.17 default. This preserves exact current selection and the
explicit historical verification-only dispatch without widening the authority
constant itself.

## Verification

- Runtime-service typecheck passed.
- Runtime-service execute-match suite passed (`35/35`).

## Follow-up Finding

The repository base `no-redeclare` rule also flagged the two legal TypeScript
overload declarations used to preserve literal-key inference for the closed
selection resolver.

The overload signature and implementation now carry narrow explanatory
suppression comments. No type, runtime value, or selector behavior changed.
Spec lint and typecheck pass with the overload contract intact.
