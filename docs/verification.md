# Verification

## v1.37 runtime ABI activation

Phase 258 activates the v1.17 runtime tuple only after the exact manifest passes. The durable receipt binds a clean execution commit/tree, command-definition digest, command IDs, owned test files, aggregate PASS counts, zero skipped counts, database-presence booleans, exit status, and privacy-safe output/named-evidence digests. It never contains commands, environment values, connection strings, raw output, durations, diagnostics, source, artifacts, memory, objectives, or host paths.

Run authoritative receipt generation from a clean detached worktree based on the intended closure source commit. A normal working copy with unrelated or user-owned edits correctly fails the provenance check even when those edits are legitimate. Reuse the local pnpm store through a worktree-local install; do not point a worktree at another checkout's mutable `node_modules` directory.

Run the post-activation proof from the repository root only after the service-backed topology is configured:

- `DATABASE_URL` points to the migrated PostgreSQL proof database.
- `COWARDS_GO_BACKEND_TEST_DATABASE_URL` points to the same isolated proof database for the exact Go database rows.
- `COWARDS_RUNTIME_SERVICE_URL` points to the guarded, loopback-only Phase-258 validation proof service.
- `COWARDS_GO_BACKEND_URL` points to the guarded Phase-258 Go/PostgreSQL proof helper backed by that database. The final Playwright row fails rather than skipping when either service or variable is unavailable.
- `COWARDS_PROVIDER_VALIDATION_SECRET` and `COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN` are nonempty local proof secrets shared by both helpers and the test process.

The proof-only runtime service never mounts production authority or execution, binds only `127.0.0.1:3107`, exposes only `/health` and `/validate-strategy`, and labels its output proof-only. It does not relax the production runtime-service entrypoint. Start it in one terminal:

```sh
export COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER=1
export COWARDS_PROVIDER_VALIDATION_SECRET=phase258-provider-validation-proof
export COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN=phase258-private-artifact-proof
pnpm exec tsx apps/runtime-service/src/source-identity-proof-server.test-support.ts
```

Start the committed Go/PostgreSQL proof helper in a second terminal. Its extended timeout keeps it alive through the complete exact manifest:

```sh
cd apps/go-backend
export COWARDS_PHASE258_SOURCE_IDENTITY_E2E_SERVER=1
export COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game
export COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107
export COWARDS_PROVIDER_VALIDATION_SECRET=phase258-provider-validation-proof
export COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN=phase258-private-artifact-proof
go test . -run '^TestPhase258SourceIdentityE2EServer$' -v -count=1 -timeout 90m
```

The Playwright configuration starts the local web process. In the runner terminal, export the same secrets and both URLs, then confirm both external dependencies:

```sh
test -n "$DATABASE_URL"
test -n "$COWARDS_GO_BACKEND_TEST_DATABASE_URL"
test -n "$COWARDS_RUNTIME_SERVICE_URL"
test -n "$COWARDS_GO_BACKEND_URL"
test -n "$COWARDS_PROVIDER_VALIDATION_SECRET"
test -n "$COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN"
curl --fail --silent --show-error "$COWARDS_RUNTIME_SERVICE_URL/health" >/dev/null
curl --fail --silent --show-error "$COWARDS_GO_BACKEND_URL/health" >/dev/null
```

Then run:

```sh
pnpm exec tsx scripts/run-v1-37-runtime-abi-test-manifest.ts --stage postactivation --require-all --write-receipt
pnpm exec tsx scripts/check-v1-37-runtime-abi-manifest-closure.ts --write-final --check
pnpm exec tsx scripts/evaluate-v1-37-runtime-abi.ts --write --check
pnpm exec tsx scripts/prove-v1-37-atomic-activation.ts --write --check
pnpm contract:check
pnpm contract:lint
pnpm boundary:imports
pnpm public-discovery:check
pnpm boundary:monitors
pnpm lint
pnpm typecheck
pnpm build
```

The evaluator authoritatively reruns the receipt commands. Supply the same database URLs, proof-service URLs, and shared local proof secrets to both `--write --check` and later strict `--check` evaluator invocations; missing database or service environment fails closed rather than accepting the committed receipt.

The evaluator fails closed if the activation manifest, exact test receipt, canonical JSON corpus, runtime budget artifact, source-normalization identity, signed managed evidence roots, immutable v1.16 evidence, or TypeScript/Go wire parity drifts.

Passing Phase 258 does not certify a counted runtime lane. Production trusted producers and counted-eligible lanes remain empty until Phase 259 supplies executable full-state, event, memory, objective, and failure-trace conformance for every supported language.
