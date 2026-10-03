# Plan265-15 source-only handoff

Status: **SOURCE_READY_FOR_REVIEW**, not Plan completion. No pilot, capacity receipt, provider, container, Match, formation or holdout was started by this executor. Root owns the empirical portion of Task2 and the eventual SUMMARY/STATE/requirement updates.

## Committed implementation

- `e32ec774`: Task1 RED compact contract tests (missing implementation failed as expected).
- `c08947a3`: Task1 GREEN strict pilot allocation, append-only charge/terminal/resource ledger, gzip with separate compressed/canonical roots and bounded decode, all-slot/unused coverage, exact200/128 metadata schedule and conservative resource tier formula.
- `c3af9b24`: Task2 RED inert CLI and native authority tests (missing implementation failed as expected).
- `b08bebe1`: Task2 source GREEN three-mode native private pilot CLI and process-local durable-charge authority; minimal private opt-in branches in factory/planner/container-session helpers. Legacy defaults/receipts/readers remain unchanged.

The additive host wiring was necessary because legacy ten-minute/5-second capabilities require the obsolete full-league allocation. A new `lean-runtime-authority-v1` capability is issued only after reopening a durable lean charge, consumed once in factory→planner→session order and bound to source/revision/executable/tuple/runtime/seat/container/ownership identities. It never mints a legacy receipt. No new dependency was installed.

## Actual source checks

Five suites passed, **242 tests**, using synthetic runtime fixtures only:

```sh
pnpm exec vitest run scripts/run-v1-38-lean-experiment.test.ts packages/strategy-lab/src/league/lean-experiment.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts
```

Focused strict typecheck passed (exit0):

```sh
pnpm exec tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --strict --esModuleInterop --types node scripts/run-v1-38-lean-experiment.ts scripts/run-v1-38-lean-experiment.test.ts packages/strategy-lab/src/league/lean-experiment.ts packages/strategy-lab/src/league/lean-experiment.test.ts
```

The first typecheck invocation omitted explicit Node types under `--ignoreConfig`; corrected invocation above passed without dependency changes. No active test/typecheck sessions remain.

## Root-only entry prerequisites and commands

Independent source review/fixes and applicable build/boundary gates must pass first. Pin the resulting `leanSourceManifest().root` and real independent source-review artifact root. Preserve reviewed source/HEAD through entry terminal and unique retained verification. Root must construct a new private request file using `apply_patch`; no historical request/authority may be reused as execution authority.

Request fields are exactly:

```json
{
  "schemaVersion": "lean-pilot-request-v1",
  "seed": "new-lowercase-dash-seed",
  "reviewRoot": "sha256:<actual independent review root>",
  "sourceRoot": "sha256:<actual leanSourceManifest root>",
  "factoryDirectory": "<existing real private Phase264 factory directory>",
  "selection": {
    "initialCandidatePublicationRoots": ["sha256:<S01 publication>", "sha256:<S03 publication>"],
    "factoryAssessmentArtifactRoots": ["sha256:<historical affirmed assessment artifact>"],
    "operations": { "maxArtifactBytes": 12000000000, "maxArtifactRecords": 200000 }
  }
}
```

The selection is data-only. It reuses the existing assessed-candidate reader and revalidates actual source closure before native construction, not legacy prepare/coordinator/full-allocation admission. Root must check these exact S01/S03 provenance identities; the source reader still performs its historical assessment checks, so do not run multiple concurrent readers.

Commands, **not invoked by this executor**:

```sh
pnpm exec tsx scripts/run-v1-38-lean-experiment.ts prepare-pilot --request <new-private-request-path>
```

This creates a fresh exclusive real0700 `.strategy-lab/lean-experiment-20261003` store, internal allocation/empty ledger, and new canonical `.planning/artifacts/v1.38-lean-pilot-allocation-v1.json`. Commit the exact new canonical allocation before entry; never stage private store contents or old zero-byte result reservations. No capacity receipt or provider is created in preparation.

```sh
pnpm exec tsx scripts/run-v1-38-lean-experiment.ts run-pilot --request <same-new-private-request-path>
```

The unique entry checks committed allocation bytes and fixed source, samples real same-process statfs plus the existing Darwin effective-available-memory reader before charge, durably charges each cell before native provider construction, retains compact outcome/accounting and preselected/failure redacted gzip replay, stops at any failed cell, and publishes `issued:false/feasibility_only`. It records actual allocated blocks, measured host RSS high-water, elapsed durations and cleanup. Guest1000ms/host5000ms/Match600000ms remain unchanged. No raw private exception is printed; an entered failure gets a finite `entry-failure.json` marker. Interrupted/ambiguous charges do not acquire invented terminal success.

Exactly one independent read-only verifier, after actual entry closure and only when result exists:

```sh
pnpm exec tsx scripts/run-v1-38-lean-experiment.ts verify-retained --request <same-new-private-request-path>
```

If no result exists, use bounded ENTRY-terminal-only verification; do not fabricate a retained head/result. Every consumed allocation/result/store/marker remains immutable. There is no retry/resume mode.

## Deliberate continuation boundary

The new allocation currently reserves only the eight feasibility pilot slots. `leanSchedule()` exposes the exact prospective200/128 vectors without materializing formation state. Task265-16 must extend the **same** cumulative experiment ledger with a reviewed chosen-stage allocation; it must preserve all eight charges/resource events, not create another ledger/reset counters or reinterpret sampled evidence as full historical streams. Offline search/replay/verification time must also be charged to that shared ledger. This source-only handoff does not claim that future-stage ledger extension or telemetry/classifiers/training are already implemented.

The reader authenticates compact chain coverage and selected gzip roots and recomputes tier/resource maxima from retained observations. Compact nondetailed Match roots are commitments, not reconstructed exhaustive execution evidence. Pilot telemetry intentionally includes only transition/event counts; full scientific classifiers belong to265-16, before comparative candidate outputs.

## Safety and limitations

No engine/kernel/production registration or public API file changed. New filesystem access is trusted coordinator-only; private directory/file/symlink checks and create-exclusive publication are enforced. New compressed-input and host-capability trust boundaries are private, tested and require independent review. No certified/full-league/formation/holdout credit is claimed by source tests.

Self-check: the four production/test commits and owned source/test files exist; focused tests and strict types passed. Full Plan265-15 remains incomplete until root performs the reviewed actual pilot and independent verification and writes an honest pilot report/SUMMARY.
