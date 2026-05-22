# Phase 46: Strategy Runtime ABI - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 46 defines the language-neutral Strategy execution protocol that current JS/TS and future Python, Go, Rust, or other Strategy runtimes must speak. It should formalize request/response envelopes, source/package metadata, limits, deterministic capability restrictions, compatibility checks, runtime violations, and system failures without enabling production multi-language support yet.

</domain>

<decisions>
## Implementation Decisions

### ABI Envelope Shape
- **D-01:** Define a full runtime ABI envelope around existing canonical game inputs. The `input` payload must remain the existing `StrategyInput` or `SoldierBrainInput`; the envelope carries ABI version, method, language, adapter metadata, source/package metadata, execution limits, compatibility versions, and capability declarations.
- **D-02:** Use one canonical discriminated ABI union keyed by method, with method-specific exported aliases/schemas for implementation ergonomics.
- **D-03:** Do not keep the current JS-shaped `{ source, methodName, input }` subprocess IPC as the long-term ABI; it may be adapted internally but should not remain the contract.

### Source And Package Metadata
- **D-04:** ABI metadata should include source plus package metadata now, while package execution remains disabled by v1.7 policy unless a later experimental adapter explicitly opts in.
- **D-05:** Required minimal provenance metadata: language id/version, source hash, source bytes, entrypoint, package mode, adapter id/version, ABI version, rules/spec compatibility, engine version, and other behavior-significant compatibility versions.
- **D-06:** Dependency list, lockfile hash, package manifest hash, and package policy fields are optional when `packageMode: "none"` and required only when packages exist.
- **D-07:** The metadata schema is future-proofing, not permission to install packages or resolve dependencies in v1.7.

### Version Negotiation And Compatibility
- **D-08:** Runtime execution fails closed before Strategy code runs when behavior-significant compatibility does not match host support.
- **D-09:** Behavior-significant fields include ABI version, adapter id/version, language id/version when behavior-significant, rules/spec version, engine version, required capabilities, and limits.
- **D-10:** Descriptive fields such as labels, docs URLs, production-readiness notes, and display copy may vary without blocking execution.
- **D-11:** v1.7 defines no compatibility ranges. Exact behavior-significant version matching is required until golden parity evidence justifies widening later.

### Failure Taxonomy
- **D-12:** Preserve and formalize separate `runtimeViolation` and `systemFailure` envelopes.
- **D-13:** Strategy-accountable runtime violations include invalid output, timeout, thrown exception, forbidden capability, and oversized output.
- **D-14:** Host/infrastructure-accountable system failures include malformed IPC, spawn failure, stdio cap exceeded, subprocess exit, and subprocess signal.
- **D-15:** Timeout remains a Strategy runtime violation when Strategy execution exceeds its budget.
- **D-16:** System failures must not be scored, projected, or explained as Strategy weakness.
- **D-17:** Failure envelopes should expose public-safe code/message fields and explicitly private diagnostics fields. Public replay, MatchSet, analytics, and export DTOs must never expose private diagnostics, stack traces, stderr, source, memory, objective payloads, or runtime internals by default.

### Carried Forward From Phase 45
- **D-18:** `@cowards/spec` remains canonical for ABI schemas, DTOs, compatibility versions, and privacy checks.
- **D-19:** Secondary documents may describe the ABI, but the typed/schema contract is the source of truth.
- **D-20:** Public and private/owner/admin fields must be separated by schema, not optional private fields on public DTOs.

