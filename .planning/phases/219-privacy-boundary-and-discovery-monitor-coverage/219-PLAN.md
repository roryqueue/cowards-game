# Phase 219 Plan: Privacy, Boundary, and Discovery Monitor Coverage

## Tasks

1. Add monitor coverage for discovery DTO boundary identity.
2. Scan discovery code for forbidden runtime/private imports and private field markers.
3. Include monitor in boundary monitor chain.

## Verification

- `pnpm public-discovery:check`
- Public page marker scans in Playwright.
