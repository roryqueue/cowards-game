# Phase 115: Python Starter Strategy and Replay Proof - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 115-Python Starter Strategy and Replay Proof
**Areas discussed:** Starter Strategy, proof Match, replay evidence

---

## Starter Strategy

| Option | Description | Selected |
| --- | --- | --- |
| Tactical showcase | Small but meaningful bounded Strategy showing selection and action choices. | yes |
| Minimal no-op | Simplest possible source that only proves plumbing. | |
| Competitive tuned starter | Stronger Strategy meant to perform well. | |

**User's choice:** Tactical showcase, scoped to bounded tactics.
**Notes:** The proof should feel real without becoming competitive tuning.

---

## Proof Match

| Option | Description | Selected |
| --- | --- | --- |
| Existing JS/TS starter opponent | Run Python against a known supported starter/opponent. | yes |
| Python-only proof | Run Python against itself or another Python fixture. | |
| Fixture-only proof | Avoid real submitted revisions. | |

**User's choice:** Existing JS/TS starter opponent.
**Notes:** Mixed-language non-counted MatchSets are acceptable.

---

## Replay Evidence

| Option | Description | Selected |
| --- | --- | --- |
| Visible runtime labels | Replay/result labels identify Python as experimental/non-counted. | yes |
| Hide runtime labels | Replay looks identical to JS/TS. | |
| Debug-heavy evidence | Show detailed runtime internals. | |

**User's choice:** Visible runtime labels.
**Notes:** Labels must remain public-safe and source-free.

---

## the agent's Discretion

- The agent may choose exact starter tactics and approved opponent.
- The proof must be realistic, deterministic, and page-smoked for board bounds.
