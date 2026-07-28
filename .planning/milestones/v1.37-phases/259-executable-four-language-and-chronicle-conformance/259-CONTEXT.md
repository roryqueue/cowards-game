# Phase 259: Executable Four-Language and Chronicle Conformance - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the immutable executable TypeScript/Python/Rust/Zig corpus and certification system, defines canonical full-trace equality, implements per-slot version-strict Chronicle validation, and proves transition-by-transition reconstruction with exact historical dispatch. Strategy observation changes and Set fairness follow in Phase 260; service/persistence release proof closes in Phase 261.

</domain>

<decisions>
## Implementation Decisions

### Corpus composition and governance
- **D-01:** The versioned mandatory corpus contains hand-authored normative scenarios, deterministic boundary tables, seeded generated/property cases, mutation-kill cases, and positive/negative failure traces.
- **D-02:** Maintain small readable audited fixture Strategy programs in TypeScript, Python, Rust, and Zig, bound to one behavior manifest and expected invocation script. Add raw-envelope probes that bypass Strategy logic to isolate adapters.
- **D-03:** Any case, seed, generator, expected trace, fixture source, or mutation change creates a new corpus version/hash. Retain old manifests/evidence and require reviewed semantic diffs; never update goldens in place.
- **D-04:** No semantic case may be skipped by a counted lane. Containment mechanics may use lane-specific probes only when they prove the same declared capability; an unsupported required capability blocks certification.

### Full-trace comparison oracle
- **D-05:** Each case has a committed reviewed canonical transition/failure trace under an exact semantic tuple. All four real adapters reproduce it; TypeScript is a lane, not a live oracle, and engine changes never silently regenerate expectations.
- **D-06:** Compare canonical bytes/hashes for Strategy outputs, StrategyMemory, SoldierMemory, objectives, transition kinds, lifecycle coordinates, ordered events, state hashes, terminal data, and failure classifications. Exclude wall timing, host paths, raw stderr, and private diagnostics from behavioral equality.
- **D-07:** Negative cases must match result class, stable reason code, failing invocation/transition boundary, state/memory mutation behavior, terminal effect, and retryability. Human messages may differ only through approved projections.
- **D-08:** A mismatch produces a restricted canonical diff and fails/quarantines the lane. If the committed oracle is disputed, suspend the affected case/tuple for review; never use tolerances, majority vote, or automatic regeneration.

### Certification and freshness
- **D-09:** Certification requires three independent complete corpus runs in fresh processes/workspaces under identical identities, producing identical canonical evidence hashes.
- **D-10:** An unavailable compiler/runtime is a system failure and creates no new certificate; no skips or synthetic evidence are allowed. Prior evidence survives only while its exact identity and freshness remain valid.
- **D-11:** Certificates stale immediately when any bound identity, policy, corpus, or semantic tuple changes. Otherwise require complete clean recertification at least every 30 days.
- **D-12:** Promote each lane independently and automatically when its exact complete evidence passes. Do not wait for all four, and do not weaken criteria for any lane.

### Chronicle grammar and historical routing
- **D-13:** Current grammar maintains independent state for every `activationId`: selected/started/open/closed status, actor/player, next expected Cycle, Advance state, terminal reason, and allowed event boundaries, alongside global Phase/Round/initiative state.
- **D-14:** Reconstruction compares transition kind, before/after hashes, events, lifecycle coordinates, and terminal data at every step, then final state/outcome/trace root. Reject the first mismatch with a stable code.
- **D-15:** Parser selection uses the exact persisted tuple/version or Phase 256's read-only authoritative resolver. Ambiguous evidence remains raw and immutable but returns a typed unresolved-version result; never guess, probe newest-to-oldest, or migrate on read.
- **D-16:** New Chronicles accept only current vocabulary/boundaries. Historical parsers accept only their original vocabulary. Runtime-service and persistence run the same semantic validator; replay projection follows validation; no migration relabels historical events as current.

### the agent's Discretion
- Corpus file layout, generator implementation, exact repeat-run isolation mechanism, and stable code names are flexible within these locked evidence semantics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Four-language, historical, privacy, and runtime boundaries.
- `.planning/REQUIREMENTS.md` — CONF-01 through CONF-05 and CHRN-01 through CHRN-06.
- `.planning/ROADMAP.md` — Phase 259 boundary and success criteria.
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` — Quarantine, promotion, exact tuple, and historical resolution.
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — Canonical transition stream, event versioning, and validation semantics.
- `.planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md` — JSON, budgets, failure ownership, identity closure.
- `.planning/research/SUMMARY.md` — Executable full-trace conformance and Chronicle recommendations.
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — F-08, F-09, F-13, and cross-language drift evidence.
- `.planning/artifacts/v2.0-core-rules-audit/README.md` — Current persisted reproduction and suite baseline.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Original per-Cycle scheduling and Backstab boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/replay/src/grammar.ts`: Existing global activation grammar becomes the per-activation state map.
- `packages/replay/src/validate.ts`: Existing version and semantic errors are the shared runtime-service/persistence validator seam.
- `packages/replay/src/reconstruct.ts` and `packages/replay/src/replay-transition.ts`: Existing reconstruction logic can compare canonical transition hashes.
- `packages/runtime-js`, `packages/runtime-python`, `packages/runtime-wasm-wasi`: Real adapters and hostile probes become corpus executors rather than declared parity evidence.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md`: Historical parity artifact is source evidence but not sufficient certification.

### Established Patterns
- Repository scripts already generate hash-checked Go parity fixtures and reject stale generated artifacts.
- Existing replay tests cover grammar, determinism, snapshots, and reconstruction; Phase 259 makes equality transition-complete and version-strict.
- TypeScript worker/service roles are already parity/rollback constrained rather than normal lifecycle owners.

### Integration Points
- A single corpus runner invokes each real adapter with identical manifests and signed budgets.
- Certification artifacts feed Phase 256's evidence-derived counted eligibility.
- Runtime-service and persistence import the same Chronicle semantic validator.
- Public and owner projections consume only successfully version-dispatched, semantically validated Chronicles.

</code_context>

<specifics>
## Specific Ideas

- Separate normative fixture readability from generated breadth, but make both mandatory.
- Treat the committed trace as a reviewed executable specification, not an output cache.
- Use exact per-transition trace hashes to join engine, language, Chronicle, and replay evidence.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 259-executable-four-language-and-chronicle-conformance*
*Context gathered: 2026-07-12*
