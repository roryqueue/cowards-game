# Plan 12-04 Summary: CI Command Split

## Completed

- Added `.github/workflows/ci.yml`.
- Split CI/local commands into fast checks, service-backed E2E, fixture smoke, and replay visual regression.
- Fixed stale fast-gate blockers: Chronicle storage test fixture context, an unused replay grammar constant, worker test type-import lint, and one Prettier drift in replay build output.
- Refreshed contraction visual snapshots to match the current legal fixture rendering.

## Verification

- `pnpm test:fast` passed.
- `pnpm e2e:smoke` passed.
- `pnpm e2e:visual` passed after snapshot refresh.

