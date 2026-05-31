# Phase 211: Result-State Explanation Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 211-result-state-explanation-polish
**Areas discussed:** State explanation, retry copy, layout

---

## State Explanation

| Option | Description | Selected |
|--------|-------------|----------|
| Existing DTO-derived copy | Improve explanations from existing lifecycle/failure/availability fields only | yes |
| Add public fields | Add DTO fields to make copy easier | |

**User's choice:** Carry forward frozen-contract decision.
**Notes:** The user explicitly requested no new public execution DTO fields.

---

## Retry Copy

| Option | Description | Selected |
|--------|-------------|----------|
| Public-level retryability | Explain retryability without counts, recovery details, quarantine, or diagnostics | yes |
| Detailed operations wording | Surface operator/recovery details to players | |

**User's choice:** Carry forward privacy and public UX boundary.
**Notes:** Similar decisions should be assumed across all public result/replay phases.

---

## Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Dense scan-friendly result page | Improve evidence rows, ledger clarity, and mobile resilience | yes |
| Decorative redesign | Recompose as a more promotional/hero-style page | |

**User's choice:** Agent recommendation accepted by confirmed milestone plan.
**Notes:** This follows existing app conventions for operational/public evidence surfaces.

## the agent's Discretion

- Exact public copy.
- Whether to add helper functions or expand `evidence-copy.ts`.
- Exact responsive layout details, provided tests/visual checks cover them.

## Deferred Ideas

None.
