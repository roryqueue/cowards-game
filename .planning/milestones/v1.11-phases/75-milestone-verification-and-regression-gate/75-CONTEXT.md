# Phase 75: Milestone Verification and Regression Gate - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 75 is the final release-style proof for v1.11. It must run the v1.11 verification set, fix v1.11-caused regressions and blockers, prove Workshop service migrations and boundary reduction, prove live Go evidence, verify privacy and non-promotion guardrails, and map all active v1.11 requirements to implementation or explicit deferral evidence before milestone close.

This phase must not introduce new product behavior, Go ownership, production Go routing, Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence writes, Strategy source retrieval, Strategy execution, production runtime sandbox promotion, counted non-JS play, or broad backend rewrites.

</domain>

<decisions>
## Implementation Decisions

### Verification Command Breadth

- **D-01:** Run the full explicit v1.11 verification gate: contracts, OpenAPI lint, `boundary:imports`, focused service/web/package tests, `typecheck`, `go:parity`, required live Go topology, `boundary:monitors`, replay smoke privacy, formatting, and `git diff --check`.
- **D-02:** Do not substitute `pnpm verify` alone for the named v1.11 evidence set.
- **D-03:** Do not narrow final verification to only changed-surface tests plus boundary/Go checks.

### Failure Handling

- **D-04:** Fix v1.11-caused failures.
- **D-05:** Fix any blocker that prevents required v1.11 verification from producing trustworthy evidence, even if the immediate symptom appears outside the touched files.
- **D-06:** If a failure is clearly unrelated/pre-existing and cannot be fixed safely inside v1.11, document it as such with enough evidence for milestone audit instead of expanding the milestone into general cleanup.
- **D-07:** Do not stop on minor unrelated drift without first classifying whether it blocks required v1.11 evidence.

### Required Live Go at Final Verification

- **D-08:** Final verification blocks unless required live Go evidence passes again or Phase 74's required live Go evidence is demonstrably fresh from the same implementation state and explicitly referenced.
- **D-09:** Always prefer a fresh Phase 75 rerun when it is cheap and the Go process is already available.
- **D-10:** Do not allow a missing-Go waiver in final verification.
- **D-11:** Required live Go remains evidence-only and no-fallback; production web traffic remains on the TypeScript service path.

### Final Evidence Shape

- **D-12:** Produce a durable final verification artifact with command results, requirement traceability, final boundary count, selected strict targets, live Go evidence link, rollback/defer notes, runtime/non-JS non-promotion state, and privacy/non-promotion checks.
- **D-13:** Summarize the durable final evidence in Phase 75 artifacts so milestone audit can consume it without re-running commands.
- **D-14:** Do not rely only on REQUIREMENTS checkbox updates or a terse summary without the evidence story.

### the agent's Discretion

- The planner may choose the exact final artifact path, but it should be under `.planning/artifacts/` or the Phase 75 directory and be easy for the milestone audit to find.
- The planner may choose the exact focused service/web/package test subset, but it must cover the Phase 71 and Phase 72 migrated read surfaces and must not omit named v1.11 verification categories.
- The planner may choose whether to rerun live Go in Phase 75 or reference Phase 74 evidence, but must prove the evidence matches the final implementation state.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Phase Context

- `.planning/PROJECT.md` - Current v1.11 milestone goal and non-negotiable constraints.
- `.planning/REQUIREMENTS.md` - VER requirements, GOEVID requirements, BOUND requirements, and requirement traceability source.
- `.planning/ROADMAP.md` - Phase 75 goal and success criteria.
- `.planning/STATE.md` - Current milestone/session state.
- `.planning/phases/70-boundary-debt-rebaseline-and-v1-11-scope-lock/70-CONTEXT.md` - Starting boundary baseline and selected/deferred surfaces.
- `.planning/phases/71-workshop-test-summary-read-boundary/71-CONTEXT.md` - Workshop test-summary migration decisions.
- `.planning/phases/72-workshop-analytics-compare-read-boundary/72-CONTEXT.md` - Workshop analytics compare migration decisions.
- `.planning/phases/73-boundary-enforcement-and-source-free-type-cleanup/73-CONTEXT.md` - Boundary enforcement and count-proof decisions.
- `.planning/phases/74-live-go-readiness-evidence-gate/74-CONTEXT.md` - Required live Go evidence decisions.

### Prior Milestone Evidence

- `.planning/milestones/v1.10-MILESTONE-AUDIT.md` - Prior milestone verification gate and definition-of-done evidence.
- `.planning/milestones/v1.10-ROADMAP.md` - Prior Phase 69 verification shape.
- `.planning/milestones/v1.10-REQUIREMENTS.md` - Prior Go/runtime/non-promotion constraints.

### Verification Commands and Scripts

- `package.json` - Canonical script definitions for contract, boundary, Go, topology, test, typecheck, e2e, and formatting commands.
- `scripts/check-service-boundary-imports.ts` - Final strict/report-only count source.
- `scripts/check-boundary-monitors.ts` - Boundary monitor, Go route inventory, runtime/non-JS, and topology diagnostic checks.
- `scripts/check-local-topology.ts` - Required live Go topology command and JSON output.
- `scripts/generate-go-parity-fixtures.ts` - Go parity fixture generation/check source of truth.
- `apps/go-backend/README.md` - Local Go startup and ownership boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `package.json` includes scripts for `contract:check`, `contract:lint`, `boundary:imports`, `go:parity`, `topology:check`, `boundary:monitors`, `typecheck`, `test`, `e2e:smoke`, `e2e:visual`, `verify`, and `format:check`.
- Phase 74 makes `pnpm topology:check -- --require-go --json` the canonical required live Go evidence command.
- Phase 73 makes `pnpm boundary:imports` the canonical final strict/report-only count source.

### Established Patterns

- v1.10 Phase 69 recorded final verification commands and definition-of-done checks in milestone evidence.
- v1.11 final verification should preserve the same auditability while adding required live Go evidence and below-30 boundary count proof.
- Verification evidence should distinguish v1.11-caused failures from unrelated/pre-existing drift.

### Integration Points

- The likely final evidence artifact is `.planning/artifacts/v1.11-final-verification-evidence.md` or a Phase 75 verification file.
- The final gate should reference Phase 74 live Go evidence if it is fresh, or capture a new live Go topology run.
- Requirement traceability should map all active v1.11 requirements in `.planning/REQUIREMENTS.md` to phase evidence, implementation state, or explicit deferral.

</code_context>

<specifics>
## Specific Ideas

- Use Phase 75 as a verification and regression gate, not a place to introduce new ownership.
- Keep command evidence exact enough that the milestone audit can cite it without guessing which checks actually ran.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 75-Milestone Verification and Regression Gate*
*Context gathered: 2026-05-23*
