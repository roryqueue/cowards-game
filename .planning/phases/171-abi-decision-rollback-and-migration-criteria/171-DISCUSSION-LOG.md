# Phase 171: ABI Decision, Rollback, and Migration Criteria - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 171-ABI Decision, Rollback, and Migration Criteria
**Areas discussed:** Active ABI decision, Fail-closed metadata, Migration criteria

---

## Sequential Milestone Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Approve defaults | Use the recommended conservative defaults for this phase and carry similar decisions forward across the milestone. | ✓ |
| Adjust phase-specific decisions | Provide phase-specific edits before writing context. | |

**User's choice:** approve defaults
**Notes:** User asked to discuss phases sequentially and confirmed that once a decision is confirmed, similar recommended decisions can generally be assumed and confirmed rather than repeatedly expanded. These logs capture the approved defaults for downstream planning.

---

## Active ABI decision

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Recommended default is to keep Preview 1 stdin/stdout JSON active unless spike evidence strongly supports a different explicit decision. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 171-CONTEXT.md.

---

## Fail-closed metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Decision must explain why direct exports and Component Model/WIT are or are not promoted. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 171-CONTEXT.md.

---

## Migration criteria

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Unknown, stale, mismatched, or unpromoted ABI metadata must fail closed. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 171-CONTEXT.md.


## the agent's Discretion

- Exact implementation factoring, artifact filenames, helper names, and test decomposition are left to downstream planning/execution as long as the approved defaults are preserved.

## Deferred Ideas

None.
