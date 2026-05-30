# Phase 177: Fixture Catalog and Golden Match States - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 177-Fixture Catalog and Golden Match States
**Areas discussed:** Fixture ownership, Scenario coverage

---

## Fixture Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Contract-first catalog | Put canonical fixture schema/catalog in `packages/spec`, with app and Go consumers nearby. | ✓ |
| App-only fixtures | Keep fixtures only under app tests. | |

**User's choice:** Confirmed recommended contract-first catalog through milestone defaults.
**Notes:** This inherits the confirmed DTO/evidence decision that fixtures must validate against app-facing public DTOs.

---

## Scenario Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Full golden scenario set | Cover complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay. | ✓ |
| Minimal happy path | Only add complete and replay-ready examples. | |

**User's choice:** Confirmed full golden scenario set through milestone defaults.
**Notes:** Required for parallel app/result/replay work without live execution.

## the agent's Discretion

- Exact fixture filenames, manifest format, and checksum mechanics.

## Deferred Ideas

- Fixture adapter behavior is deferred to Phase 180.
