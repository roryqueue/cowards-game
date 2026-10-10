# Two-Match supplement independent plan recheck v2

## VERIFICATION PASSED

Scope: revised existing Plan16 two-Match feasibility supplement only. One plan, three serial tasks, six owned source/test paths. Zero current blockers; `issues: []`. v1 report/finding preserved unchanged as audit trail.

The v1 replay-contract BLOCKER is addressed. The revised plan explicitly defines noncanonical compact-board evidence and does **not** pass recursively redacted legacy frames to full reconstruction APIs. It disclaims full Chronicle/replay/semantic-transition qualification, sets `fullChronicleVerified=false`, and leaves all original Chronicle/LEAG/phase gates pending with `requirements_completed: []`. This is an honest scoped feasibility contract, not a waiver or fabricated canonical certificate.

## Actual signature/schema cross-check

- `FullBoardSnapshotSchema` (`packages/spec/src/schemas.ts:381`) contains bounds/soldiers/terrainStones; plan correctly uses it for that public-board subset and separately enforces exact projected keys. `SoldierSnapshotSchema` (`:326`) omits soldierMemory and retains exactly id/ownerPlayerId/status/position/facing/lastSuccessfulMoveDirection, matching the plan. Position/facing/lastSuccessfulMoveDirection nullable semantics remain supported. Metadata phase/counters/initiative match actual GameState fields, with COMPLETE terminal state required for success.
- `canonicalReplayTerrain` (`packages/replay/src/reconstruct.ts:59`) accepts position arrays and returns projected x/y sorted by y/x. Using it only for safe ordering is supported and makes no replay-execution claim.
- Actual native composition supplies `LabMatchExecution.transitions` and completed result.state. Its failure variant has an empty transition array; plan explicitly permits absent failure board evidence and never promotes it to success.
- Accounting exact descriptor fields match `compactExecution` (`scripts/run-v1-38-lean-experiment.ts:174`). `deriveFactoryOrderedRecordDescriptor("lean-accounting", rows)` is the real bounded per-record chain API; wrapping its descriptor in `labRoot("lean-accounting-v1", ...)` matches the existing compact root. `LabRuntimeIdentity` ten keys and the four actual FactorySupervisionProvider extension keys correspond to the plan's allowlist. Actual factory runtime verifies native evidence and wraps it with that admitted extended identity; the plan preserves this opaque producer-side authenticity and does not claim the reader can reissue it.
- Board state/row domains, exact bounded NDJSON shape, start→transition→terminal continuity, canonical start positions/declared board geometry, public outcome, accounting roots/counts and terminal/result anchors now form an explicit implementable producer→reader contract. No engine/Strategy execution is needed for reader schema/continuity/start/bounds checks. Full-state hash and Chronicle reconstruction are expressly not claimed. Coherent wholesale rewriting limitations are disclosed.
- Connected inert positive producer→reader fixture, privacy sentinels, missing Soldier facing, coordinate/transition/provider/debit/accounting tampering and recomputed-frame/stale-terminal plus recomputed-terminal/stale-result anchors are executable acceptance requirements in Task2. They exercise the real selected projection/reader rather than inventing compatible Chronicle input.
- Source role spelling and `source-${role}.json` metadata convention match actual baseline source role whitelist. Existence/full roots are still gate inputs, not assumed evidence or guessed authority.

## Preserved passed checks

Approval window22:06:36UTC..00:06:36UTC/frontier23:15:36UTC/carry322054903/cap329254903, two600000ms plus31-minute reserve and all-work charging remain unchanged. Guest1000/startup2500/host5000/Match600000 and3GBRAM/15GBtotal preserved; forty old Match charges/both prior non-Match attempts/retained costs remain immutable, historical peaks unknown. At most two frozen Smoke/seed/seat-swapped Matches, absolute bottom initiative; no probes/retries/third Match/training/formation/holdout/public/counting/production.

Separate prospective opaque capacity/admission/debit/seat authority and existing issued WeakMap/V8 claim path remain explicit, with durable debit before providers, no scalar/caller override/fake old ledger/attempt5 route. Shared composer preserves legacy wrappers/defaults/windows; compactExecution permits undefined legacy allocation plus mandatory new guard. All independent source review/fix/validation/source verification gates precede prepare; source/HEAD held through unique ROOT entry/terminal and one independent O_RDONLY reader. Zero new owned diagnostics required; inherited strict/cleanup/global coverage gaps remain unwaived.

Task structure/dependencies, key links, scope, private HOST tier, project constraints and shared pattern compliance pass within this supplement. Three automated task verify commands are present; original phase VALIDATION exists, supplement research has no Validation Architecture (formal supplement Nyquist table not applicable). No responsibility map/open unresolved research question applies. Full league requirement coverage is not credited by this scoped PASS.

No runtime, tests, typecheck, boundary checker, preparation, allocation, capacity observation, entry, provider, Strategy, Match, empirical reader or source edits ran during recheck. Only this fresh v2 report was written; v1/history/source/STATE untouched. All commands closed; report ownership released on delivery. Source execution may proceed under the existing approval/gates; this report grants no empirical admission or readiness.

```yaml
issues: []
status: VERIFICATION_PASSED
scope: two-match-private-feasibility-supplement-only
requirements_completed: []
```

<oai-mem-citation>
<citation_entries>
MEMORY.md:92-95|note=[preserve narrow experimental scope from initial check]
</citation_entries>
<rollout_ids>
01a05548-40a1-7b32-b84e-39b15d18c048
</rollout_ids>
</oai-mem-citation>
