# Phase 232: Live Four-Language Signed-In Proof - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 232 proves the signed-in end-to-end workflow for JS/TS, Python, Rust, and Zig: author/load, save, enter counted paths, execute, view results, view replay, inspect public evidence, and verify desktop/mobile rendering plus privacy and board realism.

</domain>

<decisions>
## Implementation Decisions

### Proof Scope
- **D-01:** Proof must include all four languages in signed-in flows, not only service-level fixtures.
- **D-02:** Proof should record provider ids, ABI decision, counted eligibility, pairwise coverage, privacy scan, boundary monitor result, board realism checks, and non-claims.
- **D-03:** Browser proof should cover desktop and mobile surfaces enough to catch clipped, overlapping, or contradictory language labels.

### Live vs Fixture
- **D-04:** Prefer live local service proof where available. If an environment dependency is unavailable, fail loudly and document the gap rather than silently substituting a weaker claim.
- **D-05:** Public output scans remain mandatory even for local proof artifacts.

### The Agent's Discretion
- Pick the exact proof runner shape and service startup sequence during planning. Keep runtime prerequisites explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `PROOF-01..PROOF-05`.
- `.planning/ROADMAP.md` - Phase 232 success criteria.
- `.planning/phases/228-cross-language-golden-strategy-corpus-and-parity-matrix/228-CONTEXT.md`
- `.planning/phases/229-workshop-account-and-competition-entry-unification/229-CONTEXT.md`
- `.planning/phases/230-result-replay-public-evidence-and-docs-language-pass/230-CONTEXT.md`
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md`

### Code
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` - Existing multi-compiler proof pattern.
- `apps/web/e2e/v1-31-public-site-spine.spec.ts` - Public/signed-in route proof pattern.
- `apps/web/e2e/workshop-to-replay.spec.ts` - Workshop to replay proof baseline.
- `scripts/check-local-topology.ts` - Local service topology diagnostics.
- `scripts/evaluate-v1-24-runtime-abuse-lab.ts` - Multi-runtime proof artifact pattern.
- `apps/runtime-service/src/server.ts` - Runtime service required for proof.
- `apps/go-backend/main.go` - Go backend local proof participant.

### Evidence
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md`
- `.planning/artifacts/v1.24-signed-in-multi-runtime-regression-proof.md`
- `.planning/artifacts/v1.31-public-site-spine-proof.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Playwright proof specs already create signed-in revisions and inspect result/replay surfaces.
- Local topology diagnostics already help avoid false proof when services are unavailable.

### Established Patterns
- Proof artifacts should record commands, route coverage, privacy scans, boundary results, and non-claims.
- Board realism checks are required for replay proof.

### Integration Points
- Web app, Go backend, runtime-service, persistence, Playwright, privacy scanners, boundary monitors, and generated proof artifacts.

</code_context>

<specifics>
## Specific Ideas

This is the confidence phase. If a language cannot complete signed-in proof, the phase should say so clearly rather than stretching the claim.

</specifics>

<deferred>
## Deferred Ideas

Hosted production deployment proof and durable ranked season governance are outside this milestone unless already available.

</deferred>

---

*Phase: 232-Live Four-Language Signed-In Proof*
*Context gathered: 2026-05-31*
