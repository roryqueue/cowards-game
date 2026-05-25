# Phase 132: v1.20 Baseline, Candidate Decision, and Budget Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 132-v1-20-baseline-candidate-decision-and-budget-contract
**Areas discussed:** Context package, Artifact versioning, Container candidate, runsc handling, Timeout budget policy

---

## Context Package

| Option | Description | Selected |
| --- | --- | --- |
| Context package | Produce one consolidated all-phase context package with per-phase CONTEXT and DISCUSSION content. | yes |
| Interactive phases | Discuss each phase in separate turns before finalizing context. | |
| Assume defaults | Generate context from recommended assumptions with minimal questioning. | |

**User's choice:** Context package.
**Notes:** User asked to carry similar decisions forward when already confirmed and recommended.

---

## Artifact Versioning

| Option | Description | Selected |
| --- | --- | --- |
| v1.20-specific | Create v1.20 schema/artifact names and preserve v1.19 as archived baseline. | yes |
| Generic names | Use generic latest artifact names only. | |
| Mirror v1.19 | Reuse v1.19-style names with minimal changes. | |

**User's choice:** v1.20-specific.

---

## Container Candidate

| Option | Description | Selected |
| --- | --- | --- |
| Required if present | Docker lane must execute the matrix and fail loudly or non-promote if controls/evidence fail. | yes |
| Strict command only | Keep default checks optional and strict only in a dedicated proof command. | |
| Availability first | Record availability before executable proof. | |

**User's choice:** Required when available, with follow-up discussion about `runsc`.

---

## runsc Handling

| Option | Description | Selected |
| --- | --- | --- |
| Fail-loud preflight | Do not download `runsc`; record host runtime absence and keep Docker/runc as required executable candidate. | yes |
| Manual prerequisite | Document host install steps and require operator install before strict gVisor proof. | |
| Bootstrap script | Add a host-side install helper. | |

**User's choice:** Fail-loud preflight.
**Notes:** Downloading `runsc` inside a Docker container would not make Docker run the container under gVisor because `runsc` is selected by the host Docker daemon before container start.

---

## Timeout Budget Policy

| Option | Description | Selected |
| --- | --- | --- |
| Outer budgets only | Keep per-Strategy caps intact; tune and document Match/job/HTTP/browser budgets around them. | yes |
| Loosen Python caps | Allow Python exhibition per-call caps to grow if needed. | |
| Measurement only | Document timing without changing budget defaults. | |

**User's choice:** Outer budgets only.

## the agent's Discretion

- Exact artifact field names are left to planning/implementation if v1.20-specific and monitor-readable.
- Baseline artifact shape can be compact if it references the archived v1.19 evidence clearly.

## Deferred Ideas

- Host-side `runsc` installation automation.
- Production sandbox certification.
- Python counted or ranked eligibility.
