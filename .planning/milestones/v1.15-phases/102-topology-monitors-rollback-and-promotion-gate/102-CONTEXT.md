# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 102 is the v1.15 promotion gate. It proves the local normal-product topology, no-fallback behavior, rollback path, public-output privacy, replay board realism, and monitor coverage after the prior phases move Go ownership across orchestration, runtime handoff, completion, Chronicle persistence, scoring, and selected public evidence.

This phase does not implement broad new backend ownership, retire the TypeScript runtime, promote a production sandbox, or claim v1.16 runtime work is complete.

</domain>

<decisions>
## Implementation Decisions

### Promotion Gate Role

- **D-01:** Phase 102 is a promotion gate for v1.15, not another broad implementation phase.
- **D-02:** Final artifacts should record explicit promotion/defer decisions for Go orchestration, runtime boundary, Chronicle persistence, MatchSet scoring, public evidence, rollback, no-fallback, privacy, and remaining TypeScript ownership.
- **D-03:** The promotion decision must state that production sandbox replacement and final TypeScript runtime retirement remain out of scope.

### Required Topology Evidence

- **D-04:** Required local topology evidence must prove web frontend -> Go backend -> TypeScript runtime execution service -> Go completion/Chronicle persistence -> Go MatchSet scoring -> Go public evidence.
- **D-05:** The repeatable topology command should create a Go-owned exhibition, execute Matches through the TypeScript runtime boundary, persist Chronicles through Go, finalize scoring through Go, and fetch public evidence through Go.
- **D-06:** Topology must fail if normal product workflows silently fall back to TypeScript backend/service persistence paths.

### Failure Drills

- **D-07:** Stopped-Go drills are required. Selected Go-owned web/API workflows must fail closed without TypeScript backend fallback.
- **D-08:** Stopped-runtime-service drills are required. Go must classify stopped runtime service behavior as retryable or terminal system failure without TypeScript persistence fallback.
- **D-09:** Failure drill diagnostics must be public-safe and redacted by default.

### Rollback

- **D-10:** Rollback must be explicit and documented: stop Go orchestration, switch ownership, then start the TypeScript rollback worker.
- **D-11:** Rollback must not mix DB claim/completion owners.
- **D-12:** Rollback evidence should cover queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior where practical.

### Boundary Monitors

- **D-13:** Boundary monitors should fail on unexpected TypeScript backend ownership creep, unsafe fallback, schema drift, runtime ABI drift, lifecycle/route manifest drift, privacy drift, report-only offense increases, and public-output leaks.
- **D-14:** Monitors should make remaining TypeScript production-ish ownership visible and limited to the isolated JS/TS Strategy runtime service plus explicitly documented parity/test/rollback/deferred surfaces.
- **D-15:** Report-only offense increases should be treated as promotion blockers unless explicitly rebaselined with evidence.

### Browser Replay Gate

- **D-16:** Browser replay validation remains part of the promotion gate for Go-created or Go-completed evidence.
- **D-17:** Replay validation should prove plausible full Match starts with in-bounds visible Soldiers and terrain, no clipped/off-board pieces, and no canonical-start regression for canonical arenas.

### Privacy And Public Safety

- **D-18:** Public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- **D-19:** The final promotion/defer artifacts must be source-safe and suitable as public evidence.

### the agent's Discretion

The agent may choose exact topology command names, artifact filenames, monitor helper structure, and drill harness details, provided the gate proves the complete v1.15 ownership story and does not widen the milestone into v1.16 runtime retirement or production sandbox replacement.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — GATE-01 through GATE-08 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 102 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state, blockers, and deferred-scope warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Prior Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Lifecycle ownership labels, no-fallback defaults, rollback semantics, and manifest vocabulary.
- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` — Go lifecycle ownership, lease, retry, failure, and rollback decisions.
- `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md` — Execution-only TypeScript runtime service and ABI decisions.
- `.planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md` — Go completion, Chronicle persistence, idempotency, and replay safety decisions.
- `.planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md` — Go scoring, status refresh, and failure classification decisions.
- `.planning/phases/101-public-evidence-delivery-and-web-cutover/101-CONTEXT.md` — Selected public/product web cutover and TypeScript surface labels.

### Prior Evidence

- `.planning/artifacts/v1.14-live-web-go-topology.json` — Existing topology artifact shape and limitations.
- `.planning/artifacts/v1.14-promotion-decision.md` — Prior promoted/deferred runtime and Go route decisions.
- `.planning/artifacts/v1.14-route-ownership-manifest.json` — Prior route ownership and runtime boundary vocabulary.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine boundaries, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Topology And Monitor Scripts

- `scripts/check-local-topology.ts`: Existing local topology checker with command guidance, privacy-safe diagnostics, web/Go smoke support, runtime metadata checks, and public payload validation.
- `scripts/check-boundary-monitors.ts`: Existing boundary monitor entry point for contract drift, privacy, web boundary, runtime adapter readiness, runtime isolation, non-JS guardrails, Go parity, promotion manifests, and topology.
- `scripts/check-service-boundary-imports.ts`: Existing strict/report-only web import monitor and report-only offense baseline.

### Existing v1.14 Evidence Patterns

- `.planning/artifacts/v1.14-live-web-go-topology.json`: Current artifact records commands, fixture loading, TypeScript service health, runtime adapter metadata, runtime isolation readiness, web/Go smoke placeholders, and diagnostic privacy.
- `.planning/artifacts/v1.14-promotion-decision.md`: Existing promotion/defer artifact structure with promoted, deferred, evidence, privacy, and boundary notes.

### Gate Risks To Guard

- A topology command that proves only fixtures rather than a live web -> Go -> runtime -> Go persistence/public evidence path.
- TypeScript service or worker silently claiming/completing jobs during the Go-selected normal path.
- Stopped runtime being treated as an old worker fallback instead of a Go-classified system failure.
- Public evidence or monitor details leaking source, memories, raw Awareness Grid, owner debug, stack traces, stderr, tokens, paths, DB DSNs, or runtime internals.
- Browser replay evidence passing metadata checks while the actual board is clipped, off-bounds, or missing canonical starts.

</code_context>

<specifics>
## Specific Ideas

The final phase should be artifact-heavy and adversarial. It should prove the happy path, the stopped-service paths, rollback isolation, monitor failure behavior, browser replay realism, and remaining TypeScript limits. The best outcome is a promotion decision that is strict, source-safe, and honest about what v1.16 still owns.

</specifics>

<deferred>
## Deferred Ideas

- Production hostile-code sandbox replacement.
- Final TypeScript runtime retirement.
- Counted non-JS MatchSets/ladders/gauntlets by default.
- Full workshop/admin/governance migration.
- Cloud deployment, service mesh, Kubernetes, or production observability stack.

</deferred>

---

*Phase: 102-Topology Monitors Rollback and Promotion Gate*
*Context gathered: 2026-05-24*
