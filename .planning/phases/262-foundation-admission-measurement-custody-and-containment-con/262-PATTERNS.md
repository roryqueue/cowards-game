# Phase 262: Foundation Admission, Measurement, Custody, and Containment Contract - Pattern Map

**Mapped:** 2026-08-09 (successor refresh)
**Files analyzed:** 20 new/modified files
**Analogs found:** 20 / 20

## Scope Guard

Phase 262 may create only profile-neutral code, synthetic classifier/custody fixtures, and public-safe receipts. The literal current-edge, inward, and bracket coordinates belong only in the pre-search contract as `protocol_only` records with `materialization: "forbidden_before_phase_267"`.

Do not create or make reachable any `formation/`, `profiles/`, `candidates/`, `prompts/`, `cache/`, `traces/`, `replays/`, or `results/` namespace. Do not add a profile-to-`GameState` adapter, executable alternate initial state, Strategy source/hash produced by search, run manifest, or production import. Phase 266 must freeze the current league before any executable formation artifact exists, and Phase 267 is the first phase allowed to materialize one.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/evaluate-v1-38-foundation-contract.ts` | controller / generator | batch + file-I/O | `scripts/generate-v1-37-strategy-foundation-handoff.ts` | exact |
| `scripts/evaluate-v1-38-foundation-contract.test.ts` | test | batch + mutation | `scripts/check-v1-37-audit-reproduction.test.ts` | exact |
| `scripts/lib/v1-38-foundation-admission.ts` | service / validator | transform + request-response | `scripts/check-v1-37-audit-reproduction.ts` | exact |
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | service | batch + request-response | `apps/runtime-service/src/execute-match.ts` | role-match |
| `scripts/lib/v1-38-current-matrix-child-protocol.ts` | boundary protocol / validator | request-response + child control frames | exact-key validators in `scripts/check-v1-37-audit-reproduction.ts` plus child-process ownership in `scripts/lib/v1-38-current-matrix-reproduction.ts` | composite role-match |
| `scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts` | standalone boundary test / synthetic subprocess fixture | mutation + real synthetic subprocess | `scripts/check-v1-37-audit-reproduction.test.ts` plus subprocess tests in `scripts/evaluate-v1-38-foundation-contract-successor-routes.test.ts` | composite role-match |
| `scripts/lib/v1-38-successor-source-seal.ts` | custody / authorization / route checker-writer | transform + Git/object validation + exclusive file-I/O | A2/B2/A3/B3/A4/B4 source/seal branches in the same module and immutable generator/checker pattern in `scripts/generate-v1-37-strategy-foundation-handoff.ts` | exact lineage analog |
| `.planning/artifacts/v1.38-plan-262-29-authorization-v5.json` | immutable single-use authority | canonical transform + exclusive file-I/O | prior authorization-v2/v3/v4 artifacts checked by `scripts/lib/v1-38-successor-source-seal.ts` | exact lineage analog |
| `.planning/artifacts/v1.38-successor-source-seal-v5.json` | immutable source/authority seal | Git custody + exclusive file-I/O | prior successor-source-seal-v2/v3/v4 artifacts checked by `scripts/lib/v1-38-successor-source-seal.ts` | exact lineage analog |
| `scripts/lib/v1-38-study-contract.ts` | model / config | transform | `scripts/generate-v1-37-strategy-foundation-handoff.ts` | role-match |
| `scripts/lib/v1-38-measurement.ts` | utility | transform | `scripts/check-v1-37-audit-reproduction.ts` | role-match |
| `scripts/lib/v1-38-custody.ts` | service / store | event-driven + file-I/O | `scripts/lib/v1-37-restricted-evidence-store.ts` | exact |
| `scripts/lib/v1-38-containment.ts` | boundary monitor | batch + static analysis | `scripts/check-v1-37-integrity-boundaries.ts` | exact |
| `package.json` | config | command dispatch | `package.json` v1.37 script block | exact |
| `.planning/artifacts/v1.38-foundation-admission.json` | immutable receipt | file-I/O | `.planning/artifacts/v1.37-strategy-evaluation-foundation.json` | role-match |
| `.planning/artifacts/v1.38-current-matrix-reproduction.json` | immutable receipt | batch + file-I/O | `.planning/artifacts/v1.37-strategy-evaluation-foundation.json` | role-match |
| `.planning/artifacts/v1.38-pre-search-contract.json` | immutable config | transform + file-I/O | `.planning/artifacts/v1.37-strategy-evaluation-foundation.json` | role-match |
| `.planning/artifacts/v1.38-custody-public-reference.json` | public-safe reference | file-I/O | `V137PublicRestrictedEvidenceRef` in `scripts/lib/v1-37-restricted-evidence-store.ts` | role-match |
| `.planning/artifacts/v1.38-pre-formation-containment.json` | immutable receipt | batch + file-I/O | v1.37 integrity-boundary analysis output | role-match |
| `.planning/artifacts/v1.38-foundation-contract-root.json` | aggregate root | transform + file-I/O | `.planning/artifacts/v1.37-strategy-evaluation-foundation.json` | role-match |

## Pattern Assignments

### Successor protocol-v2, standalone fixture, and A5/B5 seal files

**Applies to:** `scripts/lib/v1-38-current-matrix-child-protocol.ts`, `scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts`, `scripts/lib/v1-38-successor-source-seal.ts`, authorization-v5, and successor-source-seal-v5.

The protocol module follows the repository's exact-key, fixed-discriminant, bounded-byte, typed-failure validator pattern and the existing reproduction module's parent/child ownership boundary. It must keep the four-family control vocabulary closed, reject missing/duplicate/out-of-order/trailing frames, and preserve successful result-envelope bytes. The standalone test follows the v1.37 mutation-fixture style while deriving the repository root from `import.meta.url`; it uses deterministic injected functions and real synthetic subprocesses, never temporal route setup, provider execution, Strategy execution, live observation, or mutable `.planning/artifacts` inputs.

The successor seal extends the existing A2/B2/A3/B3/A4/B4 lineage in the same module. Plan 262-28 adds A5 closure plus render, checker, all exclusive v5/v9/v10 writer entry points, and every terminal branch; writer behavior is proved only against owned temporary destinations and supplied synthetic inputs in offline tests. Plans 262-29 and 262-30 alone invoke those already-tested writers against canonical artifact destinations. Authorization-v5 and seal-v5 use canonical bytes, exclusive-create semantics, full Git parent/tree/path/blob custody, exact destination inventories, and the same no-mutable-alias rule as prior authorities.

### `scripts/evaluate-v1-38-foundation-contract.ts` (controller, batch + file-I/O)

**Analog:** `scripts/generate-v1-37-strategy-foundation-handoff.ts`

Use an `import.meta.url`-derived repository root, exported pure generate/render/write/check functions, strict `--write` versus `--check` dispatch, and a small public-safe stdout summary. Do not derive the root from `process.cwd()`.

**Repository root and content binding pattern** (lines 27-40):

```typescript
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const canonical = (value: unknown): string => `${JSON.stringify(value)}\n`
const digest = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const fail = (code: string): never => {
  throw new TypeError(code)
}
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
```

**Generate only from machine authorities** (lines 342-350):

```typescript
export const generateV137StrategyFoundation = (repoRoot: string): V137StrategyFoundation => {
  const phase260 = asRecord(readJson(repoRoot, "..."), "V137_STRATEGY_FOUNDATION_PHASE260_INVALID")
  const prearchive = asRecord(validateV137PrearchiveProof(readJson(repoRoot, "...")), "V137_STRATEGY_FOUNDATION_PREARCHIVE_INVALID")
  const audit = asRecord(validateV137MilestoneAudit(readJson(repoRoot, "...")), "V137_STRATEGY_FOUNDATION_AUDIT_INVALID")
  return fromMachineAuthorities(
    phase260,
    prearchive,
    audit,
    integrated,
    revalidation,
    candidates,
    sourceBindings(repoRoot),
  )
}
```

For Phase 262, call the gates in dependency order: admission, supervised matrix reproduction, contained calibration/freeze, custody public reference verification, containment, then aggregate root. A stopped gate must prevent later authoritative artifacts from being written.

**Write/check and CLI pattern** (lines 359-397):

```typescript
const temporary = `${target}.tmp-${process.pid}`
writeFileSync(temporary, bytes, { flag: "w", mode: 0o644 })
renameSync(temporary, target)

