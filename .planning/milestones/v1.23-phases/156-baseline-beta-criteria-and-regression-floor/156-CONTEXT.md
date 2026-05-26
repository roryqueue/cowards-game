# Phase 156: Baseline, Beta Criteria, and Regression Floor - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Define the v1.22 regression floor and the exact non-counted exhibition beta gate language for Rust and Zig. This phase should produce planning/evidence contracts only; it should not implement runtime changes, UI changes, ABI spikes, signed-in proof, monitors, or promotion decisions.

</domain>

<decisions>
## Implementation Decisions

### Beta Criteria Contract
- **D-01:** Beta means non-counted exhibition beta only. Any wording, artifact, UI copy, or monitor introduced in this phase must explicitly reject counted, ranked, ladder, gauntlet, broad production multi-language, and production sandbox promotion.
- **D-02:** Rust and Zig each need independent beta criteria so the final milestone can split outcomes: Rust beta / Zig alpha, both beta, neither beta, or both remain alpha.
- **D-03:** The beta criteria must be evidence-gated, not label-gated: signed-in multi-compiler proof, immutable artifact execution, runtime hardening, public-safe diagnostics, replay plausibility, no silent fallback, and JS/TS counted regression safety are mandatory gates.

### Regression Floor
- **D-04:** Treat v1.22 as the floor: Rust compiles to `wasm32-wasip1`, Zig compiles to `wasm32-wasi`, both execute through runtime-service / Runtime Broker / Wasmtime using Preview 1 stdin/stdout JSON, and v1.22 WASM/WASI hardening evidence passed 19/19 probes.
- **D-05:** Carry forward the v1.22 caveat as a v1.23 gate: full signed-in JS/TS/Rust/Zig live MatchSet proof was not rerun and must not be treated as already satisfied.
- **D-06:** JS/TS counted support and Python non-counted exhibition beta status are explicit regression gates and must not be reclassified by Rust/Zig work.

### the agent's Discretion
- The planner may choose the exact shape of the beta criteria artifact, but it must be machine-checkable enough for later phases to reference.
- The planner may add small helper scripts or checks if they only summarize existing evidence and do not implement runtime behavior.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope
- `.planning/PROJECT.md` — Active v1.23 milestone, project constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — BASE-01 through BASE-06 requirements.
- `.planning/ROADMAP.md` — Phase 156 goal and success criteria.
- `.planning/STATE.md` — Active v1.23 constraints and next-step state.
- `.planning/research/v1.23-SUMMARY.md` — Research stance on Preview 1 JSON, Zig ergonomics, and ABI caution.

### Baseline Evidence
- `.planning/milestones/v1.22-REQUIREMENTS.md` — v1.22 baseline and non-goals.
- `.planning/milestones/v1.22-ROADMAP.md` — v1.22 completed phase structure.
- `.planning/milestones/v1.22-VERIFY-WORK.md` — Verification caveat that full signed-in proof was not rerun.
- `.planning/milestones/v1.22-MILESTONE-AUDIT.md` — Audit result and residual risk.
- `.planning/artifacts/v1.22-wasm-wasi-hardening-evidence.json` — 19/19 hardening probe floor.
- `.planning/artifacts/v1.22-zig-readiness-evidence.json` — Zig toolchain/artifact/runtime readiness floor.
- `.planning/artifacts/v1.22-promotion-decision.md` — Conservative non-promotion baseline.
- `.planning/artifacts/v1.22-abi-evolution-decision.md` — Preview 1 JSON remains active ABI.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/evaluate-wasm-wasi-runtime.ts`: Existing evidence generator for WASM/WASI hardening, Zig readiness, ABI decision, and promotion decision artifacts.
- `packages/runtime-wasm-wasi/src/metadata.ts`: Source of Rust/Zig runtime metadata, target triples, adapter id, and package mode.
- `packages/spec/src/runtime.ts`: Runtime registry and product semantics are the canonical place to validate language labels and counted eligibility.

### Established Patterns
- Evidence artifacts live under `.planning/artifacts/` with versioned JSON/Markdown pairs when machine-readable checks matter.
- Promotion decisions are explicit Markdown artifacts, not implied by passing tests.
- Runtime proof language distinguishes beta/candidate readiness from production sandbox certification.

### Integration Points
- Later phases should consume Phase 156 criteria rather than redefine beta semantics.
- Phase 163 should cite this phase when making the final split promotion decision.

</code_context>

<specifics>
## Specific Ideas

Use "non-counted exhibition beta" as the exact product phrase. Do not shorten to "beta" in user-facing or planning-critical contexts unless the sentence also preserves the non-counted exhibition boundary.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 156-Baseline, Beta Criteria, and Regression Floor*
*Context gathered: 2026-05-25*
