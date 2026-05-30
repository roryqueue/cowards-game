# Phase 171 Summary: ABI Decision, Rollback, and Migration Criteria

## Result

Completed.

## Requirements Covered

ABIDEC-01..ABIDEC-06

## Delivered

The ABI decision keeps WASI Preview 1 stdin/stdout JSON active and requires explicit future promotion, compatibility, privacy, no-fallback, replay, and rollback evidence.

Primary artifacts:
- .planning/artifacts/v1.24-runtime-abuse-lab-evidence.json
- .planning/artifacts/v1.24-production-sandbox-readiness-matrix.json
- .planning/artifacts/v1.24-direct-export-abi-proof.json
- .planning/artifacts/v1.24-component-model-wit-proof.json
- .planning/artifacts/v1.24-abi-decision.json
- .planning/artifacts/v1.24-signed-in-multi-runtime-regression-proof.json
- .planning/artifacts/v1.24-signed-in-live-regression-proof.json

## Verification

- pnpm runtime-abuse:evaluate
- pnpm runtime-abuse:evaluate:check
- pnpm exec tsx scripts/check-boundary-monitors.ts
- RUN_V1_18_PROOF=1 PLAYWRIGHT_TEST=1 ... pnpm exec playwright test --project=desktop --workers=1 v1-18-exhibition-proof.spec.ts
- RUN_V1_23_PROOF=1 PLAYWRIGHT_TEST=1 ... pnpm e2e:v1.23-proof
