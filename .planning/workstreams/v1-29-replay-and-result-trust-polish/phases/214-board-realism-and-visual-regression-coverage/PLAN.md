# Phase 214 Plan

## Goal

Strengthen public replay/result proof with board realism and browser-level validation.

## Scope

- Preserve existing board validation for out-of-bounds Soldiers, invalid bounds, overlapping visible pieces, FALLEN/non-positioned visibility, and canonical Match starts.
- Add public page proof that checks ready replay canvas pixels and fixture-backed result/replay states.
- Record board realism in the v1.29 proof artifact.

## Verification

- Server board realism tests.
- Playwright canvas pixel checks.
- v1.29 proof artifact board realism field.
