# Phase 186: Malformed Runtime Result and Stale Artifact Failure Drills - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 186-Malformed Runtime Result and Stale Artifact Failure Drills
**Areas discussed:** Malformed split, stale artifacts, privacy

---

## Malformed Split

| Option | Description | Selected |
|--------|-------------|----------|
| Split by layer | Retry malformed service envelopes; fail malformed Strategy/runtime output closed. | ✓ |
| Retry all malformed | Treat all malformed failures as service/system retryable. | |
| Fail all malformed | Treat all malformed failures as non-retryable. | |

**User's choice:** Confirmed split-by-layer decision.
**Notes:** Same decision as Phase 184, applied to concrete drills.

## Stale Artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed without fallback | Stale/mismatched immutable artifact metadata is non-retryable and public-safe. | ✓ |
| Fallback to source | Use source fallback when artifact mismatch occurs. | |

**User's choice:** Confirmed fail closed without source fallback.
**Notes:** No direct-export/Component Model/WIT migration or runtime promotion claim.

## Privacy

| Option | Description | Selected |
|--------|-------------|----------|
| Category-only public evidence | Public output uses frozen categories and redacted proof artifacts. | ✓ |
| Include raw diagnostics | Surface raw runtime/service diagnostics publicly for debugging. | |

**User's choice:** Confirmed category-only public evidence.
**Notes:** Raw diagnostics remain private.

## the agent's Discretion

- Choose the most reliable mechanism for inducing malformed and stale paths.

## Deferred Ideas

None.
