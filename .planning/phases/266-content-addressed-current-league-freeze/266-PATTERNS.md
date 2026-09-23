# Phase 266: Content-Addressed Current-League Freeze — Pattern Map

**Mapped:** 2026-09-23  
**Files classified:** 7 recommended new files  
**Analogs found:** 7 / 7 (no complete precedent for the multi-root absence or final-seal bridge)

This is a **source-only map**. Phase 265 has no completed, independently verified empirical result in the supplied research. None of the analogs supplies a population, outcome, eligible finalist, actual holdout custody receipt, or Phase 266 root. Do not execute a provider or Match, open the holdout, publish a freeze, or materialize a formation profile while using this map.

## File Classification

| Proposed new file | Role | Data flow | Closest existing analog | Quality |
|---|---|---|---|---|
| `packages/strategy-lab/src/league/freeze.ts` | model / pure verifier | transform, batch evidence closure | `packages/strategy-lab/src/league/contracts.ts`; `identity.ts`; `selection.ts` | role + flow; new manifest shape |
| `packages/strategy-lab/src/league/freeze.test.ts` | test | transform, synthetic batch | `packages/strategy-lab/src/league/contracts.test.ts`; `repository.test.ts` | role + flow |
| `scripts/lib/v1-38-current-freeze-inventory.ts` | utility / guard | file-I/O, batch inventory | `scripts/check-v1-38-lab-boundaries.ts`; `packages/strategy-lab/src/league/repository.ts` | partial; existing source scan omits required stores |
| `scripts/lib/v1-38-current-freeze-inventory.test.ts` | test | file-I/O, canary matrix | `scripts/check-v1-38-lab-boundaries.test.ts` | role + flow; expand scopes/classes |
| `scripts/lib/v1-38-current-freeze-publication.ts` | service / restricted writer | file-I/O, immutable publication | `packages/strategy-lab/src/league/repository.ts`; `scripts/lib/v1-38-durable-publication-successor-v1.ts` | role + flow; no existing all-leaf atomic gate |
| `scripts/freeze-v1-38-current-league.ts` | offline CLI / controller | request-response, file-I/O | `scripts/evaluate-v1-37-prearchive-proof.ts`; `scripts/run-v1-38-serious-league.ts` | role + flow; forbid runner modes |
| `scripts/freeze-v1-38-current-league.test.ts` | test | request-response, file-I/O | `scripts/evaluate-v1-37-prearchive-proof.test.ts`; `packages/strategy-lab/src/league/repository.test.ts` | role + flow; add seal/atomic faults |

These are the recommended filenames in `266-RESEARCH.md` and the concrete Wave 0 test names in `266-VALIDATION.md`. The publication fault tests may live in the CLI test or in a separate sibling test if planning splits them; no additional production or engine file is implied. Phase 267's exact-parent constructor gate is a downstream requirement, not a Phase 266 source edit.

## Pattern Assignments

### `packages/strategy-lab/src/league/freeze.ts` — model / pure verifier, transform

**Analogs:** `packages/strategy-lab/src/league/contracts.ts` (schema and typed roots), `identity.ts` (re-derivation), `selection.ts` (honest non-pass). Keep filesystem and seal operations outside this file.

**Imports and bounded, exact schema pattern** — `contracts.ts:1-3,32-49`:

```ts
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

const canonical = <T>(value: unknown, validate: (value: RecordValue) => T): Readonly<T> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (admitted.ok) {
    const admittedValue = admitted.value
    if (admitted.canonicalByteLength > 262144 || admittedValue === null || typeof admittedValue !== "object" || Array.isArray(admittedValue)) fail("CANONICAL_VALUE")
    return freezeLabValue(validate(admittedValue as RecordValue))
  }
  return fail("CANONICAL_VALUE")
}
```

**Core root and failure pattern** — `contracts.ts:41-49` and `identity.ts:63-70`: exact fields, schema version, and domain-root equality are checked at admission, then a declared root is independently re-derived.

```ts
if (!exact(entry, keys) || !root(entry.root) || entry.root !== selfRoot(domain, entry)) fail("ROOT")

const actual = deriveForDomain(value)
if ((value as Rooted).root !== actual) fail()
return actual
```

**Disposition pattern** — `contracts.ts:57-59` separates terminal dispositions from `process_valid`/`process_invalid`; `selection.ts:238-242` emits either `no_robust_pure_finalist_found` or `robust_pure_finalist` with rooted gate receipts. Preserve a process-valid empirical non-pass and an explicitly empty exact-source allowlist; any incomplete/provenance/contamination condition blocks the freeze. Do not infer empirical success from a source-only fixture or a caller-supplied `passed` flag.

