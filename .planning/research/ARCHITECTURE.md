# Research: Architecture

**Project:** Coward's Game
**Date:** 2026-05-18
**Milestone context:** v1.1 Trustworthy Simulation Beta

## Existing Architecture Snapshot

```txt
apps/web
  -> Workshop APIs and replay UI
  -> persistence package
  -> replay projection

apps/worker
  -> queued Match runner
  -> runtime-js
  -> pure engine
  -> Chronicle builder
  -> persistence package

packages/spec
  -> canonical types, Zod schemas, versions

packages/engine
  -> pure rules and runtime interface

packages/replay
  -> Chronicle build, validate, reconstruct, project, hash

packages/runtime-js
  -> Strategy Revision validation, transpile, worker-thread execution

packages/test-utils
  -> engine scenarios
```

This is the right shape. v1.1 should deepen the replay/runtime contracts inside these packages instead of moving rule logic into UI or persistence.

## Proposed v1.1 Build Path

### 1. Engine-Generated Replay Fixtures

Move replay demo inputs toward `packages/test-utils` scenario builders that call the engine and Chronicle builder. Each scenario should produce:

- legal Match input
- Chronicle
- final state
- expected event types
- expected visual checkpoints

`apps/web` can still own UI-specific fixture projection, but the legality source should be engine/replay packages.

### 2. Chronicle Grammar Validator

Add grammar validation in `packages/replay`, layered after `ChronicleSchema.safeParse`.

Suggested structure:

```txt
validateChronicle
  -> parse schema
  -> validate versions
  -> validate sequence numbers
  -> validate grammar windows
  -> validate context/payload consistency
  -> validate snapshot boundaries and references
  -> validate privacy projection constraints
  -> validate optional integrity hash
```

Represent grammar as explicit state transitions rather than scattered ad hoc checks. A small finite-state validator is easier to test exhaustively:

- `pre-match`
- `in-match`
- `in-round`
- `in-activation`
- `in-cycle`
- `post-match`

This does not need to re-run Strategy source. For impossible board transitions, compare snapshots and event effects where snapshots exist. Full replay reconstruction can remain in `reconstruct.ts`, but invalid Chronicles should fail before UI render.

### 3. Runtime Adapter Boundary

Add a runtime execution adapter boundary in `packages/runtime-js`:

```txt
StrategyRuntime
  -> createRuntimeFromRevision
    -> StrategyExecutionAdapter
      -> workerThreadAdapter (existing)
      -> subprocessAdapter (v1.1 spike/implementation)
```

The adapter interface should accept only method name, source hash/source, and schema-valid input. It should return only `RuntimeResult<unknown>`. Validation into `StrategyResultSchema` or `SoldierBrainResultSchema` should remain outside the raw adapter.

Subprocess adapter requirements:

- `spawn` a child process with no shell.
- Provide minimal env.
- Use JSON lines or one-shot JSON over stdin/stdout.
- Cap stdout/stderr bytes.
- Kill on timeout.
- Treat nonzero exit, malformed response, timeout, and signal exit as distinct failure modes.
- Do not inherit database URL, app env, file descriptors, or web/API context.

### 4. Replay Debugging DTOs

Keep public replay DTOs privacy-safe. Add owner-only explanation fields generated from public event context plus owner private refs:

- soldier did nothing because it was not selected
- activation order missing or invalid
- Soldier was STONE/FALLEN
- action invalid or blocked
- runtime violation occurred
- Match/round/activation already ended

The UI should consume explanation DTOs, not infer rules in React.

### 5. Local/CI Reliability Layer

Add a preflight command or package script that checks:

- Postgres reachable
- Redis reachable if still expected by compose/dev path
- migrations applied
- seed data present or seed command available
- worker can claim/run one test job
- replay endpoint can return a valid replay

This can be used by both Docker and no-Docker local paths.

## Suggested Phase Order

1. Replay fixture legality and visual regression corpus
2. Strict Chronicle grammar and compatibility failure handling
3. Runtime isolation adapter and hostile-code test matrix
4. Doctrine debugging UX
5. Local/CI service reliability and end-to-end confidence

## Integration Rules

- Do not put game rules in React components.
- Do not execute Strategy source in `apps/web` or API routes.
- Keep grammar validation in `packages/replay`, not persistence.
- Keep engine deterministic and side-effect free.
- Keep runtime adapter replaceable.
- Keep public replay projection separate from owner debug projection.

## Sources

- `packages/spec/src/schemas.ts`
- `packages/replay/src/validate.ts`
- `packages/replay/src/build.ts`
- `packages/replay/src/project.ts`
- `packages/runtime-js/src/worker-bridge.ts`
- `packages/runtime-js/src/worker-harness.ts`
- `apps/worker/src/runner.ts`
- `compose.yaml`
- `scripts/dev-local-postgres.sh`
- Node `child_process` docs: https://nodejs.org/api/child_process.html
- Node Permission Model docs: https://nodejs.org/api/permissions.html
