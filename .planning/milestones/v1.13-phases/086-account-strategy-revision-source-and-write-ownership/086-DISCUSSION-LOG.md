# Phase 86: Account Strategy Revision Source and Write Ownership - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 86-Account Strategy Revision Source and Write Ownership
**Areas discussed:** Source route, Write/fork slice, No execution boundary, Validation parity, Failure behavior

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Source route | Decide whether Go may serve owner-private Strategy source and under what privacy constraints. | ✓ |
| Write/fork slice | Decide whether source retrieval, save/create, Starter fork, and Advanced fork move as one account write family. | ✓ |
| No execution boundary | Decide whether Go can execute, compile, test, or sandbox Strategy code. | ✓ |
| Validation parity | Decide which Strategy Revision metadata semantics must be preserved. | ✓ |
| Failure behavior | Decide how selected-Go account source/write failures behave. | ✓ |

**User's choice:** approved recommended checkpoint.
**Notes:** User approved all recommended Phase 86 decisions.

---

## Source Route

| Option | Description | Selected |
|--------|-------------|----------|
| Owner-private only | Go returns source only to authenticated owner with private/no-store behavior and no evidence/log exposure. | ✓ |
| Broader source exposure | Include source in normal account/public outputs or evidence. | |

**User's choice:** approved recommended decision.
**Notes:** Source remains excluded from public outputs and ordinary evidence.

---

## Write/Fork Slice

| Option | Description | Selected |
|--------|-------------|----------|
| Account write family | Move owner source retrieval, save/create, Starter fork, and Advanced fork together. | ✓ |
| Split forks/source/save separately | Promote only one write path and defer the rest. | |

**User's choice:** approved recommended decision.
**Notes:** Phase 86 depends on Phase 85 owner auth behavior.

---

## No Execution Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| No Strategy execution in Go | Go may hash/count/store metadata but must not execute, compile, test, or use Node `vm`. | ✓ |
| Execute for validation parity | Run Strategy code or Workshop tests from Go/API to validate submitted source. | |

**User's choice:** approved recommended decision.
**Notes:** Storage and metadata are in scope; hostile-code execution is not.

---

## Validation Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve metadata semantics | Preserve source limits/hash/bytes, runtime metadata, engine compatibility, validation status, lineage, tags, labels, notes, owner association, and immutability. | ✓ |
| Minimal write record | Store source and owner only, then let later systems backfill metadata. | |

**User's choice:** approved recommended decision.
**Notes:** Existing TypeScript behavior remains the parity oracle.

---

## Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed, owner-safe | Unauthorized, invalid source/fork id, duplicate/storage/schema/privacy, and Go-unavailable failures fail closed without fallback. | ✓ |
| Best-effort fallback | Use TypeScript fallback for selected-Go source/write failures. | |

**User's choice:** approved recommended decision.
**Notes:** Stopped-Go and bad-response drills must prove no silent fallback.

## the agent's Discretion

- Exact route switch names, Go package structure, hash implementation, response envelope, and parity artifact format may be chosen during planning.
- Source privacy, no-execution behavior, metadata parity, and no-fallback selected-Go behavior are locked.

## Deferred Ideas

- Workshop validation/test/runtime and sandbox promotion.
- Match orchestration, jobs, Chronicle generation, and worker ownership.
- Exhibition creation.
- Go-owned migrations and engine/rules changes.
