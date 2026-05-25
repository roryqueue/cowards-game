# Phase 111: Strategy Artifact Language Metadata and Eligibility - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 111 extends Strategy Revision artifact metadata so JS/TS and Python revisions can be represented under the same immutable artifact model. It must add language/runtime/package/compile/validation/eligibility metadata without weakening JS/TS support, source privacy, artifact immutability, or counted eligibility semantics.

This phase does not execute Python, implement full Workshop UX, or allow Python in ranked/ladder counted play.

</domain>

<decisions>
## Implementation Decisions

### Artifact Model
- **D-01:** Extend the existing StrategyRevision and StrategyArtifact model rather than adding Python-only parallel structures.
- **D-02:** Represent language id/version, runtime target, adapter version, source format, package metadata, compile metadata, validation status, immutable artifact hash, compatibility key, and eligibility flags in the shared artifact surface.
- **D-03:** Keep JS/TS artifact semantics intact and backward-compatible where possible.

### Immutable Hash And Compatibility
- **D-04:** Artifact hash and behavior compatibility keys must include behavior-significant language, runtime, package, compile, and validation metadata.
- **D-05:** JS/TS and Python revisions must not collide or compare as compatible unless their metadata and behavior contracts genuinely match.

### Eligibility And Public Labels
- **D-06:** Python artifacts are eligible only for experimental non-counted Workshop/exhibition proof paths in v1.17.
- **D-07:** JS/TS counted eligibility remains intact through the existing isolated runtime support.
- **D-08:** Public labels may expose safe language/runtime/experimental/non-counted labels, but not source, memory, objectives, stack, stderr, host paths, package paths, tokens, DB DSNs, or private runtime internals.

### the agent's Discretion
The agent may choose the exact DTO field grouping, schema names, and migration helpers, provided public output remains source-free and existing JS/TS revisions remain usable.

</decisions>

<specifics>
## Specific Ideas

The user confirmed the default for artifact work: extend existing contracts, include behavior-significant metadata in hashes/compatibility, and keep public labels safe but visible enough for users to understand experimental Python/non-counted status.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - ART requirements.
- `.planning/ROADMAP.md` - Phase 111 scope and success criteria.
- `.planning/phases/110-broker-registry-baseline-and-contract-hardening/110-CONTEXT.md` - Broker and registry decisions that Phase 111 consumes.

### Existing Artifact Baseline
- `.planning/milestones/v1.14-ROADMAP.md` - Generic Strategy Artifact and runtime boundary contract milestone.
- `.planning/milestones/v1.14-REQUIREMENTS.md` - Archived artifact requirements.
- `.planning/artifacts/v1.14-runtime-abi-v1-14.md` - Runtime ABI baseline if present.
- `.planning/artifacts/v1.16-runtime-service-boundary.json` - v1.16 runtime boundary baseline.

### Source Specs And Non-Negotiables
- `AGENTS.md` - Strategy Revision immutability and public replay privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical replay and Strategy terminology.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/types.ts`: StrategyRevision, StrategyArtifact, source format, and public DTO types.
- `packages/spec/src/runtime.ts`: Runtime language and adapter metadata seed.
- `packages/persistence/src/workshop.ts`: Revision construction and validation path.
- `packages/persistence/src/competition.ts`: MatchSet and eligibility-related persistence behavior.
- `apps/web/app/workshop/server.ts`: Workshop-facing revision data shape.

### Established Patterns
- Source privacy is enforced through owner-only source surfaces and public summaries.
- Compatibility keys already exist and should be extended rather than bypassed.
- Match eligibility must be explicit; Python cannot inherit counted eligibility by accident.

### Integration Points
- Phase 112 will use these metadata fields for Python validation reports.
- Phase 113 will use runtime metadata for broker selection.
- Phase 114 will use eligibility flags for non-counted MatchSet behavior.

</code_context>

<deferred>
## Deferred Ideas

- Python counted/ranked eligibility.
- Broad multi-language product support.
- Dependency lockfiles or package marketplace metadata.

</deferred>

---

*Phase: 111-strategy-artifact-language-metadata-and-eligibility*
*Context gathered: 2026-05-25*
