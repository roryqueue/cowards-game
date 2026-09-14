---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: committed-b80017cd-calibration-integration-review
checked: 2026-09-14
status: gaps_found
focused_tests: 9/9 passed
open_gaps: 1
---

# Phase 264 Calibration Integration Review

This is a bounded read-only review of the committed preparation, runner, calibration contract, and selected-runtime adapter. No CLI run, Match, guest, provider, installation, network, or historical selector was used. The focused tests use injected data-only mechanics.

## Evidence checked

- `scripts/prepare-v1-38-factory-calibration.ts`
- `scripts/run-v1-38-factory-calibration.ts`
- `scripts/lib/v1-38-factory-supervised-runtime.ts`
- `packages/strategy-lab/src/factory/calibration.ts`
- Their focused tests

Checks run:

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/calibration.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/prepare-v1-38-factory-calibration.test.ts scripts/run-v1-38-factory-calibration.test.ts` — **4 files, 9 tests passed**.
- `tsx .../prepare-v1-38-factory-calibration.ts --help` and `tsx .../run-v1-38-factory-calibration.ts --help` — both printed their real CLI usage and exited 0.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Authorization/root freshness | PASS (bounded) | Preparation admits one canonical authorization record, rederives its root, reopens protocol/allocation artifacts, checks their phase/purpose/split/limits and roots, hashes both policy files, and binds ingested packet roots into a new manifest. Runner reopens and rebinds those records before work and rejects prior starts using the same protocol/allocation. |
| Charge before work | PASS | Runner publishes accounting, records the immutable attempt start, and only then reads ingestion, admits the packet, validates source, creates a runtime, or invokes supervision. Invalid-after-start paths retain a terminal ledger record. |
| Runtime/policy/image bounds | PASS for the actual selected path | Source bytes are rehashed and rebuilt as authored TypeScript; ABI, translation, runtime profile, adapter id, image, lifetime, invocation limit, attempt root, budget root, and source root are checked. The selected planner runtime additionally enforces revision rebuild, runtime limits, canonical tuple, and its own invocation/lifetime/accounting rules. |
| Selected opponent/setup | PASS for CLI default | `defaultPlan` selects the canonical smoke arena, one-phase bounded match, candidate as the selected side, and a deterministic inert opponent. The actual CLI calls `runFactoryCalibration` without hooks, so test-only plan/runtime injection is not part of the CLI path. |
| Failure/cleanup/terminal retention | PASS | Candidate/system failures, invalid setup, cleanup failure, and runtime errors are mapped to retained terminal dispositions. Cleanup is attempted in both normal and exceptional paths; system failure clears output authority and stops subsequent attempts. |
| Real CLI versus hooks | PASS for CLI, with one API gap below | `--help` dispatches to the real coordinator, and the real coordinator uses the default plan and selected adapter. Focused tests use hooks only to inject mechanics without launching a guest. |

## Concrete gap

1. **Factory adapter accepts benchmark/synthetic-runtime options through its public option type.** `FactorySupervisedRuntimeOptions` extends `PlannerSupervisedRuntimeOptions` while omitting only `revision` and `image` (`scripts/lib/v1-38-factory-supervised-runtime.ts:13`), and line 43 forwards the remaining fields directly to `createPlannerSupervisedRuntime`. This leaves `benchmarkLifetimeMs`, `observerHarness`, `transport`, and `streamFactory` available to direct callers; the runner hook type also leaves observer/transport fields available. The planner treats `benchmarkLifetimeMs` as a benchmark-only mode and accepts synthetic transport/observer seams. The actual CLI supplies none of these, so this is not an observed CLI execution defect, but the selected factory adapter itself does not fail closed against Phase-263 benchmark authority or synthetic transport when called through its exported API. Narrow the factory option type/forwarding to the selected factory-safe fields, or reject benchmark/observer/transport overrides at the adapter boundary. No new allocation or external authority is needed.

## Disposition

The committed CLI coordinator is otherwise correctly charge-first, root-bound, bounded, selected-opponent, and terminal-retaining. The one API-surface gap should be closed before treating the adapter as a generally safe factory boundary; it does not constitute evidence of a live run or candidate quality.

_Independent bounded source review; no source edits or commit performed._
