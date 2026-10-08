---
phase: 265
plan: 16
reviewed: 2026-10-08
review_type: bounded_source_only_plan_check
status: issues_found
source_edits: false
tests_run: false
empirical_operations: false
---

# Plan 16 preparation provenance — bounded plan check

**BLOCKED on one verification gap.** The proposed repair is correctly scoped as prospective, private, source-only attribution; it preserves the consumed v12-1 material and does not claim to reconstruct the cause of preparation9358. No test, helper, admission, reader, Match, or route was run or invoked for this check.

## Coverage checked

The proposal maps to the real `prepareLeanCorrection` sequence at `scripts/run-v1-38-lean-correction.ts:1283`: admission start; scope and spent-destination checks; request and predecessor reads; allocation and time admission; optional snapshot; ledger creation and allocation publication. The proposed stage set covers the failure-capable work inside the preparation `try`; the existing `finally` still owns admission close and v12 failure custody.

The existing trusted-code mechanism is identity-based: `trustedGuardErrors` is a `WeakMap` populated only by `leanCorrectionTrustedGuardError` for allowlisted codes. The CLI formatter then reads that map; matching or parsing an error message alone is not authentication. Limiting the new receipt to that WeakMap and recording arbitrary/native errors as `unknown` is compatible with the implementation and avoids a message classifier.

The proposal explicitly keeps admission/request/helper/authorization/check/carry/hold inputs immutable; limits the sidecar to a private, non-authorizing record bound to the admission start, mode, and route; preserves legacy behavior; avoids successful-prepare sidecars; and requires a HOST regression through the actual prepare function with synthetic dependencies, no dispatch, custody, exclusive publication, trusted-vs-message-shaped errors, and original-error propagation. These are appropriate acceptance boundaries for the zero-new-Match, 34-charge ended pair. The historical cause remains unknown.

## Blocker

```yaml
issues:
  - plan: "265-16 preparation provenance supplement"
    dimension: "verification_derivation"
    severity: "BLOCKER"
    description: "The plan requires diagnostic-publication failure not to replace or suppress the original preparation refusal, but its HOST regression criteria do not explicitly force sidecar publication/retention to fail while an original trusted or unknown preparation error is in flight. A passing-publication propagation test would not verify this fail-safe property."
    fix_hint: "Make the single HOST regression inject an exclusive sidecar publication failure after a preparation refusal, then assert the original refusal remains the propagated outcome, admission close and failure custody still occur, no allocation/dispatch/success is produced, and the sidecar grants no authority. Keep this entirely synthetic and do not retry v12-1."
```

## Recommendation

Add that failure-injection case to the existing regression's explicit acceptance criteria, then recheck this supplement. This is a plan-verification gap only; it is not evidence of a source defect or of the cause of preparation9358.
