# Phase 112: Python Submission Validation and Diagnostics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 112-Python Submission Validation and Diagnostics
**Areas discussed:** Submission semantics, validation depth, diagnostics

---

## Submission Semantics

| Option | Description | Selected |
| --- | --- | --- |
| Store valid revisions only | Invalid Python returns reports; valid Python creates immutable revisions. | yes |
| Store invalid revisions | Persist invalid artifacts for later repair. | |
| Accept with warnings | Let invalid or partially valid Python enter MatchSet paths. | |

**User's choice:** Store valid revisions only.
**Notes:** This matches existing revision safety expectations.

---

## Validation Depth

| Option | Description | Selected |
| --- | --- | --- |
| Parse/compile/AST policy | Validate syntax, bytecode compile feasibility, required functions, denylisted imports/capabilities. | yes |
| Parse only | Only syntax-check the file. | |
| Execute smoke calls | Run Strategy functions at submission. | |

**User's choice:** Parse/compile/AST policy.
**Notes:** Validation may inspect but must not run Strategy logic in Go/web/API.

---

## Diagnostics

| Option | Description | Selected |
| --- | --- | --- |
| Safe line/column hints | Return category, message, severity, and safe location data. | yes |
| Raw Python errors | Return stderr/stack/source context directly. | |
| Generic failure only | Hide all actionable detail. | |

**User's choice:** Safe line/column hints.
**Notes:** Avoid source echoes, stacks, stderr, paths, environment, and private runtime data.

---

## the agent's Discretion

- The agent may choose exact validator placement and diagnostic codes.
- User-safe diagnostics are preferred over raw interpreter output even when raw output seems more actionable.
