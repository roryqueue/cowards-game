# Phase 48: Runtime Adapter Registry - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 48 adds first-class Strategy language and runtime adapter metadata, registry records, Strategy Revision metadata migration, and compatibility checks. It should make future multi-language runtimes visible to the contract without making experimental adapters available for normal public MatchSet play.

</domain>

<decisions>
## Implementation Decisions

### Registry Scope And Owner
- **D-01:** `@cowards/spec` owns runtime registry schemas and baseline registry records.
- **D-02:** Runtime implementation packages such as `@cowards/runtime-js` still own concrete execution adapters.
- **D-03:** The registry must model language records separately from adapter records. Adapters declare the language records they support.
- **D-04:** Do not center the registry in `@cowards/runtime-js`; that would make JS the wrong source of truth for future Python/Go/Rust metadata.

### Strategy Revision Metadata Migration
- **D-05:** Phase 48 should replace the old `runtime: { name: "runtime-js", version }` shape with new first-class language, adapter, ABI, package, and compatibility metadata.
- **D-06:** Migration policy is read legacy, write new. Readers can accept old `runtime.name/version` records and normalize them to the new metadata shape, but newly built Strategy Revisions should use only the new shape.
- **D-07:** Do not dual-write old and new runtime metadata long term.
- **D-08:** Existing JS/TS behavior must remain stable after metadata migration.
- **D-09:** Stored/demo/archive revisions should not become unusable solely because they were written before Phase 48.

### Compatibility Key Strictness
- **D-10:** MatchSet, analytics, and gauntlet compatibility keys include behavior-significant ids, versions, capabilities, and limits only.
- **D-11:** Compatibility-significant fields include language id/version, adapter id/version, ABI version, package mode, source hash, rules/spec version, engine version, Chronicle version, scoring policy, seeds, preset, entrants/opponents, required capabilities, and behavior-affecting limits.
- **D-12:** Behavior-affecting limits include timeout, memory/resource limits, output caps, package policy, environment policy, filesystem/network/shell policy, and deterministic capability restrictions.
- **D-13:** Exclude display-only metadata from compatibility hashes and equivalence checks: labels, readiness notes, docs URLs, display names, descriptions, and other non-behavioral copy.

### Experimental Adapter Policy
- **D-14:** Experimental adapters are registry-visible but disabled for normal play.
- **D-15:** Experimental adapters may be used through dev/test or explicit experimental paths only.
- **D-16:** Experimental adapter results are dev/test only and must not become public counted MatchSet, ladder, analytics, or gauntlet evidence by default.
- **D-17:** Do not add a normal user-facing runtime selector in Phase 48.

### Carried Forward From Earlier Phases
- **D-18:** Phase 46 exact behavior-significant version matching applies; no compatibility ranges in v1.7.
- **D-19:** Source plus package metadata exists in the contract, but package execution remains disabled by v1.7 policy unless an experimental adapter explicitly owns it.
- **D-20:** Public/private privacy boundaries remain strict when registry metadata appears in public DTOs.

### the agent's Discretion
- The planner may choose exact schema/type names and registry file layout inside `@cowards/spec`.
- The planner may choose the details of the legacy normalization helper, provided it does not write old metadata for new revisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — v1.7 goal and runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 48 requirements `REG-01` through `REG-05`.
- `.planning/ROADMAP.md` — Phase 48 goal, success criteria, canonical refs, and sequencing before the non-JS runtime spike.
- `.planning/research/SUMMARY.md` — Adapter registry and compatibility research synthesis.
- `.planning/research/ARCHITECTURE.md` — Existing runtime/revision integration points.
- `.planning/phases/46-strategy-runtime-abi/46-CONTEXT.md` — ABI metadata, exact compatibility, source/package, and failure taxonomy decisions.
- `.planning/phases/47-golden-parity-harness/47-CONTEXT.md` — Golden parity expectations that should cover metadata migration and compatibility behavior.

### Runtime And Revision Code
- `packages/spec/src/types.ts` — Current `StrategyRuntimeName`, `StrategyRevision`, compatibility/version types, and fields that need migration.
- `packages/spec/src/schemas.ts` — Current Strategy Revision schema and compatibility schemas.
- `packages/spec/src/versions.ts` — Existing compatibility version constants.
- `packages/runtime-js/src/adapter.ts` — Existing adapter metadata and runtime controls.
- `packages/runtime-js/src/revision.ts` — Current Strategy Revision builder that writes `runtime.name/version`.
- `packages/runtime-js/src/hash.ts` — Strategy Revision id/hash inputs that may need metadata-aware updates.
- `packages/runtime-js/src/validation.ts` — Runtime/spec/engine validation behavior.

### Compatibility Consumers
- `packages/persistence/src/competition.ts` — Existing runtime compatibility checks for entrants and public MatchSet DTOs.
- `packages/persistence/src/ladder.ts` — Existing runtime compatibility checks for ladder entries.
- `packages/persistence/src/workshop-analytics.ts` — Analytics compatibility key/hash and runtime adapter/version fields.
- `packages/persistence/src/account-revisions.ts` — Account revision summary/source persistence mapping.
- `packages/persistence/src/repositories.ts` — Stored revision rows and runtime/engine compatibility persistence mapping.
- `apps/web/app/workshop/workshop-client.tsx` — Current display of runtime/compatibility metadata.
- `apps/web/app/strategies/[strategyId]/page.tsx` — Public Strategy card runtime display.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing `StrategyExecutionAdapterMetadata` already records adapter id, label, readiness, isolation boundary, notes, runtime controls, diagnostics, timeout, output caps, environment, execArgv, filesystem, network, and shell.
- Existing analytics compatibility hashes already exclude display metadata and focus on behavior-significant values.
- Existing persistence checks already reject non-`runtime-js` revisions in competition/ladder contexts; these will need registry-aware replacement.

### Established Patterns
- Compatibility hashes should ignore display-only metadata.
- Strategy Revisions are immutable and content-addressed.
- Public DTOs expose runtime/compatibility summaries, but not private runtime internals.
- Experimental or non-production runtime behavior must not imply official support or counted fairness.

### Integration Points
- `@cowards/spec` gains registry schemas/records and new Strategy Revision metadata schema.
- `@cowards/runtime-js` uses registry metadata for concrete JS/TS adapters.
- Persistence and competition/analytics compatibility code moves from `runtime.name === "runtime-js"` checks toward registry metadata and compatibility key validation.
- Legacy normalization should live near schema parsing or revision mapping so old stored data can be read safely.

</code_context>

<specifics>
## Specific Ideas

- Treat language as distinct from adapter: `javascript`/`typescript` are not the same concept as `runtime-js-worker-thread`, `runtime-js-subprocess`, or `runtime-js-container-subprocess`.
- Include behavior-affecting runtime limits in compatibility, because changing a timeout or memory cap can change Match outcomes.
- Keep experimental runtime evidence out of public counted results in v1.7.

</specifics>

<deferred>
## Deferred Ideas

- Normal user-facing runtime selection is deferred until multiple production-supported runtimes exist.
- Public non-counted experimental runtime displays are deferred; v1.7 keeps experimental results dev/test only.
- Compatibility ranges remain deferred.

</deferred>

---

*Phase: 48-Runtime Adapter Registry*
*Context gathered: 2026-05-22*
