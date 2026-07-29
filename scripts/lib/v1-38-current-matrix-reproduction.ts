/* eslint-disable no-restricted-imports -- Offline regression admission must bind the selected runtime-service implementation without widening its production barrel. */
import { Buffer } from "node:buffer"
import { createHash, generateKeyPairSync, sign } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  createPreparedRuntimeServiceDependenciesV118,
  executePreparedRuntimeServiceRequestV118,
  hashRuntimeAuthoritySchedulingDecisionReference,
  type PreparedRuntimeServiceExecutionV118,
} from "../../apps/runtime-service/src/execute-match.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  VerifiedMountedRuntimeEvidenceAuthority,
} from "../../apps/runtime-service/src/runtime-evidence-authority.js"
import { createRuntimeServiceConfig } from "../../apps/runtime-service/src/runtime-config.js"
import {
  ADVANCED_STRATEGY_DEFINITIONS,
  buildAdvancedStrategyRevision,
} from "../../packages/persistence/src/advanced-strategies.js"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticTupleV118,
  createSetScenarioV137,
  hashExecutableLaneIdentity,
  parseRuntimeEvidenceAuthorityPayload,
  type ExecutableLaneIdentity,
  type RuntimeEntrantAuthorityReference,
  type JsonValue,
  type RuntimeCertificateReferenceV118,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceRequestV118,
  type StrategyRevision,
} from "@cowards/spec"

const FIXTURE_PURPOSE = "regression_throughput_only" as const
const HISTORICAL_MATRIX_SOURCE =
  ".planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts"
const HISTORICAL_MATRIX_README =
  ".planning/artifacts/v2.0-core-rules-audit/README.md"
const HISTORICAL_EXPECTATION_ARTIFACT =
  ".planning/artifacts/v1.38-historical-matrix-expectation.json"
