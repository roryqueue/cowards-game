# Phase 213: Public Privacy Scan Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 213-public-privacy-scan-expansion
**Areas discussed:** Scan targets, forbidden markers, debug boundary

---

## Scan Targets

| Option | Description | Selected |
|--------|-------------|----------|
| Broad public scan | Pages, fixtures, proof artifacts, and copy snapshots | yes |
| Page-only scan | Only browser-rendered result/replay pages | |

**User's choice:** Carry forward requirement scope.
**Notes:** Generated artifacts can leak too, so they stay in scope.

---

## Forbidden Markers

| Option | Description | Selected |
|--------|-------------|----------|
| Full private marker set | Include Strategy, memory, objective, diagnostics, host/env/token/DB/package/runtime/operator/recovery markers | yes |
| Existing smaller list | Keep only current v1.25-style markers | |

**User's choice:** Carry forward hard constraints from milestone prompt.
**Notes:** Player-facing copy should avoid private field names where possible.

---

## Debug Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Prove disabled in public mode | Owner/test debug and fixture fallback cannot become public evidence | yes |
| Trust existing gates | Do not add specific public-mode assertions | |

**User's choice:** Agent recommendation accepted.
**Notes:** This decision repeats in monitor/proof phases.

## the agent's Discretion

- Shared helper location for marker lists.
- Exact copy snapshot format.

## Deferred Ideas

None.
