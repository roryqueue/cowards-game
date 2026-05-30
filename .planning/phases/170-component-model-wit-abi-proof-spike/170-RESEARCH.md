# Phase 170 Research: Component Model/WIT ABI Proof Spike

## Sources Read

- AGENTS.md
- .planning/PROJECT.md
- .planning/ROADMAP.md
- .planning/STATE.md
- .planning/REQUIREMENTS.md
- .planning/research/SUMMARY.md
- .planning/research/v1.24-SUMMARY.md
- v1.23 milestone and artifact baselines
- Runtime packages and boundary monitor scripts touched by v1.24

## Findings

- v1.23 is the baseline and remains archived; v1.24 evidence reuses it without promoting Rust, Zig, Python, or WASM/WASI to counted play.
- The active execution ABI remains WASI Preview 1 stdin/stdout JSON. Direct exports and Component Model/WIT are evidence spikes only.
- Public-safe evidence must avoid private runtime data and should distinguish local policy contracts from live proof.
- Component Model/WIT is recorded as a future typed ABI candidate with minimal world shape, tooling gaps, and no Match execution eligibility.

## Uncertainties Resolved

- Production sandbox certification is not claimed.
- JS/TS remains the counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta.
- Go/runtime-service ownership stays unchanged.
