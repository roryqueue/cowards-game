# Phase 107: Deferred Surface Relabeling and Privacy Preservation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 107-Deferred Surface Relabeling and Privacy Preservation
**Areas discussed:** Final surface label artifact, deferred product surfaces, owner-debug replay, test-support and fixtures, privacy guard floor, scope control

---

## Final Surface Label Artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Complete label artifact | Label every remaining backend-like TypeScript path with taxonomy, owner, risk, gate, migration note, and monitor status. | ✓ |
| Partial labels | Label only paths touched during implementation. | |
| Prose only | Explain deferred surfaces without machine-readable labels. | |

**User's choice:** Confirmed complete label artifact.
**Notes:** It should feed Phase 108 monitors.

---

## Deferred Product Surfaces

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit deferred labels | Workshop, broader ladder/admin/governance, analytics, and private-source paths remain only with labels and gates. | ✓ |
| Migrate now | Pull these surfaces into Phase 107 Go migration. | |
| Leave implicit | Let existing TypeScript behavior remain without explicit labels. | |

**User's choice:** Confirmed explicit deferred labels.
**Notes:** Migration belongs in later phases unless selected by Phase 105.

---

## Owner-Debug Replay

| Option | Description | Selected |
|--------|-------------|----------|
| Private/deferred with gates | Keep owner-debug explicit and authorized; public replay stays Go-owned when selected. | ✓ |
| Public fallback | Use owner/private Chronicle path when public Go evidence is missing. | |
| Full migration now | Migrate owner-debug replay to Go in this phase. | |

**User's choice:** Confirmed private/deferred owner-debug behavior.
**Notes:** Owner-debug cannot be public evidence fallback.

---

## Test-Support And Fixtures

| Option | Description | Selected |
|--------|-------------|----------|
| Test/fixture-only gates | Keep paths only under explicit non-normal gates and assertions. | ✓ |
| Normal local access | Allow these routes in local product runtime. | |
| Delete all fixtures | Remove fixture/test-support paths now. | |

**User's choice:** Confirmed test/fixture-only gates.
**Notes:** Normal product traffic must not reach them.

---

## Privacy Guard Floor

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve public-output privacy everywhere | No source/memory/objective/owner-debug/raw grid/stack/stderr/session/token/DB/host/runtime leaks. | ✓ |
| Public-only privacy checks | Apply privacy scans only to Go-selected public routes. | |
| Debug-rich deferred output | Allow deferred paths to expose more internals. | |

**User's choice:** Confirmed privacy floor across remaining surfaces.
**Notes:** Deferred does not mean privacy-exempt.

---

## Scope Control

| Option | Description | Selected |
|--------|-------------|----------|
| Label and harden only | Avoid accidental migration of Workshop/governance/owner-debug unless already selected. | ✓ |
| Expand migration scope | Opportunistically migrate deferred surfaces. | |
| Skip hardening | Wait for future migrations to fix labels and privacy. | |

**User's choice:** Confirmed label and harden only.
**Notes:** This keeps Phase 107 from becoming a grab bag.

---

## the agent's Discretion

- The agent may choose artifact filename, grouping, scanner strategy, and whether comments are useful.

## Deferred Ideas

- Go migration for Workshop.
- Go migration for broader ladder/admin/governance.
- Go migration for owner-debug replay.
