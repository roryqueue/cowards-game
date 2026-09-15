# Phase 265: Serious Current-Rules League and Development Red Team - Pattern Map

**Mapped:** 2026-09-14  
**Files analyzed:** 15 proposed source/test files  
**Analogs found:** 12 / 15 (role or integration matches; no exact solver/PSRO/selection analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/strategy-lab/src/league/contracts.ts` | contracts/schema | transform / request-response | `src/contracts.ts`, `src/factory/contracts.ts` | role-match |
| `packages/strategy-lab/src/league/identity.ts` | utility/identity | transform | `src/factory/identity.ts`, `src/identity.ts` | exact domain pattern |
| `packages/strategy-lab/src/league/matrix.ts` | coordinator/reducer | CRUD/batch | `src/tasks.ts`, `src/reduce.ts` | role + data-flow match |
| `packages/strategy-lab/src/league/solver.ts` | utility/solver | transform | `src/reduce.ts`, `src/factory/numeric-calibration.ts` | partial; solver is new |
| `packages/strategy-lab/src/league/psro.ts` | coordinator | event-driven/batch | `src/runner.ts`, `src/factory/admission.ts` | partial; loop is new |
| `packages/strategy-lab/src/league/selection.ts` | reducer/selector | transform | `src/factory/admission.ts`, `src/factory/fingerprint.ts` | partial; gates are new |
| `packages/strategy-lab/src/league/red-team.ts` | coordinator/ledger | event-driven | `src/factory/ledger.ts`, `src/runner.ts` | role + accounting match |
| `packages/strategy-lab/src/league/report.ts` | projection/reporter | transform/file-I/O | `src/factory/supervision-artifacts.ts`, `src/factory/repository.ts` | role + privacy match |
| `packages/strategy-lab/src/league/connected-runner.ts` | integration runner | request-response/streaming | `src/runtime-bridge.ts`, `src/runner.ts` | integration match |
| `packages/strategy-lab/src/league/{contracts,identity,matrix,solver,psro,selection,red-team,report,connected-runner}.test.ts` | test | transform/request-response | corresponding existing `*.test.ts` files | role-match |
| `packages/strategy-lab/src/index.ts` | barrel export | request-response | `src/factory/index.ts` | exact |

The implementation must reuse the full `MATCH_KERNEL` path, the supervised provider/runtime bridge, and immutable Phase-264 candidate/supervision roots. Do not copy the historical direct-source matrix runner (`.planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts`); it uses `new Function`, display-arena keys, and seed-parity initiative and is explicitly a regression fixture only.

## Pattern Assignments

### `packages/strategy-lab/src/league/contracts.ts` (contracts/schema, transform)

**Analogs:** `packages/strategy-lab/src/contracts.ts`; `packages/strategy-lab/src/factory/contracts.ts`.

**Canonical admission and roots** (`src/contracts.ts:4-15, 43-54`):

```typescript
export type LabRoot = `sha256:${string}`
export const freezeLabValue = <T>(value: T): Readonly<T> => { /* recursively freeze */ }
export const labRoot = (domain: string, value: unknown): LabRoot => {
  const admitted = admitCanonicalJsonValue(["cowards:strategy-lab:v1", domain, value], { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("LAB_CANONICAL_VALUE")
  return `sha256:${createHash("sha256").update(admitted.canonicalBytes).digest("hex")}`
}
```

Use strict private schemas with exact keys, `privacy: "private_offline"`, schema versions, bounded canonical JSON, frozen values, and discriminated dispositions. Mirror `FactoryAttemptTerminal` (`factory/ledger.ts:9-18, 40-42`) for accepted/rejected/invalid/duplicate/legal-but-weak/player/system/unfilled evidence. Contracts must encode population, semantic-arena, condition, runtime, request, snapshot, round, solver, red-team, portfolio, mixture, and finalist roots; no public DTO or production Strategy identity.

### `packages/strategy-lab/src/league/identity.ts` (identity utility, transform)

**Analog:** `packages/strategy-lab/src/factory/identity.ts:1-23`.

```typescript
export const deriveFactoryAttemptRoot = (value: unknown): LabRoot =>
  labRoot("factory-attempt-v1", withoutRoot(value as Rooted))
export const deriveFactoryCandidateRoot = (value: unknown): LabRoot =>
  labRoot("factory-candidate-v1", withoutRoot(value as Rooted))
```

Create domain-separated roots by removing only the self `root` field. Add separate domains for candidate population, unordered pair/canonical entrant order, four-condition row, semantic arena cell, population snapshot, solver manifest/output, PSRO round/target/admission, red-team allocation/attempt, portfolio, and report. Canonical ordering must use immutable candidate identity and `semanticGeometryHash`, never completion order, display ID, directory order, or seed spelling.

### `packages/strategy-lab/src/league/matrix.ts` (batch coordinator/reducer, CRUD)

**Analogs:** `packages/strategy-lab/src/tasks.ts:7-34`; `packages/strategy-lab/src/reduce.ts:6-42`; `packages/spec/src/set-condition-policy-v1-37.ts:62-88`.

**Task allocation pattern** (`tasks.ts:14-31`): validate context, derive each task root from immutable identity, reject duplicate representatives, then freeze the graph. Adapt it to enumerate `8 * C(n,2)` cells: canonically sorted unordered candidate pairs × `CANONICAL_SET_CONDITION_ROWS_V1_37` × unique active semantic geometry hashes.

**Condition identity pattern** (`set-condition-policy-v1-37.ts:230-285`): use explicit `bottom`, `top`, and `initialInitiative` entrant keys and retain scenario/condition/request identities. Do not infer fairness from seed parity.

**Reduction/admission pattern** (`reduce.ts:8-12, 19-42`): require exact coverage and unique roots, sort by canonical ordinal/root, derive semantic projections explicitly, and return a rooted complete/non-pass result. Unlike the old reducer, any missing, duplicate, conflicting, invalid, or system-failed cell must block solving and must never become a zero/draw/imputed payoff.

**Arena identity guard:** `packages/spec/src/arena-catalog-v1-37.ts:268-317` parses and rejects duplicate active `semanticGeometryHash` values. Reuse that identity rule so Smoke/Open Field contributes one empty geometry; Standard Cross is the other active geometry. Keep display labels as metadata only.

### `packages/strategy-lab/src/league/solver.ts` (exact deterministic solver, transform)

**Closest analogs:** `packages/strategy-lab/src/reduce.ts:38-42` for canonical output; `packages/strategy-lab/src/factory/numeric-calibration.ts` for numeric evidence. **No exact existing solver.**

Implement only after the synthetic numerical spike freezes algorithm/version, exact numeric representation, canonical entrant ordering, iteration/convergence schedule, normalization, tie-breaks, and failure codes. Prefer the researched exact-rational `bigint` design. Match score values should be integer half-point units before rational operations; emit normalized non-negative weights summing to `1/1` and canonical bytes. Provide golden, permutation, repeat, worker-count, shard-order, restart, and adversarial-boundary vectors. The solver accepts one complete immutable snapshot root and cannot inspect live cells or mutate a prior distribution.

### `packages/strategy-lab/src/league/psro.ts` (response-loop coordinator, event-driven/batch)

**Closest analogs:** `packages/strategy-lab/src/runner.ts:14-31, 46-75` for immutable execution binding and resume; `packages/strategy-lab/src/factory/admission.ts:49-78` for staged admission. **No exact PSRO analog.**

Reuse the runner discipline: bind execution/provider roots once, resume only from content-addressed artifacts, and never refund uncertain work. Each round must root the input snapshot, frozen meta-distribution, strongest/vulnerable pure targets, and response allocation. Admit a response only after legal/runtime/evidence validation, independence/clone and novelty checks, and positive-response gate; accepted responses create the next population/snapshot root. Rejected, weak, duplicate, invalid, player-violation, system-failure, retried, and unfilled outcomes remain charged ledger events.

### `packages/strategy-lab/src/league/selection.ts` (portfolio/finalist reducer, transform)

**Closest analogs:** `packages/strategy-lab/src/factory/fingerprint.ts:29-49, 85-117`; `packages/strategy-lab/src/factory/admission.ts:63-78`. **No exact robust-pure selector.**

Consume the six receipt-derived fingerprint dimensions and all response evidence, not names/source hashes alone. Keep diagnostic mixture, diverse pure portfolio, and robust-pure finalist as separate rooted artifacts. Implement the conjunctive frozen gates over mixture performance, strongest-pure targets, accepted counters, pure-policy worst case, independent probes, invariance, legality, privacy, runtime, family/core/lineage/behavior diversity. Return `{ kind: "robust_pure_finalist", candidateRoot }` only when every gate passes; otherwise return the explicit `no_robust_pure_finalist_found` disposition with failed gate roots. Never promote a mixture through ordinary Strategy Revision registration.

### `packages/strategy-lab/src/league/red-team.ts` (multi-channel ledger/coordinator, event-driven)

**Analogs:** `packages/strategy-lab/src/factory/ledger.ts:9-42`; `packages/strategy-lab/src/factory/repository.ts:57-77`; `packages/strategy-lab/src/runner.ts:61-74`.

Use the factory start/terminal shape: record `started` before validation/dispatch, bind allocation and retry parent, then publish exactly one terminal disposition linked to the start root. Every automated, model, human, and external channel needs an allocation row; zero is valid only when an explicit Phase-265 authorization says so. Preserve failed and unused capacity, and charge uncertain launches at the frozen ceiling. A successful counter must be returned to `psro.ts` as a declared response target, not appended as a report annotation.

The protocol must produce invariance/probe receipts for side, initial initiative, horizontal symmetry, opaque IDs, Soldier/source ordering, semantic-arena identity, deterministic repeat, and source-order/tie-break stability, while retaining private evidence and excluding source/memory/objective payloads from safe projections.

### `packages/strategy-lab/src/league/report.ts` (private projection, transform/file-I/O)

**Analogs:** `packages/strategy-lab/src/factory/supervision-artifacts.ts:65-106, 108-176`; `packages/strategy-lab/src/factory/repository.ts:57-77`.

Follow the private canonical JSONL/chunk pattern: publish immutable bytes once, link chunks with previous roots and bounded descriptors, and reopen as data-only with `issued: false` (`supervision-artifacts.ts:71-105, 108-176`). Reports must be rooted in complete population/snapshot/solver/red-team artifacts and expose complete iteration curves, matrices, distributions, response graphs, worst cases, gaps, attempts, budgets, and finalist dispositions. Safe projections must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw traces, and runtime diagnostics; claims remain oracle-relative and must not say Nash, optimal, solved, or permanent balance.

### `packages/strategy-lab/src/league/connected-runner.ts` (integration runner, request-response/streaming)

**Analogs:** `packages/strategy-lab/src/runtime-bridge.ts:8-22, 26-84`; `packages/strategy-lab/src/runner.ts:35-59`.

The runtime bridge is the execution boundary. `runCanonicalLabMatch` creates `MATCH_KERNEL.createMachineV119`, checks provider identity against tuple/image/runtime roots, invokes providers for kernel effects, validates request/input/ordinal/charged/completed evidence, resumes the kernel, and converts failures to private system failure (`runtime-bridge.ts:26-84`). Reuse this contract for every matrix cell and red-team match. The connected runner should bind candidate/provider supervision receipts and condition/arena roots, call the full kernel Match once per cell, retain transitions/accounting/trace roots, and publish via existing shard/repository mechanisms. It must not execute source, copy rules, use `new Function`, use Node `vm`, create formation artifacts, or enter production/web/API/Go paths.

### Tests

Mirror the colocated test style (`tasks.test.ts`, `runner-invariance.test.ts`, `factory/{repository,ledger,admission,fingerprint}.test.ts`). Tests should use synthetic records/providers only and prove: exact `8 * C(n,2)` cardinality; Smoke/Open Field alias collapse; gap/duplicate/conflict/system-failure fail-closed behavior; solver golden/permutation/restart/layout invariance; immutable PSRO target/re-entry; charged all-channel red-team dispositions; fingerprint diversity and mixture/portfolio separation; conjunctive robust-pure/no-finalist behavior; private projection denylist; and connected runner use of `MATCH_KERNEL` with supervised identity checks. Do not run candidates, production dispatch, formation logic, or live Phase-265 allocation from tests.

## Shared Patterns

### Content-addressed immutable values

**Sources:** `packages/strategy-lab/src/contracts.ts:4-15, 43-54`; `packages/strategy-lab/src/factory/identity.ts:7-23`.

Use `admitCanonicalJsonValue`, exact key sets, domain-separated `labRoot`, recursive `freezeLabValue`, and self-root derivation. Inputs and outputs are immutable; never use mutable `latest` or directory order.

### Charge-before-work and publish-once evidence

**Sources:** `packages/strategy-lab/src/runner.ts:20-31, 46-74`; `packages/strategy-lab/src/factory/repository.ts:57-77`; `packages/strategy-lab/src/factory/ledger.ts:40-43`.

Record starts before work, publish terminals only against the exact start root, reject overwrite/conflict, preserve uncertain starts as charged failures, and reduce only complete canonical coverage.

### Supervised full-kernel execution

**Source:** `packages/strategy-lab/src/runtime-bridge.ts:26-84`; admitted kernel export at `packages/engine/src/kernel/driver.ts:757-773`.

All league Matches use `MATCH_KERNEL.createMachineV119`/`stepMatch` through the supervised provider bridge. No direct source execution or league-side legality/scheduler implementation.

### Semantic condition and arena identity

**Sources:** `packages/spec/src/set-condition-policy-v1-37.ts:62-88, 230-285`; `packages/spec/src/arena-catalog-v1-37.ts:268-317`.

Use explicit four side/entrant-level-initial-initiative rows and active semantic geometry hashes. Smoke/Open Field is one geometry and duplicate active hashes are integrity failures.

### Privacy-safe private report reopening

**Source:** `packages/strategy-lab/src/factory/supervision-artifacts.ts:108-176`.

Reopening grants bounded data-only access and never reissues execution authority. Apply the same private/offline boundary to all league reports.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `league/solver.ts` | solver | transform | No empirical-game solver exists; freeze algorithm only after synthetic spike. |
| `league/psro.ts` | coordinator | event-driven/batch | No response-loop implementation exists; adapt runner/admission ledgers. |
| `league/selection.ts` | selector | transform | No robust-pure conjunctive reducer exists; adapt fingerprint evidence. |

## Metadata

**Analog search scope:** `packages/strategy-lab/src/{tasks,shards,reduce,runner,runtime-bridge,factory}`, `packages/spec/src/{set-condition-policy-v1-37,arena-catalog-v1-37}`, `packages/engine/src/kernel/driver.ts`  
**Files scanned:** 15 primary analogs plus colocated tests  
**Pattern extraction date:** 2026-09-14
