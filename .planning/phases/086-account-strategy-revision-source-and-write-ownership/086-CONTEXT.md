# Phase 86: Account Strategy Revision Source and Write Ownership - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 86 moves owner-private Strategy Revision source retrieval and account Strategy Revision write/fork flows toward Go ownership after Phase 85 auth/session ownership is in place. It covers owner source retrieval, save/create, Starter fork, and Advanced fork. It does not execute Strategy code, run Strategy tests, move Workshop validation/test/runtime flows, move Match orchestration or worker ownership, change engine rules, own migrations, or expose source in public/evidence outputs.

</domain>

<decisions>
## Implementation Decisions

### Source Route

- **D-01:** Go may return owner-private Strategy Revision source only to the authenticated owner.
- **D-02:** Owner source responses must use private/no-store behavior equivalent to the current route behavior and must not be cached or exposed through public surfaces.
- **D-03:** Strategy source must stay out of public outputs, monitors, topology evidence, route ownership artifacts, normal service logs, diagnostics, and public/service DTOs by default.
- **D-04:** Unauthorized or non-owner source access should fail closed without revealing whether a private revision exists beyond the existing owner-safe semantics.

### Write and Fork Slice

- **D-05:** Move owner source retrieval, save/create, Starter fork, and Advanced fork together as the account revision write family.
- **D-06:** Phase 86 depends on Phase 85 authenticated owner/session behavior; it should not invent a parallel auth model.
- **D-07:** TypeScript behavior remains parity oracle and explicit rollback/reference, not silent fallback in selected-Go evidence paths.

### No Execution Boundary

- **D-08:** Go must not execute Strategy code, compile it, run Strategy tests, invoke Node `vm`, or treat validation as hostile-code isolation.
- **D-09:** Go may compute source hash/bytes and persist validation/runtime metadata according to existing reference semantics.
- **D-10:** Any code path that would require hostile Strategy execution, worker runtime, Workshop test execution, or runtime sandbox promotion is out of scope and must be blocked/deferred.

### Validation and Metadata Parity

- **D-11:** Preserve existing Strategy Revision metadata semantics: immutable submitted revisions, source byte limits, source hash, runtime metadata, engine compatibility, validation status, Starter lineage, Advanced lineage, tags, label/name, notes, owner association, and created/locked timestamps where applicable.
- **D-12:** Starter fork and Advanced fork must preserve source hash, lineage, tags, name, notes, validation status, runtime metadata, engine compatibility, and owner association.
- **D-13:** Save/create must preserve current behavior for optional Starter/Advanced lineage when the submitted source exactly matches the selected library source.
- **D-14:** Account list/source/write DTOs must pass canonical schema checks and privacy scans.

### Failure Behavior

- **D-15:** Unauthorized source access, missing/invalid session, invalid source, oversized source, invalid Starter/Advanced fork id, duplicate or locked revision conflicts, storage unavailable, schema failure, privacy failure, and Go unavailable must fail closed.
- **D-16:** Failures must map to owner-safe or public-safe service errors without stack traces, SQL details, DB DSNs, host paths, stderr, sessions, tokens, cookies, password hashes, unrelated owner details, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, or private runtime internals.
- **D-17:** Stopped-Go and bad-response drills must prove no silent TypeScript fallback when Go account revision write/source ownership is selected.

### the agent's Discretion

Downstream agents may choose exact route switch names, Go package structure, hash implementation, source response envelope, and parity artifact format, but source privacy, no-execution behavior, metadata parity, and no-fallback selected-Go behavior are locked.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Context

- `.planning/PROJECT.md` - v1.13 goal and hard boundaries.
- `.planning/REQUIREMENTS.md` - ACCT-01 through ACCT-07 plus milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 86 goal, success criteria, and dependencies.
- `.planning/phases/082-ownership-baseline-and-aggressive-cutover-registry/082-CONTEXT.md` - Ownership states, registry, evidence, and no-fallback decisions.
- `.planning/phases/083-go-persistence-and-live-dto-foundation/083-CONTEXT.md` - Live DB, schema/privacy, parity, and sanitized error decisions.
- `.planning/phases/085-auth-session-and-account-read-ownership/085-CONTEXT.md` - Auth/session and token-safe owner identity decisions.

### Strategy Revision Reference

- `packages/spec/src/service.ts` - `createStrategyRevision`, `getStrategyRevisionSource`, and account revision DTO contracts.
- `packages/persistence/src/account-revisions.ts` - Account revision save/create, list, source retrieval, Starter fork, Advanced fork, and ownership checks.
- `packages/persistence/src/starter-strategies.ts` - Starter library source/hash/lineage reference.
- `packages/persistence/src/advanced-strategies.ts` - Advanced library source/hash/lineage reference.
- `packages/runtime-js/src/revision.ts` - Current TypeScript revision construction semantics.
- `packages/runtime-js/src/validation.ts` - Existing source hash/byte/validation metadata semantics; not a hostile-code execution boundary.
- `apps/web/app/competitive/server.ts` - Current account revision save/fork/source behavior.
- `apps/web/lib/account-revision-write-boundary.ts` - Current save request boundary.
- `apps/web/app/api/account/revisions/[revisionId]/source/route.ts` - Current owner-private source route behavior.
- `apps/web/app/api/account/revisions/save/route.ts` - Current save route handoff.
- `apps/web/app/api/account/starter-forks/route.ts` - Current Starter fork route.
- `apps/web/app/api/account/advanced-forks/route.ts` - Current Advanced fork route.

### Monitors and Evidence

- `scripts/check-boundary-monitors.ts` - Boundary monitor and privacy-safe artifact checks.
- `scripts/check-local-topology.ts` - Topology evidence pattern to extend for owner/private source and writes.
- `scripts/check-service-boundary-imports.ts` - Strict/report-only import baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `packages/persistence/src/account-revisions.ts` already defines current source/write/fork semantics and owner checks.
- `apps/web/app/competitive/server.ts` wraps save/fork/source behavior with current authenticated user handling and persistence error mapping.
- `packages/spec/src/service.ts` already defines service contracts for create and source routes, while account list metadata is covered by Phase 85.
- Starter and Advanced libraries already store source/hash/bytes and lineage metadata.

### Established Patterns

- Strategy source is owner-private and excluded from public/evidence outputs by default.
- Source handling must not execute hostile Strategy code in the web/API or Go backend process.
- TypeScript remains parity oracle and explicit rollback reference.
- Selected-Go paths fail closed without silent fallback.

### Integration Points

- Phase 86 should update the Phase 82 ownership manifest for account revision source/write/fork route statuses.
- Phase 86 should reuse Phase 85 owner/session identity and Phase 83 live DB/error/privacy foundation.
- Phase 87 exhibition creation depends on account revisions preserving ownership, validation status, runtime metadata, and locked/immutable semantics.

</code_context>

<specifics>
## Specific Ideas

Treat Strategy source as private payload data, not executable code. Go can hash, byte-count, store, and retrieve it for the owner, but any operation needing hostile execution or sandboxed validation must remain outside the Go web/API ownership cutover.

</specifics>

<deferred>
## Deferred Ideas

- Workshop validation, test launch, analytics rerun, runtime execution, and sandbox promotion.
- Match orchestration, job claiming/completion, Chronicle generation, and worker ownership.
- Exhibition creation, which is Phase 87.
- Go-owned migrations and engine/rules changes.

</deferred>

---

*Phase: 86-Account Strategy Revision Source and Write Ownership*
*Context gathered: 2026-05-23*
