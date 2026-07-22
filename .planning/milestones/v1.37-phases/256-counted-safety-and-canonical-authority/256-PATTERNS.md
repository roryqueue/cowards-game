# Phase 256: Counted Safety and Canonical Authority - Pattern Map

**Mapped:** 2026-07-12
**Planned seams classified:** 24
**Pattern families found:** 5 / 5

This map is deliberately limited to Phase 256. It maps the new authority/evidence spine, tuple persistence, scheduling/execution rechecks, append-only historical correction, and privacy-safe projections. Transition-kernel, Chronicle-conformance, Strategy-input, arena, and Set-fairness work remains in later phases.

## File Classification

| New/Modified File or Seam | Role | Data Flow | Closest Current Analog | Match Quality |
|---|---|---|---|---|
| `packages/spec/src/integrity-authority.ts` | model / registry | transform, exact lookup | `packages/spec/src/runtime.ts` | role + flow exact |
| `packages/spec/src/integrity-authority.test.ts` | contract test | table-driven transform | `packages/spec/src/competition-governance.test.ts` | test-shape exact |
| `packages/spec/src/runtime-evidence.ts` | model / policy evaluator | transform | `packages/spec/src/competition-governance.ts` plus `runtime.ts` | role exact |
| `packages/spec/src/runtime-evidence.test.ts` | contract test | table-driven transform | `packages/spec/src/competition-governance.test.ts` | test-shape exact |
| `packages/spec/src/index.ts` | barrel | export | existing `packages/spec/src/index.ts` | exact |
| `packages/spec/src/runtime.ts` | registry compatibility facade | transform | existing registry/evaluator sections in the same file | exact modification |
| `packages/spec/src/match-execution-contract.ts` | boundary contract | request-response | `packages/spec/src/runtime-execution-service.ts` | role exact |
| `packages/spec/src/competition-entry-eligibility.ts` | public decision projection | transform | `packages/spec/src/competition-governance.ts` | role exact |
| `packages/spec/src/public-output-privacy.ts` | guard / validator | transform | `assertPublicCompetitionGovernanceLeakSafe` | role exact |
| `scripts/generate-v1-37-integrity-authority.ts` or equivalent | generator | file I/O, batch | `scripts/evaluate-v1-35-boundary-surface-inventory.ts` | flow exact |
| committed authority/tuple manifest and hash-vector fixture | config / fixture | file I/O, transform | v1.35 generated inventory artifacts plus `packages/replay/src/hash.ts` | role match |
| `packages/persistence/migrations/0012_integrity_authority.sql` or next migration | migration | DDL / append-only storage | `0011_competition_governance_surfaces.sql` | role exact |
| `packages/persistence/src/integrity-evidence.ts` | repository / service | CRUD, event projection | `packages/persistence/src/governance.ts` | role + flow exact |
| `packages/persistence/src/integrity-evidence.test.ts` | persistence test | transactional CRUD | `packages/persistence/src/governance.test.ts` | test-shape exact |
| `packages/persistence/src/ladder.ts` | scheduling gate | transactional request-response | existing `runtimeEligibility`, entry, and schedule paths | exact modification |
| `packages/persistence/src/governance.ts` | event projection | transactional CRUD | existing audit-event writer | exact modification |
| `packages/persistence/src/index.ts` | barrel | export | existing `packages/persistence/src/index.ts` | exact |
| `apps/go-backend/integrity_evidence.go` or equivalent | policy parity / boundary gate | request-response, transform | `provider_readiness.go` and `runtime_service_client.go` | role exact |
| `apps/go-backend/integrity_evidence_test.go` | Go parity test | table-driven transform | `provider_readiness_test.go` | test-shape exact |
| `apps/go-backend/orchestrator.go` | claim/execution coordinator | request-response | current claim/failure/completion pipeline | exact modification |
| `apps/go-backend/runtime_service_client.go` | transport DTO / validator | request-response | current request validation and SHA-256 artifact checks | exact modification |
| `apps/runtime-service/src/execute-match.ts` | execution boundary | request-response | current schema-first fail-closed dispatcher | exact modification |
| `apps/runtime-service/src/counted-safety.test.ts` | boundary test | request-response | `execute-match.test.ts` | test-shape exact |
| `scripts/check-v1-37-integrity-boundaries.ts` and `.test.ts` (or focused additions to the existing monitor) | structural monitor / test | file I/O, batch | `check-boundary-monitors.ts` and `.test.ts` | role + flow exact |

