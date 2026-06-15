# Phase 243: Boundary Surface Inventory and Contract Lock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 243-Boundary Surface Inventory and Contract Lock
**Areas discussed:** Inventory scope, Decision register taxonomy, Compatibility aliases, Privacy and claim calibration, Handoff boundaries

---

## Inventory Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full trust-surface inventory | Cover all v1.35 account/save/source/debug/alias/entry/provider/sandbox/package/TinyGo/privacy surfaces before behavior changes. | x |
| Narrow TypeScript account-save inventory | Focus only on the known Go TypeScript drift first. | |
| Ad hoc per-phase discovery | Let each later phase rediscover its own surfaces. | |

**User's choice:** Auto-selected full trust-surface inventory.
**Notes:** The approved roadmap and requirements make Phase 243 the authority for the whole v1.35 surface matrix.

---

## Decision Register Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Fix/quarantine/deprecate/document/future taxonomy | Classify each surface once with owner, trust boundary, privacy class, tests, evidence, and downstream phase. | x |
| Free-form notes | Use narrative findings without a structured register. | |
| Immediate fixes | Fix easy issues while inventorying. | |

**User's choice:** Auto-selected structured taxonomy.
**Notes:** Behavior changes should wait for downstream phases unless characterization tests are needed.

---

## Compatibility Aliases

| Option | Description | Selected |
|--------|-------------|----------|
| Route-by-route disposition | Inventory each legacy alias and recommend remove, hidden/local-only, migrate, or deprecate-with-tests. | x |
| Preserve all aliases | Keep old aliases as stable public APIs. | |
| Remove all aliases immediately | Delete before caller/dependency inventory. | |

**User's choice:** Auto-selected route-by-route disposition.
**Notes:** Retained aliases must be treated as bypass risks until tests prove otherwise.

---

## Privacy and Claim Calibration

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit forbidden-marker and claim matrix | Track public/private data class and allowed sandbox/package claims for every surface. | x |
| Privacy handled only in final proof | Defer privacy classification until Phase 248. | |
| User-facing copy only | Inventory labels without data-flow/private-output checks. | |

**User's choice:** Auto-selected explicit privacy and claim matrix.
**Notes:** This keeps TypeScript/Python provenance-only, Rust/Zig artifact-backed, TinyGo hidden, package mode none, and no production certification by default.

---

## Handoff Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Inventory only in Phase 243 | Phase 243 locks scope and decisions; later phases implement behavior. | x |
| Inventory plus implementation | Mix discovery and fixes in one phase. | |
| Documentation only | Avoid characterization tests and code surface checks. | |

**User's choice:** Auto-selected inventory-only handoff.
**Notes:** Characterization tests and inventory scripts are allowed; provider-proof cleanup, auth changes, label changes, package enforcement, and service-backed proof belong to Phases 244-248.

---

## the agent's Discretion

- Exact inventory artifact filenames, table schema, and optional machine-readable companion are left to the planner.
- The planner may decide whether a Phase 243 code scan should be a script, test, static artifact, or monitor precursor, as long as it does not implement downstream behavior prematurely.

## Deferred Ideas

None.