if (!existsSync(target)) fail("..._ARTIFACT_MISSING")
if (readFileSync(target, "utf8") !== expected) fail("..._ARTIFACT_EDITED")

const mode = process.argv.slice(2)
try {
  const result =
    mode.length === 1 && mode[0] === "--write"
      ? writeArtifacts(root)
      : mode.length === 1 && mode[0] === "--check"
        ? checkArtifacts(root)
        : fail("..._MODE_INVALID")
  process.stdout.write(`${JSON.stringify(publicSummary(result))}\n`)
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "..._FAILED"}\n`)
  process.exitCode = 1
}
```

The Phase 262 aggregate root is a join over exact receipt roots and source bindings, not a scan for whichever files happen to be present and never a mutable `latest`.

---

### `scripts/evaluate-v1-38-foundation-contract.test.ts` (test, batch + mutation)

**Analog:** `scripts/check-v1-37-audit-reproduction.test.ts`

Use one shared Vitest file with `-t`-selectable describe/it names matching validation contract selectors: `admission`, `matrix`, `contract`, `accounting`, `gates`, `reporting`, `classifiers`, `custody`, and `containment`.

**Exact pass plus safe projection** (lines 15-31):

```typescript
it("runs the permanent reproduction and accepts the exact seven observations", () => {
  const receipt = runV137AuditReproductionGate(process.cwd())
  expect(receipt.status).toBe("passed-exact")
  expect(receipt.hashes.joinSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
  expect(JSON.stringify(receipt)).not.toMatch(/Users|DATABASE_URL|stack|diagnostic/iu)
}, 20_000)
```

