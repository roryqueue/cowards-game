---
phase: 102-topology-monitors-rollback-and-promotion-gate
reviewed: 2026-05-24T04:39:31Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - .planning/artifacts/v1.15-failure-drills.json
  - .planning/artifacts/v1.15-live-web-go-runtime-topology.json
  - .planning/artifacts/v1.15-promotion-decision.md
  - .planning/artifacts/v1.15-typescript-surface-labels.json
  - apps/go-backend/README.md
  - apps/go-backend/fixture_checksums_gen.go
  - apps/go-backend/main.go
  - apps/go-backend/main_test.go
  - apps/go-backend/testdata/service-fixtures/fixture-manifest.json
  - apps/go-backend/testdata/service-fixtures/public-replay-evidence.json
  - apps/go-backend/testdata/service-fixtures/route-manifest.json
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-local-topology.test.ts
  - scripts/check-local-topology.ts
  - scripts/generate-go-parity-fixtures.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: fixed
---

# Phase 102: Code Review Report

**Reviewed:** 2026-05-24T04:39:31Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** fixed

## Summary

Reviewed the Phase 102 topology, boundary monitor, Go fixture, and v1.15 promotion artifacts. The new public replay evidence fixture route is mostly checksum-guarded, but the promotion gate is too artifact-driven: it can pass without exercising live web, Go, runtime-service, DB, or browser replay paths in the current run. Several monitors accept self-reported evidence or incomplete labels, creating false promotion confidence around exactly the cutover risks Phase 102 is supposed to close.

**Resolution:** Fixed in follow-up Phase 102 changes. `--require-v1-15-lifecycle` now requires live web, Go, web-through-Go public Strategy read, runtime-service health, v1.15 artifacts, Go public replay evidence schema validation, rollback order, TypeScript surface labels, and promotion-decision privacy. `pnpm topology:check -- --require-v1-15-lifecycle --json` and `pnpm boundary:monitors` both pass against the live local web/Go/runtime-service setup.

## Critical Issues

### CR-01: BLOCKER - `--require-v1-15-lifecycle` Does Not Require Live Topology

**File:** `scripts/check-local-topology.ts:143`
**Issue:** The new lifecycle flag only flips `requireV115Lifecycle`; it does not require web, Go, runtime-container, runtime-service, live DB, or browser replay checks. `evaluateLocalTopology` then explicitly skips web and Go when no URLs are supplied, and `check-boundary-monitors.ts:1151` invokes it with `webUrl: null`, `goUrl: null`, and `requireRuntimeContainer: false`. I confirmed `pnpm exec tsx scripts/check-local-topology.ts --require-v1-15-lifecycle --json` returns `ok: true` while reporting `web service health route` and `Go live smoke` as skipped and `container=skipped`.
**Resolution:** `--require-v1-15-lifecycle` now implies live web, live Go, web-through-Go public Strategy read, and runtime-service health checks with default local URLs. `check-boundary-monitors.ts` now calls this live gate for v1.15 diagnostics. Runtime container promotion remains explicitly out of v1.15 scope and is still guardrailed as evidence-only rather than required for promotion.
**Fix:**
```ts
case "--require-v1-15-lifecycle":
  options.requireV115Lifecycle = true
  options.requireWeb = true
  options.requireGo = true
  options.requireRuntimeContainer = true
  options.webUrl ??= "http://localhost:3000"
  options.goUrl ??= "http://127.0.0.1:8087"
  break
```
Also add a required runtime-service health/execution-boundary smoke and make `checkTopologyDiagnostics` pass real URLs or fail with an explicit "live topology not run" status.

### CR-02: BLOCKER - Promotion Evidence Is Self-Reported And Can Be Stale

**File:** `scripts/check-local-topology.ts:394`
**Issue:** `validateV115TopologyArtifact` trusts whatever appears in `commandEvidence` as long as every listed command has `"status": "pass"`. It does not require specific commands, non-empty evidence, current git revision, timestamps, logs, output hashes, fixture checksum linkage, or proof that the current run executed those commands. The artifact at `.planning/artifacts/v1.15-live-web-go-runtime-topology.json:93` can therefore continue to promote after route, runtime ABI, DB lifecycle, or replay-rendering drift.
**Resolution:** The topology artifact validator now requires the exact v1.15 command evidence ids, rejects duplicates/unexpected ids, and requires status, timestamp, repo head, and evidence reference fields. The live topology and boundary monitor commands were rerun after the validator change.
**Fix:**
```ts
const requiredCommands = new Set([
  "go-test",
  "go-live-db-test",
  "go-parity",
  "topology-v115-live",
  "boundary-monitors",
  "replay-visual",
])
if (commands.length !== requiredCommands.size) throw new Error("missing command evidence")
for (const command of commands) {
  if (!requiredCommands.has(requireString(command, "id", "commandEvidence"))) {
    throw new Error("unexpected or stale command evidence")
  }
  requireString(command, "repoHead", "commandEvidence")
  requireString(command, "completedAt", "commandEvidence")
  requireString(command, "artifactHash", "commandEvidence")
}
```
Prefer deriving this artifact from the topology command run itself instead of accepting hand-authored pass/fail claims.

