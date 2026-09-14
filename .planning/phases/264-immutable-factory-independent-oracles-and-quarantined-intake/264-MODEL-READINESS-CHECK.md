---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-04-frozen-model-readiness
checked: 2026-09-13
status: passed
targeted_test: 7/7 passed
open_gaps: 0
recheck: 2026-09-13
repaired_commits: [42298ff8, 26fb12c7]
---

# Phase 264 Frozen-Model Readiness Check

This is a bounded source/provenance mechanics review only. The fixtures are not genuine provider evidence; no provider, network, credentials, source execution, Match, or candidate admission was used.

## Evidence checked

- `packages/strategy-oracle-model/src/bundle.ts`
- `packages/strategy-oracle-model/src/emit.ts`
- `packages/strategy-oracle-model/src/index.ts`
- `packages/strategy-oracle-model/src/model.test.ts`
- Plan 04/Summary and `packages/strategy-lab/src/factory/contracts.ts`

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts` — **7 tests passed** after the `42298ff8`/`26fb12c7` repair.

## Re-check after model repair

The two initial provenance gaps are closed at the Plan 04 package boundary:

- `issueModelFactoryPacketProvenance` now retains the exact admitted full `FrozenModelBundle` beside the exact emitted packet. `requireIssuedModelFactoryPacketProvenance` requires the issued packet/companion identities, re-requires the admitted bundle, rederives the companion root, and checks bundle, packet, source, provider, and lineage bindings. The companion therefore carries the frozen request, response, accounting, attempt, budget, and ordinal records through the retained bundle rather than dropping them at packet conversion.
- `emitModelFactoryPacket` now requires exact equality between requested lineage and the admitted bundle lineage before packet creation. A request-side lineage override is rejected.

The focused test additions exercise exact issued-companion identity, cloned packet/companion rejection, lineage override rejection, and companion-root changes when request, response, accounting, or attempt inputs change. `FactoryOraclePacketSchema.parse` uses the shared canonical admission and recursive `freezeLabValue`, so the issued packet itself is immutable; the focused test is mechanics-only and does not constitute provider/model evidence.

Persistence, atomic consumption, and any genuine provider receipt remain Plan 05 integration responsibilities. A standalone validated synthetic companion is not genuine empirical evidence.

## Scientist-critical checks (current re-check)

| Check | Result | Evidence |
|---|---|---|
| Canonical frozen bundle admission | PASS (mechanics) | `admitFrozenModelBundle` canonicalizes input, enforces exact keys, freezes admitted data, and requires stable bundle/response/source roots and byte lengths. Structural clones are rejected by the weak admission set. |
| Provider/model/version/settings/request/response/token/resource/attempt provenance | PASS at bundle boundary | `bundle.ts:39-56,67-85` requires provider identity, request root/length, response source/root, source bytes/hash, token/resource accounting, attempt/budget/ordinal, native lane, and lineage. |
| Unavailable and identity drift | PASS (mechanics) | `assessFrozenModelIdentity` returns new-root charged terminal blocks for unavailable and mismatched provider identities; no substitution or retry is introduced. |
| Unsupported native lanes | PASS fail-closed | `validateBundle` accepts only TypeScript/v1.19/translation-none and rejects other lanes before packet conversion. Unsupported lanes are rejected, not represented as charged blocks; this is distinct from the required charged unavailable/drift dispositions. |
| No provider/model/source execution | PASS | The package imports hashing, canonical admission, schemas, and TypeScript AST tooling only; no provider SDK, network, credential, dynamic import, runner, or source evaluation path exists. |
| Required source shape and closure | PASS (mechanics) | `assertModelSourceClosure` requires an object-literal `export default` with real `selectActivations` and `soldierBrain` methods, rejects imports/async/`this`, unresolved identifiers, direct/computed constructor recovery, forbidden capabilities, and then applies `validateStrategySource`. |
| Exact packet API and source/packet roots | PASS (mechanics) | `emitModelFactoryPacket` is exported from the leaf, accepts only an admitted bundle, preserves source/provider/native-lane values, validates `FactoryOraclePacketSchema`, and derives the packet root from the packet contents. |
| Full frozen-attempt provenance survives packet conversion | PASS (mechanics) | `emit.ts` issues a private frozen companion containing the complete admitted `FrozenModelBundle`; the companion root binds that bundle plus packet/source roots. The focused regression changes request, response, accounting, and attempt inputs and observes distinct companion roots. |

## Historical initial review (superseded by the re-check above)

The initial 5-test review recorded two gaps: the packet conversion did not yet retain a full frozen-bundle companion, and request lineage was not compared with admitted bundle lineage. Those findings are retained here as historical evidence; both are resolved by the repaired implementation and the 7-test focused regression.

## Scope and limitations

The source fixture is intentionally a test shape, not evidence of model participation or quality. This check does not establish external provider identity, genuine model calls, candidate validity, runtime behavior, Match outcomes, calibration, or league readiness. Plan 05 must consume only explicitly admitted source bytes and preserve the full frozen-bundle provenance atomically before any later supervision.

_Independent bounded review; no source edits or commit performed._