**Fail-closed inventory mutation** (lines 33-65):

```typescript
const { successfulPushPusherHistory: _removed, ...missing } =
  fixture.freshObservations
expect(() =>
  analyzeV137AuditReproduction(
    replace(fixture, { freshObservations: missing }),
  ),
).toThrow("V137_AUDIT_PROBE_INVENTORY_INVALID")
```

**No override/waiver shapes** (lines 92-106):

```typescript
for (const mutation of [
  { ...fixture, override: true },
  { ...fixture, waiver: "approved" },
  { ...fixture, manualPass: true },
]) {
  expect(() => analyze(mutation as unknown as Input))
    .toThrow("..._INPUT_SCHEMA_INVALID")
}
```

Add table/mutation coverage for every typed stop, duplicate-identical versus duplicate-conflicting result, system failure remaining charged but excluded from cells, invalid report-state combinations, terminal contamination, no-second-open, forbidden extra keys, and seeded containment bypasses. Synthetic classifier fixtures must be plain profile-neutral projections; importing `GameState` or a formation adapter is itself a failing test.

---

### `scripts/lib/v1-38-foundation-admission.ts` (service, transform + request-response)

**Analog:** `scripts/check-v1-37-audit-reproduction.ts`

Copy the exact input inventory, byte-digest comparison, exact-key validation, and joined-root construction. Extend its inputs to the immutable v1.37 archive commit, annotated tag object, post-tag checker result, semantic tuple, runtime authority, audit/prearchive artifacts, and separately recorded post-tag correction lineage.

**Closed schema and typed failure** (lines 154-165, 222-247):

