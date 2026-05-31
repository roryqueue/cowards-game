# Phase 209: Boundary Monitors, Privacy Audit, and Live Compatibility Proof - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 209-boundary-monitors-privacy-audit-and-live-compatibility-proof
**Areas discussed:** Monitors, privacy audit, and live compatibility

---

## Monitor Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-block broad boundary drift | Contract/version drift, fixture gaps/fallback, private leakage, owner/test leakage, internal imports, promotion/ABI/Strategy execution claims. | ✓ |
| Advisory warnings | Too weak for boundary/privacy protection. | |
| Manual checklist only | Too weak and easy to skip. | |

**User's choice:** `confirm 209`
**Notes:** User confirmed the recommended default.

---

## Import Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit forbidden imports | Runtime-service, Go orchestration, persistence internals, owner private sections, debug payloads, quarantine/recovery/operator internals. | ✓ |
| General privacy scan only | Useful but insufficient for ownership creep. | |
| Allow if not rendered | Rejected because import coupling itself is boundary drift. | |

**User's choice:** `confirm 209`
**Notes:** Public intelligence should consume only app/public DTO/projection paths.

---

## Live Compatibility

| Option | Description | Selected |
|--------|-------------|----------|
| Run if services exist, fail-loud absence | Open signed-in result/replay pages through frozen/public DTOs where local services are available. | ✓ |
| Require live proof always | Too brittle for local environment variance. | |
| Skip live compatibility silently | Too weak and misleading. | |

**User's choice:** `confirm 209`
**Notes:** Absence should be recorded without claiming live proof.

---

## Fixture Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Static plus dynamic proof | Monitors and runtime/route/read behavior both prove fail-closed fixture mode. | ✓ |
| Static source check only | Not enough to prove behavior. | |
| Browser happy path only | Misses production fallback risk. | |

**User's choice:** `confirm 209`
**Notes:** Carries forward Phase 208 dynamic fail-closed stance.

---

## the agent's Discretion

- Exact monitor markers, proof script names, artifact filenames, and local-service detection approach are left to the agent/planner.

## Deferred Ideas

None.
