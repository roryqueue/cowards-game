# Phase 108: No-TypeScript-Backend Topology and Monitor Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 108-No-TypeScript-Backend Topology and Monitor Gate
**Areas discussed:** Strict topology mode, allowed TypeScript processes, representative page smoke, boundary monitors, failure drills, privacy denylist, evidence artifacts

---

## Strict Topology Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Extend v1.15 strict mode only | Keep using `--require-v1-15-lifecycle`. | |
| Add v1.16 no-TypeScript-backend mode | Add a strict v1.16 mode with v1.15 checks plus stronger retirement assertions. | ✓ |
| Separate manual checklist | Document checks without executable topology mode. | |

**User's choice:** Confirmed v1.16 no-TypeScript-backend mode.
**Notes:** Example command: `pnpm topology:check -- --require-v1-16-no-typescript-backend --json`.

---

## Allowed TypeScript Processes

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend plus runtime service only | Allow web frontend and isolated JS/TS runtime service, fail on TS backend/worker/fallback. | ✓ |
| No TypeScript process at all | Remove even JS/TS runtime service. | |
| Existing local TS service allowed | Permit TypeScript service/backend as local fallback. | |

**User's choice:** Confirmed frontend plus runtime service only.
**Notes:** v1.16 is backend retirement, not JS/TS Strategy support removal.

---

## Representative Page Smoke

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve and extend page smoke | Keep v1.15 pattern and require every major page type to load. | ✓ |
| Health checks only | Rely on service liveness without page load validation. | |
| Defer page smoke to final audit | Do not include page smoke in topology/monitor gates. | |

**User's choice:** Confirmed representative page smoke closure gate.
**Notes:** Milestone cannot complete if major page types fail to load.

---

## Boundary Monitors

| Option | Description | Selected |
|--------|-------------|----------|
| v1.16 manifest-consuming monitors | Consume labels/contracts/artifacts and fail on drift/fallback/privacy/runtime violations. | ✓ |
| Keep v1.15 monitors unchanged | Rely on existing monitor coverage. | |
| Report-only checks | Record offenses without failing closure gate. | |

**User's choice:** Confirmed v1.16 monitor closure gate.
**Notes:** Includes route manifest drift, label drift, monitor drift, runtime ABI drift, unexpected Strategy execution, and public-output leaks.

---

## Failure Drills

| Option | Description | Selected |
|--------|-------------|----------|
| Fail-closed drills | Stopped-Go and stopped-runtime-service classify explicitly without TS backend fallback. | ✓ |
| Resilient fallback | Recover through retired TypeScript backend behavior. | |
| Manual observation | Check stopped services outside monitors. | |

**User's choice:** Confirmed fail-closed drills.
**Notes:** Failure cannot be hidden by TypeScript fallback.

---

## Privacy Denylist

| Option | Description | Selected |
|--------|-------------|----------|
| Full named denylist | Fail on source/memory/objective/owner-debug/grid/stack/stderr/session/token/DB/host/runtime leaks. | ✓ |
| Existing privacy scan only | Keep prior denylist unchanged. | |
| Route-specific denylist | Different denylist per route family. | |

**User's choice:** Confirmed full named denylist.
**Notes:** Matches the v1.16 requirements and Phase 107 privacy floor.

---

## Evidence Artifacts

| Option | Description | Selected |
|--------|-------------|----------|
| Audit-ready artifacts | Produce topology, monitor, route/label sync, and failure-drill evidence for Phase 109. | ✓ |
| Command logs only | Rely on terminal output. | |
| Final audit reconstructs evidence | Let Phase 109 inspect prior phase notes manually. | |

**User's choice:** Confirmed audit-ready evidence artifacts.
**Notes:** Phase 109 should not need archaeology.

---

## the agent's Discretion

- The agent may choose exact flag name, artifact filenames, page smoke selection, and monitor implementation details.

## Deferred Ideas

None.
