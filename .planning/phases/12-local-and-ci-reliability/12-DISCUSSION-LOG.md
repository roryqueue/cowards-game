# Phase 12: Local and CI Reliability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 12-Local and CI Reliability
**Areas discussed:** Local startup parity, Preflight shape, CI split, E2E ambition, Docker scope

---

## Local Startup Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both paths | Docker happy path plus no-Docker local Postgres support. | ✓ |
| Docker only | Prefer Docker and let no-Docker drift. | |
| No-Docker only | Avoid Docker-specific local workflow. | |

**User's choice:** approve recommended decision sheet, with added note that Docker was downloaded and started locally.
**Notes:** Docker path must work end to end locally as part of the plan.

---

## Preflight Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One shared diagnostic command | Check services, migrations, seeds, worker readiness, and replay readiness. | ✓ |
| Separate scripts | Add separate checks per layer. | |
| CI-only diagnostics | Keep local scripts lightweight. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Output should classify layer-specific failures.

---

## CI Split

| Option | Description | Selected |
|--------|-------------|----------|
| Separate fast, service, and visual checks | Keep failure modes legible and locally runnable. | ✓ |
| Single verify command only | Keep all checks under root verify. | |
| Service checks only in CI | Avoid local service-backed slices. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Developers should be able to run the relevant slice locally.

---

## E2E Ambition

| Option | Description | Selected |
|--------|-------------|----------|
| One real trust loop in CI | Service-backed edit -> submit -> execute -> replay plus visual fixture suite. | ✓ |
| Smoke only | Keep fixture smoke as the main E2E. | |
| Broad matrix now | Add broad browser/service matrix immediately. | |

**User's choice:** approve recommended decision sheet.
**Notes:** Broader matrix coverage can stay local or nightly until stable.

---

## Docker Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Services first, app container optional | Reliable Dockerized services are required; app containers are nice-to-have. | ✓ |
| Fully containerize app and worker | Require web/worker containers in this phase. | |
| Existing compose only | Leave Docker scope mostly unchanged. | |

**User's choice:** approve recommended decision sheet.
**Notes:** If app containers are not added, Dockerized services plus host-run web/worker must still be verified end to end.

## the agent's Discretion

- Exact script names, preflight implementation language, CI job names, and app-container inclusion are left to research and planning.

## Deferred Ideas

- Fully containerized web/worker dev environment unless planning finds it cheap and low-risk.