### the agent's Discretion
- The planner may choose exact type/schema names, provided they clearly distinguish ABI envelopes, runtime violations, system failures, metadata, capabilities, and diagnostics.
- The planner may decide whether current `runtime-js` subprocess IPC adapts to the ABI in this phase or only receives compatibility tests/documentation, provided the ABI contract itself is concrete and testable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — v1.7 goal, constraints, and non-negotiable runtime isolation posture.
- `.planning/REQUIREMENTS.md` — Phase 46 requirements `ABI-01` through `ABI-06`.
- `.planning/ROADMAP.md` — Phase 46 goal, success criteria, canonical refs, and sequencing before adapter registry/spikes.
- `.planning/research/SUMMARY.md` — Contract-first, parity-first research synthesis.
- `.planning/research/STACK.md` — Runtime stack additions and Python subprocess/Go JSON cautions.
- `.planning/research/PITFALLS.md` — Runtime ABI drift, shell/environment hazards, and false confidence warnings.
- `.planning/phases/45-service-boundary-contract/45-CONTEXT.md` — Carried-forward contract source of truth, structured errors, and privacy schema decisions.

### Runtime And Spec Code
- `packages/spec/src/types.ts` — Existing `StrategyInput`, `SoldierBrainInput`, `StrategyResult`, `SoldierBrainResult`, `RuntimeViolation`, memory types, and current `StrategyRuntimeName`.
- `packages/spec/src/schemas.ts` — Existing zod schemas for Strategy inputs/results, memory limits, objective limits, RuntimeViolation type, and Strategy Revision schema.
- `packages/spec/src/constants.ts` — Existing source, memory, and objective byte limits.
- `packages/runtime-js/src/adapter.ts` — Current `StrategyExecutionAdapter`, metadata, runtime controls, readiness, and adapter request shape.
- `packages/runtime-js/src/subprocess-ipc.ts` — Current subprocess request/response guards and system failure codes.
- `packages/runtime-js/src/subprocess-adapter.ts` — Current Node subprocess execution, timeout, stdio caps, spawn/signal/exit/system failure handling.
- `packages/runtime-js/src/validation.ts` — Current JS/TS source validation and forbidden capability patterns.
- `packages/runtime-js/src/revision.ts` — Current immutable JS/TS Strategy Revision construction and runtime metadata.

### Primary Source Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical Strategy API concepts and deterministic Match constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Runtime isolation and architecture constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `StrategyInputSchema`, `SoldierBrainInputSchema`, `StrategyResultSchema`, and `SoldierBrainResultSchema` can be wrapped inside ABI envelopes rather than redefined.
- Current `RuntimeViolation` already has stable Strategy-accountable categories.
- Current `SubprocessSystemFailure` already separates malformed IPC, spawn failure, stdio cap, subprocess exit, and signal from gameplay violations.
- Current adapter metadata has useful fields for readiness, isolation boundary, runtime controls, timeout, output caps, environment, execArgv, filesystem, network, and shell.

### Established Patterns
- Strategy source is immutable once submitted for Match or MatchSet play.
- Runtime execution must not happen in web/API processes.
- Runtime public outputs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private internals.
- Host capability restrictions include no system time, randomness, filesystem, network, environment, shell, database, package installation, or live model inference.

### Integration Points
- Add ABI schemas and types to `packages/spec`.
- Adapt or validate current `packages/runtime-js` subprocess IPC against ABI semantics.
- Feed ABI metadata into Phase 48 adapter registry and Strategy Revision metadata work.
- Feed failure fixtures into Phase 47 golden parity harness.

</code_context>

<specifics>
## Specific Ideas

- Treat package metadata as a sealed placeholder in v1.7: visible in the contract, rejected or disabled by host policy unless an experimental adapter explicitly owns it.
- Keep execution rejection before Strategy code runs for behavior-significant mismatches.
- Use exact versions only; avoid ranges until cross-language golden parity can prove safe compatibility.

</specifics>

<deferred>
## Deferred Ideas

- Compatibility ranges are deferred until after golden parity evidence exists.
- Full package dependency installation/resolution is deferred beyond v1.7.
- Production multi-language runtime support is deferred; Phase 46 defines the ABI, and Phase 49 may add only an experimental spike.
- Production-grade hostile-code sandbox replacement is deferred to a later milestone.

</deferred>

---

*Phase: 46-Strategy Runtime ABI*
*Context gathered: 2026-05-22*
