# Phase 116: Topology, Monitors, Privacy, and Promotion Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 116-Topology, Monitors, Privacy, and Promotion Gate
**Areas discussed:** Final gate strictness, boundary/privacy checks, promotion decision

---

## Final Gate Strictness

| Option | Description | Selected |
| --- | --- | --- |
| Final live required | Run actual topology, monitor, test, page-smoke, and replay checks. | yes |
| Artifact-only gate | Rely on written evidence without live verification. | |
| Defer live checks | Leave verification for a future promotion milestone. | |

**User's choice:** Final live required.
**Notes:** v1.17 must look realistic in execution and results.

---

## Boundary And Privacy Checks

| Option | Description | Selected |
| --- | --- | --- |
| All drift checks strict | Fail on ABI/registry drift, Python boundary creep, backend ownership, leaks, fallback, and premature counted eligibility. | yes |
| Advisory checks | Warn but do not fail on some drift. | |
| Privacy-only checks | Focus only on public-output leaks. | |

**User's choice:** All drift checks strict.
**Notes:** The user called these checks non-negotiable.

---

## Promotion Decision

| Option | Description | Selected |
| --- | --- | --- |
| Experimental runtime path | State Python remains runtime-only, non-counted, and behind broker/runtime boundary. | yes |
| Product promotion | Treat Python as a first-class counted language. | |
| No decision | Leave status implicit. | |

**User's choice:** Experimental runtime path.
**Notes:** Use this phrase in final promotion/defer artifacts.

---

## the agent's Discretion

- The agent may choose exact monitor artifact names.
- Final archive and tag steps happen only after audit/fix and verification pass.
