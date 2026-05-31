# Phase 231 Validation: Drift Monitors and Boundary Coverage

## Nyquist Validation

| Risk | Coverage |
| --- | --- |
| Product code adds a direct language branch outside provider boundaries | `findDirectLanguageSpecialCases` scans active web app/lib branch conditions and fails outside the approved allowlist. |
| Old beta/non-promotion monitors silently remain active truth | Runtime adapter, runtime broker, isolation source, and non-JS policy checks now assert provider-gated counted support. |
| Web/API imports runtime implementation packages directly | Service boundary imports deny JS, Python, and WASM/WASI runtime packages in strict routes and dependency chains. |
| Public discovery imports runtime implementation internals | Public discovery boundary denylist now includes JS, Python, and WASM/WASI runtime packages and package paths. |
| Supported language records become label-only | Provider completeness monitor checks contract version, adapter mapping, counted eligibility, privacy rules, docs/examples, limits, and proof requirements. |
| Contract or ABI drift becomes implicit | Existing contract, ABI, Match execution, public result/replay, and topology monitors remain in the full boundary suite. |

## Validation Result

Pass. Phase 231 requirements are covered by executable monitors and focused tests.