**Pitfall:** `report.ts:38-44` accepts only persisted, successful cells for a report projection. That narrow projection is **not** a complete Phase 266 retention/charge validator. The freeze needs all allocated attempts, failures, retries, rejections, unresolved starts, and unused slots, plus every matrix and analysis leaf. Reuse the typed lower-level graph and validate exhaustive membership separately.

### `packages/strategy-lab/src/league/freeze.test.ts` — test, synthetic transform

**Analog:** `packages/strategy-lab/src/league/contracts.test.ts:18-25,85-115`; for read-only mutation assertions, `repository.test.ts:69-90`.

```ts
/** Injected source-only evidence; no container, provider process or canonical Match is run. */
export const importedCandidateFixture = async (slot: number) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-league-import-test-"))); directories.push(directory)
  const repository = createFactoryRepository(directory)
  const put = (value: unknown) => { const bytes = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!bytes.ok) throw new Error("test encoding"); return publishFactoryArtifact(repository, bytes.canonicalBytes) }
```

Use `describe`/`it`/`expect` with fake canonical leaves and injected resolvers. Follow `contracts.test.ts:85-115` by mutating one root, terminal, or source join at a time and asserting the stable failure. Cover missing/duplicate/reordered/changed leaves, complete charge accounting, process-valid non-pass, process-invalid failure, exact descendant-parent comparison, preliminary finalist subreceipts, and empty eligibility. The fixture must never claim an actual Phase 265 result or use a live holdout preimage.

### `scripts/lib/v1-38-current-freeze-inventory.ts` — utility / guard, file-I/O batch

**Analog:** `scripts/check-v1-38-lab-boundaries.ts:44-63,133-145,182-184` for an injected-root scan and deterministic violations; `league/repository.ts:141-171` for bounded private evidence reopening.

```ts
export const loadLabBoundaryFiles = (inventoryRoot = repositoryRoot): Record<string, string> => {
  const files: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        // Canonical private experiment evidence is data, not source inventory.
        // Exclude only this root directory; a public/.strategy-lab copy remains
        // visible to the exposure checks, as does any explicit source import.
        if (!ignoredDirectories.has(entry.name) && path !== resolve(inventoryRoot, ".strategy-lab")) walk(path)
        continue
      }
      if (sourceExtension.test(entry.name) || /\.(?:json|ya?ml|toml|go|sh)$/u.test(entry.name) || /dockerfile|dockerignore/iu.test(entry.name)) {
        files[relative(inventoryRoot, path).replaceAll("\\", "/")] = readFileSync(path, "utf8")
      }
    }
  }
  walk(inventoryRoot)
  return files
}
```

**Copy the explicit root injection and deterministic violation output, not the exclusions.** `check-v1-38-lab-boundaries.ts:15,50-58` skips `.planning`, `.strategy-lab`, `dist`, `.cache`, and non-source file types—exactly where formation artifacts may reside. The new inventory must authenticate every configured repository, generated, task/lineage, artifact, cache, prompt/model, trace/replay, and private-storage scope; an unknown/unreadable scope is failure, not empty. Inspect identity/content where names alone are insufficient, distinguish contract prose from materialized data, and reject symlinks or unbounded traversals according to a declared policy.

**Read-only pattern** — `league/repository.ts:147-171` sorts entries, bounds bytes and record count, rejects unknown artifacts, reports remnants, and returns `issued: false`; it never repairs an incomplete start. An absence receipt should carry the authenticated scan scope and finding roots, not private paths in a safe projection. Coordinate the inventory snapshot with publication to avoid a scan/write race.

### `scripts/lib/v1-38-current-freeze-inventory.test.ts` — test, file-I/O canaries

**Analog:** `scripts/check-v1-38-lab-boundaries.test.ts:7-20,22-35,111-129`.

```ts
const directory = mkdtempSync(join(tmpdir(), "factory-source-inventory-"))
try {
  mkdirSync(join(directory, ".strategy-lab"))
  // ... seed controlled files and assert scanned/omitted paths
} finally { rmSync(directory, { recursive: true, force: true }) }
```

Use `it.each` to seed every forbidden artifact class and alternate naming/identity path in each configured scope. Assert that policy text describing future formations is allowed while an executable namespace, cold root, manifest, initial state, candidate, score, prompt, cache, trace, replay, or result is rejected. Test missing, unreadable, symlinked, and changed scopes; snapshot the test store before/after `--check` to prove no write or repair. Do **not** copy the old test's expectation that `.strategy-lab/private.json` is omitted (`:9-20`); that is a known insufficiency for FRZE-02.

