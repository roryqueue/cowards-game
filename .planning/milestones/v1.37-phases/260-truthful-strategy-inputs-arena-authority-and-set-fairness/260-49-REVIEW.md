---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "49"
review_status: resolved
resolved: 2026-07-19
---

# Phase 260 Plan 49 Code Review

## Result

PASS. All findings discovered while exercising the complete released-v1.17 and disposable selected-v1.19 packages are resolved. Production recording, replay, service dispatch, and historical compatibility remain fail-closed and version-exact.

## Findings resolved

1. **Selected-current replay omitted candidate Match authority.** Generic replay fixtures and the current validator could record v1.19 but could not carry the exact Set, arena, side, initiative, and persisted-Match envelope through current validation and reconstruction. Current v1.19 now requires and re-verifies that frozen envelope; explicit candidate validation remains non-current and non-publishable before activation.
2. **Successor initiative was absent from the replay state projection.** The runtime schema carried `initialInitiativePlayerId`, but the canonical semantic state type and replay projection did not. The field is now represented and hashed for v1.19 transitions and terminal state.
3. **The first successor projection repair contaminated historical v1.17 evidence.** Authority-aware projection now includes initial initiative only for v1.19. The frozen v1.17 service source, protected request bytes, receipts, transitions, and replay evidence remain exact.
4. **Historical/default test fixtures relied on selector-relative identity.** Test support now derives canonical catalog and four-condition authority for the selected runtime while explicit v1.17 fixtures retain their original schemas, wire shape, observations, and receipts.

## Verification

- Released replay: 14 files, 230/230 tests.
- Disposable selected-v1.19 replay: 14 files, 230/230 tests.
- Released runtime-service: 16 files, 156/156 tests, plus typecheck and lint.
- Disposable selected-v1.19 runtime-service: 16 files, 156/156 tests, plus typecheck and lint.
- Disposable selected-v1.19 spec: 334 passed, 1 intentional skip; generator proofs 35/35.
- Preactivation evaluator independently reran its executable gates and emitted `OBSERVATION_V1_19_PREACTIVATION_PROVED`.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Database head remained exact v1.17 revision 0 with no pending intent, finalization, or compensation.

No remaining actionable code-review finding was identified.
