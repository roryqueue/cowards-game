---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-04-frozen-model-readiness
checked: 2026-09-13
status: gaps_found
targeted_test: 5/5 passed
open_gaps: 2
---

# Phase 264 Frozen-Model Readiness Check

This is a bounded source/provenance mechanics review only. The fixtures are not genuine provider evidence; no provider, network, credentials, source execution, Match, or candidate admission was used.

## Evidence checked

- `packages/strategy-oracle-model/src/bundle.ts`
- `packages/strategy-oracle-model/src/emit.ts`
- `packages/strategy-oracle-model/src/index.ts`
- `packages/strategy-oracle-model/src/model.test.ts`
- Plan 04/Summary and `packages/strategy-lab/src/factory/contracts.ts`

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts` — **5 tests passed**.

## Scientist-critical checks

| Check | Result | Evidence |
|---|---|---|
| Canonical frozen bundle admission | PASS (mechanics) | `admitFrozenModelBundle` canonicalizes input, enforces exact keys, freezes admitted data, and requires stable bundle/response/source roots and byte lengths. Structural clones are rejected by the weak admission set. |
| Provider/model/version/settings/request/response/token/resource/attempt provenance | PASS at bundle boundary | `bundle.ts:39-56,67-85` requires provider identity, request root/length, response source/root, source bytes/hash, token/resource accounting, attempt/budget/ordinal, native lane, and lineage. |
| Unavailable and identity drift | PASS (mechanics) | `assessFrozenModelIdentity` returns new-root charged terminal blocks for unavailable and mismatched provider identities; no substitution or retry is introduced. |
| Unsupported native lanes | PASS fail-closed | `validateBundle` accepts only TypeScript/v1.19/translation-none and rejects other lanes before packet conversion. Unsupported lanes are rejected, not represented as charged blocks; this is distinct from the required charged unavailable/drift dispositions. |
| No provider/model/source execution | PASS | The package imports hashing, canonical admission, schemas, and TypeScript AST tooling only; no provider SDK, network, credential, dynamic import, runner, or source evaluation path exists. |
| Required source shape and closure | PASS (mechanics) | `assertModelSourceClosure` requires an object-literal `export default` with real `selectActivations` and `soldierBrain` methods, rejects imports/async/`this`, unresolved identifiers, direct/computed constructor recovery, forbidden capabilities, and then applies `validateStrategySource`. |
| Exact packet API and source/packet roots | PASS (mechanics) | `emitModelFactoryPacket` is exported from the leaf, accepts only an admitted bundle, preserves source/provider/native-lane values, validates `FactoryOraclePacketSchema`, and derives the packet root from the packet contents. |
| Full frozen-attempt provenance survives packet conversion | **GAP** | `emit.ts:70-88` carries source/provider/native lane/build/lineage into `FactoryOraclePacket`, but drops the bundle’s `request.root`, `response.root`, `accounting.resourceRoot` and token/elapsed accounting, and `attempt.attemptRoot`/`budgetRoot`/`ordinal`. The packet therefore cannot bind the full frozen model request-response/attempt record downstream. Preserve these roots via the factory packet’s permitted provenance extension or a root-bound companion artifact consumed atomically by Plan 05. |

## Scope and limitations

## Additional main-orchestrator integration finding

`emitModelFactoryPacket` also assigns `lineage: request.lineage` without comparing it to the admitted bundle's frozen lineage. A caller can therefore replace the source's recorded predecessor/correction/retry provenance while all packet-schema checks pass. Require exact equality (or a separately explicit, validated derivation relationship) and add a mismatch regression. The provenance companion must retain and bind the original bundle, not conceal this replacement. This is a source-provenance correctness gap, not a requirement for external custody.

The source fixture is intentionally a test shape, not evidence of model participation or quality. This check does not establish external provider identity, genuine model calls, candidate validity, runtime behavior, Match outcomes, calibration, or league readiness. Plan 05 must consume only explicitly admitted source bytes and preserve the missing frozen-bundle provenance before any later supervision.

_Independent bounded review; no source edits or commit performed._
