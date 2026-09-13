# Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake - Pattern Map

**Mapped:** 2026-09-13
**Files analyzed:** 14 inferred Phase-264 source/test areas
**Analogs found:** 11 strong role/data-flow matches / 14

This map is read-only guidance for the planner. Phase 264 must extend the private
`@cowards/strategy-lab` spine and must not widen production revision, persistence,
runtime-service, web, API, or Go ownership. The phase has no existing
oracle-package or human-intake implementation; those rows are explicitly
no-analog/role-match assignments below.

## File Classification

| New/Modified File (inferred) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/strategy-lab/src/factory/contracts.ts` | model/schema | transform | `packages/strategy-lab/src/contracts.ts` | exact |
| `packages/strategy-lab/src/factory/identity.ts` | utility/model | transform | `packages/strategy-lab/src/identity.ts` | exact |
| `packages/strategy-lab/src/factory/ledger.ts` | ledger/service | append-only file I/O | `packages/strategy-lab/src/shards.ts` | exact |
| `packages/strategy-lab/src/factory/admission.ts` | service/transform | request-response + transform | `packages/strategy-lab/src/planner/emit.ts` | exact seam |
| `packages/strategy-lab/src/factory/fingerprint.ts` | utility/transform | batch/transform | `packages/strategy-lab/src/identity.ts`, `reduce.ts` | role-match |
| `packages/strategy-lab/src/factory/model-bundle.ts` | model/schema/service | file I/O + request-response | `packages/strategy-lab/src/contracts.ts`, revalidation receipt path | role-match |
| `packages/strategy-lab/src/factory/intake.ts` | service/CLI backend | file I/O + request-response | `shards.ts` publication and `revalidate-strategy-revision-v1-19.ts` | role-match |
| `packages/strategy-lab/src/factory/*.test.ts` | test | transform/invariant | `contracts.test.ts`, `shards.test.ts`, `runtime-bridge.test.ts` | exact test style |
| `packages/strategy-oracle-tactical/src/index.ts` | oracle/provider | transform | `planner/assign.ts` + `planner/brain.ts` | role-match; no independent analog |
| `packages/strategy-oracle-teacher/src/index.ts` | oracle/provider | transform | `planner/assign.ts` / `runner.ts` | role-match; no independent analog |
| `packages/strategy-oracle-model/src/index.ts` | oracle/provider | request-response + file I/O | `planner/emit.ts` | role-match; no independent analog |
| `scripts/check-v1-38-factory-boundaries.ts` | utility/monitor | batch/transform | `scripts/check-boundary-monitors.ts` | role-match |

## Pattern Assignments

### Candidate artifact and strict contracts

**Target:** `factory/contracts.ts`, `factory/identity.ts`, and
`factory/admission.ts` — model/service + transform.

**Analog:** `packages/strategy-lab/src/contracts.ts` (lines 1-126), with source
and artifact identity constraints from `packages/spec/src/schemas.ts` (lines
919-1027 and 1110-1224).

**Imports and canonical admission** (`contracts.ts:1-4, 16-31, 54-71`):

```typescript
import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"

export type LabRoot = `sha256:${string}`
export const freezeLabValue = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeLabValue(child)
    Object.freeze(value)
  }
  return value
}
export const labRoot = (domain: string, value: unknown): LabRoot => {
  const admitted = admitCanonicalJsonValue(["cowards:strategy-lab:v1", domain, value], { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("LAB_CANONICAL_VALUE")
  return `sha256:${createHash("sha256").update(admitted.canonicalBytes).digest("hex")}`
}
```

Use exact-key checks, bounded canonical admission, discriminated classifications,
then deep-freeze the parsed value. Candidate identity must bind source bytes/hash,
build/toolchain, compatibility, factory/algorithm/schema versions, lineage,
doctrine/oracle family, split, validation, runtime profile, and fingerprints.
Do not reuse `StrategyArtifactKindSchema` as a production admission type: its
allowed kinds are product artifacts. Copy its cross-field source-hash and
language/toolchain consistency refinements into a disjoint private schema.

**Artifact identity analog:** `packages/spec/src/schemas.ts:919-1027` checks
WASM/source artifacts against revision source hash, ABI, target, and language;
`schemas.ts:1110-1224` checks artifact source byte/hash and validation/lineage
consistency. Preserve the same reject-on-mismatch style, but include immutable
factory metadata and no public/default DTO projection.

**Domain-separated roots:** `packages/spec/src/canonical-identity-domains.ts:25-74`
uses a known domain tag, length-framed segments, canonical JSON, and SHA-256.
For new candidate/attempt/bundle/fingerprint roots either add explicit private
domains through the canonical identity authority or retain the existing
`labRoot("<domain>", value)` wrapper; never concatenate unframed strings.

### Append-only charged attempt ledger

**Target:** `factory/ledger.ts` — ledger service, append-only file I/O.

**Analog:** `packages/strategy-lab/src/shards.ts` (lines 1-87, 118-193) and
`packages/strategy-lab/src/shards.test.ts` (lines 20-67).

**Safe publication pattern** (`shards.ts:57-87`):

```typescript
const publishBytes = (dir: string, id: string, bytes: Uint8Array, fault?: LabPublicationFault) => {
  const target = safePath(dir, id)
  const temporary = `${target}.tmp`
  const fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { /* bounded write */ fsyncSync(fd) } finally { closeSync(fd) }
  if (hashBytes(boundedRead(temporary, cap)) !== hashBytes(bytes)) fail("TEMP_TAMPER")
  linkSync(temporary, target) // atomic, non-overwriting publication
  const directoryFd = openSync(directory(dir), constants.O_RDONLY)
  try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
  unlinkSync(temporary)
}
```

`recordLabAttemptStart` (`shards.ts:118-126`) charges first by publishing a
content-addressed start marker. `publishLabShard` (`shards.ts:134-158`) rejects
duplicate coverage, requires a valid start for every non-`unused` record, and
publishes terminal evidence only after the shard is readable. `resumeLabInventory`
(`shards.ts:160-193`) conservatively reports uncertain starts and verifies every
terminal record root. Copy this no-refund behavior for accepted, rejected,
invalid, duplicate, legal-but-weak, failed, retried, and system-failed attempts;
never overwrite or erase an attempt to make a budget look unused.

### Hostile source admission and exact runtime semantics

**Target:** `factory/admission.ts`, factory intake, all three oracle emitters.

**Analog:** `packages/strategy-lab/src/runtime-bridge.ts` (lines 1-84),
`apps/runtime-service/src/revalidate-strategy-revision-v1-19.ts` (lines 324-426,
444-583), and `packages/runtime-js/src/supervised-subprocess-adapter.ts`
(lines 97-150, 403-522).

`runCanonicalLabMatch` validates provider identity against revision, tuple, image,
runtime limits, and admitted roots before invoking. It verifies exact request id,
method, input root, ordinal, charged/completed flags, bounded output, unique
invocation root, and provider-issued evidence (`runtime-bridge.ts:29-68`). Any
binding failure returns a private system failure with no transitions/result;
cleanup uncertainty also becomes `LAB_CLEANUP_INCOMPLETE` (`:69-84`). Preserve
this exact three-way mapping: `result.ok` success, typed player violation, or
system failure; no fallback lane and no source execution in coordinator/web/API/Go.

The revalidation analog validates exact source/artifact bytes and hashes,
provider/lane identity (`revalidate...:348-367`), copies bytes before dispatch
(`:426-440`), rejects current-lane execution (`:497-515`), and turns malformed
provider evidence into `REVALIDATION_EVIDENCE_MISMATCH` (`:517-561`). Use this
for every source regardless of origin, including model/human/external intake.

### Oracle package boundaries and deterministic emission

**Targets:** `strategy-oracle-tactical`, `strategy-oracle-teacher`,
`strategy-oracle-model` — provider/transform roles, no current analog for
physical strategic independence.

**Allowed planner building seam:** `packages/strategy-lab/src/planner/emit.ts`
(lines 1-42, 44-73). It statically concatenates known modules, rejects
unexpected imports/re-exports, transpiles, checks syntax/closure/capabilities,
then validates source and builds a revision with exact runtime metadata. Copy
the `SOURCE_MODULES` allowlist, `assertPlannerSourceClosure`, source root,
module roots, and `buildStrategyRevision` validation shape for each emitter.

**Tactical optimizer interface analog only:** `planner/assign.ts:1-28, 74-115`
and `planner/brain.ts:1-20, 54-116`. Keep selector, mission scoring, Action
scoring, and search state physically in the tactical package. These files are
interface/contract examples, not code to copy into multiple oracle packages;
the existing shared `missions.ts`/`brain.ts` strategic logic must not be shared.

**Search teacher/distiller interface analog only:** use `planner/assign.ts` as
an example of bounded deterministic ranking and `planner/emit.ts` as the
source-distillation boundary. Do not copy its selector, scorer, search tree, or
prompt into another oracle. Privileged counterfactuals may exist only in offline
teacher code; emitted source must receive canonical legal input only and pass the
same source closure and hostile runtime path.

**Model synthesizer:** no existing model call analog is permitted. Record a
frozen request/response bundle with provider/model/version/settings/prompt/context
/token/attempt roots using the canonical contract pattern above. The runner
consumes frozen bundles, never calls a model in Match/search execution, and only
admits validated deterministic explicit source. Provider identity drift must
return a new versioned/system-failed attempt, never silently substitute.

### Independence allowlist and evidence

**Target:** `scripts/check-v1-38-factory-boundaries.ts`, boundary tests, and
factory independence receipts —
policy/service + batch transform.

**Analog:** `scripts/check-boundary-monitors.ts` (imports and marker sets at
lines 1-40, 366-404, 1659-1678) and the source-closure denial set in
`planner/emit.ts:20-41`. Use static import/dependency inspection and explicit
deny markers; do not infer independence from package names or process count.

Allow only literal legality, geometry, strict schemas, canonical artifact
creation, supervised adapters, and reporting. Reject imports/dependencies for
other strategic selectors, mission/Action scorers, search trees, learned
parameters, opening books, prompts, or another oracle's emitted candidates.
Persist dependency, authorship, source, legal-input decision, Chronicle behavior,
counterfactual correlation, clone, and failure-mode evidence as immutable roots.
Correlated/borderline evidence is `unresolved` and quarantined.

### Model bundle and quarantined human/external intake

**Targets:** `factory/model-bundle.ts` and `factory/intake.ts` —
schema/service/CLI; no exact existing analog.

Use `LabManifestSchema`/`admitLabManifest` (`contracts.ts:39-75`) for bounded
private manifests, `recordLabAttemptStart` before any work, and `publishLabShard`
for immutable terminal evidence. Reuse `revalidateExactStrategyRevisionV119`
for exact source/artifact/native-lane proof. Intake must require explicit
deterministic source and complete provenance, freeze disclosure/submission and
reviewer budgets plus conflict declarations, validate through the same hostile
runtime path, and retain rejection/failure notes under the same evidence root.
Advice, prose, opaque binaries lacking identity, live agents, holdout data,
StrategyMemory/SoldierMemory/objectives, evaluator state, credentials, and
security internals are reject/quarantine outcomes, never fallback candidates.

CLI orchestration should follow `packages/strategy-lab/src/runner.ts:1-76`:
validate graph/config, bind immutable execution root, resume inventory, dispatch
only pending attempts, charge on start, require supervised traces, publish records,
and reduce only complete coverage. The CLI must remain offline and private.

## Shared Patterns

### Private immutable values

**Sources:** `packages/strategy-lab/src/contracts.ts:6-31` and
`packages/strategy-lab/src/identity.ts:8-26`.

Deep-freeze all admitted records; validate before traversal; derive identity from
canonical, domain-separated values; use `structuredClone` before freezing when
accepting external objects. Never expose mutable `latest` pointers.

### Stable task/attempt identity and no-refund accounting

**Sources:** `packages/strategy-lab/src/tasks.ts:7-45`, `runner.ts:15-62`,
`shards.ts:118-193`.

Pre-enumerate identities, bind task/attempt/worker/shard roots, charge before
execution, preserve uncertain work as system failure, and make reductions refuse
missing, duplicate, or incomparable records.

### Runtime boundary and privacy

**Sources:** `runtime-bridge.ts:29-84`, `revalidate-strategy-revision-v1-19.ts:497-583`,
`scripts/check-boundary-monitors.ts:393-404, 1659-1678`.

Private artifacts must remain private/offline; runtime failures expose stable
codes only; source and memory never enter public/default DTOs. Add negative import
tests proving production packages/apps cannot import strategy-lab or oracle
packages.

### Information-boundary tests

**Sources:** `packages/strategy-lab/src/planner/information-boundary.test.ts`
and `packages/strategy-lab/src/planner/emission.test.ts`.

Use adversarial source/observation fixtures to prove no hidden phase/round,
Soldier IDs, privileged counterfactual, dynamic import/eval, or shared strategic
state leaks into emitted decisions.

## No Analog Found

| File/Area | Role | Data Flow | Why no exact analog |
|---|---|---|---|
| Three physically separate oracle packages | provider | transform | Existing planner is one spine and Advanced fixtures are generated from a shared generator; use planner seams only for bounded emission and prove strategic-core separation. |
| Model request/response bundle store | model/schema | file I/O | No model-call implementation exists or is permitted; design as frozen canonical evidence consumed offline. |
| Human/external quarantined intake | service/CLI | request-response + file I/O | Existing persistence quarantine is a production lifecycle marker, not a candidate intake; reuse only append-only and revalidation mechanics. |
| Cross-oracle correlation/clone fingerprints | utility | batch/transform | Existing `reduce.ts` compares deterministic semantic roots but has no multidimensional fingerprinting; require new dimensions from FACT-08. |

## Metadata

**Analog search scope:** `packages/strategy-lab/src/**`, `packages/spec/src/**`,
`packages/runtime-js/src/**`, `apps/runtime-service/src/**`,
`packages/persistence/src/**`, `scripts/**`
**Files scanned:** 27 focused source/test files plus requirement/research contracts
**Pattern extraction date:** 2026-09-13
