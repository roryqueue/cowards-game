# Plan 09-02 Summary: Public Projection Privacy Hard Gate

## Changed Files

- `packages/replay/src/project.ts`
- `packages/replay/src/project.test.ts`
- `apps/web/app/matches/replay-fixture.test.ts`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-02-PLAN.md`
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-02-SUMMARY.md`

## Requirements Satisfied

- GRAM-07: Public replay projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, private runtime details, private refs, top-level private/debug sections, and storage metadata by default.
- GRAM-08: Added hostile private-leaking projection fixtures covering nested arrays/objects, runtime violation payloads, `private.byPlayerId`, `private.debug`, `storageMetadata`, private refs, and private key names.

## Implementation Notes

- Extended the replay package private-key sanitizer denylist for nested private containers and metadata keys.
- Expanded replay projection tests with marker and key-name matrices so public serialization fails if private values or private key names appear.
- Verified owner projection remains player-scoped by exposing only the requested player's `ownerPrivate` data.
- Extended the web fixture DTO test with a `[privacy]` assertion that compares fixture output to `projectPublicChronicle` and checks the DTO path without adding web-layer sanitizer logic.

## Verification

- `pnpm --filter @cowards/replay test -- project.test.ts` - passed
- `pnpm --filter @cowards/web test -- replay-fixture.test.ts` - passed
- `pnpm --filter @cowards/replay typecheck` - passed
- `pnpm --filter @cowards/web typecheck` - passed

## Blockers

- None.
