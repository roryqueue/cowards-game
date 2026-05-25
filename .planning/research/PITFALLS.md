# Pitfalls Research: v1.17 Python Strategy Runtime Pilot

**Project:** Coward's Game
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Researched:** 2026-05-24

## Common Pitfalls

### Treating Python Subprocess As A Sandbox

Subprocess execution, timeout APIs, and Python isolated/safe-path flags are useful hardening tools, but they are not a production hostile-code sandbox. v1.17 should keep Python experimental and non-counted.

**Prevention:** Mark Python runtime isolation promotion state as evidence-only; keep production sandbox promotion out of scope; add monitors that fail if Python claims counted eligibility.

### Building Python Directly Into Go Or Web

Python validation or execution inside Go or Next.js would violate the v1.16 boundary and make hostile code easier to route around the broker.

**Prevention:** Require validation to be parse/compile/policy only where run outside runtime; execute Strategy methods only inside runtime implementation; add source import/execution monitors.

### Letting Runtime Service Become A Backend

A language runtime can accidentally gain backend authority by reading DB state, claiming jobs, persisting Chronicles, refreshing scoring, or serving public evidence.

**Prevention:** Carry v1.16 authority policy forward; extend runtime registry and topology monitors; reject filesystem/network/database/job/route imports from runtime implementations.

### Silent Fallback

If Python fails and the system falls back to JS/TS, TypeScript backend, or Go execution, evidence becomes untrustworthy.

**Prevention:** Fail closed on stopped runtime, unknown adapter, unsupported artifact, ABI drift, malformed response, and registry mismatch.

### Privacy Leaks In Diagnostics

Python exceptions often contain stack frames, file paths, stderr, source snippets, package paths, and environment hints.

**Prevention:** Redact diagnostics by default and scan public outputs for source, memories, objectives, owner debug, stack, stderr, paths, tokens, DB DSNs, package paths, and runtime internals.

### Premature Product Promotion

A public language picker or counted eligibility label could imply Python is production-supported.

**Prevention:** Use experimental/non-counted labels; scope proof to Workshop or exhibition-style MatchSets; keep ranked/ladder gates closed.

### Artifact Identity Drift

If language/runtime/package/compile metadata is not in hashes and compatibility keys, Python and JS/TS artifacts may compare incorrectly.

**Prevention:** Include behavior-significant metadata in immutable artifact hashes and runtime compatibility keys.

## Phase Placement

- Pitfalls around broker drift belong in Phase 110.
- Artifact identity pitfalls belong in Phase 111.
- Validation and diagnostics pitfalls belong in Phase 112.
- Execution and sandbox pitfalls belong in Phase 113.
- Counted eligibility and fallback pitfalls belong in Phase 114.
- User proof and replay realism pitfalls belong in Phase 115.
- Cross-cutting monitor/privacy pitfalls belong in Phase 116.
