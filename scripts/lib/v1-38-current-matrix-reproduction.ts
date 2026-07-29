import { createHash, generateKeyPairSync, sign } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import {
  createPreparedRuntimeServiceDependenciesV118,
  executePreparedRuntimeServiceRequestV118,
} from "../../apps/runtime-service/src/execute-match.js"
import { createRuntimeServiceConfig } from "../../apps/runtime-service/src/runtime-config.js"
import {
  ADVANCED_STRATEGY_DEFINITIONS,
  buildAdvancedStrategyRevision,
} from "../../packages/persistence/src/advanced-strategies.js"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticTupleV118,
  createSetScenarioV137,
  type JsonValue,
  type RuntimeCertificateReferenceV118,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceRequestV118,
  type StrategyRevision,
} from "../../packages/spec/src/index.js"

const FIXTURE_PURPOSE = "regression_throughput_only" as const
const HISTORICAL_MATRIX_SOURCE =
  ".planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts"
const ADMISSION_RECEIPT =
  ".planning/artifacts/v1.38-foundation-admission.json"
const MATRIX_SCHEMA_VERSION = "v1.38-current-matrix-inventory-v1" as const
const FIXED_EVALUATION_INSTANT = "2026-07-28T00:00:00.000Z"
const FIXED_AUTHORITY_GENERATION = "0"

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

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

const certificateReference = (
  side: "bottom" | "top",
  attemptId: string,
  revision: StrategyRevision,
): RuntimeCertificateReferenceV118 => {
  const sourceDigest = sha256(revision.source)
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
      identityManifestRoot: sha256(
        `v1.38-matrix-identity\0${revision.id}`,
      ),
      evidenceGraphRoot: sha256(
        `v1.38-matrix-supervision\0${revision.id}`,
      ),
      laneIdentityHash: sha256(
        `v1.38-matrix-lane\0${revision.id}`,
      ),
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
              seedLabel === "meta-even"
                ? bottomEntrantId
                : topEntrantId
            const initialInitiativePlayerId =
              seedLabel === "meta-even" ? bottomPlayerId : topPlayerId
            const scenario = createSetScenarioV137({
              arenaCatalogVersion:
                CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
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
              authorityBundleHash: sha256(
                `v1.38-matrix-authority\0${attemptId}`,
              ),
              registryGeneration: FIXED_AUTHORITY_GENERATION,
              publication: {
                publicationId: `publication:v138-matrix:${attemptId}`,
                installReceiptId: `install:v138-matrix:${attemptId}`,
                payloadSha256: sha256(`payload\0${attemptId}`),
                envelopeSha256: sha256(`envelope\0${attemptId}`),
                sourceManifestHash: sha256(`manifest\0${attemptId}`),
              },
              entrants: {
                bottom: {
                  entrantKey: bottomEntrantId,
                  strategyRevisionId: bottom.revision.id,
                  laneIdentityHash: sha256(
                    `v1.38-matrix-lane\0${bottom.revision.id}`,
                  ),
                  effectiveStatus: "exhibition_only" as const,
                  schedulingDecisionId: `schedule:v138-matrix:${attemptId}:bottom`,
                  schedulingDecisionHash: sha256(
                    `schedule\0${attemptId}\0bottom`,
                  ),
                  schedulingDecision: {
                    status: "exhibition_only" as const,
                    reasonCode: "CONFORMANCE_MISSING",
                    evaluatedAt: FIXED_EVALUATION_INSTANT,
                    freshUntil: "2099-12-31T23:59:59.999Z",
                    registryGeneration: FIXED_AUTHORITY_GENERATION,
                  },
                  containmentCertificateId:
                    `certificate:v138-matrix:${attemptId}:bottom`,
                  containmentCertificateHash: sha256(
                    `v1.38-matrix-certificate\0${attemptId}\0bottom\0${bottom.revision.id}`,
                  ),
                },
                top: {
                  entrantKey: topEntrantId,
                  strategyRevisionId: top.revision.id,
                  laneIdentityHash: sha256(
                    `v1.38-matrix-lane\0${top.revision.id}`,
                  ),
                  effectiveStatus: "exhibition_only" as const,
                  schedulingDecisionId: `schedule:v138-matrix:${attemptId}:top`,
                  schedulingDecisionHash: sha256(
                    `schedule\0${attemptId}\0top`,
                  ),
                  schedulingDecision: {
                    status: "exhibition_only" as const,
                    reasonCode: "CONFORMANCE_MISSING",
                    evaluatedAt: FIXED_EVALUATION_INSTANT,
                    freshUntil: "2099-12-31T23:59:59.999Z",
                    registryGeneration: FIXED_AUTHORITY_GENERATION,
                  },
                  containmentCertificateId:
                    `certificate:v138-matrix:${attemptId}:top`,
                  containmentCertificateHash: sha256(
                    `v1.38-matrix-certificate\0${attemptId}\0top\0${top.revision.id}`,
                  ),
                },
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
                  arenaSemanticGeometryHash:
                    scenario.arenaSemanticGeometryHash,
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
                budgetProfileRoot: sha256("v1.38-matrix-budget-v1"),
                ledgerPrestateRoot: sha256(
                  `v1.38-matrix-ledger-prestate\0${attemptId}`,
                ),
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

// Task 2 fills the executor/reducer. Keeping the selected functions referenced
// here makes the authority dependency explicit at the module boundary.
void createRuntimeServiceConfig
void createPreparedRuntimeServiceDependenciesV118
void executePreparedRuntimeServiceRequestV118
void generateKeyPairSync
void sign