### CR-03: BLOCKER - Rollback Order Is Not Enforced

**File:** `scripts/check-local-topology.ts:471`
**Issue:** The rollback validator checks that `operatorSequence` includes three steps, but it does not check their order. An unsafe sequence such as `start_typescript_rollback_worker`, `stop_go_orchestration`, `switch_lifecycle_owner_to_typescript` would pass even though Phase 102 explicitly forbids mixed DB-completing owners. That is a data-integrity risk during rollback.
**Resolution:** The rollback validator now requires the exact safe operator sequence: stop Go orchestration, switch lifecycle owner, then start the TypeScript rollback worker.
**Fix:**
```ts
const expectedRollbackSteps = [
  "stop_go_orchestration",
  "switch_lifecycle_owner_to_typescript",
  "start_typescript_rollback_worker",
]
if (JSON.stringify(rollbackSteps) !== JSON.stringify(expectedRollbackSteps)) {
  throw new Error("rollback drill operatorSequence order drifted")
}
```
Add a test that misorders the sequence and expects the monitor to fail.

### CR-04: BLOCKER - Public Replay Evidence Promotion Is Not Verified Against Live Go Output

**File:** `.planning/artifacts/v1.15-promotion-decision.md:11`
**Issue:** The promotion decision claims public replay evidence "rejects owner-private projection data", but the Phase 102 gate validates only committed fixture/artifact JSON. It does not fetch a live Go `/public/replays/{matchId}/evidence` response under `--require-v1-15-lifecycle`, and the Go fixture test only checks the static fixture. A live projection/privacy regression can pass Phase 102 if fixtures remain clean.
**Resolution:** Live Go smoke now fetches `getPublicReplayEvidence`, parses it with `PublicReplayEvidenceServiceDtoSchema`, and runs the public DTO leak guard. The Go fixture tests also cover the public replay evidence fixture route.
**Fix:** Add a required live public replay evidence check in `evaluateLocalTopology` when v1.15 lifecycle is required:
```ts
const evidence = await smokeJson(goUrl, sampleRoute("getPublicReplayEvidence").samplePath)
PublicReplayEvidenceServiceDtoSchema.parse(evidence)
assertPublicServiceDtoLeakSafe(evidence)
```
Also add a negative Go test with nested `ownerPrivate`, `private`, and `objectivePayload` fields in a persisted Chronicle event/snapshot to prove the live projection rejects them before writing the response.

### CR-05: BLOCKER - Text Artifact Privacy Check Misses Credential Markers

**File:** `scripts/check-local-topology.ts:275`
**Issue:** `checkPublicText` scans only the local `privateMarkers` strings. It does not use the central public-output privacy contract, so text artifacts such as `v1.15-promotion-decision.md` could contain `Bearer ...`, `DATABASE_URL`, `postgres://...`, host paths, or token-shaped fields and still pass the promotion gate. This is a monitor false negative for source-safe/public-safe evidence.
**Resolution:** `checkPublicText` now uses `assertPublicOutputLeakSafe` before local marker checks, so promotion text artifacts share the central public-output privacy contract.
**Fix:**
```ts
import { assertPublicOutputLeakSafe } from "../packages/spec/src/index.ts"

const checkPublicText = (value: string): string => {
  assertPublicOutputLeakSafe({ text: value }, "public text artifact")
  return `${value.length} public-safe text bytes`
}
```
Keep the existing redaction-specific tests, but add text-artifact cases for bearer tokens and database URLs.

## Warnings

### WR-01: WARNING - TypeScript Surface Labels Can Omit Required Surfaces

**File:** `scripts/check-local-topology.ts:531`
**Issue:** `validateV115TypeScriptSurfaceLabels` accepts any surface whose role is in `allowedRoles`, but it does not require the expected surface list, require at least one `rollback_only` surface, or verify runtime-only/deferred fallback policies. The current artifact allows `rollback_only` but labels no rollback surface, while `.planning/artifacts/v1.15-failure-drills.json:50` names `apps/worker/src/runner.ts` as rollback evidence. This weakens the TypeScript ownership-creep monitor.
**Resolution:** The validator now requires expected runtime, rollback, frontend, parity, and deferred TypeScript surfaces. The artifact labels `apps/worker/src/runner.ts` as `rollback_only`.
**Fix:** Define required surface entries and role/policy expectations, then fail on omissions:
```ts
const requiredSurfaces = new Map([
  ["apps/runtime-service", "runtime_only"],
  ["apps/worker/src/runner.ts", "rollback_only"],
  ["apps/web/app/matches/server.ts", "frontend"],
])
for (const [surface, role] of requiredSurfaces) {
  const entry = surfaces.find((item) => requireString(item, "surface", "surfaceLabels.surface") === surface)
  if (!entry || requireString(entry, "role", "surfaceLabels.surface") !== role) {
    throw new Error(`surface labels missing ${surface} as ${role}`)
  }
}
```

---

_Reviewed: 2026-05-24T04:39:31Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
