# Phase 101: Public Evidence Delivery and Web Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 101-Public Evidence Delivery and Web Cutover
**Areas discussed:** Selected normal workflows, Replay data boundary, TypeScript labels, Public evidence shape, Privacy checks

---

## Selected Normal Workflows

| Option | Description | Selected |
|--------|-------------|----------|
| Broad web migration | Migrate all workshop/admin/debug/ladder/product routes in one phase. | |
| Focused product cutover | Select exhibition creation, public MatchSet summary/evidence, public replay metadata, and selected public replay evidence. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** The phase should prove a real web -> Go product workflow without swallowing unrelated deferred surfaces.

---

## Replay Data Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Keep direct web Chronicle reads | Leave replay pages reading persisted Chronicles through web persistence imports. | |
| Go-owned evidence contracts | Keep React rendering but move normal replay data access behind Go-owned public/evidence contracts. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Owner-debug replay remains outside normal public flow.

---

## TypeScript Surface Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit legacy leftovers | Leave remaining TypeScript routes unlabeled until later implementation touches them. | |
| Explicit labels | Label remaining TypeScript surfaces as frontend, parity-only, rollback-only, test-only, runtime-only, or deferred. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This follows Phase 96 role vocabulary.

---

## Public Evidence Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Raw Chronicle evidence | Expose raw Chronicle/private projection data to power replay evidence. | |
| Projected public evidence | Expose source-safe public evidence by default, with owner/debug data outside normal flow. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** No raw private Chronicle projection by default.

---

## Privacy Checks

| Option | Description | Selected |
|--------|-------------|----------|
| Public-only checks | Check only public MatchSet/replay outputs. | |
| Broad output privacy checks | Check public/account/workshop/replay/evidence outputs against the denylist. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Outputs must omit Strategy source, memories, objectives, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, paths, DB DSNs, and private internals.

---

## the agent's Discretion

- The agent may choose exact route/DTO/adapter names and cutover flags if selected workflows are Go-owned when selected and no-fallback/privacy guarantees are enforced.

## Deferred Ideas

- Full workshop internals, owner-debug replay projection, ladder/admin/governance mutation migration, test-support route promotion, topology gates, production sandbox replacement, and final TypeScript runtime retirement are deferred.