```typescript
const fail = (code: string): never => {
  throw new TypeError(code)
}

const exactKeys = (value: object, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
}

if (input === null || typeof input !== "object" || !exactKeys(input, inputKeys)) {
  fail("V137_AUDIT_INPUT_SCHEMA_INVALID")
}
if (sha256(input.reproductionSourceBytes) !== expectedHashes.reproduction) {
  fail("V137_AUDIT_REPRODUCTION_SOURCE_DRIFT")
}
```

**Exact inventory and content join** (lines 232-280):

```typescript
if (!exactKeys(input.freshObservations, V137_AUDIT_PROBE_IDS)) {
  fail("V137_AUDIT_PROBE_INVENTORY_INVALID")
}

const hashes = {
  reproductionSourceSha256: sha256(input.reproductionSourceBytes),
  freshResultSha256: sha256(canonical(input.freshObservations)),
  retainedResultSha256: sha256(input.retainedResultBytes),
}
return {
  schemaVersion: "...",
  status: "passed-exact",
  hashes: {
    ...hashes,
    joinSha256: sha256(canonical(hashes)),
  },
}
```

Return a discriminated `passed_exact` / `stopped_integrity_foundation` result or throw a typed closed error at the CLI boundary. Never include repair callbacks, normalization, waiver, override, `acceptAnyway`, or tag mutation. The archive tag remains authoritative; post-tag corrections are a distinct lineage binding.

---

### `scripts/lib/v1-38-current-matrix-reproduction.ts` (service, batch + request-response)

**Analogs:** `apps/runtime-service/src/execute-match.ts` and `scripts/check-v1-37-audit-reproduction.ts`

Preserve the historical declared inventory (10 definitions, 45 unordered pairs, three labels, two seed parities, mirrored sides, 540 Matches), but build immutable Advanced `StrategyRevision` fixtures and send them through the selected supervised runtime-service path. The historical `new Function` loader and direct `runMatch` path are evidence inputs only and must never be called.

**Three-way runtime classification** (`execute-match.ts`, lines 210-227):

```typescript
const candidatePublicResult = (request, outcome) => ({
  requestId: request.requestId,
  invocationId: request.invocationId,
  kernelRequestId: request.kernelRequestId,
  classification: outcome.kind,
  ...(outcome.kind === "player_violation"
    ? { code: outcome.violation.code }
    : outcome.kind === "system_failure"
      ? { code: outcome.failure.code, retryable: outcome.failure.retryable }
      : {}),
})
```

**Selected canonical execution path** (`execute-match.ts`, lines 2300-2333):

```typescript
const response = executeRuntimeServiceRequestInternal(
  request,
  input.runtimeConfig,
  {
    authorityLoader: input.authorityLoader,
    createCanonicalRuntimeForRevision: createCandidateV119RuntimeForRevision,
    runMatchV119: (match) => {
      const result = runVersionedMatchV119(match)
      captured = result.execution
      return result
    },
  },
  true,
)
if (!response.ok || captured === undefined) {
  throw new TypeError("Selected current Match execution did not complete.")
}
```

Player violations and system failures are reproduction failures unless the frozen historical expected cell names that exact class. They remain visible in the attempt ledger and never become accepted gameplay cells. Resolve historical arena labels to semantic geometry hashes and explicitly retain the Smoke/Open Field duplicate-geometry annotation. Seed parity is not a substitute for the current four-condition entrant side/initiative policy.

---

### `scripts/lib/v1-38-study-contract.ts` (model/config, transform)

**Analog:** schema/validator/rendering sections of `scripts/generate-v1-37-strategy-foundation-handoff.ts`

Define one readonly exact-key schema covering estimands, paired contrasts, full cell identity, splits, opponent fields, root-seed blocks, two-ledger accounting, resource dimensions, calibration replacements, numeric gates with denominators, response/finalist/portfolio/robust-pure rules, orthogonal report states, and claim grammar.

