# Phase 87: Exhibition Creation Ownership and Worker Handoff - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 87-Exhibition Creation Ownership and Worker Handoff
**Areas discussed:** Mutation slice, Transactional parity, Worker boundary, No source execution, Failure behavior

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Mutation slice | Decide whether Go owns only exhibition creation or broader MatchSet/result workflows. | ✓ |
| Transactional parity | Decide which existing creation writes and validations must be preserved. | ✓ |
| Worker boundary | Decide what Go may enqueue versus what TypeScript worker continues to own. | ✓ |
| No source execution | Decide whether exhibition creation may inspect source or execute Strategy code. | ✓ |
| Failure behavior | Decide how selected-Go exhibition creation failures behave. | ✓ |

**User's choice:** approved recommended checkpoint.
**Notes:** User approved all recommended Phase 87 decisions.

---

## Mutation Slice

| Option | Description | Selected |
|--------|-------------|----------|
| Creation only | Move exhibition MatchSet creation to Go while public reads and worker execution remain separately owned. | ✓ |
| Broader MatchSet ownership | Move creation plus public reads plus worker execution/orchestration together. | |

**User's choice:** approved recommended decision.
**Notes:** Public MatchSet reads are Phase 84; runtime/workers remain TypeScript-owned.

---

## Transactional Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Full creation parity | Preserve preset validation, revision checks, eligibility, rate limit, duplicate prevention, arena seeding, MatchSet/entrant/Match/job writes, locks, provenance, and audit event transactionally. | ✓ |
| Minimal creation record | Insert only a MatchSet shell and let later systems repair/expand it. | |

**User's choice:** approved recommended decision.
**Notes:** Partial writes on failure are unacceptable.

---

## Worker Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Go as job producer only | Go may enqueue jobs but does not claim, execute, complete, score, classify, heartbeat, or retry worker jobs. | ✓ |
| Go starts owning worker lifecycle | Go creation also claims or manages created jobs. | |

**User's choice:** approved recommended decision.
**Notes:** Worker/runtime ownership stays explicit and TypeScript-owned.

---

## No Source Execution

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata only | Creation inspects stored metadata/eligibility and never reads source into public DTOs or executes Strategy code. | ✓ |
| Source/runtime validation during creation | Creation reads or executes source to revalidate entrants. | |

**User's choice:** approved recommended decision.
**Notes:** Hostile Strategy isolation remains outside Go web/API.

---

## Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Fail closed, owner-safe | Invalid preset/revisions/ownership/runtime, duplicate, rate limit, storage/transaction/schema/privacy, and Go-unavailable failures fail closed without fallback. | ✓ |
| Best-effort fallback | Use TypeScript fallback for selected-Go exhibition creation failures. | |

**User's choice:** approved recommended decision.
**Notes:** Stopped-Go and transaction failure drills must prove no silent fallback.

## the agent's Discretion

- Exact switch names, Go package structure, transaction helper shape, and evidence artifact format may be chosen during planning.
- Transactional parity, worker boundary, no source execution, and no-fallback selected-Go behavior are locked.

## Deferred Ideas

- Go worker claiming/completion/retries/heartbeats.
- Match execution, Chronicle generation, scoring completion, and runtime failure classification in Go.
- Strategy execution, Workshop tests, sandbox promotion, Go-owned migrations, and engine changes.
