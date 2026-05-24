# Phase 98: Runtime Execution Service Boundary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 98-Runtime Execution Service Boundary
**Areas discussed:** Service boundary shape, Request contract, Runtime ABI/isolation, Response/failure semantics, No-fallback behavior, Privacy diagnostics

---

## Service Boundary Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Keep coupled TypeScript worker | Let TypeScript continue claim/execute/complete as one normal worker process. | |
| Dedicated execution-only service | Go calls a TypeScript runtime execution service over a versioned JSON contract; TypeScript has no normal DB ownership. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This preserves TypeScript as runtime owner only, not backend owner.

---

## Request Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Thin execution request | Go sends minimal pointers and lets TypeScript load missing Match/Strategy data. | |
| Complete execution request | Go sends complete Match inputs, Strategy Revision source/hash/bytes/runtime metadata, arena, seed, ids, and limits. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** The runtime service should not need persistence access in normal topology.

---

## Runtime ABI And Isolation

| Option | Description | Selected |
|--------|-------------|----------|
| New runtime ABI/promotion | Use the phase to change ABI or promote sandbox/readiness labels. | |
| Preserve v1.14 ABI | Use `strategy-runtime-abi-v1.14`, existing adapters, no Node `vm`, no readiness promotion. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Sandbox replacement and TypeScript runtime retirement remain out of scope.

---

## Response And Failure Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Treat all runtime failures as system failures | Collapse Strategy violations and service faults into retryable failure records. | |
| Split runtime violations from system failures | Runtime violations remain valid Match outcomes; service/infrastructure faults become Go-classified system failures. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Phase 100 handles scoring impact; Phase 97 provides system-failure persistence contracts.

---

## No-Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript worker fallback | If service execution fails, run the old TypeScript DB-owning worker. | |
| Go fail-closed path | Go records retryable/terminal system failure through lifecycle contracts with no TS backend fallback. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** The runtime service cannot regain DB claim/completion ownership.

---

## Privacy Diagnostics

| Option | Description | Selected |
|--------|-------------|----------|
| Rich private diagnostics | Include raw stderr/stack/source-adjacent data for local debugging. | |
| Redacted diagnostics by default | Bound and redact diagnostics in public/service/Go/topology/monitor outputs. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Outputs must omit Strategy source, memories, objectives, raw Awareness Grid, stack traces, stderr, tokens, paths, DB DSNs, and private internals by default.

---

## the agent's Discretion

- The agent may choose transport/process details and contract filenames if the boundary remains execution-only, schema-validated, ABI-stable, privacy-safe, and no-fallback.

## Deferred Ideas

- Match completion, Chronicle persistence, MatchSet scoring, public evidence delivery, topology promotion gates, production sandbox replacement, and final runtime retirement are deferred.
