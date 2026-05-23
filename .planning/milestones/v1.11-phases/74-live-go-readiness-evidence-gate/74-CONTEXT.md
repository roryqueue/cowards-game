# Phase 74: Live Go Readiness Evidence Gate - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 74 makes live local Go readiness evidence a required validation lane while keeping Go read-only, fixture-backed, and out of production web routing. The phase should validate Go fixture parity, route manifest alignment, boundary monitors, required live local topology, privacy-safe diagnostics, no-fallback semantics, and rollback/non-promotion documentation.

This phase must not add Go writes, Go auth/session mutation, Go ladder writes, Go Match orchestration, Go jobs, Go migrations, Go persistence ownership, Go Strategy source retrieval, Go Strategy execution, production web routing to Go, production runtime sandbox promotion, or counted non-JS play.

</domain>

<decisions>
## Implementation Decisions

### Canonical Live Evidence Command

- **D-01:** Use the existing `pnpm topology:check -- --require-go --json` command as the canonical live Go readiness evidence gate.
- **D-02:** Patch only gaps discovered during planning/implementation. Do not add a new wrapper command unless the existing topology command cannot satisfy GOEVID requirements.
- **D-03:** Live Go evidence is required validation evidence, not documentation-only smoke.

### Go Process Startup Model

- **D-04:** Require the developer/validator to start the Go backend separately using the existing `apps/go-backend/README.md` contract before running required topology.
- **D-05:** Do not add automatic start/stop process management for the Go backend in this phase.
- **D-06:** Do not make `pnpm boundary:monitors` opportunistically substitute for the required live topology gate when Go happens to be running.

### Owner Analytics Live Check Depth

- **D-07:** Required live topology should prove unauthenticated owner analytics is rejected with a public-safe 401 or 403 response.
- **D-08:** Do not require an authenticated owner analytics positive-read smoke in Phase 74.
- **D-09:** Do not commit or require real owner bearer tokens in evidence artifacts. Diagnostics must redact token-like values if they appear.

### Evidence Artifact and Failure Semantics

- **D-10:** Store sanitized command outputs and rollback/non-promotion notes in a durable planning artifact that Phase 75 can reference.
- **D-11:** Required live Go evidence fails the phase if Go is unavailable, divergent, non-JSON, privacy-unsafe, or silently falls back to TypeScript.
- **D-12:** Do not allow a temporary waiver for missing local Go once Phase 74 validation is in scope.
- **D-13:** Evidence must show production web traffic remains on the TypeScript service path and that Go evidence can be removed/rolled back without affecting user-facing TypeScript service behavior.

### Non-Promotion Guardrails

- **D-14:** Go remains read-only and fixture-backed. Adding or promoting Go routes beyond the approved read-only route set is out of scope.
- **D-15:** Runtime isolation remains evidence-only, and Python/other non-JS runtimes remain experimental and non-counted.

### the agent's Discretion

- The planner may choose the exact durable artifact path, but it should be under `.planning/artifacts/` and referenced by Phase 75.
- The planner may add narrowly scoped tests for topology parsing/failure semantics if implementation changes `scripts/check-local-topology.ts`.
- The planner may choose whether Phase 74 captures fresh `pnpm go:parity` and `pnpm boundary:monitors` output in the same artifact or references separate command evidence.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Phase Context

- `.planning/PROJECT.md` - Current v1.11 milestone goal and Go/non-promotion constraints.
- `.planning/REQUIREMENTS.md` - GOEVID requirements and v1.11 out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 74 goal and success criteria.
- `.planning/phases/70-boundary-debt-rebaseline-and-v1-11-scope-lock/70-CONTEXT.md` - Decision that required live Go belongs in Phase 74.
- `.planning/phases/73-boundary-enforcement-and-source-free-type-cleanup/73-CONTEXT.md` - Boundary enforcement prerequisite for live Go evidence.
- `.planning/milestones/v1.10-MILESTONE-AUDIT.md` - Prior Go parity and non-promotion evidence baseline.
- `.planning/milestones/v1.10-REQUIREMENTS.md` - Prior Go route ownership and non-goal constraints.

### Go and Topology Code

- `apps/go-backend/README.md` - Local Go startup, fixture directory, address, owner-token configuration, and ownership boundary.
- `apps/go-backend/main.go` - Read-only Go backend route implementation and fixture loading.
- `apps/go-backend/main_test.go` - Go handler, privacy, route, and error behavior tests.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Approved Go read-only route inventory.
- `scripts/check-local-topology.ts` - Required live topology checks, JSON output, sanitization, and no-fallback behavior.
- `scripts/check-boundary-monitors.ts` - Go route manifest, fixture privacy, topology diagnostics, runtime/non-JS guardrails.
- `scripts/generate-go-parity-fixtures.ts` - TypeScript-service-backed Go parity fixture generation/check source of truth.
- `package.json` - `go:parity`, `boundary:monitors`, and `topology:check` script definitions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `pnpm go:parity` checks generated TypeScript-service-backed Go fixtures and runs Go tests.
- `pnpm boundary:monitors` already checks route inventory, fixture privacy, runtime/non-JS guardrails, topology diagnostics, and boundary monitors.
- `scripts/check-local-topology.ts` supports `--require-go`, defaults Go URL to `http://127.0.0.1:8087`, emits JSON with `--json`, and marks required Go failures as process failures.
- The Go backend defaults to `127.0.0.1:8087` and fixture directory `testdata/service-fixtures`.

### Established Patterns

- Go route inventory must remain GET-only, canonical, privacy-checked, and limited to approved read-only fixture-backed routes.
- Required boundary validation must fail loudly rather than silently falling back to TypeScript.
- Public/service/Go/topology/monitor outputs must be privacy-safe by default.

### Integration Points

- The likely live command is `pnpm topology:check -- --require-go --json` after starting Go with `go run .` from `apps/go-backend`.
- The likely durable evidence artifact is `.planning/artifacts/v1.11-live-go-readiness-evidence.md`.
- If topology behavior changes, the likely test target is `scripts/check-local-topology.test.ts`.

</code_context>

<specifics>
## Specific Ideas

- Keep owner analytics live validation to unauthenticated rejection only so the route does not look product-promoted.
- Capture command output in sanitized form and include rollback notes that explicitly leave production web traffic on the TypeScript service path.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 74-Live Go Readiness Evidence Gate*
*Context gathered: 2026-05-23*
