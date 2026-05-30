# Phase 171: ABI Decision, Rollback, and Migration Criteria - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Decide active ABI status and write fail-closed migration/rollback criteria.

This phase clarifies and implements only the requirements mapped to Phase 171: ABIDEC-01, ABIDEC-02, ABIDEC-03, ABIDEC-04, ABIDEC-05, ABIDEC-06. New runtime promotion, counted non-JS support, production sandbox certification, or ABI migration outside this phase boundary must be deferred unless explicitly required by the mapped requirements.

</domain>

<decisions>
## Implementation Decisions

### Approved Defaults
- **D-01:** Recommended default is to keep Preview 1 stdin/stdout JSON active unless spike evidence strongly supports a different explicit decision.
- **D-02:** Decision must explain why direct exports and Component Model/WIT are or are not promoted.
- **D-03:** Unknown, stale, mismatched, or unpromoted ABI metadata must fail closed.
- **D-04:** Migration criteria must cover compatibility, schema validation, caps, privacy, replay, no-fallback, rollback, and artifact coexistence.
- **D-05:** Decision must preserve Go/runtime-service ownership and prevent Strategy execution in web/API/Go.

### Carry-Forward Milestone Decisions
- **D-CF-01:** Similar decisions across this milestone should use the same conservative defaults unless phase evidence creates a real conflict.
- **D-CF-02:** Prefer extending existing evidence scripts, runtime registries, boundary monitors, and signed-in proof patterns over creating parallel governance systems.
- **D-CF-03:** Fail-loud non-promotion evidence is a valid successful outcome for proof-spike phases.

### the agent's Discretion
Downstream agents may choose exact file/module boundaries, helper function names, and test factoring, provided they preserve the decisions above, existing project patterns, deterministic engine boundaries, runtime-service hostile-code ownership, Go orchestration ownership, and public-output privacy.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Milestone Baseline
- `AGENTS.md` — Project non-negotiables, terminology, testing expectations, and GSD workflow.
- `.planning/PROJECT.md` — Current milestone goals, constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — v1.24 requirements and traceability.
- `.planning/ROADMAP.md` — Phase boundaries and success criteria.
- `.planning/STATE.md` — Current milestone state and active constraints.
- `.planning/research/v1.24-SUMMARY.md` — Current research baseline and recommended phase structure.
- `.planning/research/v1.23-SUMMARY.md` — Prior research baseline for Rust/Zig beta and ABI candidates.
- `.planning/milestones/v1.23-REQUIREMENTS.md` — Archived v1.23 completed requirements and future requirements.
- `.planning/milestones/v1.23-ROADMAP.md` — Archived v1.23 phase structure and proof gates.
- `.planning/milestones/v1.23-MILESTONE-AUDIT.md` — Archived audit result and fixed findings.
- `.planning/milestones/v1.23-VERIFY-WORK.md` — Signed-in proof and validation command baseline.
- `.planning/milestones/v1.23-CODE-REVIEW.md` — v1.23 review findings and residual risk.
- `.planning/artifacts/v1.23-promotion-decision.md` — Explicit non-counted Rust/Zig beta promotion decision.
- `.planning/artifacts/v1.23-abi-readiness-decision.md` — Active ABI decision keeping Preview 1 stdin/stdout JSON.
- `.planning/artifacts/v1.23-wasm-wasi-beta-readiness-evidence.md` — WASM/WASI beta readiness probe baseline.
- `.planning/artifacts/v1.23-signed-in-multi-compiler-proof.md` — Signed-in proof summary when available; JSON artifact has detailed evidence.

### Code and Evidence Patterns
- `package.json` — Existing verification and evidence commands: sandbox, WASM/WASI, boundary monitors, e2e proof.
- `scripts/evaluate-runtime-sandbox.ts` — Runtime sandbox/readiness and no-fallback evidence pattern to extend.
- `scripts/evaluate-wasm-wasi-runtime.ts` — WASM/WASI hardening evidence pattern.
- `scripts/evaluate-v1-23-wasm-wasi-beta.ts` — Rust/Zig beta readiness evidence pattern.
- `apps/runtime-service/src/execute-match.ts` — Runtime-service broker selection, artifact validation, and execution boundary.
- `packages/spec/src/runtime.ts` — Runtime registry, ABI metadata, eligibility, limits, and non-JS guardrails.
- `packages/runtime-js/src/sandbox-evaluation.ts` — JS/TS sandbox probe taxonomy and candidate readiness model.
- `packages/runtime-wasm-wasi/src/validation.ts` — Rust/Zig WASM validation, import inspection, artifact metadata, and toolchain evidence.
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` — Signed-in multi-compiler proof style to reuse for v1.24 regression.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing evidence scripts in `scripts/` already write JSON and Markdown artifacts and support `--check` staleness gates.
- Runtime registry and product semantics live in `packages/spec/src/runtime.ts` and should remain the source of truth for eligibility and metadata.
- Runtime-service execution in `apps/runtime-service/src/execute-match.ts` already validates source, artifact metadata, registry matches, and response schemas before returning execution results.
- WASM/WASI validation in `packages/runtime-wasm-wasi/src/validation.ts` already inspects imports, compiles Rust/Zig, and records artifact metadata.
- Signed-in browser proof exists in `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts` and can be extended or mirrored for v1.24 proof.

### Established Patterns
- Planning and proof artifacts should be paired machine-readable JSON plus human-readable Markdown when evidence is meant for audits.
- Runtime unavailability, unsupported lanes, stale artifacts, mismatched metadata, and malformed envelopes should fail loudly rather than being treated as successful proof.
- Public evidence should describe categories and outcomes, not raw diagnostics or private runtime internals.
- Boundary monitors should compose existing checks rather than introduce isolated one-off gates.

### Integration Points
- `package.json` scripts are the operator-facing entry points for evidence, monitors, and proof commands.
- `scripts/check-boundary-monitors.ts` is the likely aggregate gate for milestone drift checks.
- `.planning/artifacts/` is the canonical location for generated readiness, abuse, ABI, no-fallback, proof, and decision artifacts.

</code_context>

<specifics>
## Specific Ideas

User approved the default sequential discussion decisions for all v1.24 phases. The recurring preference is conservative claim discipline, reuse of existing evidence patterns, public-safe outputs, fail-loud non-promotion when evidence is weak, and no silent migration or fallback.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 171-ABI Decision, Rollback, and Migration Criteria*
*Context gathered: 2026-05-30*
