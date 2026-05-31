# Phase 212: Replay Trust Cues and Missing Evidence States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 212-replay-trust-cues-and-missing-evidence-states
**Areas discussed:** Replay trust, unavailable states, owner debug boundary

---

## Replay Trust

| Option | Description | Selected |
|--------|-------------|----------|
| Explain public projection | Trust cues describe public Chronicle/replay evidence and privacy exclusions | yes |
| Expose deeper internals | Use runtime/source/memory details to make replay feel more explainable | |

**User's choice:** Carry forward public privacy boundary.
**Notes:** Public replay trust must be source-free and memory-free.

---

## Unavailable States

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence-state language | Missing/invalid/stale/no-result are public evidence availability states | yes |
| Internal error language | Surface raw validation/runtime/persistence details | |

**User's choice:** Agent recommendation accepted through milestone boundary.
**Notes:** The copy should preserve trust without implying hidden recovery/operator details.

---

## Owner Debug Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Keep public/owner split strict | Public mode cannot expose owner debug data or controls | yes |
| Blend debug hints into public replay | Use owner/debug internals for richer public explanation | |

**User's choice:** Carry forward privacy and public-output rules.
**Notes:** Owner debug remains outside public result/replay output by default.

## the agent's Discretion

- Exact row/band/empty-state presentation.
- Exact sanitized public wording.

## Deferred Ideas

None.