## Pattern Assignments

### Spec-owned authority, tuple, and evidence contracts

**Applies to:** `integrity-authority.ts`, `runtime-evidence.ts`, their tests, and the `runtime.ts` compatibility facade.

**Primary analogs:**

- `packages/spec/src/competition-governance.ts:7-45` for literal registries whose union types derive from `as const` arrays.
- `packages/spec/src/competition-governance.ts:64-119` for one private policy table plus a pure validator/evaluator.
- `packages/spec/src/runtime.ts:1116-1260` for immutable runtime adapter records.
- `packages/spec/src/runtime.ts:1447-1484` for exact registry lookup and issue collection.
- `packages/spec/src/runtime.ts:1486-1525` for a derived compatibility view.

**Copy the literal-registry/type pattern:**

```ts
export const COMPETITION_GOVERNANCE_ACTIONS = [
  "under_review",
  "counted",
  "non_counted",
] as const

export type CompetitionGovernanceAction =
  (typeof COMPETITION_GOVERNANCE_ACTIONS)[number]
```

Use this shape for authority domains, evidence status/reason codes, tuple components, certificate status, and historical-resolution states. Keep all new arrays and records immutable (`as const` plus `satisfies`) and return new projections rather than mutable registry objects.

**Copy the single-policy-table pattern:**

```ts
const ACTION_POLICY: Record<CompetitionGovernanceAction, {
  categories: readonly CompetitionGovernanceCategory[]
  publicExplanation: string
}> = { /* exhaustive rows */ }

export const competitionGovernanceActionPolicy = (action, category) => {
  const policy = ACTION_POLICY[action]
  if (!policy.categories.includes(category)) throw new Error(/* stable detail */)
  return policy
}
```

The Phase-256 evaluator should likewise be pure and exhaustive. It should accept the exact active tuple, lane identity, containment certificate, conformance certificate, freshness instant supplied by the caller, and operator kill-switch state, then return one canonical `counted | exhibition_only | disabled` result plus stable reason code and evidence references. No caller-local `approve` or `countedResultsAllowed` boolean may create promotion.

**Registry lookup pattern to tighten:** `runtime.ts:1447-1484` currently finds provider/adapter records and returns issue codes. Preserve the pure lookup style, but Phase 256 must reject aliases and independently-known tuple members: lookup only by exact tuple ID, compare the entire expanded tuple, and compare the full executable identity.

**Compatibility facade pattern to replace:** `runtime.ts:1486-1512` currently derives `countedResultsAllowed` from static language/adapter booleans. Keep the derived-view idea, but derive public/product semantics from the canonical evaluator. The current counted literals at `runtime.ts:429-602` and `1116-1260` are the stale authority to converge, not values to copy into the new authority.

**Test pattern:** `competition-governance.test.ts:13-65` uses `it.each` for exhaustive fixed mappings, explicit invalid-combination assertions, and public-leak assertions. Use the same structure for:

- every tuple component mutation changing or invalidating the ID as appropriate;
- missing/stale/revoked/mismatched containment and conformance certificates;
- operator-disable and re-enable-without-proof cases;
- wildcard, `latest`, partial, mixed, and unknown tuples;
- public DTO privacy and restricted DTO denylist cases.

### Fixed-order tuple hashing and generated authority artifacts

**Applies to:** the tuple generator, committed semantic tuple manifest, generated owner manifest, and TypeScript/Go hash vectors.

**Crypto analog:** `packages/replay/src/hash.ts:1-4,27-32` shows the repository convention for platform SHA-256:

```ts
import { createHash } from "node:crypto"

createHash("sha256")
  .update(bytes)
  .digest("hex")
```

Only copy the platform-crypto call. Do **not** copy `stableStringify` from `hash.ts:6-25` for tuple identity: Phase 256 research requires a domain-separated, fixed-field-order byte record because Phase 258 owns canonical JSON. The generator and Go verifier must share committed byte/hash vectors.