const ADMISSION_RECEIPT = ".planning/artifacts/v1.38-foundation-admission.json"
const MATRIX_SCHEMA_VERSION = "v1.38-current-matrix-inventory-v1" as const
const FIXED_EVALUATION_INSTANT = "2026-07-28T00:00:00.000Z"
const FIXED_AUTHORITY_GENERATION = "0"
const FIXED_AUTHORITY_BUNDLE_HASH = sha256Text(
  "v1.38-current-matrix-authority-v1",
)
const FIXED_PUBLICATION = {
  publicationId: "publication:v138-matrix:v1",
  installReceiptId: "install:v138-matrix:v1",
  payloadSha256: FIXED_AUTHORITY_BUNDLE_HASH,
  envelopeSha256: sha256Text("v1.38-matrix-authority-envelope-v1"),
  sourceManifestHash: sha256Text("v1.38-matrix-authority-source-manifest-v1"),
} as const
const FIXED_LEDGER_PRESTATE_ROOT = sha256Text("v1.38-matrix-ledger-prestate-v1")
function sha256Text(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`
}

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

type Sha256 = `sha256:${string}`

export interface V138HistoricalMatrixExpectation {
  readonly schemaVersion: "v1.38-historical-matrix-expectation-v1"
  readonly predicateVersion: "v1.38-historical-matrix-predicate-v1"
  readonly provenance: Readonly<{
    archiveCommit: string
    reviewedCodeSnapshot: string
    sourcePath: typeof HISTORICAL_MATRIX_README
    sourceBlobOid: string
    sourceSha256: Sha256
    runnerPath: typeof HISTORICAL_MATRIX_SOURCE
    runnerBlobOid: string
    runnerSourceSha256: Sha256
    derivationSourceRoot: Sha256
  }>
  readonly declaredResults: Readonly<{
    definitionCount: 10
    unorderedPairCount: 45
    configuredArenaCount: 3
    seedParityCount: 2
    mirroredSides: true
    totalMatchCount: 540
    leaders: readonly [
      Readonly<{
        strategyId: "advanced:stonewall-shear"
        wins: 62
        losses: 44
        draws: 2
      }>,
      Readonly<{
        strategyId: "advanced:vanguard-pressure"
        wins: 62
        losses: 44
        draws: 2
      }>,
    ]
    thirdPlace: Readonly<{
      strategyId: "advanced:rear-guard-sentinel"
      wins: 57
      losses: 51
      draws: 0
    }>
    majorityEdgeCycleCount: 9
    arenaRecordEquality: Readonly<{
      leftArenaLabel: "Smoke"
      rightArenaLabel: "Open Field"
      scope: "per_strategy_wins_losses_draws"
    }>
  }>
  readonly historicalExpectationRoot: Sha256
}

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim()

const gitBlob = (
  repoRoot: string,
  commit: string,
  repoPath: string,
): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], {
    cwd: repoRoot,
    maxBuffer: 8 * 1024 * 1024,
  })

// BEGIN V1.38 HISTORICAL EXPECTATION DERIVATION SOURCE
const onlyMatch = (source: string, pattern: RegExp): RegExpMatchArray => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))]
  if (matches.length !== 1) {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_AMBIGUOUS")
  }
  return matches[0]!
}

const deriveHistoricalDeclarations = (
  readmeBytes: Uint8Array,
): V138HistoricalMatrixExpectation["declaredResults"] => {
  const source = Buffer.from(readmeBytes).toString("utf8")
  const reviewedCodeSnapshot = onlyMatch(
    source,
    /^Reviewed code snapshot: `([0-9a-f]{40})`$/mu,
  )[1]
  if (reviewedCodeSnapshot !== "38f4a83db9298502c12db44cd66d026878803d20") {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_DECLARATION_INVALID")
  }
  const exactLines = [
    "- 10 Advanced Strategy definitions",
    "- 45 unordered pairings",
    "- 3 configured arenas",
    "- 2 seed parities",
    "- mirrored sides",
    "- 540 total Matches",
  ]
  for (const line of exactLines) {
    onlyMatch(source, new RegExp(`^${line}$`, "mu"))
  }
  const rows = [
    onlyMatch(
      source,
      /^\| `advanced:stonewall-shear` \| 62-44-2 \| 57\.4% \|$/mu,
    ),
    onlyMatch(
      source,
      /^\| `advanced:vanguard-pressure` \| 62-44-2 \| 57\.4% \|$/mu,
    ),
    onlyMatch(
      source,
      /^\| `advanced:rear-guard-sentinel` \| 57-51-0 \| 52\.8% \|$/mu,
    ),
  ]
  if (rows.some((row) => row[0] === undefined)) {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_DECLARATION_INVALID")
  }
  onlyMatch(
    source,
    /^The matrix found nine majority-edge non-transitive three-cycles, but neither leading Strategy had a majority-losing matchup\. All detected cycles were below the leading pair\. Smoke and Open Field produced identical per-Strategy records because both are empty geometries\.$/mu,
  )
  return {
    definitionCount: 10,
    unorderedPairCount: 45,
    configuredArenaCount: 3,
    seedParityCount: 2,
    mirroredSides: true,
    totalMatchCount: 540,
    leaders: [
      {
        strategyId: "advanced:stonewall-shear",
        wins: 62,
        losses: 44,
        draws: 2,
      },
      {
        strategyId: "advanced:vanguard-pressure",
        wins: 62,
        losses: 44,
        draws: 2,
      },
    ],
    thirdPlace: {
      strategyId: "advanced:rear-guard-sentinel",
      wins: 57,
      losses: 51,
      draws: 0,
    },
    majorityEdgeCycleCount: 9,
    arenaRecordEquality: {
      leftArenaLabel: "Smoke",
      rightArenaLabel: "Open Field",
      scope: "per_strategy_wins_losses_draws",
    },
  }
}

const derivationSourceRoot = (): Sha256 => {
  const source = readFileSync(new URL(import.meta.url), "utf8")
  const match = source.match(
    /\/\/ BEGIN V1\.38 HISTORICAL EXPECTATION DERIVATION SOURCE\n([\s\S]*?)\/\/ END V1\.38 HISTORICAL EXPECTATION DERIVATION SOURCE/u,
  )
  if (match?.[1] === undefined) {
    throw new TypeError("MATRIX_EXPECTATION_DERIVATION_SOURCE_MISSING")
  }
  return sha256(match[1])
}

export const deriveV138HistoricalMatrixExpectation = (
  repoRoot: string,
): Readonly<V138HistoricalMatrixExpectation> => {
  const admission = JSON.parse(
    readFileSync(path.resolve(repoRoot, ADMISSION_RECEIPT), "utf8"),
  ) as { archiveCommit?: unknown; status?: unknown }
  if (
    admission.status !== "passed_exact" ||
    typeof admission.archiveCommit !== "string" ||
    !/^[0-9a-f]{40}$/u.test(admission.archiveCommit) ||
    git(repoRoot, ["rev-parse", "refs/tags/v1.37^{}"]) !==
      admission.archiveCommit
  ) {
    throw new TypeError("MATRIX_EXPECTATION_ADMISSION_INVALID")
  }
  const archiveCommit = admission.archiveCommit
  const sourceBytes = gitBlob(repoRoot, archiveCommit, HISTORICAL_MATRIX_README)
  const runnerBytes = gitBlob(repoRoot, archiveCommit, HISTORICAL_MATRIX_SOURCE)
  const sourceBlobOid = git(repoRoot, [
    "rev-parse",
    `${archiveCommit}:${HISTORICAL_MATRIX_README}`,
  ])
  const runnerBlobOid = git(repoRoot, [
    "rev-parse",
    `${archiveCommit}:${HISTORICAL_MATRIX_SOURCE}`,
  ])
  const reviewedCodeSnapshot = onlyMatch(
    sourceBytes.toString("utf8"),
    /^Reviewed code snapshot: `([0-9a-f]{40})`$/mu,
  )[1]!
  const withoutRoot = {
    schemaVersion: "v1.38-historical-matrix-expectation-v1" as const,
    predicateVersion: "v1.38-historical-matrix-predicate-v1" as const,
    provenance: {
      archiveCommit,
      reviewedCodeSnapshot,
      sourcePath: HISTORICAL_MATRIX_README,
      sourceBlobOid,
      sourceSha256: sha256(sourceBytes),
      runnerPath: HISTORICAL_MATRIX_SOURCE,
      runnerBlobOid,
      runnerSourceSha256: sha256(runnerBytes),
      derivationSourceRoot: derivationSourceRoot(),
    },
    declaredResults: deriveHistoricalDeclarations(sourceBytes),
  }
  return deepFreeze({
    ...withoutRoot,
    historicalExpectationRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138HistoricalMatrixExpectation>
}
// END V1.38 HISTORICAL EXPECTATION DERIVATION SOURCE

export const validateV138HistoricalMatrixExpectation = (
  repoRoot: string,
  input: unknown,
): Readonly<V138HistoricalMatrixExpectation> => {
  const expected = deriveV138HistoricalMatrixExpectation(repoRoot)
  if (canonical(input) !== canonical(expected)) {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  return expected
}

export const loadV138HistoricalMatrixExpectation = (
  repoRoot: string,
): Readonly<V138HistoricalMatrixExpectation> => {
  const bytes = readFileSync(
    path.resolve(repoRoot, HISTORICAL_EXPECTATION_ARTIFACT),
    "utf8",
  )
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes)
  } catch {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  const expectation = validateV138HistoricalMatrixExpectation(repoRoot, parsed)
  if (bytes !== `${canonical(expectation)}\n`) {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  return expectation
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const RESOURCE_POLICY = deepFreeze({
  policyId: "v1.38-matrix-resource-policy-v1",
  calibrationAttemptCount: 1,
  maxProjectedTotalMilliseconds: 90 * 60 * 1_000,
  maxShardAttempts: 4,
  maxShardMilliseconds: 10 * 60 * 1_000,
  maxShardRssKilobytes: 2 * 1024 * 1024,
  progressEmission: "stderr_after_each_terminal_shard",
  partialAcceptedEvidenceReusable: false,
})

const revisionFor = (
  definition: (typeof ADVANCED_STRATEGY_DEFINITIONS)[number],
): StrategyRevision => {
  const base = buildAdvancedStrategyRevision(definition)
  return deepFreeze({
    ...base,
    metadata: {
      ...base.metadata,
      label: `${definition.name} — regression throughput fixture`,
      tags: [...(base.metadata.tags ?? []), FIXTURE_PURPOSE],
    },
  }) as StrategyRevision
}

const artifactHash = (revision: StrategyRevision): `sha256:${string}` => {
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (artifact === undefined) {
    throw new TypeError("MATRIX_REVISION_ARTIFACT_MISSING")
  }
  return `sha256:${artifact.hash.replace(/^sha256:/u, "")}`
}

const laneIdentity = (
  revision: StrategyRevision,
  compatibility = CANONICAL_COMPATIBILITY_TUPLES.find(
    ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.19",
  )!,
): ExecutableLaneIdentity => ({
  providerId: "v1.38-matrix-typescript-provider",
  languageId: revision.runtime.language.id,
  runtimeId: "node",
  runtimeVersion:
    revision.metadata.sourceArtifact?.toolchain.runtimeVersion ??
    revision.validation.runtimeVersion,
  toolchainId:
    revision.metadata.sourceArtifact?.toolchain.language ?? "typescript",
  toolchainVersion:
    revision.metadata.sourceArtifact?.toolchain.runtimeVersion ??
    revision.runtime.language.version,
  adapterId: revision.runtime.adapter.id,
  adapterVersion: revision.runtime.adapter.version,
  policyId: "v1.38-matrix-package-none-policy",
  policyVersion: "v1",
  corpusId: "v1.38-historical-advanced-regression",
  corpusVersion: "v1",
  artifactId: `artifact:${revision.id}`,
  artifactSha256: artifactHash(revision).replace(/^sha256:/u, ""),
  implementationId: "runtime-execution-service-v1.18",
  buildId: "v1.38-matrix-reproduction-v1",
  semanticTupleId: compatibility.tupleId,
  semanticTuple: { ...compatibility.tuple },
})

const entrantEvidence = (input: {
  side: "bottom" | "top"
  attemptId: string
  entrantId: string
  revision: StrategyRevision
  compatibility: (typeof CANONICAL_COMPATIBILITY_TUPLES)[number]
}): RuntimeEntrantAuthorityReference => {
  const lane = laneIdentity(input.revision, input.compatibility)
  const entrant: RuntimeEntrantAuthorityReference = {
    entrantKey: input.entrantId,
    strategyRevisionId: input.revision.id,
    laneIdentityHash: `sha256:${hashExecutableLaneIdentity(lane)}`,
    effectiveStatus: "exhibition_only",
    schedulingDecisionId: `schedule:v138-matrix:${input.attemptId}:${input.side}`,
    schedulingDecisionHash: `sha256:${"0".repeat(64)}`,
    schedulingDecision: {
      status: "exhibition_only",
      reasonCode: "CONFORMANCE_MISSING",
      evaluatedAt: FIXED_EVALUATION_INSTANT,
      freshUntil: "2099-12-31T23:59:59.999Z",
      registryGeneration: FIXED_AUTHORITY_GENERATION,
    },
    containmentCertificateId: `certificate:v138-matrix:${input.attemptId}:${input.side}`,
    containmentCertificateHash: sha256(
      `v1.38-matrix-certificate\0${input.attemptId}\0${input.side}\0${input.revision.id}`,
    ),
  }
  return {
    ...entrant,
    schedulingDecisionHash: hashRuntimeAuthoritySchedulingDecisionReference({
      compatibilityTupleId: input.compatibility.tupleId,
      authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
      registryGeneration: FIXED_AUTHORITY_GENERATION,
      publication: FIXED_PUBLICATION,
      entrant,
    }),
  }
}

const certificateReference = (
  side: "bottom" | "top",
  attemptId: string,
  revision: StrategyRevision,
): RuntimeCertificateReferenceV118 => {
  const sourceDigest = sha256(revision.source)
  const laneIdentityHash =
    `sha256:${hashExecutableLaneIdentity(laneIdentity(revision))}` as const
  return {
    side,
    certificateId: `certificate:v138-matrix:${attemptId}:${side}`,
    certificateRecordHash: sha256(
      `v1.38-matrix-certificate\0${attemptId}\0${side}\0${revision.id}`,
    ),
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    lane: "typescript-worker-thread-regression",
    freshUntil: "2099-12-31T23:59:59.999Z",
    sourceIdentity: {
      side,
      strategyRevisionId: revision.id,
      originalSourceSha256: sourceDigest,
      normalizedSourceSha256: sha256(
        revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
      ),
      artifactSha256: artifactHash(revision),
      identityManifestRoot: laneIdentityHash,
      evidenceGraphRoot: sha256(`v1.38-matrix-supervision\0${revision.id}`),
      laneIdentityHash,
    },
  }
}

export interface V138CurrentMatrixAttempt {
  readonly attemptId: string
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly leftDefinitionId: string
  readonly rightDefinitionId: string
  readonly historicalArenaLabel: string
  readonly arenaId: string
  readonly semanticGeometryHash: `sha256:${string}`
  readonly seedLabel: "meta-even" | "meta-odd"
  readonly mirrored: boolean
  readonly bottomEntrantId: string
  readonly topEntrantId: string
  readonly initialInitiativeEntrantId: string
  readonly initialInitiativePlayerId: string
  readonly request: RuntimeExecutionServiceRequestV118
}

export interface V138CurrentMatrixInventory {
  readonly schemaVersion: typeof MATRIX_SCHEMA_VERSION
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly historicalSourceSha256: `sha256:${string}`
  readonly admissionRoot: `sha256:${string}`
  readonly definitions: readonly Readonly<{
    id: string
    sourceSha256: `sha256:${string}`
    revisionId: string
  }>[]
  readonly arenas: readonly Readonly<{
    historicalLabel: string
    arenaId: string
    semanticGeometryHash: `sha256:${string}`
    duplicateGeometryGroup: "empty-v1" | null
  }>[]
  readonly attempts: readonly V138CurrentMatrixAttempt[]
}

const admissionRoot = (repoRoot: string): `sha256:${string}` => {
  const parsed = JSON.parse(
    readFileSync(path.resolve(repoRoot, ADMISSION_RECEIPT), "utf8"),
  ) as { admissionRoot?: unknown; status?: unknown }
  if (
    parsed.status !== "passed_exact" ||
    typeof parsed.admissionRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(parsed.admissionRoot)
  ) {
    throw new TypeError("MATRIX_ADMISSION_INVALID")
  }
  return parsed.admissionRoot as `sha256:${string}`
}

export const enumerateV138CurrentMatrix = (
  repoRoot: string,
): Readonly<V138CurrentMatrixInventory> => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES.find(
    ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.19",
  )
  if (tuple === undefined) {
    throw new TypeError("MATRIX_SELECTED_TUPLE_MISSING")
  }
  const definitions = ADVANCED_STRATEGY_DEFINITIONS.map((definition) => ({
    definition,
    revision: revisionFor(definition),
  }))
  if (definitions.length !== 10) {
    throw new TypeError("MATRIX_DEFINITION_INVENTORY_INVALID")
  }
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas
  if (arenas.length !== 3) {
    throw new TypeError("MATRIX_ARENA_INVENTORY_INVALID")
  }

  const attempts: V138CurrentMatrixAttempt[] = []
  for (let leftIndex = 0; leftIndex < definitions.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < definitions.length;
      rightIndex += 1
    ) {
      const left = definitions[leftIndex]!
      const right = definitions[rightIndex]!
      for (const arena of arenas) {
        for (const seedLabel of ["meta-even", "meta-odd"] as const) {
          for (const mirrored of [false, true] as const) {
            const bottom = mirrored ? right : left
            const top = mirrored ? left : right
            const bottomEntrantId = `entrant:${bottom.definition.id}`
            const topEntrantId = `entrant:${top.definition.id}`
            const bottomPlayerId = `player:${bottom.definition.id}:bottom`
            const topPlayerId = `player:${top.definition.id}:top`
            const initialInitiativeEntrantId =
              seedLabel === "meta-even" ? bottomEntrantId : topEntrantId
            const initialInitiativePlayerId =
              seedLabel === "meta-even" ? bottomPlayerId : topPlayerId
            const scenario = createSetScenarioV137({
              arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
              arenaSemanticGeometryHash: arena.semanticGeometryHash,
              entrantA: {
                entrantKey: `entrant:${left.definition.id}`,
                playerId: mirrored ? topPlayerId : bottomPlayerId,
              },
              entrantB: {
                entrantKey: `entrant:${right.definition.id}`,
                playerId: mirrored ? bottomPlayerId : topPlayerId,
              },
              baseSeed: seedLabel,
            })
            const condition = scenario.conditions.find(
              (candidate) =>
                candidate.bottomEntrantKey === bottomEntrantId &&
                candidate.topEntrantKey === topEntrantId &&
                candidate.initialInitiativeEntrantKey ===
                  initialInitiativeEntrantId,
            )
            if (condition === undefined) {
              throw new TypeError("MATRIX_CONDITION_MISSING")
            }
            const attemptId =
              `p${leftIndex}-${rightIndex}:a${arena.id.split(":")[1]}:` +
              `${seedLabel === "meta-even" ? "e" : "o"}:` +
              `${mirrored ? "m" : "u"}`
            const evidenceSnapshot = {
              compatibility: {
                tupleId: tuple.tupleId,
                tuple: { ...tuple.tuple },
              },
              authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
              registryGeneration: FIXED_AUTHORITY_GENERATION,
              publication: FIXED_PUBLICATION,
              entrants: {
                bottom: entrantEvidence({
                  side: "bottom",
                  attemptId,
                  entrantId: bottomEntrantId,
                  revision: bottom.revision,
                  compatibility: tuple,
                }),
                top: entrantEvidence({
                  side: "top",
                  attemptId,
                  entrantId: topEntrantId,
                  revision: top.revision,
                  compatibility: tuple,
                }),
              },
            }
            const nestedRequest: RuntimeExecutionServiceRequest = {
              contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
              kind: "executeMatch",
              requestId: `request:v138-matrix:${attemptId}:nested`,
              match: {
                matchId: `match:v138-matrix:${attemptId}`,
                seed: seedLabel,
                arenaVariant: {
                  id: arena.id,
                  name: arena.name,
                  initialBounds: { ...arena.initialBounds },
                  terrainStones: arena.terrainStones.map((value) => ({
                    ...value,
                  })),
                },
                bottomPlayerId,
                topPlayerId,
                bottomStrategyRevisionId: bottom.revision.id,
                topStrategyRevisionId: top.revision.id,
                initialInitiativePlayerId,
                candidateMatch: {
                  semanticAuthorityKey: "runtime-v1.19",
                  matchId: `match:v138-matrix:${attemptId}`,
                  seed: seedLabel,
                  arenaVariantId: arena.id,
                  bottomStrategyRevisionId: bottom.revision.id,
                  topStrategyRevisionId: top.revision.id,
                  bottomPlayerId,
                  topPlayerId,
                  bottomEntrantKey: condition.bottomEntrantKey,
                  topEntrantKey: condition.topEntrantKey,
                  setPolicyVersion: scenario.setPolicyVersion,
                  scenarioId: scenario.scenarioId,
                  conditionId: condition.conditionId,
                  conditionOrdinal: condition.ordinal,
                  conditionSuffix: condition.suffix,
                  requestIdentity: condition.requestIdentity,
                  arenaCatalogVersion: scenario.arenaCatalogVersion,
                  arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
                  initialInitiativeEntrantKey:
                    condition.initialInitiativeEntrantKey,
                  initialInitiativePlayerId:
                    condition.initialInitiativePlayerId,
                },
              },
              strategies: {
                bottom: bottom.revision,
                top: top.revision,
              },
              limits: DEFAULT_RUNTIME_LIMITS,
              evidenceSnapshot,
            }
            const references = {
              bottom: certificateReference(
                "bottom",
                attemptId,
                bottom.revision,
              ),
              top: certificateReference("top", attemptId, top.revision),
            }
            const request: RuntimeExecutionServiceRequestV118 = {
              contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
              kind: "executeMatch",
              requestId: `request:v138-matrix:${attemptId}`,
              matchId: nestedRequest.match.matchId,
              semanticTuple: createRuntimeSemanticTupleV118(tuple.tuple),
              authorityGeneration: FIXED_AUTHORITY_GENERATION,
              evaluationInstant: FIXED_EVALUATION_INSTANT,
              certificateReferences: references,
              accounting: {
                budgetProfileRoot: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
                ledgerPrestateRoot: FIXED_LEDGER_PRESTATE_ROOT,
              },
              match: nestedRequest as unknown as JsonValue,
            }
            attempts.push(
              deepFreeze({
                attemptId,
                fixturePurpose: FIXTURE_PURPOSE,
                leftDefinitionId: left.definition.id,
                rightDefinitionId: right.definition.id,
                historicalArenaLabel: arena.name,
                arenaId: arena.id,
                semanticGeometryHash: arena.semanticGeometryHash,
                seedLabel,
                mirrored,
                bottomEntrantId,
                topEntrantId,
                initialInitiativeEntrantId,
                initialInitiativePlayerId,
                request,
              }) as V138CurrentMatrixAttempt,
            )
          }
        }
      }
    }
  }
  if (attempts.length !== 540) {
    throw new TypeError("MATRIX_ATTEMPT_INVENTORY_INVALID")
  }

  return deepFreeze({
    schemaVersion: MATRIX_SCHEMA_VERSION,
    fixturePurpose: FIXTURE_PURPOSE,
    historicalSourceSha256: sha256(
      readFileSync(path.resolve(repoRoot, HISTORICAL_MATRIX_SOURCE)),
    ),
    admissionRoot: admissionRoot(repoRoot),
    definitions: definitions.map(({ definition, revision }) => ({
      id: definition.id,
      sourceSha256: sha256(definition.source),
      revisionId: revision.id,
    })),
    arenas: arenas.map((arena) => ({
      historicalLabel: arena.name,
      arenaId: arena.id,
      semanticGeometryHash: arena.semanticGeometryHash,
      duplicateGeometryGroup:
        arena.semanticGeometryHash === arenas[0]!.semanticGeometryHash
          ? ("empty-v1" as const)
          : null,
    })),
    attempts,
  })
}

export type V138CurrentMatrixAttemptOutcome =
  | Readonly<{
      attemptId: string
      classification: "success"
      outcome: "bottom_win" | "top_win" | "draw"
    }>
  | Readonly<{
      attemptId: string
      classification: "player_violation"
      code: string
    }>
  | Readonly<{
      attemptId: string
      classification: "system_failure"
      code: string
      retryable: boolean
    }>

interface MatrixRecord {
  wins: number
  losses: number
  draws: number
}

export interface V138CurrentMatrixReceipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v1"
  readonly status: "passed_exact"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly admissionRoot: `sha256:${string}`
  readonly historicalMatrixSourceSha256: `sha256:${string}`
  readonly historicalExpectedAggregateRoot: `sha256:${string}`
  readonly expectedAggregateMatched: true
  readonly arenaMapping: V138CurrentMatrixInventory["arenas"]
  readonly definitionCount: 10
  readonly unorderedPairCount: 45
  readonly historicalArenaLabelCount: 3
  readonly semanticGeometryCount: 2
  readonly seedParityCount: 2
  readonly mirroredSideCount: 2
  readonly attemptCount: 540
  readonly acceptedCellCount: 540
  readonly playerViolationCount: 0
  readonly systemFailureCount: 0
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly chargedAttemptLedgerRoot: `sha256:${string}`
  readonly acceptedCellLedgerRoot: `sha256:${string}`
  readonly reducerSourceRoot: `sha256:${string}`
  readonly aggregate: Readonly<{
    standings: readonly Readonly<
      MatrixRecord & { id: string; winRateBasisPoints: number }
    >[]
    nonTransitiveCycleCount: number
  }>
  readonly receiptRoot: `sha256:${string}`
}

export interface V138CurrentMatrixStoppedReceipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v1"
  readonly status: "stopped_process_failure"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: "system_failure_resource_pressure"
  readonly admissionRoot: `sha256:${string}`
  readonly historicalMatrixSourceSha256: `sha256:${string}`
  readonly arenaMapping: V138CurrentMatrixInventory["arenas"]
  readonly declaredAttemptCount: 540
  readonly acceptedCellCount: 0
  readonly partialAcceptedEvidenceReusable: false
  readonly priorFailedRun: Readonly<{
    classification: "system_failure_resource_pressure"
    elapsedSecondsAtTermination: 14_390
    hostFreeMemoryPercentAtTermination: 9
    partialResultsDiscarded: true
    completedAttemptCount: "unknown"
  }>
  readonly resourcePolicy: typeof RESOURCE_POLICY
  readonly calibration: Readonly<{
    attemptCount: 1
    elapsedMilliseconds: number
    maxRssKilobytes: number
    projectedTotalMilliseconds: number
    withinTotalRunBudget: false
    withinShardMemoryBudget: boolean
    outcomeClassification: "success" | "player_violation" | "system_failure"
  }>
  readonly chargedAttemptLedgerRoot: `sha256:${string}`
  readonly acceptedCellLedgerRoot: `sha256:${string}`
  readonly reducerSourceRoot: `sha256:${string}`
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly receiptRoot: `sha256:${string}`
}

export type V138CurrentMatrixReproductionReceipt =
  | V138CurrentMatrixReceipt
  | V138CurrentMatrixStoppedReceipt

const canonical = (value: unknown): string => JSON.stringify(value)

const HISTORICAL_EXPECTED_AGGREGATE_ROOT = `sha256:${"0".repeat(64)}` as const

const aggregateOutcomes = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  outcomes: readonly V138CurrentMatrixAttemptOutcome[],
) => {
  const records = new Map<string, MatrixRecord>(
    inventory.definitions.map(({ id }) => [
      id,
      { wins: 0, losses: 0, draws: 0 },
    ]),
  )
  const matchupRecords = new Map<
    string,
    { left: string; right: string; leftWins: number; rightWins: number }
  >()
  const accepted = outcomes
    .filter(
      (
        outcome,
      ): outcome is Extract<
        V138CurrentMatrixAttemptOutcome,
        { classification: "success" }
      > => outcome.classification === "success",
    )
    .map((outcome) => {
      const attempt = inventory.attempts.find(
        ({ attemptId }) => attemptId === outcome.attemptId,
      )!
      const left = records.get(attempt.leftDefinitionId)!
      const right = records.get(attempt.rightDefinitionId)!
      const matchupKey = `${attempt.leftDefinitionId}\0${attempt.rightDefinitionId}`
      const matchup = matchupRecords.get(matchupKey) ?? {
        left: attempt.leftDefinitionId,
        right: attempt.rightDefinitionId,
        leftWins: 0,
        rightWins: 0,
      }
      if (outcome.outcome === "draw") {
        left.draws += 1
        right.draws += 1
      } else {
        const bottomWon = outcome.outcome === "bottom_win"
        const winnerId = bottomWon
          ? attempt.bottomEntrantId.replace(/^entrant:/u, "")
          : attempt.topEntrantId.replace(/^entrant:/u, "")
        const loserId =
          winnerId === attempt.leftDefinitionId
            ? attempt.rightDefinitionId
            : attempt.leftDefinitionId
        records.get(winnerId)!.wins += 1
        records.get(loserId)!.losses += 1
        if (winnerId === attempt.leftDefinitionId) matchup.leftWins += 1
        else matchup.rightWins += 1
      }
      matchupRecords.set(matchupKey, matchup)
      return {
        attemptId: outcome.attemptId,
        outcome: outcome.outcome,
      }
    })

  const standings = [...records.entries()]
    .map(([id, record]) => ({
      id,
      ...record,
      winRateBasisPoints: Math.round(
        (record.wins * 10_000) /
          Math.max(1, record.wins + record.losses + record.draws),
      ),
    }))
    .sort(
      (left, right) =>
        right.winRateBasisPoints - left.winRateBasisPoints ||
        left.id.localeCompare(right.id),
    )
  const beats = new Set(
    [...matchupRecords.values()].flatMap((matchup) =>
      matchup.leftWins === matchup.rightWins
        ? []
        : [
            matchup.leftWins > matchup.rightWins
              ? `${matchup.left}>${matchup.right}`
              : `${matchup.right}>${matchup.left}`,
          ],
    ),
  )
  const ids = inventory.definitions.map(({ id }) => id)
  let nonTransitiveCycleCount = 0
  for (let first = 0; first < ids.length; first += 1) {
    for (let second = first + 1; second < ids.length; second += 1) {
      for (let third = second + 1; third < ids.length; third += 1) {
        const [a, b, c] = [ids[first]!, ids[second]!, ids[third]!]
        if (
          (beats.has(`${a}>${b}`) &&
            beats.has(`${b}>${c}`) &&
            beats.has(`${c}>${a}`)) ||
          (beats.has(`${a}>${c}`) &&
            beats.has(`${c}>${b}`) &&
            beats.has(`${b}>${a}`))
        ) {
          nonTransitiveCycleCount += 1
        }
      }
    }
  }
  return {
    accepted,
    aggregate: { standings, nonTransitiveCycleCount },
  }
}

export const reduceV138CurrentMatrix = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  outcomes: readonly V138CurrentMatrixAttemptOutcome[],
): Readonly<V138CurrentMatrixReceipt> => {
  const expectedIds = inventory.attempts.map(({ attemptId }) => attemptId)
  const actualIds = outcomes.map(({ attemptId }) => attemptId)
  if (
    outcomes.length !== 540 ||
    new Set(actualIds).size !== 540 ||
    canonical(actualIds) !== canonical(expectedIds)
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_MISMATCH")
  }
  const playerViolationCount = outcomes.filter(
    ({ classification }) => classification === "player_violation",
  ).length
  const systemFailureCount = outcomes.filter(
    ({ classification }) => classification === "system_failure",
  ).length
  const { accepted, aggregate } = aggregateOutcomes(inventory, outcomes)
  const chargedAttemptLedgerRoot = sha256(
    canonical(
      outcomes.map((outcome) =>
        outcome.classification === "success"
          ? {
              attemptId: outcome.attemptId,
              classification: outcome.classification,
              outcome: outcome.outcome,
            }
          : outcome,
      ),
    ),
  )
  const acceptedCellLedgerRoot = sha256(canonical(accepted))
  const observedAggregateRoot = sha256(
    canonical({ acceptedCellLedgerRoot, aggregate }),
  )
  if (
    playerViolationCount !== 0 ||
    systemFailureCount !== 0 ||
    accepted.length !== 540 ||
    observedAggregateRoot !== HISTORICAL_EXPECTED_AGGREGATE_ROOT
  ) {
    throw new TypeError(
      `MATRIX_REPRODUCTION_MISMATCH:${observedAggregateRoot}:accepted=${accepted.length}:player=${playerViolationCount}:system=${systemFailureCount}:first=${outcomes.find(({ classification }) => classification !== "success")?.code ?? "none"}`,
    )
  }
  const reducerSourceRoot = sha256(readFileSync(new URL(import.meta.url)))
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v1" as const,
    status: "passed_exact" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    admissionRoot: inventory.admissionRoot,
    historicalMatrixSourceSha256: inventory.historicalSourceSha256,
    historicalExpectedAggregateRoot: HISTORICAL_EXPECTED_AGGREGATE_ROOT,
    expectedAggregateMatched: true as const,
    arenaMapping: inventory.arenas,
    definitionCount: 10 as const,
    unorderedPairCount: 45 as const,
    historicalArenaLabelCount: 3 as const,
    semanticGeometryCount: 2 as const,
    seedParityCount: 2 as const,
    mirroredSideCount: 2 as const,
    attemptCount: 540 as const,
    acceptedCellCount: 540 as const,
    playerViolationCount: 0 as const,
    systemFailureCount: 0 as const,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot,
    reducerSourceRoot,
    aggregate,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138CurrentMatrixReceipt>
}

const authorityForAttempt = (
  attempt: V138CurrentMatrixAttempt,
): Readonly<VerifiedMountedRuntimeEvidenceAuthority> => {
  const nested = attempt.request
    .match as unknown as RuntimeExecutionServiceRequest
  const attestations = (["bottom", "top"] as const).map((side) => ({
    attestationId: `attestation:v138-matrix:${attempt.attemptId}:${side}`,
    attestationHash:
      attempt.request.certificateReferences[side].sourceIdentity
        .evidenceGraphRoot,
    verified: true as const,
    imports: [] as const,
  }))
  const certificates = (["bottom", "top"] as const).map((side, index) => {
    const entrant = nested.evidenceSnapshot.entrants[side]
    const revision = nested.strategies[side]
    return {
      kind: "containment" as const,
      certificateId: entrant.containmentCertificateId!,
      certificateVersion: "v1.38-matrix-containment-v1",
      certificateRecordHash: entrant.containmentCertificateHash!,
      laneIdentityHash: entrant.laneIdentityHash,
      laneIdentity: laneIdentity(revision),
      issuedAt: "2026-07-27T00:00:00.000Z",
      freshUntil: "2099-12-31T23:59:59.999Z",
      attestationIds: [attestations[index]!.attestationId],
    }
  })
  const payload = parseRuntimeEvidenceAuthorityPayload({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
    bundleVersion: "v1.38-matrix-regression-v1",
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    issuedAt: "2026-07-27T00:00:00.000Z",
    validFrom: "2026-07-27T00:00:00.000Z",
    validUntil: "2099-12-31T23:59:59.999Z",
    semanticTupleManifestHash: nested.evidenceSnapshot.compatibility.tupleId,
    attestations,
    certificates,
    revocations: [],
    supersessions: [],
    operatorLaneDisables: [],
  })
  return deepFreeze({
    authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    semanticTupleManifestHash: nested.evidenceSnapshot.compatibility.tupleId,
    trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    keyId: "v1.38-matrix-regression-authority",
    payload,
  }) as Readonly<VerifiedMountedRuntimeEvidenceAuthority>
}

const executeAttemptsInProcess = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  selectedAttempts: readonly V138CurrentMatrixAttempt[],
): V138CurrentMatrixAttemptOutcome[] => {
  let currentAuthority:
    | Readonly<VerifiedMountedRuntimeEvidenceAuthority>
    | undefined
  const authorityLoader: RuntimeEvidenceAuthorityLoader = {
    load: () => {
      if (currentAuthority === undefined) {
        throw new TypeError("MATRIX_AUTHORITY_NOT_MOUNTED")
      }
      return currentAuthority
    },
    current: () => currentAuthority,
  }
  const runtimeConfig = createRuntimeServiceConfig({
    strategyExecutionAdapter: "worker-thread",
    semanticReceiptSecret: "v1.38-matrix-regression-receipt-v1",
    resolveDeploymentLaneIdentity: laneIdentity,
  })
  const keys = generateKeyPairSync("ed25519")
  const dependencies = createPreparedRuntimeServiceDependenciesV118({
    runtimeConfig,
    authorityLoader,
    signer: {
      keyId: "v1.38-matrix-regression-signer",
      publicKeyPem: keys.publicKey.export({
        format: "pem",
        type: "spki",
      }) as string,
      sign: (bytes) => sign(null, bytes, keys.privateKey),
    },
    budgetProfileRoot: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    ledgerPrestateRoot: FIXED_LEDGER_PRESTATE_ROOT,
    evaluationInstant: () => FIXED_EVALUATION_INSTANT,
  })
  const outcomes: V138CurrentMatrixAttemptOutcome[] = []
  for (const attempt of selectedAttempts) {
    currentAuthority = authorityForAttempt(attempt)
    let captured: PreparedRuntimeServiceExecutionV118 | undefined
    const response = executePreparedRuntimeServiceRequestV118(attempt.request, {
      ...dependencies,
      executeCurrentMatchWithAccounting: (request) => {
        captured = dependencies.executeCurrentMatchWithAccounting(request)
        return captured
      },
    })
    if (!response.ok || captured === undefined) {
      outcomes.push({
        attemptId: attempt.attemptId,
        classification: "system_failure",
        code: response.ok
          ? "EXECUTION_CAPTURE_MISSING"
          : response.systemFailure.code,
        retryable: response.ok ? false : response.systemFailure.retryable,
      })
      continue
    }
    const finalState = captured.response.ok
      ? captured.response.result.finalState
      : undefined
    const outcome = finalState?.outcome
    if (outcome === undefined || outcome.type === "FAILED") {
      outcomes.push({
        attemptId: attempt.attemptId,
        classification: "player_violation",
        code:
          outcome?.type === "FAILED" ? outcome.reason : "MISSING_MATCH_OUTCOME",
      })
      continue
    }
    outcomes.push({
      attemptId: attempt.attemptId,
      classification: "success",
      outcome:
        outcome.type === "DRAW"
          ? "draw"
          : outcome.winnerPlayerId ===
              (
                attempt.request
                  .match as unknown as RuntimeExecutionServiceRequest
              ).match.bottomPlayerId
            ? "bottom_win"
            : "top_win",
    })
  }
  return outcomes
}

interface ShardExecutionResult {
  outcomes: V138CurrentMatrixAttemptOutcome[]
  maxRssKilobytes: number
}

const executeShardSubprocess = (
  repoRoot: string,
  attemptIds: readonly string[],
): Readonly<{
  elapsedMilliseconds: number
  result: ShardExecutionResult
}> => {
  const started = process.hrtime.bigint()
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      fileURLToPath(import.meta.url),
      "--execute-shard",
      Buffer.from(JSON.stringify({ repoRoot, attemptIds }), "utf8").toString(
        "base64",
      ),
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: RESOURCE_POLICY.maxShardMilliseconds,
      maxBuffer: 4 * 1024 * 1024,
    },
  )
  const elapsedMilliseconds = Math.ceil(
    Number(process.hrtime.bigint() - started) / 1_000_000,
  )
  if (child.status !== 0) {
    return {
      elapsedMilliseconds,
      result: {
        maxRssKilobytes: 0,
        outcomes: attemptIds.map((attemptId) => ({
          attemptId,
          classification: "system_failure",
          code:
            child.error?.name === "Error" &&
            child.error.message.includes("ETIMEDOUT")
              ? "RESOURCE_POLICY_SHARD_TIMEOUT"
              : "RESOURCE_POLICY_SHARD_FAILED",
          retryable: false,
        })),
      },
    }
  }
  try {
    const result = JSON.parse(child.stdout) as ShardExecutionResult
    if (
      !Array.isArray(result.outcomes) ||
      result.outcomes.length !== attemptIds.length ||
      !Number.isFinite(result.maxRssKilobytes)
    ) {
      throw new TypeError("invalid shard result")
    }
    return { elapsedMilliseconds, result }
  } catch {
    return {
      elapsedMilliseconds,
      result: {
        maxRssKilobytes: 0,
        outcomes: attemptIds.map((attemptId) => ({
          attemptId,
          classification: "system_failure",
          code: "RESOURCE_POLICY_SHARD_OUTPUT_INVALID",
          retryable: false,
        })),
      },
    }
  }
}

const stoppedForResourcePolicy = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  calibration: Readonly<{
    elapsedMilliseconds: number
    maxRssKilobytes: number
    projectedTotalMilliseconds: number
    withinShardMemoryBudget: boolean
    outcomeClassification: "success" | "player_violation" | "system_failure"
  }>,
): Readonly<V138CurrentMatrixStoppedReceipt> => {
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorFailedRun: {
        classification: "system_failure_resource_pressure",
        elapsedSecondsAtTermination: 14_390,
        hostFreeMemoryPercentAtTermination: 9,
        partialResultsDiscarded: true,
        completedAttemptCount: "unknown",
      },
      calibration,
    }),
  )
  const acceptedCellLedgerRoot = sha256(canonical([]))
  const reducerSourceRoot = sha256(readFileSync(new URL(import.meta.url)))
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v1" as const,
    status: "stopped_process_failure" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    reason: "system_failure_resource_pressure" as const,
    admissionRoot: inventory.admissionRoot,
    historicalMatrixSourceSha256: inventory.historicalSourceSha256,
    arenaMapping: inventory.arenas,
    declaredAttemptCount: 540 as const,
    acceptedCellCount: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
    priorFailedRun: {
      classification: "system_failure_resource_pressure" as const,
      elapsedSecondsAtTermination: 14_390 as const,
      hostFreeMemoryPercentAtTermination: 9 as const,
      partialResultsDiscarded: true as const,
      completedAttemptCount: "unknown" as const,
    },
    resourcePolicy: RESOURCE_POLICY,
    calibration: {
      attemptCount: 1 as const,
      ...calibration,
      withinTotalRunBudget: false as const,
    },
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot,
    reducerSourceRoot,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138CurrentMatrixStoppedReceipt>
}

export const reproduceV138CurrentMatrix = (
  repoRoot: string,
): Readonly<V138CurrentMatrixReproductionReceipt> => {
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationAttempt = inventory.attempts[0]!
  const calibrationShard = executeShardSubprocess(repoRoot, [
    calibrationAttempt.attemptId,
  ])
  const calibrationOutcome = calibrationShard.result.outcomes[0]!
  const projectedTotalMilliseconds =
    calibrationShard.elapsedMilliseconds * inventory.attempts.length
  const withinShardMemoryBudget =
    calibrationShard.result.maxRssKilobytes <=
    RESOURCE_POLICY.maxShardRssKilobytes
  const calibration = {
    elapsedMilliseconds: calibrationShard.elapsedMilliseconds,
    maxRssKilobytes: calibrationShard.result.maxRssKilobytes,
    projectedTotalMilliseconds,
    withinShardMemoryBudget,
    outcomeClassification: calibrationOutcome.classification,
  }
  if (
    projectedTotalMilliseconds >
      RESOURCE_POLICY.maxProjectedTotalMilliseconds ||
    !withinShardMemoryBudget ||
    calibrationOutcome.classification !== "success"
  ) {
    return stoppedForResourcePolicy(inventory, calibration)
  }

  const outcomes: V138CurrentMatrixAttemptOutcome[] = []
  for (
    let offset = 0;
    offset < inventory.attempts.length;
    offset += RESOURCE_POLICY.maxShardAttempts
  ) {
    const shard = inventory.attempts.slice(
      offset,
      offset + RESOURCE_POLICY.maxShardAttempts,
    )
    const executed = executeShardSubprocess(
      repoRoot,
      shard.map(({ attemptId }) => attemptId),
    )
    outcomes.push(...executed.result.outcomes)
    process.stderr.write(
      `${JSON.stringify({
        event: "v1.38_matrix_shard_terminal",
        completedAttempts: outcomes.length,
        declaredAttempts: inventory.attempts.length,
        acceptedCellsPublished: 0,
        partialAcceptedEvidenceReusable: false,
      })}\n`,
    )
  }
  return reduceV138CurrentMatrix(inventory, outcomes)
}

export const renderV138CurrentMatrixReceipt = (
  receipt: Readonly<V138CurrentMatrixReproductionReceipt>,
): string => `${JSON.stringify(receipt)}\n`

const runShardCli = (): void => {
  if (
    process.argv[1] !== fileURLToPath(import.meta.url) ||
    process.argv[2] !== "--execute-shard"
  ) {
    return
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(process.argv[3] ?? "", "base64").toString("utf8"),
    ) as { repoRoot: string; attemptIds: string[] }
    const inventory = enumerateV138CurrentMatrix(decoded.repoRoot)
    const byId = new Map(
      inventory.attempts.map((attempt) => [attempt.attemptId, attempt]),
    )
    const attempts = decoded.attemptIds.map((attemptId) => {
      const attempt = byId.get(attemptId)
      if (attempt === undefined) {
        throw new TypeError("MATRIX_SHARD_ATTEMPT_UNKNOWN")
      }
      return attempt
    })
    const outcomes = executeAttemptsInProcess(inventory, attempts)
    process.stdout.write(
      JSON.stringify({
        outcomes,
        maxRssKilobytes: process.resourceUsage().maxRSS,
      }),
    )
  } catch {
    process.exitCode = 1
  }
}

runShardCli()
