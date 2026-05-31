# v1.33 Feature Research

## Table Stakes

- TypeScript artifact proof binds source hash/bytes and artifact hash/bytes.
- TypeScript runtime execution uses validated artifacts and fails closed on stale/missing/mismatched/unverifiable artifacts.
- Python artifact proof binds source hash/bytes and artifact hash/bytes with interpreter/version metadata.
- Python constrained runtime policy remains intact and public claims stay honest.
- TinyGo and Grain each produce spike evidence: compile viability, ABI compatibility, import audit, size/latency notes, deterministic behavior checks, failure taxonomy, and recommendation.
- Docs/UI distinguish supported artifact-proven source languages, supported WASM/WASI artifact-backed languages, and spike-only candidates.

## Differentiators

- Provider evidence becomes comparable across all four production languages while still preserving the meaningful isolation difference between source-language artifacts and WASM/WASI artifacts.
- Spike recommendations include enough operational evidence to decide whether TinyGo or Grain deserves a future production support milestone.

## Anti-Features

- Label-only language promotion.
- Public exposure of Strategy source or memory.
- Silent fallback to mutable source or another runtime.
- Overclaiming Python or TypeScript artifact provenance as sandbox certification.
- Enabling TinyGo or Grain in counted play during spike work.
