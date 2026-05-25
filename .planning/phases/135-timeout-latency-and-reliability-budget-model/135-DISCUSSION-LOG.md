# Phase 135: Timeout, Latency, and Reliability Budget Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 135-timeout-latency-and-reliability-budget-model
**Areas discussed:** Budget policy, proof scale, timing evidence

---

## Budget Policy

| Option | Description | Selected |
| --- | --- | --- |
| Outer budgets only | Keep Strategy caps intact; tune Match/job/HTTP/browser budgets. | yes |
| Loosen Python caps | Increase Python per-call caps if latency requires it. | |
| Measurement only | Measure but do not change defaults. | |

**User's choice:** Outer budgets only.

---

## Proof Scale

| Option | Description | Selected |
| --- | --- | --- |
| Three cycles | Run bounded three-cycle proof with timing evidence. | yes |
| One cycle | Keep v1.19-style smoke proof. | |
| Five cycles | Stronger but costlier local proof. | |

**User's choice:** Three cycles.

---

## Timing Evidence

| Option | Description | Selected |
| --- | --- | --- |
| Layered timing | Separate runtime, Match, job, result, and replay timing where practical. | yes |
| End-to-end only | Capture only total proof duration. | |
| Runtime only | Measure only runtime adapter calls. | |

**User's choice:** Layered timing.

## the agent's Discretion

- Exact budget numbers should be chosen from local measurements and existing constraints.

## Deferred Ideas

- Production SLO/SLA commitments.
- Stress testing beyond bounded proof cycles.