**Exact nested validation style** (lines 323-338):

```typescript
if (!exactKeys(value, keys)) fail("..._SHAPE")
if (
  !exactKeys(handoff.setPolicy, [
    "version",
    "conditionCount",
    "conditions",
    "requiresEveryCanonicalCondition",
    "partialMatrixCounts",
    "systemFailureCounts",
  ]) ||
  handoff.setPolicy.requiresEveryCanonicalCondition !== true ||
  handoff.setPolicy.partialMatrixCounts !== false ||
  handoff.setPolicy.systemFailureCounts !== false
) fail("..._SET_POLICY_INVALID")

assertPublicOutputLeakSafe(handoff, "v1.37 Strategy foundation")
```

The three coordinate records must have `protocol_only: true` and `materialization: "forbidden_before_phase_267"`. This module must not import engine state constructors and must not export any conversion function. Fixed-policy transfer is secondary screening only; Advanced-library results are regression-only; all claims stay oracle-relative.

---

### `scripts/lib/v1-38-measurement.ts` (utility, transform)

**Analog:** pure analysis half of `scripts/check-v1-37-audit-reproduction.ts`

Keep the module pure: inputs are bounded synthetic/canonical projections and outputs are frozen metric records. No filesystem, runtime invocation, engine transition, wall time, or candidate/holdout content belongs here.

Copy the pattern of validating the full input inventory first, canonicalizing before comparison, enumerating every required identity rather than comparing counts, and returning a digest-bound result. Each metric output must bind denominator type, eligible-cell inventory root, replication unit, missingness rule, normalization profile, and implementation root.

Canonical opening clustering must normalize horizontal reflection, entrant swap plus 180-degree rotation, opaque ID renaming, and Soldier source-order permutation. Synthetic positive, negative, boundary, mirrored, renamed, permuted, obfuscated, malformed, missing, duplicate, and conflicting fixtures are required. No fixture may instantiate `GameState`.

---

### `scripts/lib/v1-38-custody.ts` (service/store, event-driven + file-I/O)

**Analog:** `scripts/lib/v1-37-restricted-evidence-store.ts`

Adapt the filesystem safety mechanics, not the closed v1.37 evidence classes. Phase 262 needs distinct closed commands for `commit`, `authorizeOpen`, `openOnce`, `projectSafeReceipt`, `verify`, `markContaminated`, and `retire`; do not expose `read`, `query`, or a generic object getter to the coordinator.

**Outside-repository, restrictive store root** (lines 346-374):

```typescript
const configuredRoot = process.env.COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT
if (configuredRoot === undefined || configuredRoot.length === 0) {
  fail("V137_RESTRICTED_EVIDENCE_ROOT_REQUIRED")
}
const repoRoot = path.resolve(options.repoRoot)
const root = path.resolve(configuredRoot)
if (isWithin(repoRoot, root)) fail("V137_RESTRICTED_EVIDENCE_ROOT_IN_REPOSITORY")
if (existsSync(root)) {
  const stat = lstatSync(root)
  if (stat.isSymbolicLink()) fail("V137_RESTRICTED_EVIDENCE_SYMLINK")
  if (!stat.isDirectory()) fail("V137_RESTRICTED_EVIDENCE_PATH_INVALID")
} else {
  mkdirSync(root, { recursive: true, mode: 0o700 })
}
```

**Exclusive writes and no-follow bounded reads** (lines 391-429):

```typescript
writeFileSync(target, bytes, { flag: "wx", mode: 0o600 })

descriptor = openSync(
  target,
  constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
)
const bytes = readFileSync(descriptor)
if (bytes.byteLength > limit) fail("..._SIZE_LIMIT")
```

**Append-only fsynced access evidence** (lines 432-477):

```typescript
descriptor = openSync(
  target,
  constants.O_CREAT |
    constants.O_APPEND |
    constants.O_WRONLY |
    (constants.O_NOFOLLOW ?? 0),
  0o600,
)
writeSync(descriptor, line)
fsyncSync(descriptor)
```

