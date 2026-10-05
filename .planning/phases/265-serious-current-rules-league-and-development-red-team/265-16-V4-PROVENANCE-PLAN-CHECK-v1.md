---
phase: 265
plan: 16
reviewed: 2026-10-05T20:03:46Z
review_type: source_only_plan_check
status: passed_with_clarifications
source_edits: false
tests_run: false
empirical_operations: false
---

# Plan 16 V4 provenance repair — plan check

The bounded source-only repair is implementable and appropriately scoped. Existing code already has an opt-in correction-origin broker clone, strict finite receipt validation, request ordinal/root correlation, a private callback, and a `failureOrigin` WeakMap. The identified gap is narrow: a validated receipt is retained by the correction observer, but the exact `SUBPROCESS_SIGNAL` exception is not registered with the session failure-origin map, so the supervised runtime falls back to `executor/unknown`.

Proceed with these acceptance clarifications:

1. Register provenance only on the exact broker-synthetic signal failure, after the existing response shape, receipt allowlist, and request ordinal/root checks have succeeded. Do not register provenance for malformed/missing/mismatched receipts, stream errors, stdout/stderr cap failures, exits, or other failures. Missing/unavailable receipt means no detailed origin; preserve the current fail-closed malformed-IPC behavior where the opted-in protocol requires a receipt, rather than accepting an unauthenticated signal.
2. Preserve the existing default broker source bytes and legacy response schema when the observer is absent. Keep the finite receipt private and retain current system-failure code, compact projection, timers, caps, and privacy boundaries. Map only the receipt’s finite `timed_out` versus `changed_without_completion` distinction; do not describe the broker’s synthetic `SIGKILL` as evidence of an OS signal, OOM, or a performance cause.
3. No new route/version/issuer or baseline instrumentation is necessary. No-native tests should cover both receipt branches, request cross-binding and extra-key rejection, absent receipt/unknown provenance, and unchanged observer-absent/default behavior. These fixtures establish the narrow correlation seam only, not native behavior or phase acceptance.

No blocker found. This check approves planning only; it does not authorize empirical/native operations or change any consumed artifact, time carry, charge, or acceptance status.
