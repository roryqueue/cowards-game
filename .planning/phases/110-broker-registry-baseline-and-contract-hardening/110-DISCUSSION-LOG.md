# Phase 110: Broker Registry Baseline and Contract Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 110-Broker Registry Baseline and Contract Hardening
**Areas discussed:** Broker shape, registry matching, v1.16 baseline preservation

---

## Broker Shape

| Option | Description | Selected |
| --- | --- | --- |
| Runtime-service internal broker | Existing isolated Strategy Execution Service owns registry selection; no new service boundary. | yes |
| Separate broker service | Add another process/service between Go and runtimes. | |
| Python-specific adapter path | Keep JS/TS as-is and bolt Python on with special-case calls. | |

**User's choice:** Runtime-service internal broker.
**Notes:** This preserves the v1.16 topology while making the broker contract concrete.

---

## Registry Matching

| Option | Description | Selected |
| --- | --- | --- |
| Exact matching | Match language/runtime/adapter/ABI/package metadata exactly, except explicit legacy JS/TS normalization. | yes |
| Lenient matching | Accept semver-ish or loosely compatible runtime claims. | |
| Fallback matching | Try another runtime if requested target is unavailable. | |

**User's choice:** Exact matching.
**Notes:** Unknown, stale, or unavailable runtime metadata fails closed; no silent fallback.

---

## v1.16 Baseline Preservation

| Option | Description | Selected |
| --- | --- | --- |
| Treat v1.16 as floor | Preserve web -> Go -> isolated runtime service topology and no TypeScript backend. | yes |
| Relax boundary for pilot | Permit Python execution or validation shortcuts in Go/web for speed. | |
| Re-open JS/TS backend paths | Allow TypeScript backend fallback for development convenience. | |

**User's choice:** Treat v1.16 as floor.
**Notes:** Python can only be a runtime implementation and must not own backend, persistence, routes, scoring, public evidence, or fallback behavior.

---

## the agent's Discretion

- The agent may choose exact registry module names, artifact filenames, and monitor wiring.
- Later phases can assume exact matching and no separate broker service when those decisions recur.

## Deferred Ideas

- Separate broker service.
- Production Python sandbox promotion.
- Arbitrary package installs.
- Python counted/ranked play.
