# Phase 138: Signed-In Reliability Proof and JS/TS Regression Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 138-signed-in-reliability-proof-and-js-ts-regression-gate
**Areas discussed:** Proof scale, proof flow, evidence assertions

---

## Proof Scale

| Option | Description | Selected |
| --- | --- | --- |
| Three cycles | Bounded repeated proof for mixed and Python-vs-Python exhibitions. | yes |
| One cycle | v1.19-style smoke proof with better assertions. | |
| Five cycles | Stronger but more expensive and flaky. | |

**User's choice:** Three cycles.

---

## Proof Flow

| Option | Description | Selected |
| --- | --- | --- |
| Signed-in full path | Account -> revisions -> exhibitions -> Go/runtime-service -> result/replay. | yes |
| Runtime-only proof | Skip signed-in browser flow and measure runtime calls. | |
| Fixture proof | Use fixture DTOs without live account/job execution. | |

**User's choice:** Signed-in full path.

---

## Evidence Assertions

| Option | Description | Selected |
| --- | --- | --- |
| Product plus candidate evidence | Verify UI labels, reliability, candidate lane, privacy, and JS/TS support. | yes |
| Product only | Verify UI and MatchSets but not candidate evidence. | |
| Artifact only | Trust artifacts without browser result/replay checks. | |

**User's choice:** Product plus candidate evidence.

## the agent's Discretion

- Exact proof command names and artifact writer shape are open if audit/monitor checks remain clear.

## Deferred Ideas

- Ranked or counted Python proof.
- Unbounded proof cycles.