### `scripts/lib/v1-38-current-freeze-publication.ts` — restricted writer, file-I/O

**Analogs:** `league/repository.ts:15-41,75-103` for safe bounded content-addressed objects; `scripts/lib/v1-38-durable-publication-successor-v1.ts:140-155,181-289` for no-replace hard-link publication and crash boundaries.

```ts
const atomic = (repository: LeagueRepository, name: string, bytes: Uint8Array, terminal = false): void => {
  const directory = safeDirectory(repository.directory), target = join(directory, name)
  const existing = lstatSafe(target)
  if (existing) {
    if (!existing.isFile() || bytesRoot(boundedRead(target)) !== bytesRoot(bytes)) return fail("OVERWRITE")
    repository.durability.syncDirectory(directory)
    return
  }
  repository.beforePublication?.({ target, byteLength: bytes.byteLength, terminal })
  const temporary = repository.temporaryName(target)
  if (!temporary.startsWith(`${target}.tmp-`) || basename(temporary) !== temporary.slice(directory.length + 1)) return fail("TEMPORARY")
  const descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < bytes.byteLength) offset += writeSync(descriptor, bytes, offset, bytes.byteLength - offset); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  try { linkSync(temporary, target) } finally { unlinkSync(temporary) }
  repository.durability.syncDirectory(directory)
}
```

Exact source: `repository.ts:75-90`. For a one-root gate, stage and authenticate all leaves and absence receipt, then publish the canonical manifest/root only after all checks. A `--check` must reopen and byte-compare without mutation; a second `--write` may accept identical bytes but must reject conflict. Test crash recovery and same-snapshot/lock exclusion.

**Pitfall:** `v1-38-durable-publication-successor-v1.ts:187-289` is a **two-member** transaction, not a complete arbitrary-leaf gate. Its intent embeds `bytesBase64` (`:238-246`), unsuitable for a location where private freeze bytes could leak. Its local `canonical()` (`:24-36`) is not the `@cowards/spec` canonical admission required for new freeze identities. Adapt the no-replace/durability mechanics without copying those identity or privacy choices wholesale.

### `scripts/freeze-v1-38-current-league.ts` — offline CLI, request-response/file-I/O

**Analogs:** `scripts/evaluate-v1-37-prearchive-proof.ts:89-95` for separate deterministic render/write/check paths; `scripts/run-v1-38-serious-league.ts:1104-1143` for explicit arguments and read-only retained verification.

```ts
export const checkV137PrearchiveProofArtifacts = (repoRoot: string): V137PrearchiveProof => { const proof = generateV137PrearchiveProof(repoRoot); for (const [kind, artifact] of Object.entries(V137_PREARCHIVE_PROOF_ARTIFACT_PATHS)) { const target = path.join(repoRoot, artifact); if (!existsSync(target)) fail("V137_PREARCHIVE_ARTIFACT_MISSING"); const expected = kind === "json" ? renderV137PrearchiveProofJson(proof) : renderV137PrearchiveProofMarkdown(proof); if (readFileSync(target, "utf8") !== expected) fail("V137_PREARCHIVE_ARTIFACT_EDITED") }; return proof }

const isDirectRun = (): boolean => {
  const invokedScript = process.argv[1]
  if (!invokedScript) return false
  try { return realpathSync(path.resolve(invokedScript)) === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
}
```

The actual source is `prearchive-proof.ts:92,94`. Parse one explicit `--write` or `--check` mode plus exact roots and configured private directories; never default to `latest`, HEAD, a directory's last entry, or an allocation as empirical authority. Call the existing read-only `verifyRetainedSeriousLeague` only after authenticating an actual completed Phase 265 head, its independent verification, and all root inputs. `run-v1-38-serious-league.ts:1109,1116,1135-1143` shows an explicit `verify-retained` path, but its implementation returns `empiricalRequirementsComplete: false` even for a verified `run-complete` (`:1100-1101`); it is not alone sufficient for Phase 266 closure. Do not call `runSeriousLeague`, any provider, or a Match.

**Seal trap:** `scripts/lib/v1-38-local-seal.ts:125-136` derives the existing `currentLeagueFreezeRoot` only from `sourceCommit`, `sourceTree`, and `freezeCarrierIdentity` before a league manifest exists. Its `verifyV138LocalSealReceipt` (`:755-769`) appends a ledger event and can contaminate state on mismatch, so it is **not** a read-only Phase 266 checker. Plan an explicit non-circular precursor-to-final-root bridge and read-only commitment/state/ledger inspection; never call opening, consumption, or mutation APIs. The checked-in protocol-v2 fixture is mechanical precedent, not an actual holdout receipt.

