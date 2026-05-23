# Phase 86 Research: Account Strategy Revision Source and Write Ownership

## Findings

- Source/write/fork reference behavior is in `packages/persistence/src/account-revisions.ts` and `apps/web/app/competitive/server.ts`.
- Starter/Advanced library metadata and source hashes live in `packages/persistence/src/starter-strategies.ts` and `packages/persistence/src/advanced-strategies.ts`.
- Existing source route returns owner-private plaintext with no-store behavior.
- Existing validation metadata is produced by runtime-js without treating web/API as a hostile-code sandbox.

## Implementation Notes

- Add Go source retrieval as owner-private/no-store.
- Add Go save/create and fork routes that hash/count/store source and metadata but do not execute Strategy code.
- Preserve Starter/Advanced lineage when source matches library selections.
- Keep source out of normal evidence/log/monitor output.

