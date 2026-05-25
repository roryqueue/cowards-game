# Phase 126: Candidate Execution Evidence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 126-candidate-execution-evidence
**Areas discussed:** Candidate evidence, Monitor strictness

---

## Candidate Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Readiness lanes | Default milestone can pass with subprocess plus documented availability; explicit Docker/runsc-required commands fail loudly when unavailable. | ✓ |
| Require Docker | Milestone cannot complete unless Docker container probes pass locally; gVisor remains optional/readiness-only. | |
| Require both | Milestone cannot complete unless Docker and gVisor/runsc probes pass locally. | |

**User's choice:** Readiness lanes.
**Notes:** Applies directly to candidate execution evidence.

---

## Monitor Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Split strictness | Keep `pnpm boundary:monitors` runnable without Docker/runsc, and add explicit required candidate commands for stricter evidence. | ✓ |
| Strict default | Make aggregate monitors require container evidence by default. | |
| Artifact only | Record candidate evidence in artifacts, but avoid strict command lanes. | |

**User's choice:** Split strictness.
**Notes:** Candidate execution should produce artifacts usable by both default and strict lanes.

## the agent's Discretion

- Exact gVisor/runsc artifact shape is left to the implementer.

## Deferred Ideas

- Treating unavailable Docker/runsc as a passing condition.
- Production sandbox promotion.