**Opaque public projection** (lines 605-621):

```typescript
const reference = Object.freeze({
  schemaVersion: record.reference.schemaVersion,
  sha256: record.reference.sha256,
  class: record.reference.class,
  attestationSha256: record.reference.attestationSha256,
  retentionClass: record.reference.retentionClass,
  availabilityPosture,
})
assertPublicOutputLeakSafe(reference, "v1.37 restricted evidence public reference")
return reference
```

Use HMAC-SHA-256 with custodian-held secret material, a secret random salt, canonical domain framing, and length-checked `timingSafeEqual`. Never return the secret, salt, preimage, opponent/schedule identities, evaluator internals, raw query details, or decryption material. The state machine is monotone; `contaminated` is terminal and failed projection after opening does not authorize a diagnostic query or replacement holdout. An actual named custodian and approved encrypted private store are operational prerequisites, not values the code should invent.

---

### `scripts/lib/v1-38-containment.ts` (boundary monitor, batch + static analysis)

**Analog:** `scripts/check-v1-37-integrity-boundaries.ts`

Use TypeScript AST inspection plus exact artifact inventory and content/schema checks. Filename-only `rg` scanning is insufficient.

**Typed finding records** (lines 25-80):

```typescript
export type V137IntegrityBoundaryFindingCode =
  | "DUPLICATE_AUTHORITY_OWNER"
  | "DUPLICATE_SCHEDULER_AUTHORITY"
  | "UI_RULE_AUTHORITY"
  | "PUBLIC_EXECUTION_ROUTE"
  | "FIXTURE_PRODUCTION_PROMOTION"
  | "CURRENT_FORBIDDEN_DEPENDENCY"

export interface V137IntegrityBoundaryFinding {
  code: V137IntegrityBoundaryFindingCode
  path: string
  line: number
  detail: string
}
```

**AST import and alias inspection** (lines 1419-1514):

```typescript
const sourceFile = ts.createSourceFile(
  normalizedPath,
  source,
  ts.ScriptTarget.Latest,
  true,
)
const imports: ts.ImportDeclaration[] = []
const aliasDeclarations: Array<{ name: string; initializer: ts.Expression }> = []

const visit = (node: ts.Node): void => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      node.initializer !== undefined) {
    aliasDeclarations.push({ name: node.name.text, initializer: node.initializer })
  }
  if (ts.isImportDeclaration(node)) imports.push(node)
  ts.forEachChild(node, visit)
}
visit(sourceFile)
```

**Forbidden dependency finding** (lines 1556-1599):

```typescript
for (const importDeclaration of imports) {
  if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) continue
  const moduleName = importDeclaration.moduleSpecifier.text
  // collect imported names, classify dependency, and emit a source location
  if (violatesReplay || violatesRuntime || violatesPersistence) {
    add(
      "CURRENT_FORBIDDEN_DEPENDENCY",
      normalizedPath,
      sourceFile,
      importDeclaration,
      `Forbidden gameplay-authority import: ${forbidden.join(", ")}.`,
    )
  }
}
```

Phase 262 findings should cover forbidden namespace/file creation, executable initial-state values, `GameState` or engine-constructor imports in profile protocol/classifier code, `new Function`/`vm`, direct Strategy imports/execution, production imports of v1.38 lab code, mutable `latest`, unapproved artifact keys, and private data in public receipts. Tests must seed disguised imports, allowed-filename executable state, candidate artifacts, prompt/cache/trace/replay/result files, and aliases to prove the monitor detects bypasses.

---

### `package.json` (config, command dispatch)

**Analog:** existing v1.37 script block, lines 52-84.

Add exactly:

```json
"v1.38:foundation-contract:write": "pnpm exec tsx scripts/evaluate-v1-38-foundation-contract.ts --write",
"v1.38:foundation-contract:check": "pnpm exec tsx scripts/evaluate-v1-38-foundation-contract.ts --check"
```

