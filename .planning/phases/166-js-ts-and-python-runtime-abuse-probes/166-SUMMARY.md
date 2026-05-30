# Phase 166 Summary: JS/TS and Python Runtime Abuse Probes

## Result

Completed.

## Requirements Covered

JSPY-01..JSPY-07

## Delivered

JS/TS counted and Python beta probes execute, classify invalid output/import attempts, and explicitly avoid promoting policy-only unavailable-lane evidence to a sandbox pass.

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
