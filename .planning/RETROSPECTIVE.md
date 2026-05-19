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

## Milestone: v1.1 — Trustworthy Simulation Beta

**Shipped:** 2026-05-18
**Phases:** 6 | **Plans:** 29

### What Was Built

- Engine-generated replay fixtures replaced fragile hand-authored demos and now drive visual checks for important mechanics.
- Chronicle validation became strict enough to reject malformed, impossible, private-leaking, and incompatible replay data before rendering.
- Runtime execution gained explicit adapter metadata, subprocess JSON IPC, hostile Strategy coverage, and stronger output/failure boundaries.
- Workshop and replay debugging gained sample Strategies, actionable validation/runtime messages, replay links, and owner-only Soldier inactivity explanations.
- Docker, no-Docker, service-backed E2E, fixture smoke, visual, and fast-test commands became clearer and more repeatable.
- Persisted owner replay debug authorization was closed through Phase 13 and proven with service-backed failing Strategy replay.

### What Worked

- The milestone audit found a real integration gap, and adding Phase 13 was the right way to close it without pretending fixture coverage was enough.
- Layered privacy tests across projection, server DTOs, browser replay, and persisted Workshop flows gave high confidence.
- Focused Playwright screenshots on the replay board caught board-scale and fixture fidelity issues without making full-page snapshots brittle.

### What Was Inefficient

- The available `gsd-sdk` binary did not expose the documented `query` commands, so several workflow updates had to be maintained manually.
- Some Phase 8 summary coverage was plan-level rather than fully normalized across all plans, which made readiness checks less automatic than ideal.
- Manual browser review after the audit still found small but real UI polish issues, so responsive Workshop layout deserves earlier visual scrutiny.

### Patterns Established

- Treat Chronicle grammar as a trust contract between engine, persistence, replay, and UI.
- Keep owner debug data DTO-derived and server-authorized; React should render facts, not infer rules.
- Use service-backed E2E for any feature that claims to work on persisted Matches.
- Preserve Docker and no-Docker local paths as parallel first-class workflows.

### Key Lessons

- Fixture coverage and persisted replay coverage are different assurances; both matter.
- Public privacy should be asserted against field names as well as marker values.
- Layout regressions are part of trust when they affect replay/workshop inspection; narrow viewport screenshots should be part of UI review.

### Cost Observations

- Model mix: not recorded.
- Sessions: one extended milestone thread with audit, closure phase, manual browser review, and archive pass.
- Notable: subagent-style review and validation paid off, but the final polish loop benefited from direct user inspection.

## Cross-Milestone Trends

| Trend | Observation |
| --- | --- |
| Verification depth | Later audit passes became more valuable as cross-phase surfaces appeared; v1.1 showed that persisted service-backed flows need explicit proof beyond fixtures. |
| Metadata hygiene | Summary frontmatter and validation status should be maintained during execution, not repaired at close. |
| UI polish | Narrow viewport browser review caught issues after automated checks; responsive screenshots should move earlier in UI phases. |
