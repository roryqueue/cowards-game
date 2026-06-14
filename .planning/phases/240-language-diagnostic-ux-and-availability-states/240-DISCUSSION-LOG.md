# Phase 240: Language Diagnostic UX and Availability States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 240-Language Diagnostic UX and Availability States
**Areas discussed:** Diagnostic Detail Level, Unavailable State Copy, Diagnostic Mapping Ownership, Line/Column and References

---

## Diagnostic Detail Level

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable categories, no raw detail | Show language-specific category, short public-safe message, constraint/remediation/reference, optional safe line/column; never show raw compiler/runtime text by default. | ✓ |
| More detailed sanitized snippets | Include selected compiler-like snippets if scrubbed; more helpful but higher privacy/path leakage risk. | |
| Minimal status only | Safest, but too vague for Workshop users trying to fix Python/Rust/Zig code. | |

**User's choice:** Same recommended path, inferred from repeated backtick after prior instruction to confirm similar recommended decisions.
**Notes:** Locked as actionable categories with no raw detail.

---

## Unavailable State Copy

| Option | Description | Selected |
|--------|-------------|----------|
| Shared calm template plus language-specific next step | Explain the checker/service/toolchain issue calmly and give a specific next step. | ✓ |
| Fully language-specific copy | More tailored, but more text to maintain and easier to drift. | |
| Generic unavailable copy only | Simpler, but less actionable for Python/Rust/Zig users. | |

**User's choice:** Same recommended path, inferred from repeated backtick after prior instruction.
**Notes:** Locked as shared calm template plus language-specific next step.

---

## Diagnostic Mapping Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Shared checker utility/schema | Centralize category/actionability/redaction mapping outside React components. | ✓ |
| API route only | Simpler initially, but submit/save/UI can drift. | |
| React-side mapping | Easiest for display, but puts validation meaning in UI code. | |

**User's choice:** Shared checker utility/schema.
**Notes:** User selected the recommended option.

---

## Line/Column and References

| Option | Description | Selected |
|--------|-------------|----------|
| Structured-safe only | Include line/column/reference only from safe structured validation fields. | ✓ |
| Best-effort parse raw diagnostics | More precise, but risks leaking paths/raw compiler text. | |
| No locations ever | Safest, but less helpful for Python/TypeScript syntax fixes. | |

**User's choice:** Structured-safe only.
**Notes:** User selected the recommended option.

---

## the agent's Discretion

- Planner may choose shared utility/schema file locations and exact copy wording.

## Deferred Ideas

- Default/public raw diagnostics are deferred out of v1.34 unless an existing private/test-only gate safely owns them.
