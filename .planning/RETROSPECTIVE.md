# Retrospective

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-17  
**Phases:** 7 | **Plans:** 33

### What Was Built

- Established a strict TypeScript monorepo with canonical spec contracts, package boundaries, local topology, and selected E2E verification in pnpm verify.
- Implemented the deterministic Coward's Game rules engine, covering rounds, activation selection, movement, pushing, Backstab, stoning, contraction, end conditions, and purity tests.
- Built Chronicle and replay infrastructure for deterministic reconstruction, integrity validation, public privacy projection, and owner-only debug data.
- Delivered a replaceable JS/TS strategy runtime boundary with immutable Strategy Revisions, validation, worker-only execution, timeout/failure handling, and no production node:vm execution.
- Added PostgreSQL-backed Match/MatchSet orchestration, job claiming, retries, Chronicle persistence, deterministic scoring, and worker execution.
- Shipped the Strategy Workshop and replay viewer, including Monaco authoring, revision history, Workshop test launch, Pixi replay board, timeline/inspector, owner Awareness Grid, and service-backed edit-to-replay Playwright coverage.

### What Worked

- Phase-by-phase verification caught real integration gaps before closure.
- Keeping the engine pure and Chronicle-centered made later replay and persistence work easier to reason about.
- Service-backed Playwright exposed issues that unit tests missed, including PostgreSQL enum casting and encoded Match id replay lookup.

### What Was Inefficient

- Some summary and validation frontmatter needed retroactive normalization for strict milestone audit compatibility.
- The service-backed E2E required local PostgreSQL setup because Docker was unavailable in the execution environment.

### Patterns Established

- Every phase should end with a passed VERIFICATION.md and complete requirements frontmatter in summaries.
- Replay privacy should be tested both at projection level and browser level.
- Replay demo fixtures should be held to engine-rule legality, not just visual plausibility.
- Test-support routes must fail loudly and remain gated to test environments.

### Key Lessons

- Run service-backed E2E earlier for flows that cross web, persistence, worker, and replay.
- Treat planning metadata as part of the deliverable; strict closure depends on it.
- Runtime hardening should remain explicit technical debt until stronger isolation replaces prototype worker-only safeguards.

### Cost Observations

- Model mix: not recorded.
- Sessions: single milestone thread with phase, review, audit, and closure passes.
- Notable: parallel phase verification was valuable, but final integration still needed one coherent service-backed run.

## Cross-Milestone Trends

| Trend | Observation |
| --- | --- |
| Verification depth | Later audit passes became more valuable as cross-phase surfaces appeared. |
| Metadata hygiene | Summary frontmatter and validation status should be maintained during execution, not repaired at close. |
