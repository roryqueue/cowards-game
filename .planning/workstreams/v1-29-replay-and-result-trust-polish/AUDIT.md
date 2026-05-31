# v1.29 Audit

## Decision

Pass. No open audit findings after the final validation pass.

## Commit And Tag

- Commit: `feat: polish replay and result trust`
- Follow-up closure fix: ready replay playback fixture enrichment and milestone close-out docs.
- Tag: `v1.29`

## Boundary Checks

- No changes in `packages/spec`, `apps/go-backend`, `apps/runtime-service`, or `packages/persistence`.
- `match-execution-app-v1` remains the only public execution app contract version.
- No public execution DTO fields were added; v1.29 monitor checks exact DTO field shapes.
- Missing-Chronicle and no-result proof fixtures are app-only, test/fixture-gated, and not part of the frozen contract fixture catalog.

## Privacy Checks

- Public result/replay pages are scanned in Playwright proof.
- v1.29 generated proof artifacts are scanned for public-output leaks.
- Raw invalid Chronicle validation details are withheld from public replay output.

## Validation Summary

- Spec contract tests passed.
- Web focused tests passed.
- Web typecheck and lint passed.
- v1.29 proof and boundary monitor passed.
- v1.29 and v1.25 Playwright public page proofs passed.
- Ready replay playback was verified in the in-app browser: the public-safe replay timeline advances from `0` with max `3` after clicking "Play replay".

## Surprises

- The first missing-Chronicle/no-result fixture approach would have expanded the frozen contract fixture catalog. The final implementation moved those fixtures into the app-only fixture adapter to preserve the contract boundary.
- Invalid Chronicle tests originally expected raw validation diagnostics in public messages. v1.29 intentionally changed those assertions to prove sanitized public copy.
- Parallel Playwright proof runs collided on port 3000; sequential proof runs passed.
- The public-safe replay fixture originally had only one public checkpoint, so "Play replay" appeared ready but could not visibly advance. The fix stays app-only by enriching that fixture in the web adapter, not the frozen contract fixture catalog.
