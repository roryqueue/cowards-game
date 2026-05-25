# Phase 114: Go Orchestration and Non-Counted Eligibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 114-Go Orchestration and Non-Counted Eligibility
**Areas discussed:** Go runtime-service contract, eligibility policy, user-facing classification

---

## Go Runtime-Service Contract

| Option | Description | Selected |
| --- | --- | --- |
| Exact registered metadata only | Go accepts Python metadata only through the registered runtime ABI contract. | yes |
| Lenient metadata acceptance | Go accepts approximate Python metadata and lets runtime service decide later. | |
| Local Go checks with fallback | Go runs or adapts Python locally if runtime service fails. | |

**User's choice:** Exact registered metadata only.
**Notes:** Fail closed on stopped runtime, mismatch, unsupported artifact, or ABI drift.

---

## Eligibility Policy

| Option | Description | Selected |
| --- | --- | --- |
| Non-counted Workshop/exhibition only | Python may appear in unranked proof paths and remains excluded from counted/ranked play. | yes |
| Ranked pilot | Let Python enter ladder/counting during v1.17. | |
| Workshop only | Allow validation but no MatchSet creation yet. | |

**User's choice:** Non-counted Workshop/exhibition only.
**Notes:** JS/TS counted eligibility remains unchanged.

---

## Exhibition Visibility

| Option | Description | Selected |
| --- | --- | --- |
| Normal unranked option | Users can create a clearly non-counted unranked exhibition with Python. | yes |
| Hidden developer proof | Keep Python MatchSet creation behind a dev-only route. | |
| No UI creation | Require command-line or fixture-only proof. | |

**User's choice:** Normal unranked option.
**Notes:** Results must be clearly labeled non-counted/experimental.

---

## the agent's Discretion

- The agent may choose exact UI copy and eligibility flag names.
- Counted/ranked rejection and no-fallback behavior are mandatory.