**Generated-artifact analog:** `scripts/evaluate-v1-35-boundary-surface-inventory.ts` uses a deterministic evaluator, stable `generatedBy`/`generatedAt` metadata, typed renderers, and explicit artifact writes. Follow that source -> deterministic renderer -> committed artifact -> stale-artifact monitor chain. Never embed environment secrets, absolute host paths, or raw certificate bytes in the generated manifest.

**Manifest content pattern:** publish package/symbol ownership and the six semantic fields (`rules`, `engine`, `runtimeAbi`, `chronicle`, `arenaCatalog`, `setPolicy`) with tuple ID and expansion. Keep provider/runtime/toolchain/adapter/policy/corpus/artifact/build identity in a separate executable-lane record so rebuilds revoke evidence without minting a semantic tuple.

### Persistence: append-only evidence, legacy resolution, and cohort correction

**Applies to:** migration 0012 (or next sequence), `integrity-evidence.ts`, `governance.ts`, `ladder.ts`, and persistence tests.

**Migration analog:** `packages/persistence/migrations/0011_competition_governance_surfaces.sql:11-31` uses explicit checks, foreign keys, partial uniqueness, and query indexes. Lines 33-43 enforce append-only storage at the database boundary:

```sql
create or replace function reject_competition_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'competition audit events are append-only';
end;
$$;

create trigger competition_audit_events_append_only
before update or delete on competition_audit_events
for each row execute function reject_competition_audit_mutation();
```

Use the same DB-enforced pattern for certificates, immutable release manifests, and governance classification/compensation events. Existing historical rows may remain nullable/unresolved; new-write application paths must require tuple ID plus expanded tuple and verify their equality. Do not write guessed backfills.

**Migration runner analog:** `packages/persistence/src/migrations.ts:17-58` discovers lexically ordered SQL files and applies each inside `withTransaction`. Add one normal numbered migration; do not create a bespoke migration runner.

**Transactional service analog:** `packages/persistence/src/governance.ts:258-363` validates/sorts inputs, locks targets, rejects incomplete evidence, and performs all writes in one `withTransaction`. Preserve that shape for cohort preview/apply:

1. normalize and deterministically sort the cohort predicate/input;
2. lock/read the candidate cohort;
3. calculate preview count/hash/sample IDs;
4. on apply, re-evaluate under the same transaction and reject preview drift;
5. append the classification event;
6. recompute standings from canonical evidence and the folded effective classification.

The direct `update match_sets` at `governance.ts:329-346` is a legacy pattern to replace for Phase-256 correction authority. The reusable piece is the append-only insert helper at `governance.ts:411-445`, not the mutable status column as authority.

**Scheduling seam:**

- `ladder.ts:117-190` is the current eligibility pipeline and demonstrates early typed rejection.
- `ladder.ts:656-717` evaluates inside the entry transaction before snapshot insertion.
- `ladder.ts:972-1088` locks the Season before deterministic scheduling.

Insert canonical evidence evaluation at both entry/scheduling and schedule-run creation. Persist the exact decision snapshot, tuple expansion/ID, registry generation, and certificate IDs/hashes. Re-read/re-evaluate before work can be claimed; a current failure must not merely change a display label.

**Persistence test analog:** `packages/persistence/src/governance.test.ts:9-84` uses a query-recording fake pool; lines 87-159 assert transactionality, no unintended state change, audit insertion, and evidence gating. Reuse the unit pattern for fast SQL-path assertions, then add real PostgreSQL migration/integration proof for append-only triggers, preview drift rejection, immutable historical rows, compensation, and deterministic recomputation.

### Go scheduling/claim parity and service request identity

**Applies to:** `integrity_evidence.go`, `provider_readiness.go`, `orchestrator.go`, `runtime_service_client.go`, and Go tests.

**Pure classification analog:** `apps/go-backend/provider_readiness.go:30-112` is a side-effect-free early-return classifier. Preserve the shape but replace duplicated provider/adapter switches with generated registry data and exact certificate/tuple verification. In particular, the final unconditional `CountedEligible: true` at lines 106-111 must disappear; current lanes begin quarantined.

**Claim/failure/completion analog:** `apps/go-backend/orchestrator.go:79-159` establishes the correct failure-safe sequence:

```go
claimed, err := lifecycle.claimNextMatchJob(...)
request, err := buildRuntimeServiceRequestForClaimedMatch(...)
response, failure := runtime.executeMatch(...)
// failures go through recordAttemptFailure as system failure
completed, err := completion.completeMatch(...)
```