Follow the paired write/check naming used by:

```json
"v1.37:strategy-foundation:write": "pnpm exec tsx scripts/generate-v1-37-strategy-foundation-handoff.ts --write",
"v1.37:strategy-foundation:check": "pnpm exec tsx scripts/generate-v1-37-strategy-foundation-handoff.ts --check"
```

Wire the check into the existing boundary-monitor chain only after the generated artifact and containment tests are deterministic. Do not add any profile, candidate, league, or formation execution command in this phase.

---

### `.planning/artifacts/v1.38-foundation-admission.json` (immutable receipt)

**Analog:** `V137AuditReproductionReceipt` in `scripts/check-v1-37-audit-reproduction.ts`, lines 55-67 and 264-281.

Use an exact schema with `status`, typed stop/pass identity, archive commit, annotated tag object, post-tag result root, semantic tuple ID, runtime authority root, source bindings, and one domain-separated admission root. It must never reinterpret or move the v1.37 tag.

---

### `.planning/artifacts/v1.38-current-matrix-reproduction.json` (immutable receipt)

**Analog:** the joined reproduction receipt pattern in `scripts/check-v1-37-audit-reproduction.ts`, lines 264-281.

Bind the historical source digest, Advanced fixture inventory/source hashes, label-to-semantic-geometry mapping including duplicates, exact 540-cell declared inventory, entrant side/initiative identities, runtime authority, selected kernel, attempt ledger root, accepted-cell root, reducer source root, expected aggregate, and exact match status. Do not store Strategy source or runtime-private diagnostics.

---

### `.planning/artifacts/v1.38-pre-search-contract.json` (immutable config)

**Analog:** the closed readonly schema and canonical rendering in `scripts/generate-v1-37-strategy-foundation-handoff.ts`, lines 79-149 and 323-338.

This is the only artifact that contains the three literal profile coordinate protocols in Phase 262. Mark them protocol-only and non-materializable. Bind all metric code/fixtures, denominators, thresholds, calibration replacements, budgets, claims, cell inventory, response/finalist rules, two-ledger schemas, report-state grammar, and the proof that candidate output was unavailable during calibration.

---

### `.planning/artifacts/v1.38-custody-public-reference.json` (public-safe reference)

**Analog:** `V137PublicRestrictedEvidenceRef` and `publicRef`, `scripts/lib/v1-37-restricted-evidence-store.ts`, lines 46-53 and 605-621.

Expose only the commitment profile/digest, custodian role ID, store ID, key identifier without key material, encrypted-object digest/length, lineage root, retention/retirement policy IDs, authorized opening actor/command ID, and safe-projection schema/cardinality/byte bounds. Run `assertPublicOutputLeakSafe` before rendering.

---

### `.planning/artifacts/v1.38-pre-formation-containment.json` (immutable receipt)

**Analog:** `V137IntegrityBoundaryAnalysis` and CLI output, `scripts/check-v1-37-integrity-boundaries.ts`, lines 78-84 and 2079-2125.

Record the exact scanned source/artifact inventory root, monitor implementation/source hash, allowlist root, seeded bypass fixture results, finding count, and `passed_absence` status. It proves absence only for the bound tree; a source or artifact change creates a new root.

---

### `.planning/artifacts/v1.38-foundation-contract-root.json` (aggregate root)

**Analog:** machine-authority aggregation in `scripts/generate-v1-37-strategy-foundation-handoff.ts`, lines 342-350.

Join exact roots for admission, reproduction, pre-search contract, custody public reference, containment proof, generator/checker source bindings, tool/runtime/platform identity where behavior varies, and a complete output inventory with digests. Generate it only if every mandatory gate passes. Do not include timestamps in semantic identity and do not discover inputs via a mutable directory alias.

## Shared Patterns

### Exact Keys and Fail-Closed Validation

