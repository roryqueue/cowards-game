# Phase 9: Strict Chronicle Grammar and Compatibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 9-Strict Chronicle Grammar and Compatibility
**Areas discussed:** Grammar strictness, Board transition validation, Compatibility policy, Privacy tests, Error reporting

---

## Grammar Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Strict by default | Illegal Match/Round/Activation/Cycle windows fail closed. | ✓ |
| Best-effort render | Render whatever can be reconstructed and warn. | |
| Compatibility escape hatch | Allow looser grammar for older Chronicles. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Escape hatches must be explicit and version-gated.

---

## Board Transition Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Validate where evidence exists | Reject impossible transitions proven by snapshots/events. | ✓ |
| Full replay proof | Re-derive every transition as a second engine. | |
| Shape only | Avoid semantic board checks. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Do not re-run Strategy source or build a full second engine.

---

## Compatibility Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Current version only | Support `chronicle-v1` and current compatibility versions. | ✓ |
| Best-effort legacy | Try to render legacy versions without migration. | |
| Future-compatible | Attempt to render unknown future versions. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Unsupported versions should produce explicit failure states until migrations exist.

---

## Privacy Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Hard gates | Add negative fixtures and fail on private data leakage. | ✓ |
| Projection-only smoke | Test common public projection path. | |
| Manual review | Rely on code review for private data. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Negative fixtures should intentionally try to leak private data.

---

## Error Reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Structured and clear | Stable codes plus user-facing messages. | ✓ |
| Raw Zod messages | Surface parser messages directly. | |
| Developer-only | Keep messages technical and test-focused. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Replay unavailable screens need clear categories, not raw parser noise.

## the agent's Discretion

- Grammar validator internals, state-machine representation, fixture layout, and exact error code names are left to research and planning.

## Deferred Ideas

None.