### `scripts/freeze-v1-38-current-league.test.ts` — CLI test, request-response/file-I/O

**Analogs:** `scripts/evaluate-v1-37-prearchive-proof.test.ts:9-29` for exact shape/limitation regressions, `league/repository.test.ts:69-90` for no-mutation snapshots, and `scripts/lib/v1-38-durable-publication-successor-v1.test.ts:41-113,124-205` for real fault/race tests.

```ts
expect(() => validateV137PrearchiveProof({ ...proof, archiveCommit: "deadbeef" })).toThrow("V137_PREARCHIVE_SHAPE")
expect(() => validateV137PrearchiveProof({ ...proof, lowerProofs: proof.lowerProofs.slice(1) })).toThrow("V137_PREARCHIVE_LOWER_PROOFS_INVALID")
```

Test the real CLI argument gate against missing, conflicting, stale, dirty, source-only, incomplete, and process-invalid inputs with synthetic restricted stores. Add exact-source allowlist and empty-list cases, predecessor/final-root non-circularity, original commitment/ledger unopened state, byte-identical `--check` snapshots, privacy-safe projection, publication crash/race, and refusal to replace a conflicting root. Keep the fake seal store outside the repository and omit a real preimage. Source fixtures can prove mechanics only, not the empirical gate.

## Shared Patterns

### Canonical identity and raw-byte closure

**Sources:** `packages/strategy-lab/src/contracts.ts:12-16`; `league/repository.ts:14,29-37,95-117`; `league/identity.ts:63-70`. Apply to all rooted leaf descriptors and the final manifest. `labRoot` domain-separates canonical values, while `readLeagueArtifact` rehashes actual stored bytes. Treat schema/type, encoding, privacy class, store identity, byte length, hash, and resolvability as independently checked fields; a hash string without an object is not a retained leaf. For large evidence, use the existing bounded composed-stream reader rather than silently truncating or hashing an ad hoc JSON string.

### Read-only verification and charged failure

**Sources:** `league/repository.ts:130-171`; `scripts/run-v1-38-serious-league.ts:885-925,1089-1101`. Reopen under limits, keep missing/unterminated evidence process-invalid, and never create a replacement terminal during verification. Retained verification joins graph nodes, allocation, journal starts/terminals, candidate closures, matrices, solver, and reports. Phase 266 must additionally require Phase 265 empirical closure and account for every allocation/attempt disposition before a root exists.

### Privacy-safe output

**Sources:** `packages/spec/src/public-output-privacy.ts:1-67,97-132`; `scripts/evaluate-v1-37-prearchive-proof.ts:89-90`; `league/report.ts:20-35,74-96`. Keep raw source, memory, objectives, trace, prompts, store paths, and error detail private. Validate an exact safe projection and call `assertPublicOutputLeakSafe` before rendering; do not expose private leaf metadata through CLI diagnostics. No public or product change is authorized.

### Root ancestry and seal custody

**Sources:** `league/identity.ts:43-70`; `scripts/lib/v1-38-local-seal.ts:125-141,340-405,755-769`. Derive the final root from complete immutable leaves and verify it at each later boundary; Phase 267 must bind that **exact** root as parent. Preserve the original seal commitment/precursor bytes, verify unopened ledger state without invoking mutating commands, and avoid a hash cycle. No signing identity was found in these analogs; a content hash alone must not be described as a signature.

## No Complete Analog

| Capability | Why existing code is insufficient | Planner action |
|---|---|---|
| All-scope pre-formation absence proof | Source boundary scan excludes private/generated/planning evidence and is not an artifact-identity inventory. | Specify authenticated scopes, canary matrix, identity paths, unreadable-root failure, and publication-window recheck. |
| Final freeze root joined to original seal commitment | Existing seal `currentLeagueFreezeRoot` is a source-only precursor; public `verify` mutates ledger. | Specify versioned, non-circular bridge and read-only custody inspection before coding. |
| Atomic complete-leaf gate | Repository atomic helper publishes one object; durable pair helper publishes two and writes bytes into intent. | Design staged all-leaf verification plus one no-replace authoritative-root publication, with fault tests. |

## Metadata

**Search scope:** `packages/strategy-lab/src/{contracts,league}`, `packages/spec/src`, `scripts`, `scripts/lib`, and the Phase 266 inputs.  
**Source/test files inspected:** 18.  
**Pattern extraction date:** 2026-09-23.  
**Planning gate:** No actual Phase 266 root or formation authorization until the complete retained Phase 265 result, independent verification, actual unopened commitment receipt, and every absence scope are authenticated.