Phase 256 should add a pre-claim/scheduling eligibility snapshot check, carry the immutable identity/evidence references in the request, and recheck after the runtime response before `completeMatch`. Any identity/generation/evidence drift must use the existing system-failure path and must not call completion or mutate gameplay/player penalties.

**Boundary validation analog:** `runtime_service_client.go:258-316` validates the full request and both Strategy revisions before transport. Extend the DTO and this validator with exact tuple expansion/ID, lane identity, certificate references/hashes, and registry generation. Reject any missing or mixed member atomically.

**Go SHA-256 analog:** `runtime_service_client.go:319-349` decodes bytes, validates byte count, computes `sha256.Sum256`, and compares hex. Use `crypto/sha256` for the shared fixed-order tuple vectors, without reproducing JSON canonicalization.

**Generated-data target:** `runtime_service_client.go:356-382` is a hand-written language/adapter switch and is a drift source. Replace it with generated exact registry data or a generated fixture consumed by Go. Keep fail-closed `default: false` behavior.

**Test pattern:** existing `provider_readiness_test.go` uses table-driven inputs and asserts that every non-ready state is not counted. Extend with per-field mutation vectors, certificate freshness/revocation, kill-switch, registry-generation drift, pre-claim rejection, in-flight abort, and TypeScript/Go tuple-hash parity.

### Runtime-service revalidation and privacy-safe failure

**Applies to:** shared execution contract, `execute-match.ts`, server request path, and `counted-safety.test.ts`.

**Schema-first failure analog:** `apps/runtime-service/src/execute-match.ts:56-84` builds a typed `systemFailure`, redacts diagnostics, then parses the response schema before returning it. Reuse this exact shape for `IDENTITY_MISMATCH`, `TUPLE_UNKNOWN`, `TUPLE_UNCERTIFIED`, stale/revoked evidence, and registry-generation drift.

**Current validation seam:** `execute-match.ts:262-299` validates provider/runtime compatibility and registry membership before creating an adapter. Replace registry-label readiness with the canonical exact evidence evaluator while retaining the early fail-closed return.

**Execution sequence:** `execute-match.ts:402-503` validates source/artifact, selects runtimes, executes, schema-validates success, and returns. Phase 256 should:

1. validate request schema and exact tuple/evidence identity before adapter creation;
2. recheck the active registry/certificates immediately before invocation;
3. execute only if containment permits execution;
4. recheck registry generation/evidence hashes before returning success;
5. return a schema-valid system failure on mismatch, with no gameplay completion downstream.

`execute-match.ts:506-539` is the repository's exception-to-redacted-system-failure wrapper and should remain the outer boundary.

**Test analog:** `execute-match.test.ts` already covers registry drift, provider mismatch, malformed requests, source identity mismatch, redacted exceptions, and response-schema drift. Build `counted-safety.test.ts` as a focused evidence-identity matrix, including a dependency hook that changes registry generation between pre-invocation and post-execution checks.

### Structural authority and privacy monitors

**Applies to:** `check-v1-37-integrity-boundaries.ts/.test.ts` or focused additions to the main monitor.

**Source ownership scan analog:** `scripts/check-boundary-monitors.ts:2680-2739` collects source/import text, checks dependency names, rejects forbidden authority markers, and scans Go/web for Strategy execution. Use the same deterministic repository scan for:

- exactly one registered owner/package/symbol per authority domain;
- no static counted-promotion authority outside the canonical evaluator;
- no duplicate tuple/member acceptance logic in Go, persistence, runtime-service, or web;
- no stale execution routes or contiguous-Activation public entry point (record the known Phase-257 exception explicitly until Phase 257 removes it);
- no public/default DTO field or marker exposing source, artifacts, memories, objectives, diagnostics, host data, proof paths, or security internals.

**Wiring pattern:** `check-boundary-monitors.ts:5493-5634` returns named checks grouped by a stable layer and runs all of them through the common `check` wrapper. Add Phase-256 checks to this array rather than a silent standalone script only.

