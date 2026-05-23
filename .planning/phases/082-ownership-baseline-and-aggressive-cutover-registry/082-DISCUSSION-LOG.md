# Phase 82: Ownership Baseline and Aggressive Cutover Registry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 82-Ownership Baseline and Aggressive Cutover Registry
**Areas discussed:** Registry shape, Promotion states, Baseline evidence

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Registry shape | Decide whether the v1.13 ownership registry is one manifest or split by public/owner/mutation/worker surfaces. | ✓ |
| Promotion states | Decide the exact state vocabulary planners should use for route ownership and blocked/deferred surfaces. | ✓ |
| Baseline evidence | Decide how much evidence Phase 82 collects before implementation begins. | ✓ |

**User's choice:** all
**Notes:** User asked to discuss phases sequentially and approved carrying similar decisions forward when they match recommended patterns.

---

## Registry Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One canonical manifest | One structured source of truth for all route families, with surface discriminators and generated/readable matrix. | ✓ |
| Split manifests | Separate manifests for public reads, owner/session, mutations, and worker surfaces. | |

**User's choice:** approved recommended decision.
**Notes:** The selected approach avoids multiple ownership sources drifting during the aggressive v1.13 cutover.

---

## Promotion States

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit state vocabulary | Use `go_primary`, `typescript_primary`, `typescript_reference`, `worker_owned`, `deferred`, `blocked`, `rolled_back`, and `evidence_only`. | ✓ |
| Simpler promoted/deferred flags | Use booleans or a smaller state set. | |

**User's choice:** approved recommended decision.
**Notes:** `worker_owned` is intentionally distinct from `deferred` so worker/runtime ownership stays explicit.

---

## Baseline Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh static/local evidence | Capture boundary imports, boundary monitors, current Go manifest, v1.12 blockers, report-only list, and selected-route map. | ✓ |
| Static docs only | Use existing planning docs without fresh command output. | |
| Full live topology now | Run live topology drills in Phase 82 before implementation. | |

**User's choice:** approved recommended decision.
**Notes:** Live topology is supplemental in Phase 82 and required later when routes are implemented or verified.

## the agent's Discretion

- Exact artifact filenames and JSON field ordering may be chosen during planning.
- The manifest must remain canonical and monitorable.

## Deferred Ideas

None.
