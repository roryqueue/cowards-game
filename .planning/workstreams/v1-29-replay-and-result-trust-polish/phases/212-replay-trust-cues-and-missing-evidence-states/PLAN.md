# Phase 212 Plan

## Goal

Make public replay-ready and replay-unavailable states understandable without exposing private execution detail.

## Scope

- Add app-local replay-unavailable reasons for missing public evidence, stale evidence, and no-result.
- Surface existing lifecycle/result/replay/retry evidence rows on unavailable replay pages.
- Sanitize invalid Chronicle messages so public output does not include validator codes or detailed board diagnostics.
- Keep replay page DTOs app-internal; do not add service/spec DTO fields.

## Verification

- Server facade tests for missing Chronicle, no-result, selected-Go null evidence, and invalid Chronicle sanitization.
- Playwright proof for ready replay and unavailable replay states.
