---
phase: 115-python-starter-strategy-and-replay-proof
plan: 1
type: execute
wave: 1
depends_on: [114]
files_modified:
  - packages/persistence/src/workshop.ts
  - apps/web/app/workshop/workshop-client.tsx
  - apps/web/app/workshop/types.ts
  - apps/web/app/replays/**
  - tests/e2e/**
  - .planning/artifacts/v1.17-python-proof.md
  - .planning/artifacts/v1.17-python-proof.json
autonomous: true
requirements: [PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06]
---

<objective>
Deliver a visible Python proof from Workshop authoring through non-counted MatchSet and replay evidence.
</objective>

<tasks>

1. Add a bounded tactical Python starter/template with experimental and non-counted labels.
2. Ensure validation/submission produces Python runtime metadata and immutable revision identity.
3. Run the starter against an existing JS/TS Workshop opponent through the runtime-service path.
4. Add proof artifacts and page smoke covering Workshop, MatchSet, and replay.
5. Confirm replay labels are public-safe and board state is plausible/in-bounds.

</tasks>

<verification>

- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`
- `pnpm e2e:service`
- `pnpm e2e:visual`

</verification>

