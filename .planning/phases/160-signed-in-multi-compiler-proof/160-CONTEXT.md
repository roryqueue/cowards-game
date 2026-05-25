# Phase 160: Signed-In Multi-Compiler Proof - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Run the real signed-in multi-compiler proof for v1.23: save JS/TS, Rust, and Zig Strategy Revisions and run the required non-counted exhibition MatchSets through the live local product path. This phase proves end-to-end behavior; it should not redesign UX labels, expand runtime hardening, or make final promotion decisions.

</domain>

<decisions>
## Implementation Decisions

### Proof Shape
- **D-01:** The proof must use a signed-in account and account-owned immutable Strategy Revisions, not fixture-only or anonymous-only shortcuts.
- **D-02:** Required saved revisions are exactly one JS/TS Strategy Revision, one Rust WASM/WASI Strategy Revision, and one Zig WASM/WASI Strategy Revision.
- **D-03:** Required MatchSets are JS/TS-vs-Rust, Rust-vs-Rust, Rust-vs-Zig, and Zig-vs-Zig non-counted exhibitions.
- **D-04:** Result pages and replay pages must be opened for proof evidence, with MatchSet ids and replay links recorded.

### Failure Policy
- **D-05:** If Rust-vs-Zig or Zig-vs-Zig cannot complete because Zig compile/runtime/helper evidence fails, record a fail-loud proof artifact and block Zig beta. Do not substitute JS/TS, Rust, or source execution.
- **D-06:** JS/TS counted support must be checked separately from non-counted exhibitions so the proof cannot regress the counted path.
- **D-07:** The proof should distinguish product guardrail failures, Strategy runtime violations, system/runtime-service failures, and proof harness failures.

### Evidence and Privacy
- **D-08:** Proof artifacts may record public ids, statuses, routes, language/runtime labels, artifact hashes, and public-safe evidence summaries.
- **D-09:** Proof artifacts must not record Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, tokens, cookies, DB DSNs, host paths, or private runtime internals.

### the agent's Discretion
- The planner may choose browser automation, API-backed setup plus browser verification, or a hybrid, as long as the proof is signed-in and opens result/replay pages.
- The planner may bound proof retries to avoid unbounded local runs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Beta gate language.
- `.planning/phases/158-rust-zig-beta-readiness-hardening-gates/158-CONTEXT.md` — Hardening preconditions.
- `.planning/phases/159-abi-proof-spike-json-vs-direct-exports-vs-component-model-wit/159-CONTEXT.md` — Active ABI boundary.

### Existing Proofs
- `.planning/artifacts/v1.21-signed-in-rust-exhibition-proof.json` — Prior signed-in Rust proof shape.
- `.planning/artifacts/v1.21-signed-in-rust-exhibition-proof.md` — Human-readable Rust proof summary.
- `.planning/milestones/v1.22-VERIFY-WORK.md` — States full signed-in JS/TS/Rust/Zig proof was not rerun.
- `.planning/artifacts/v1.22-workshop-zig-alpha-smoke.png` — v1.22 Workshop Zig smoke evidence.

### Code
- `apps/web/app/workshop/server.ts` — Workshop/account validation and save integration.
- `apps/web/app/workshop/workshop-client.tsx` — Workshop UI entry for source format selection and validation.
- `apps/go-backend/runtime_service_client.go` — Go validation/execution calls to runtime-service.
- `apps/go-backend/orchestrator.go` — Match job orchestration through runtime-service.
- `apps/go-backend/matchset_status.go` — MatchSet scoring/status refresh.
- `apps/runtime-service/src/server.ts` — `/validate-strategy` and `/execute-match`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.21 proof artifacts demonstrate how to record account/revision/MatchSet proof without exposing private Strategy data.
- Go `validateStrategy` already routes Rust/Zig source validation to runtime-service.
- Runtime-service `/validate-strategy` returns runtime metadata and artifact metadata without needing Go/web to compile.

### Established Patterns
- Proof artifacts should record observed terminal public DTO status, not just creation responses.
- Proof runs should use bounded cycles/retries and avoid active duplicate exhibition guardrail surprises.
- Background Go orchestration and runtime-service budgets must be aligned for long non-JS MatchSets.

### Integration Points
- Phase 161 consumes result/replay page evidence for label/privacy review.
- Phase 163 consumes this phase as the main promotion gate.

</code_context>

<specifics>
## Specific Ideas

The proof should feel like a real user journey: edit/save revisions, create exhibitions, wait for completion, open result, open replay, and record what a public observer can safely see.

</specifics>

<deferred>
## Deferred Ideas

- Durable ranked/ladder proof.
- More than the four required MatchSet shapes unless a failure needs a bounded rerun.

</deferred>

---

*Phase: 160-Signed-In Multi-Compiler Proof*
*Context gathered: 2026-05-25*
