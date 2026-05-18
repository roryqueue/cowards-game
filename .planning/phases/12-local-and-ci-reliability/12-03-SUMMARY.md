# Plan 12-03 Summary: Service-Backed E2E Diagnostics

## Completed

- Added `e2e:service` as a first-class service-backed Workshop-to-replay command.
- Added layer-labelled Playwright assertion messages in `workshop-to-replay.spec.ts`.
- Expanded `/api/test-support/run-worker-once` failure responses with `layer: "worker_execution"` and bounded stdout/stderr diagnostics.
- Added route coverage for bounded diagnostic output.

## Verification

- `pnpm --filter @cowards/web test -- run-worker-once/route.test.ts` passed.
- `pnpm e2e:service` passed on desktop and mobile.