**Synthetic-fixture test pattern:** `scripts/check-boundary-monitors.test.ts:198-213` creates a temporary repo/file tree, and the suite imports validator functions directly. The Phase-256 test should make each synthetic duplicate authority, stale route, partial tuple, unsafe public field, and operator-overpromotion fixture fail independently. Keep the production repo scan plus focused fixture tests.

## Shared Patterns

### Imports and package boundaries

- Spec contracts import only sibling spec modules and platform crypto where generation/hash verification requires it.
- Persistence consumes `@cowards/spec`; it does not define new eligibility semantics.
- Runtime-service consumes spec contracts and remains DB-free. Its current DB/authority prohibition is enforced at `check-boundary-monitors.ts:2680-2712`.
- Go orchestrates, persists, and classifies transport/system failure, but does not execute Strategy code or invent independent compatibility policy.
- Web/public consumers render safe projections; they do not decide eligibility.

### Error handling

- Pure spec evaluators return stable reason codes for expected ineligibility and throw only for malformed programmer-owned contracts.
- Persistence validates before writes and uses one transaction for snapshot/event/recompute operations.
- Go routes execution drift through `recordAttemptFailure(... Category: system_failure ...)`.
- Runtime-service always returns a schema-valid, redacted `systemFailure`; raw diagnostics remain restricted.

### Validation and immutability

- Validate tuple ID and expansion together at every boundary.
- Treat certificate and governance records as append-only in both code and SQL triggers.
- Treat legacy resolution as a read model. Never update original Match, Chronicle, entrant, or evidence bytes.
- Use caller-supplied/evidence-record time for pure freshness evaluation; do not hide `Date.now()` inside canonical policy.

### Public/operator projection split

Use `competition-governance.ts:151-165` as the public projection style and `competition-governance.ts:187-207` as the nested-key leak guard style. Public output is a newly constructed allowlisted DTO: status, calm category, tuple ID, non-sensitive evidence version/hash, and freshness date. The restricted operator DTO may add exact identity, gate results, remediation, cohort impact, and restricted proof IDs/links, but the shared denylist still blocks bytes, source, memories, objectives, credentials, host paths, raw diagnostics, and exploit detail.

## Legacy Patterns to Retire, Not Copy

| Current Pattern | Location | Phase-256 Replacement |
|---|---|---|
| Static language/adapter counted booleans | `runtime.ts:429-602`, `1116-1260` | Evidence-derived canonical evaluator; every lane initially quarantined. |
| Independently checked `spec` + `engine` strings | `ladder.ts:162-167`; `provider_readiness.go:139-146` | Atomic six-component tuple ID + expanded equality. |
| Provider proof implies counted readiness | `ladder.ts:175-190`; `provider_readiness.go:88-111` | Independent exact containment and conformance certificates. |
| Hand-written Go runtime registry switch | `runtime_service_client.go:356-382` | Generated registry data and cross-language vectors. |
| Mutable MatchSet status as correction authority | `governance.ts:329-346` | Folded append-only classification/compensation events. |
| Scheduling check without execution recheck | `ladder.ts` / Go orchestrator | Persist snapshot, recheck before claim/invocation and before success acceptance. |

## No Close Analog Found

| File / Concern | Reason | Planner Guidance |
|---|---|---|
| Read-only legacy tuple resolver with `resolved_historical`, `legacy_incomplete`, or `unresolved` result | Existing code has scattered version fields but no immutable six-component release-manifest resolution. | Design from `256-RESEARCH.md`; keep it a pure read model and prove source-row byte/hash stability before/after resolution. |
| Deterministic cohort predicate AST + preview hash + compensating rollback fold | Existing governance is append-only for audit rows but still mutates current MatchSet state directly. | Use the transaction and append-only patterns above; do not treat the current mutable projection as authority. |
| Exact executable identity certificate pair | Existing provider proof omits toolchain/corpus/policy/tuple and conflates readiness. | Use the research-defined separate containment/conformance certificates and full identity key; no wildcard or partial comparisons. |

## Metadata

**Analog search scope:** `packages/spec`, `packages/persistence`, `packages/replay`, `apps/go-backend`, `apps/runtime-service`, and `scripts`.

**Strong pattern families:** spec registry/projection, platform hash + generated artifact, transactional append-only persistence, Go claim/transport parity, runtime-service fail-closed boundary + structural monitors.

**Pattern extraction date:** 2026-07-12
