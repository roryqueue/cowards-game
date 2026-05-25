# Phase 124: Isolation Readiness Baseline and Candidate Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 124-isolation-readiness-baseline-and-candidate-contract
**Areas discussed:** Candidate evidence, Monitor strictness, Context docs

---

## Candidate Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Readiness lanes | Default milestone can pass with subprocess plus documented availability; explicit Docker/runsc-required commands fail loudly when unavailable. | ✓ |
| Require Docker | Milestone cannot complete unless Docker container probes pass locally; gVisor remains optional/readiness-only. | |
| Require both | Milestone cannot complete unless Docker and gVisor/runsc probes pass locally. | |

**User's choice:** Readiness lanes.
**Notes:** This is the default cross-phase candidate evidence stance for v1.19.

---

## Monitor Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Split strictness | Keep `pnpm boundary:monitors` runnable without Docker/runsc, and add explicit required candidate commands for stricter evidence. | ✓ |
| Strict default | Make aggregate monitors require container evidence by default. | |
| Artifact only | Record candidate evidence in artifacts, but avoid adding strict command lanes beyond existing checks. | |

**User's choice:** Split strictness.
**Notes:** Phase 124 defines the evidence taxonomy that later monitor phases enforce.

---

## Context Docs

| Option | Description | Selected |
|--------|-------------|----------|
| All contexts first | Create CONTEXT and DISCUSSION-LOG docs for phases 124-131 before planning any phase. | ✓ |
| One at a time | Create Phase 124 context first, then plan/execute before discussing later phases. | |
| Context only | Create CONTEXT docs only and skip DISCUSSION-LOG docs. | |

**User's choice:** All contexts first.
**Notes:** All v1.19 phase discussions are materialized before phase planning starts.

## the agent's Discretion

- Exact artifact names and schemas are left to the implementer if they preserve monitor readability and honest promotion wording.

## Deferred Ideas

- Production sandbox certification.
- Python counted play.
- Arbitrary package installs.
