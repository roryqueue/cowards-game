# Phase 237: Documentation, UI, and Verification - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 237 updates docs, UI labels, provider evidence, monitors, browser review, and validation for v1.33. It should clearly distinguish source-backed artifact-proven supported languages, WASM/WASI artifact-backed supported languages, and TinyGo as a spike-only candidate, while preserving Rust/Zig behavior and avoiding security overclaims.

</domain>

<decisions>
## Implementation Decisions

### Language Taxonomy
- **D-01:** TypeScript and Python should be described as supported, source-backed artifact-proven languages.
- **D-02:** Rust and Zig should be described as supported, WASM/WASI artifact-backed languages.
- **D-03:** TinyGo should be described only as a spike-only candidate.

### Product and Public Labels
- **D-04:** TinyGo must not appear as a selectable production Strategy language.
- **D-05:** TinyGo must not appear as counted eligible or production-supported unless a future approved milestone changes that status.
- **D-06:** Product labels, Strategy cards, entry flows, result/replay pages, Learn/docs, and public evidence must avoid implying stronger support than the evidence proves.

### Provider Evidence Docs
- **D-07:** Provider evidence docs should explain source hash/bytes, artifact hash/bytes, toolchain/interpreter metadata, validation policy, compatibility metadata, privacy exclusions, and fail-closed semantics.
- **D-08:** Docs must state that TypeScript/Python artifact provenance is not equivalent to WASM/WASI isolation or production sandbox certification.
- **D-09:** Rust/Zig WASM/WASI artifact behavior must remain green under the expanded provider proof model.

### Verification
- **D-10:** Verification must include TypeScript/Python artifact proof tests, Rust/Zig regression, TinyGo spike-only label checks, privacy scans, boundary monitors, and no Strategy execution in web/API/Go.
- **D-11:** Browser review should cover supported-language pages and relevant evidence surfaces, looking for realistic language status labels, no clipping/overlap, and no security overclaiming.
- **D-12:** If replay or Match creation changes occurred in earlier phases, include replay board realism checks.

### the agent's Discretion
- Planner may choose exact docs/pages/evidence surfaces to update, but must cover every user-visible place where language status or provider evidence could be misunderstood.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `LANGDOC-01..LANGDOC-07`.
- `.planning/ROADMAP.md` - Phase 237 success criteria.
- `.planning/STATE.md` - Active v1.33 boundary notes.
- `.planning/research/SUMMARY.md` - v1.33 docs/UI/verification direction.
- `.planning/phases/234-typescript-artifact-provenance/234-CONTEXT.md` - TypeScript artifact provenance decisions.
- `.planning/phases/235-python-artifact-provenance/235-CONTEXT.md` - Python artifact provenance decisions.
- `.planning/phases/236-tinygo-wasm-wasi-spike/236-CONTEXT.md` - TinyGo spike-only decisions.

### Prior Decisions
- `.planning/phases/230-result-replay-public-evidence-and-docs-language-pass/230-CONTEXT.md` - Existing result/replay/docs language pass.
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md` - Boundary and monitor expectations.
- `.planning/phases/232-live-four-language-signed-in-proof/232-CONTEXT.md` - Browser/proof/privacy expectations.
- `.planning/phases/233-audit-archive-commit-and-tag/233-CONTEXT.md` - Closure/audit gates and non-claim discipline.

### Code
- `packages/spec/src/runtime.ts` - Supported language/provider labels, policies, evidence requirements, and runtime posture.
- `apps/runtime-service/src/server.ts` - Provider validation proof output.
- `scripts/check-boundary-monitors.ts` - Boundary, label, privacy, and provider monitor surface.
- `scripts/check-boundary-monitors.test.ts` - Monitor test patterns.
- `apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts` - Existing browser proof baseline.

### Evidence
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md` - Latest signed-in proof artifact pattern.
- `.planning/artifacts/v1.32-four-language-signed-in-proof.json` - Machine-readable proof artifact pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Supported language/provider registry already drives labels, policy text, provider ids, and docs references.
- Boundary monitor script already centralizes many privacy, label, provider, and boundary checks.
- v1.32 Playwright proof covers signed-in language surfaces and can inform browser review scope.

### Established Patterns
- Evidence docs should state non-claims as clearly as claims.
- Public result/replay/evidence surfaces must omit private Strategy/runtime details.
- UI/browser proof should inspect real rendered status labels, not just text snapshots.

### Integration Points
- Supported-language docs and Learn pages.
- Product language labels in Workshop/account/entry/result/replay/public evidence.
- Provider proof/evidence DTOs.
- Boundary monitors, privacy scans, Playwright browser review, and final validation artifacts.

</code_context>

<specifics>
## Specific Ideas

The central user-facing taxonomy is:
- TypeScript/Python: supported, source-backed artifact-proven.
- Rust/Zig: supported, WASM/WASI artifact-backed.
- TinyGo: spike-only candidate.

</specifics>

<deferred>
## Deferred Ideas

TinyGo production support, permanent language governance, package ecosystem expansion, direct-export ABI migration, Component Model/WIT migration, and production sandbox certification remain future work.

</deferred>

---

*Phase: 237-Documentation, UI, and Verification*
*Context gathered: 2026-05-31*
