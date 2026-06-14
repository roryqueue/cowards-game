# Phase 241: Checker Ergonomics, Caching, and Boundary Monitors - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 241-Checker Ergonomics, Caching, and Boundary Monitors
**Areas discussed:** Rust/Zig Validation Pacing, Cache Scope, Stale State Behavior, Boundary Monitors

---

## Rust/Zig Validation Pacing

| Option | Description | Selected |
|--------|-------------|----------|
| Debounce plus coalesce/cache | Keep responsive UX while avoiding duplicate Rust/Zig compile calls for identical identity keys. | ✓ |
| Manual validate only for Rust/Zig | Cheaper but less helpful and a UX regression. | |
| Long debounce only | Simple but still wastes calls and can feel sluggish. | |

**User's choice:** Debounce plus coalesce/cache.
**Notes:** User selected the recommended option.

---

## Cache Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Ephemeral cache only | In-memory request coalescing/cache keyed by Phase 238 identity fields; no durable checker evidence. | ✓ |
| Persist checker results | More reuse, but risks stale/provenance confusion and looks too authoritative. | |
| Client-only cache | Simpler, but does not reduce duplicate server/runtime-service churn across quick repeated route calls. | |

**User's choice:** Ephemeral cache only.
**Notes:** User selected the recommended option.

---

## Stale State Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Show stale until refreshed | Keep prior result visible with stale state when source/format/cache identity changes. | ✓ |
| Clear immediately | Less risk of confusion, but creates flicker and loses useful context. | |
| Block editing while checking | Avoids stale display, but bad Workshop ergonomics. | |

**User's choice:** Show stale until refreshed.
**Notes:** User selected the recommended option.

---

## Boundary Monitors

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit boundary monitors | Add focused tests/monitors for the v1.34 boundaries. | ✓ |
| Rely on Phase 242 audit only | Less work now, but easier to miss drift during implementation. | |
| Documentation only | Records intent but does not catch regressions. | |

**User's choice:** Explicit boundary monitors.
**Notes:** User selected the recommended option.

---

## the agent's Discretion

- Planner may choose exact cache/coalescing placement and debounce durations.

## Deferred Ideas

- Persisted checker result storage is out of scope.
