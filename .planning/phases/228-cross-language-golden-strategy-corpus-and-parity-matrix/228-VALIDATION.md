# Phase 228 Validation: Cross-Language Golden Strategy Corpus and Parity Matrix

## Nyquist Validation

| Risk | Coverage |
| --- | --- |
| Corpus omits a supported language | Test asserts TypeScript, Python, Rust, and Zig corpus records in order. |
| Pairwise matrix omits cross-language pairs | Test asserts pair count equals language count squared. |
| Product label parity without execution parity | Runtime-service builds and executes real revisions through provider/broker paths. |
| Private Strategy/runtime data leaks into public replay evidence | Test projects public Chronicles and scans for private markers. |
| WASM path falls back when artifacts are missing | Runtime-service corpus test removes Rust/Zig artifacts and expects fail-closed `MALFORMED_REQUEST`. |
| Overclaiming exact low-level replay equality | Test gates outcome, schema, core public event shape, and privacy instead of brittle event-signature identity. |

## Validation Result

Pass. The corpus and matrix are suitable as a durable base for later product, evidence, monitor, and live signed-in proof phases.

