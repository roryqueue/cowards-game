# Phase 12: Local and CI Reliability - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes Docker, no-Docker, and service-backed CI startup and verification boring and diagnosable. It covers local service startup parity, shared preflight diagnostics, test command split, service-backed edit -> execute -> replay coverage, replay visual checks, and layer-specific failure reporting.

</domain>

<decisions>
## Implementation Decisions

### Local Startup Parity
- **D-01:** Keep both Docker and no-Docker local development paths first-class.
- **D-02:** Docker Compose can be the one-command happy path, but the no-Docker `dev:local`/local Postgres path must remain documented and tested enough for environments where Docker is unavailable.
- **D-03:** The Docker path must work end to end locally now that Docker is available: service startup, migrations, worker execution, web replay access, and the relevant service-backed E2E path should all be verified.

### Preflight Shape
- **D-04:** Add one shared diagnostic/preflight command.
- **D-05:** Preflight should check Postgres, Redis if still required, migrations, seed state, worker ability to run one job, and replay endpoint readiness.
- **D-06:** Preflight output should classify layer-specific failures rather than returning generic command failure.

### CI Split
- **D-07:** Keep fast unit/type/lint checks separate from service-backed E2E and replay visual regression.
- **D-08:** Developers should be able to run the relevant slice locally without invoking the entire verification suite.

### E2E Ambition
- **D-09:** CI should run at least one service-backed edit -> submit revision -> execute Match -> open replay path.
- **D-10:** CI should also run the replay visual fixture suite.
- **D-11:** Broader service/visual matrix coverage can remain local or nightly until stable.

### Docker Scope
- **D-12:** Do not require fully containerizing web/worker in this phase unless the planner finds it cheap.
- **D-13:** The must-have is reliable Docker service startup and diagnostics; app containers are nice-to-have.
- **D-14:** If app containers are not added, the Docker path still must prove end-to-end local development with Dockerized services and host-run web/worker.

### the agent's Discretion
- The planner may choose exact script names, preflight implementation language, CI job names, and whether app containers are cheap enough to include, as long as Docker services and no-Docker parity remain verified.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone Context
- `.planning/PROJECT.md` — Current v1.1 goal and reliability scope.
- `.planning/REQUIREMENTS.md` — Phase 12 requirements REL-01 through REL-06.
- `.planning/ROADMAP.md` — Phase 12 goal, success criteria, and phase boundary.
- `.planning/research/SUMMARY.md` — v1.1 research summary.
- `.planning/research/STACK.md` — Local/CI reliability and Docker/no-Docker findings.
- `.planning/research/ARCHITECTURE.md` — Local/CI reliability layer direction.
- `.planning/research/PITFALLS.md` — Docker/no-Docker drift and diagnostic pitfalls.
- `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md` — Visual replay checks and failure diagnostics.
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md` — Chronicle validation failures that preflight/E2E should surface.
- `.planning/phases/10-runtime-isolation-hardening/10-CONTEXT.md` — Worker/runtime failure taxonomy that reliability checks should preserve.
- `.planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md` — Workshop replay-link behavior relevant to service-backed E2E.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — End-to-end Match/replay semantics.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Local topology, worker, persistence, and runtime architecture constraints.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `compose.yaml`: Current Docker Compose services for Postgres and Redis with health checks.
- `scripts/dev-local-postgres.sh`: Existing no-Docker local Postgres setup, migration, web, and worker startup path.
- `package.json`: Current scripts include `dev:full`, `dev:local`, `e2e`, `e2e:smoke`, and `verify`.
- `apps/web/e2e/workshop-to-replay.spec.ts`: Service-backed Workshop-to-replay E2E path.
- `apps/web/e2e/replay.fixture.spec.ts`: Existing replay fixture smoke path and likely visual regression expansion point.
- `packages/persistence/src/dev-smoke.ts`: Existing persistence/dev smoke utilities that may be useful for preflight.
- `apps/worker/src/runner.ts`: Worker execution readiness point.

### Established Patterns
- Docker currently provides services; web/worker run on the host in the default local scripts.
- No-Docker local startup currently handles Postgres and migrations directly.
- Verification scripts already split root verification and E2E smoke, but service-backed and visual slices need clearer boundaries.

### Integration Points
- Preflight should likely live in `scripts/` or a small package script and be usable by local dev and CI.
- Docker service readiness should integrate with `dev:full` rather than assuming `docker compose up -d` is enough.
- Service-backed E2E should exercise Workshop submission, worker execution, Chronicle validation/projection, and replay route access.
</code_context>

<specifics>
## Specific Ideas

- Docker is now available locally and should be verified end to end as part of this phase.
- The Docker must-have is reliable service startup plus host-run app/worker E2E; full app containerization is optional.
- Diagnostics should tell the developer which layer failed.
</specifics>

<deferred>
## Deferred Ideas

- Fully containerized web/worker dev environment is nice-to-have unless planning finds it cheap and low-risk.
</deferred>

---

*Phase: 12-Local and CI Reliability*
*Context gathered: 2026-05-18*
