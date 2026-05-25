# Phase 133: Executable Container Runtime Candidate Lane - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 133-executable-container-runtime-candidate-lane
**Areas discussed:** Candidate strictness, runsc, artifact versioning

---

## Candidate Strictness

| Option | Description | Selected |
| --- | --- | --- |
| Required if present | Docker lane must execute and fail loudly or non-promote if controls/evidence fail. | yes |
| Strict command only | Keep default checks optional and require container only in dedicated proof. | |
| Availability first | Record availability before executable proof. | |

**User's choice:** Required if present.
**Notes:** Docker/runc is locally available, so v1.20 should not treat the container lane as only documentation.

---

## runsc

| Option | Description | Selected |
| --- | --- | --- |
| Fail-loud preflight | Do not download/install; record host runtime absence. | yes |
| Manual prerequisite | Document host install steps and require operator setup. | |
| Bootstrap script | Add installer/helper. | |

**User's choice:** Fail-loud preflight.
**Notes:** `runsc` must be available to the host Docker daemon to count as gVisor evidence.

---

## Artifact Versioning

| Option | Description | Selected |
| --- | --- | --- |
| v1.20-specific | Create v1.20-specific schema and artifact names. | yes |
| Generic only | Rely on latest generic artifact. | |
| Mirror v1.19 | Minimal rename/update. | |

**User's choice:** v1.20-specific.

## the agent's Discretion

- The planner may choose exact command names, but strict candidate commands must remain visible in `package.json`.

## Deferred Ideas

- Making gVisor pass without host runtime availability.
- Network downloads during proof.