**Source:** `scripts/check-v1-37-audit-reproduction.ts`, lines 154-194 and 222-262  
**Apply to:** every module and generated artifact

Validate every object at every trust boundary with exact keys, fixed schema/version discriminants, bounded arrays/strings/bytes, and typed failure codes. Extra keys such as `override`, `waiver`, `manualPass`, repair callbacks, secret/private fields, or alternate authority are invalid.

### Canonical Identity and Source Bindings

**Source:** `scripts/generate-v1-37-strategy-foundation-handoff.ts`, lines 27-32, 50-61, and 151-155  
**Apply to:** every receipt and the aggregate root

Bind exact input paths and byte hashes plus the generator/checker source hash. Use the existing `@cowards/spec` canonical JSON and registered domain-separated identity primitives for semantic roots; do not use display labels or `JSON.stringify` order as a new interchange identity.

### Public-Safe Projection

**Source:** `scripts/lib/v1-37-restricted-evidence-store.ts`, lines 605-621  
**Apply to:** admission, matrix, custody, containment, and aggregate receipts

Construct a new closed object containing only approved scalar IDs, hashes, statuses, and bounded counts, then call `assertPublicOutputLeakSafe`. Never serialize private store paths, Strategy source/artifacts, memories/objectives, holdout preimages, raw diagnostics, host/env data, credentials, security internals, evaluator state, or per-hidden-cell feedback.

### Attempt Ledger Versus Accepted Cells

**Source:** runtime three-way outcome handling in `apps/runtime-service/src/execute-match.ts`, lines 210-227 and 2883-2901  
**Apply to:** matrix reproduction and frozen study contract

Every allocated attempt, retry, invalid output, duplicate, player violation, system failure, unfilled slot, and unused unit remains charged. Only process-valid success can enter the accepted-cell matrix. Conflicting duplicates are integrity stops; system failures never become gameplay or imputed cells.

### Restricted Store and Custody

**Source:** `scripts/lib/v1-37-restricted-evidence-store.ts`, lines 337-478 and 624-774  
**Apply to:** custody only

Require an outside-repository root, reject traversal and symlinks, use `0700` directories and `0600` files, exclusive writes, bounded no-follow reads, append-only fsynced events, content verification, and a separately constructed safe public reference. The v1.38 custody state machine is stricter and must not reuse the v1.37 generic read surface.

### Static Containment

**Source:** `scripts/check-v1-37-integrity-boundaries.ts`, lines 1378-1610  
**Apply to:** the entire Phase 262 tree and production import graph

Use AST-based import/symbol/alias analysis plus exact artifact inventories, schemas, content scans, and mutation probes. A zero-finding result is meaningful only when the monitor catches each seeded bypass.

### Test Root Resolution and Serialized Validation

**Source:** `scripts/lib/v1-37-restricted-evidence-store.test.ts`, lines 27-59  
**Apply to:** Phase 262 test helpers

Resolve the repository from `import.meta.dirname` / `import.meta.url`, use an external temporary custody directory, restore environment variables in `afterEach`, and run the final root suite with `pnpm turbo test --concurrency=1`.

## No Analog Found

No planned file is completely without an analog. The closest analogs are structural rather than semantic for `v1-38-study-contract.ts`, `v1-38-measurement.ts`, and the six generated artifacts; their Phase 262-specific schema content must come from `262-CONTEXT.md`, `262-RESEARCH.md`, and `262-VALIDATION.md`, while retaining the repository patterns above.

## Metadata

**Analog search scope:** `scripts/`, `scripts/lib/`, `packages/spec/src/`, `packages/engine/src/`, `apps/runtime-service/src/`, `.planning/artifacts/`, and root `package.json`  
**Strong analogs read:** 5 primary implementations plus corresponding tests/config  
**Files scanned:** repository file inventory plus focused v1.37 evidence/runtime/boundary sources  
**Pattern extraction date:** 2026-08-09 successor refresh
