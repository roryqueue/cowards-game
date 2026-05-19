# Phase 9: Strict Chronicle Grammar and Compatibility - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds strict Chronicle grammar and compatibility validation so invalid, impossible, private-leaking, or unsupported Chronicles fail before replay rendering. It covers semantic event windows, context/payload consistency, snapshot boundary validation, version compatibility behavior, privacy checks, and negative fixtures.

</domain>

<decisions>
## Implementation Decisions

### Grammar Strictness
- **D-01:** Chronicle validation should be strict by default. Validated Chronicles must follow legal Match/Round/Activation/Cycle windows.
- **D-02:** Invalid or impossible sequences should fail closed before replay rendering. Compatibility escape hatches must be explicit and version-gated, not silent best-effort rendering.

### Board Transition Validation
- **D-03:** Validate impossible board transitions where snapshots/events provide enough information to prove impossibility.
- **D-04:** The validator should not become a full second engine and must not re-run Strategy source. It should use Chronicle data, snapshots, and event semantics.

### Compatibility Policy
- **D-05:** Support `chronicle-v1` and current compatibility versions.
- **D-06:** Unsupported future or legacy versions should produce explicit unsupported-version failure states until a migration exists.

### Privacy Tests
- **D-07:** Public projection privacy is a hard gate, not advisory coverage.
- **D-08:** Tests must prove public projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and private runtime details.
- **D-09:** Add negative fixtures that intentionally try to leak private data.

### Error Reporting
- **D-10:** Chronicle validation should return stable error codes for tests/planners and clear messages suitable for replay unavailable screens.
- **D-11:** Raw Zod-only messages should not be the primary user-facing failure output.

### the agent's Discretion
- The planner may choose the grammar validator internals, state-machine representation, fixture layout, and exact error code names as long as the behavior above is preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone Context
- `.planning/PROJECT.md` — Current v1.1 goal and constraints.
- `.planning/REQUIREMENTS.md` — Phase 9 requirements GRAM-01 through GRAM-08.
- `.planning/ROADMAP.md` — Phase 9 goal, success criteria, and phase boundary.
- `.planning/research/SUMMARY.md` — v1.1 research summary.
- `.planning/research/STACK.md` — Chronicle grammar and compatibility findings.
- `.planning/research/ARCHITECTURE.md` — Proposed validator layering.
- `.planning/research/PITFALLS.md` — Chronicle/schema pitfalls and privacy risks.
- `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md` — Fixture legality and failure-diagnostic decisions that Phase 9 builds on.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical Match/Round/Activation/Cycle/Action/Advance terminology and rule behavior.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Chronicle/replay architecture constraints.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/schemas.ts`: Owns `ChronicleEventSchema`, event payload discriminated unions, snapshot schemas, validation error codes, and compatibility versions.
- `packages/replay/src/validate.ts`: Current validator handles version, sequence contiguity, required events, snapshots, and hash checks; this is the natural place to add semantic grammar.
- `packages/replay/src/reconstruct.ts`: Existing reconstruction logic can inform snapshot/transition checks without re-running Strategy source.
- `packages/replay/src/project.ts`: Public/owner projection logic and privacy filtering are the privacy test target.
- `packages/replay/src/validate.test.ts` and `packages/replay/src/project.test.ts`: Existing test homes for validation and projection coverage.

### Established Patterns
- Zod shape parsing happens before semantic validation.
- `ChronicleValidationResult` already has stable `ok` discrimination and error codes.
- Public projection currently sanitizes private payload keys and exposes owner data only through explicit owner projection.

### Integration Points
- Replay loading in `apps/web/app/matches/server.ts` and replay unavailable UI should consume explicit validation failure categories.
- Phase 8 generated fixtures and negative fixtures should exercise the same validation path.
</code_context>

<specifics>
## Specific Ideas

- Fail closed on unsupported version or illegal grammar.
- Validate impossible transitions only when Chronicle data is sufficient; avoid implementing a shadow engine.
- Negative privacy fixtures should be deliberately hostile.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 9-Strict Chronicle Grammar and Compatibility*
*Context gathered: 2026-05-18*
