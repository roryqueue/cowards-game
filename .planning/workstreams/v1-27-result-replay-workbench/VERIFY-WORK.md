# v1.27 Verify Work

## Verified User Outcomes

- Every v1.25 fixture scenario renders on MatchSet result pages with clear public-safe UI.
- Public-safe replay fixture renders plausibly on desktop, tablet, and mobile.
- Board output is nonblank and proof anchors for Soldiers/terrain remain inside board bounds.
- Fixture mode supports app/UI proof without live Match execution services.
- Fixture catalog is explicit test support and fails closed outside the fixture gate.
- Default public result/replay/fixture output does not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- Owner debug controls are absent from default public replay output.
- Boundary monitors catch v1.27 UI ownership, privacy, and proof drift.

## Live Compatibility Note

The local workspace had no `COWARDS_GO_BACKEND_URL` or signed-in proof service environment configured, so v1.27 does not claim a live signed-in execution proof. The implemented app work remains fixture-backed and consumes only frozen public app-facing DTOs for normal proof.

## Relevant Pages

- Fixture catalog: `http://localhost:3000/test-support/match-execution-fixtures`
- Unavailable runtime result: `http://localhost:3000/matchsets/match-set%3Afixture%3Aunavailable-runtime`
- Public-safe replay result: `http://localhost:3000/matchsets/match-set%3Afixture%3Apublic-safe-replay`
- Public-safe replay page: `http://localhost:3000/matches/match%3Afixture%3Apublic-safe-replay/replay`

## Final Browser Check

In-app browser inspection confirmed:

- fixture catalog is reachable in fixture mode,
- unavailable result has lifecycle/availability/runtime/privacy sections,
- replay board is visible, centered, and in bounds,
- replay page has no default owner-debug toggle,
- replay rendered DOM does not include the canonical private markers.
