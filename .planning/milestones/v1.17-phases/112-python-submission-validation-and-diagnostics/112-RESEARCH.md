# Phase 112 Research: Python Submission Validation and Diagnostics

**Date:** 2026-05-25
**Status:** Complete

## Findings

- Workshop validation currently accepts only source text and calls JS/TS `validateStrategySource`.
- `packages/runtime-python` contains execution seed code but no submission validator.
- Python validation can use a small host script for `ast.parse`, `compile`, required function checks, and denylist checks without invoking Strategy functions.
- Existing `StrategyRevisionValidationIssue` lacks line/column fields; adding optional fields is backward-compatible.
- Workshop API and client need an explicit language/source-format field so Python is never inferred silently.

## Risks

- Running Python Strategy functions during validation would violate submission-time safety.
- Raw Python exceptions could leak paths or source snippets; diagnostics must be normalized.
- Importing execution helpers into web/API validation paths could blur boundaries; validation helper must remain parse/compile only.

## Recommended Tests

- Runtime-python validator tests for parse errors, forbidden imports, missing functions, package markers, and redaction.
- Workshop tests for Python valid/invalid validation and valid-only submission.
- API/client tests where practical for explicit language selection.

