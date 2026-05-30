# Phase 165: Runtime Abuse Taxonomy and Evidence Schema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 165-Runtime Abuse Taxonomy and Evidence Schema
**Areas discussed:** Taxonomy shape, Evidence artifacts, Failure classification

---

## Sequential Milestone Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Approve defaults | Use the recommended conservative defaults for this phase and carry similar decisions forward across the milestone. | ✓ |
| Adjust phase-specific decisions | Provide phase-specific edits before writing context. | |

**User's choice:** approve defaults
**Notes:** User asked to discuss phases sequentially and confirmed that once a decision is confirmed, similar recommended decisions can generally be assumed and confirmed rather than repeatedly expanded. These logs capture the approved defaults for downstream planning.

---

## Taxonomy shape

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Organize probes by abuse behavior first and runtime lane second. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 165-CONTEXT.md.

---

## Evidence artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Produce machine-readable JSON plus public-safe Markdown for human audit. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 165-CONTEXT.md.

---

## Failure classification

| Option | Description | Selected |
|--------|-------------|----------|
| Conservative evidence-first default | Evidence must record runtime lane, probe class, expected outcome, observed outcome, failure class, privacy class, and promotion impact. | ✓ |
| Stronger promotion or migration claim | Only allowed if explicit phase evidence supports it and a final decision says so. | |

**User's choice:** Conservative evidence-first default
**Notes:** Captured in 165-CONTEXT.md.


## the agent's Discretion

- Exact implementation factoring, artifact filenames, helper names, and test decomposition are left to downstream planning/execution as long as the approved defaults are preserved.

## Deferred Ideas

None.
