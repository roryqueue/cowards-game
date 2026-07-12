# Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase defines the canonical JSON profile, equivalent runtime/preflight budget contracts, end-to-end three-way failure ownership, and exact source/artifact/runtime/toolchain/evidence identity chain required before four-language certification. It does not build the full conformance corpus or Chronicle grammar.

</domain>

<decisions>
## Implementation Decisions

### Canonical JSON profile
- **D-01:** Reject duplicate object keys from raw bytes before host-language object conversion in every input, output, memory, objective, manifest, and evidence envelope.
- **D-02:** Allow finite IEEE-754 binary64 numbers; reject NaN/infinities; require integer values within ±(2^53−1); normalize negative zero to `0`; use one shortest-round-trip decimal encoding. Domain schemas may be stricter.
- **D-03:** Require valid UTF-8 and Unicode scalar sequences, preserve exact strings without NFC/NFD normalization, and sort object keys lexicographically by UTF-8 bytes for canonical serialization/hashing.
- **D-04:** Define one canonical parser ceiling for bytes, depth, node count, string bytes, array entries, and object entries. Specific fields such as StrategyMemory, SoldierMemory, objectives, outputs, and manifests may declare lower documented caps.

### Runtime budget contract
- **D-05:** Every counted lane enforces the same named budget vector: wall deadline, compute/fuel allowance, memory ceiling, output-byte ceiling, and process/capability limits. A lane unable to prove equivalent enforcement remains uncertified.
- **D-06:** Each `selectActivations` and `SoldierBrain` invocation has an explicit budget, plus a cumulative Match ceiling. Both are carried in the signed execution request.
- **D-07:** Proven Strategy-caused compute, memory, output, or process exhaustion is a player violation. Host overload, unavailable enforcement, accounting failure, or ambiguous attribution is a no-mutation system failure.
- **D-08:** Source validation, compilation, artifact validation, and conformance use separate explicit preflight budgets. Invalid source/artifact is a submission violation; failed/unavailable infrastructure is a system failure. Preflight never consumes Match budget.

### Failure ownership taxonomy
- **D-09:** A proven Strategy-code exception inside a healthy invocation is a player violation; adapter, interpreter, Wasmtime, transport, or host crashes are system failures.
- **D-10:** The adapter owns the authenticated outer transport envelope: missing, truncated, unauthenticated, or undecodable envelopes are system failures. The Strategy owns the decoded payload: duplicate-key, non-canonical, schema-invalid, or illegal payloads are player violations.
- **D-11:** A player violation discards every proposed memory and response field, preserves prior memory, and applies only the canonical v1.4 gameplay consequence.
- **D-12:** Retry system failures only from the identical pre-transition state with the same request identity and budgets under bounded Go-owned policy. Never automatically retry player violations.

### Source/artifact identity chain
- **D-13:** Original source bytes and their domain hash define immutable revision identity. Normalized bytes are a separately hashed derivative with explicit normalization policy/version and line-ending facts; artifacts bind both domains.
- **D-14:** Use one specified hash algorithm with fixed domain tags and canonical length-delimited encoding for original source, normalized source, artifact, manifest, semantic tuple, corpus, runtime/toolchain identity, and evidence bundle.
- **D-15:** Counted runtime/toolchain identity binds immutable executable/image digest, reported version, target/ABI, compiler flags, adapter build, standard library/sysroot inputs, containment policy, and every behavior-significant execution setting. Public output exposes safe IDs only.
- **D-16:** The evidence manifest is a closed validated hash graph from source domains through artifact, toolchain/runtime, tuple, policy/corpus, and conformance/containment results. Reject missing, orphaned, and mismatched links. Include trusted pipeline attestation; use signatures only where a managed signing identity exists.

### the agent's Discretion
- Exact numerical ceilings and budget values are for research/planning to derive from existing limits and adversarial tests, then freeze before conformance.
- Exact canonical encoding library/module layout and typed code names are flexible within the locked cross-language semantics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — Runtime, privacy, determinism, and package-free boundaries.
- `.planning/REQUIREMENTS.md` — RABI-01 through RABI-08.
- `.planning/ROADMAP.md` — Phase 258 boundary and success criteria.
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` — Evidence-derived eligibility, exact tuple, and public/operator split.
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — Yield/resume runtime effects, unchanged-state system failures, and canonical penalties.
- `.planning/research/SUMMARY.md` — Canonical JSON, failure, budget, and identity findings.
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — F-02, F-03, F-13, F-14, and F-15.
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` — Deep-memory recursion regression.
- `CowardsGame_Technical_Architecture_Spec_v1.4.md` — Historical Strategy/runtime boundary.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/schemas.ts`: Existing recursive JSON schemas and runtime envelopes are the convergence point for iterative canonical parsing and typed limits.
- `packages/spec/src/runtime.ts`: Existing three-way service vocabulary, limits, compatibility metadata, evidence classes, and provider registry can be versioned rather than replaced.
- `packages/runtime-js/src/sandbox-evaluation.ts`: Existing hostile probes already distinguish runtime violations and system failures and inventory wall/memory/output/process controls.
- `packages/runtime-python/src/python_runtime_host.py`: Existing envelope production reveals the adapter/payload ownership boundary.
- `packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts`: Existing WASI envelope, timeout, hashing, and normalization paths need classification parity.
- `packages/runtime-wasm-wasi/src/validation.ts`: Existing source/artifact/compiler evidence is the base for the closed identity manifest.

### Established Patterns
- Runtime-service already redacts diagnostics and separates public messages from private details.
- Provider proof already binds source and artifact hashes, but normalization and toolchain closure are inconsistent across lanes.
- Existing adapters have differing timeout and failure normalization; the canonical contract must own semantics rather than each adapter.

### Integration Points
- Raw-byte canonical parsing must occur before existing Zod shape validation.
- Execution requests carry semantic tuple, budget vector, request identity, and evidence closure.
- Adapters return the authenticated outer envelope without converting system failures into player violations.
- Counted eligibility consumes the closed evidence manifest designed here and executed in Phase 259.

</code_context>

<specifics>
## Specific Ideas

- Separate semantic tuple versioning from executable identity invalidation.
- Treat JSON, identity, and budgets as one ABI contract rather than three documentation sections.
- A proof pipeline attests the closed graph; public surfaces expose safe identifiers, never the graph's sensitive payloads.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Context gathered: 2026-07-12*
