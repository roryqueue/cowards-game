import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import type {
  ExecutableLaneIdentity,
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyLanguageId,
  StrategyRevisionId,
} from "@cowards/spec"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  type SetScenarioV137,
} from "@cowards/spec"
import type { Pool, PoolClient } from "pg"
import { createRepositories } from "./repositories.js"
import { withTransaction } from "./db.js"
import {
  createMatchJobId,
  validateCreateMatchInput,
  validateCreateMatchRecordInput,
  type CreateMatchRecordInput,
  type CreateMatchRecordInputV119,
} from "./match-service.js"
import {
  IntegrityEvidenceInputError,
  createMatchExecutionEvidencePair,
  createCandidateMatchSetIntegrityIdentityV117,
  createCandidateMatchSetIntegrityIdentityV119,
  createMatchSetIntegrityIdentity,
  matchExecutionEvidencePairSqlValues,
  matchSetExecutionEntrantSqlValues,
  matchSetIntegritySqlValues,
  type EntrantExecutionEvidence,
  type MatchExecutionEvidencePair,
  type MatchSetIntegrityIdentity,
} from "./integrity-evidence.js"
import type { RuntimeExecutionCompatibilityIdentity } from "@cowards/spec"
import {
  getMatchSetPreset,
  getMatchSetPresetV117,
  resolveFileCurrentSchedulingSemanticAuthority,
  resolveSchedulingSemanticAuthority,
  resolveVersionedMatchSetPreset,
  type FrozenSchedulingSemanticAuthority,
  type MatchSetPresetId,
  type MatchSetPresetV119Candidate,
  type SchedulingSemanticAuthorityKey,
} from "./presets.js"
import type { MatchSetStatus } from "./schema.js"
import {
  assertCountedSemanticAuthoritySelection,
  lockSemanticAuthoritySelectionHead,
} from "./semantic-authority-selection-head.js"

export interface IntegritySchedulingIdentity {
  compatibility: RuntimeExecutionCompatibilityIdentity
  authorityBundleHash: string
  registryGeneration: string
  executionEntrants: Readonly<Record<string, EntrantExecutionEvidence>>
}

export type MatchSetEvidencePurpose =
  | "counted"
  | "exhibition"
  | "workshop"
  | "development"

export interface MatchSetEvidenceEntrantBinding {
  entrantKey: string
  strategyRevisionId: StrategyRevisionId
}

export interface MatchSetEvidenceResolutionRequest {
  purpose: MatchSetEvidencePurpose
  evaluationInstant: string
  entrants: readonly MatchSetEvidenceEntrantBinding[]
}

export interface MatchSetExecutionEvidenceResolver {
  readonly trustDomain: "production" | "fixture"
  resolve(
    input: MatchSetEvidenceResolutionRequest,
  ): Promise<IntegritySchedulingIdentity>
}

export const EMPTY_PRODUCTION_MATCH_SET_EVIDENCE_RESOLVER: MatchSetExecutionEvidenceResolver =
  Object.freeze({
    trustDomain: "production" as const,
    async resolve(): Promise<IntegritySchedulingIdentity> {
      throw new IntegrityEvidenceInputError(
        "Production containment authority is empty; MatchSet creation is unavailable.",
      )
    },
  })

const fixtureHash = (value: string): string =>
  createHash("sha256").update(`fixture:v1.37:${value}`, "utf8").digest("hex")

export const createFixtureMatchSetEvidenceResolver = (
  options: {
    languageIdsByRevision?:
      | Readonly<Record<string, StrategyLanguageId>>
      | undefined
    omitStrategyRevisionIds?: readonly string[] | undefined
    semanticAuthorityKey?: SchedulingSemanticAuthorityKey | undefined
  } = {},
): MatchSetExecutionEvidenceResolver =>
  Object.freeze({
    trustDomain: "fixture" as const,
    async resolve(
      input: MatchSetEvidenceResolutionRequest,
    ): Promise<IntegritySchedulingIdentity> {
      const selected = (
        options.semanticAuthorityKey === undefined
          ? resolveFileCurrentSchedulingSemanticAuthority()
          : resolveSchedulingSemanticAuthority(options.semanticAuthorityKey)
      ).selection
      const tuple = {
        tupleId: selected.tupleId,
        tuple: {
          rules: selected.rulesVersion,
          engine: selected.engineVersion,
          runtimeAbi: selected.runtimeAbiVersion,
          chronicle: selected.chronicleVersion,
          arenaCatalog: selected.arenaCatalogVersion,
          setPolicy: selected.setPolicyVersion,
        },
      }
      const isCandidate = selected.semanticAuthorityKey === "runtime-v1.19"
      const registryGeneration = "fixture:v1.37:generation:1"
      const omitted = new Set(options.omitStrategyRevisionIds ?? [])
      const executionEntrants = Object.fromEntries(
        input.entrants
          .filter((binding) => !omitted.has(binding.strategyRevisionId))
          .map((binding, index) => {
            const languageId =
              options.languageIdsByRevision?.[binding.strategyRevisionId] ??
              "typescript"
            const laneIdentity: ExecutableLaneIdentity = {
              providerId: `fixture:provider:${languageId}`,
              languageId,
              runtimeId: `fixture:runtime:${languageId}`,
              runtimeVersion: "1",
              toolchainId: `fixture:toolchain:${languageId}`,
              toolchainVersion: "1",
              adapterId: `fixture:adapter:${languageId}`,
              adapterVersion: "1",
              policyId: "fixture:policy:v1.37",
              policyVersion: "1",
              corpusId: "fixture:corpus:v1.37",
              corpusVersion: "1",
              artifactId: `fixture:artifact:${binding.strategyRevisionId}`,
              artifactSha256: fixtureHash(
                `artifact:${binding.strategyRevisionId}`,
              ),
              implementationId: `fixture:implementation:${languageId}`,
              buildId: `fixture:build:${languageId}:${index}`,
              semanticTupleId: tuple.tupleId,
              semanticTuple: { ...tuple.tuple },
            }
            return [
              binding.entrantKey,
              {
                entrantKey: binding.entrantKey,
                strategyRevisionId: binding.strategyRevisionId,
                laneIdentity,
                containmentCertificateRef: {
                  kind: "containment" as const,
                  certificateId: `fixture:certificate:containment:${binding.strategyRevisionId}`,
                  certificateVersion: "fixture-runtime-certificate-v1",
                  certificateRecordHash: fixtureHash(
                    `containment:${binding.strategyRevisionId}`,
                  ),
                  registryGeneration,
                },
                ...(isCandidate
                  ? {
                      conformanceCertificateRef: {
                        kind: "conformance" as const,
                        certificateId: `fixture:certificate:conformance:${binding.strategyRevisionId}`,
                        certificateVersion:
                          "runtime-conformance-certificate-v1.19",
                        certificateRecordHash: fixtureHash(
                          `conformance:${binding.strategyRevisionId}`,
                        ),
                        registryGeneration,
                      },
                    }
                  : {}),
                schedulingDecision: {
                  status: isCandidate
                    ? ("counted" as const)
                    : ("exhibition_only" as const),
                  reasonCode: isCandidate
                    ? ("EVIDENCE_CURRENT" as const)
                    : ("CONFORMANCE_MISSING" as const),
                  evaluatedAt: input.evaluationInstant,
                  freshUntil: "2099-12-31T23:59:59.999Z",
                  registryGeneration,
                },
              },
            ]
          }),
      )
      return {
        compatibility: {
          tupleId: tuple.tupleId,
          tuple: { ...tuple.tuple },
        },
        authorityBundleHash: fixtureHash("authority-bundle"),
        registryGeneration,
        executionEntrants,
      }
    },
  })

export const resolveMatchSetExecutionEvidence = async (input: {
  resolver?: MatchSetExecutionEvidenceResolver | undefined
  purpose: MatchSetEvidencePurpose
  evaluationInstant: string
  entrants: readonly MatchSetEvidenceEntrantBinding[]
  semanticAuthorityKey?: SchedulingSemanticAuthorityKey | undefined
}): Promise<IntegritySchedulingIdentity> => {
  const resolver =
    input.resolver ?? EMPTY_PRODUCTION_MATCH_SET_EVIDENCE_RESOLVER
  if (input.purpose === "counted" && resolver.trustDomain !== "production") {
    throw new IntegrityEvidenceInputError(
      "Fixture-domain evidence cannot authorize counted MatchSet creation.",
    )
  }
  const resolved = await resolver.resolve({
    purpose: input.purpose,
    evaluationInstant: input.evaluationInstant,
    entrants: input.entrants.map((entrant) => ({ ...entrant })),
  })
  const identityInput = {
    compatibility: resolved.compatibility,
    authorityBundleHash: resolved.authorityBundleHash,
    registryGeneration: resolved.registryGeneration,
    expectedEntrants: input.entrants.map((entrant) => ({ ...entrant })),
    entrants: Object.values(resolved.executionEntrants),
  }
  const identity =
    input.semanticAuthorityKey === "runtime-v1.19"
      ? createCandidateMatchSetIntegrityIdentityV119(identityInput)
      : input.semanticAuthorityKey === "runtime-v1.17"
        ? createCandidateMatchSetIntegrityIdentityV117(identityInput)
        : createMatchSetIntegrityIdentity(identityInput)
  if (
    identity.normalizedEntrants.some(
      (entrant) =>
        entrant.schedulingDecision.status === "disabled" ||
        (input.purpose === "counted" &&
          (entrant.schedulingDecision.status !== "counted" ||
            entrant.schedulingDecision.reasonCode !== "EVIDENCE_CURRENT")),
    )
  ) {
    throw new IntegrityEvidenceInputError(
      input.purpose === "counted"
        ? "Counted MatchSet creation requires current containment and conformance for every entrant."
        : "MatchSet creation requires current containment for every entrant.",
    )
  }
  return Object.freeze({
    compatibility: identity.compatibility,
    authorityBundleHash: identity.authorityBundleHash,
    registryGeneration: identity.registryGeneration,
    executionEntrants: identity.entrantsByKey,
  })
}

export interface CreateMatchSetFromMatrixInput {
  id: MatchSetId
  semanticAuthorityKey?: SchedulingSemanticAuthorityKey | undefined
  matches: CreateMatchRecordInput[]
  integrityIdentity: IntegritySchedulingIdentity
  matchSet?: {
    presetId?: MatchSetPresetId | undefined
    presetVersion?: "v1" | undefined
    creatorUserId?: string | undefined
    competitionPresetId?: string | undefined
    competitionPresetVersion?: string | undefined
    scoringPolicyVersion?: string | undefined
    visibility?: string | undefined
    entrantSnapshotSet?: unknown
    publicationPolicy?: unknown
    duplicateKey?: string | undefined
    lockedAt?: Date | undefined
  }
  competitionEntrants?: Array<{
    id: string
    entrantIndex: number
    executionEntrantKey: string
    strategyRevisionId: StrategyRevisionId
    ownerUserId: string
    ownerHandle: string
    displayLabel: string
    sourceHash: string
    sourceBytes: number
    runtime: unknown
    engineCompatibility: unknown
    snapshot: unknown
  }>
}

export interface CreateMatchSetFromPresetInput {
  id: MatchSetId
  presetId: MatchSetPresetId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  integrityIdentity: IntegritySchedulingIdentity
}

export interface CreateMatchSetFromPresetInputV119 extends CreateMatchSetFromPresetInput {
  semanticAuthorityKey: "runtime-v1.19"
}

export interface CreateMatchSetFromPresetInputV117 extends CreateMatchSetFromPresetInput {
  semanticAuthorityKey: "runtime-v1.17"
}

type GeneratePresetMatrixInput = Omit<
  CreateMatchSetFromPresetInput,
  "integrityIdentity"
>

export const generatePresetMatrixV117 = (
  input: GeneratePresetMatrixInput,
): CreateMatchRecordInput[] => {
  const preset = getMatchSetPresetV117(input.presetId)
  const matches: CreateMatchRecordInput[] = []
  let index = 0

  for (const arenaVariantId of preset.arenaVariantIds) {
    for (const seed of preset.seeds) {
      matches.push({
        id: `match:${input.id}:${index}` as MatchId,
        bottomStrategyRevisionId: input.bottomStrategyRevisionId,
        topStrategyRevisionId: input.topStrategyRevisionId,
        arenaVariantId,
        seed,
        bottomPlayerId: input.bottomPlayerId,
        topPlayerId: input.topPlayerId,
        bottomEntrantKey: input.bottomStrategyRevisionId,
        topEntrantKey: input.topStrategyRevisionId,
      })
      index += 1
      if (preset.mirrorSides) {
        matches.push({
          id: `match:${input.id}:${index}` as MatchId,
          bottomStrategyRevisionId: input.topStrategyRevisionId,
          topStrategyRevisionId: input.bottomStrategyRevisionId,
          arenaVariantId,
          seed: `${seed}:mirror`,
          bottomPlayerId: input.topPlayerId,
          topPlayerId: input.bottomPlayerId,
          bottomEntrantKey: input.topStrategyRevisionId,
          topEntrantKey: input.bottomStrategyRevisionId,
        })
        index += 1
      }
    }
  }

  return matches
}

export const generatePresetMatrix = (
  input: GeneratePresetMatrixInput,
): CreateMatchRecordInput[] => {
  getMatchSetPreset(input.presetId)
  return generatePresetMatrixV117(input)
}

export const generateCandidatePresetMatrixV119 = (
  input: Omit<CreateMatchSetFromPresetInputV119, "integrityIdentity">,
): CreateMatchRecordInputV119[] => {
  const preset = resolveVersionedMatchSetPreset({
    semanticAuthorityKey: input.semanticAuthorityKey,
    presetId: input.presetId,
  })
  if (!preset || !("semanticAuthorityKey" in preset)) {
    throw new IntegrityEvidenceInputError(
      "Explicit runtime-v1.19 preset dispatch is required.",
    )
  }
  const candidatePreset: MatchSetPresetV119Candidate = preset
  const arenaById = new Map(
    CANONICAL_ARENA_CATALOG_V1_37.arenas.map((arena) => [arena.id, arena]),
  )
  const matches: CreateMatchRecordInputV119[] = []
  let matchIndex = 0
  for (const arenaId of candidatePreset.arenaVariantIds) {
    const arena = arenaById.get(arenaId)
    if (!arena || arena.status !== "active" || !arena.schedulable) {
      throw new IntegrityEvidenceInputError(
        "Candidate preset contains a nonschedulable arena.",
      )
    }
    for (const baseSeed of candidatePreset.baseSeeds) {
      const scenario = createSetScenarioV137({
        arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
        arenaSemanticGeometryHash: arena.semanticGeometryHash,
        entrantA: {
          entrantKey: input.bottomStrategyRevisionId,
          playerId: input.bottomPlayerId,
        },
        entrantB: {
          entrantKey: input.topStrategyRevisionId,
          playerId: input.topPlayerId,
        },
        baseSeed,
      })
      const revisionByEntrant = new Map([
        [input.bottomStrategyRevisionId, input.bottomStrategyRevisionId],
        [input.topStrategyRevisionId, input.topStrategyRevisionId],
      ])
      for (const condition of scenario.conditions) {
        matches.push({
          id: `match:${input.id}:${matchIndex}` as MatchId,
          bottomStrategyRevisionId: revisionByEntrant.get(
            condition.bottomEntrantKey,
          )!,
          topStrategyRevisionId: revisionByEntrant.get(
            condition.topEntrantKey,
          )!,
          arenaVariantId: arena.id as CreateMatchRecordInput["arenaVariantId"],
          seed: scenario.baseSeed,
          bottomPlayerId: condition.bottomPlayerId,
          topPlayerId: condition.topPlayerId,
          bottomEntrantKey: condition.bottomEntrantKey,
          topEntrantKey: condition.topEntrantKey,
          semanticAuthorityKey: "runtime-v1.19",
          setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
          scenarioId: scenario.scenarioId,
          conditionId: condition.conditionId,
          conditionOrdinal: condition.ordinal,
          conditionSuffix: condition.suffix,
          requestIdentity: condition.requestIdentity,
          arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
          arenaSemanticGeometryHash: arena.semanticGeometryHash,
          initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
          initialInitiativePlayerId: condition.initialInitiativePlayerId,
        })
        matchIndex += 1
      }
    }
  }
  return matches
}

interface ValidatedMatchSetCreation {
  identity: Readonly<MatchSetIntegrityIdentity>
  pairs: readonly Readonly<MatchExecutionEvidencePair>[]
  candidateScenarios: readonly Readonly<{
    arenaId: string
    scenario: Readonly<SetScenarioV137>
  }>[]
}

const utf8KeyOrder = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))

const validateMatchSetCreation = (
  input: CreateMatchSetFromMatrixInput,
  semanticAuthority: Readonly<FrozenSchedulingSemanticAuthority>,
  now = new Date(),
): ValidatedMatchSetCreation => {
  if (!input.integrityIdentity || typeof input.integrityIdentity !== "object") {
    throw new IntegrityEvidenceInputError(
      "MatchSet creation requires exact integrity identity.",
    )
  }
  if (
    !input.integrityIdentity.executionEntrants ||
    typeof input.integrityIdentity.executionEntrants !== "object" ||
    Array.isArray(input.integrityIdentity.executionEntrants)
  ) {
    throw new IntegrityEvidenceInputError(
      "MatchSet execution entrants must be a deterministic key map.",
    )
  }

  const expectedByKey = new Map<string, string>()
  const isCandidate =
    semanticAuthority.selection.semanticAuthorityKey === "runtime-v1.19"
  if (
    input.semanticAuthorityKey !== undefined &&
    input.semanticAuthorityKey !== "runtime-v1.17" &&
    input.semanticAuthorityKey !== "runtime-v1.19"
  ) {
    throw new IntegrityEvidenceInputError(
      "Unknown MatchSet scheduling semantic authority.",
    )
  }
  if (
    input.matches.length === 0 ||
    input.matches.some(
      (match) => "semanticAuthorityKey" in match !== isCandidate,
    )
  ) {
    throw new IntegrityEvidenceInputError(
      "MatchSet scheduling versions cannot be empty or mixed.",
    )
  }
  for (const match of input.matches) {
    validateCreateMatchRecordInput(match)
    for (const [entrantKey, strategyRevisionId] of [
      [match.bottomEntrantKey, match.bottomStrategyRevisionId],
      [match.topEntrantKey, match.topStrategyRevisionId],
    ] as const) {
      const existing = expectedByKey.get(entrantKey)
      if (existing && existing !== strategyRevisionId) {
        throw new IntegrityEvidenceInputError(
          `Entrant ${entrantKey} has mixed Strategy Revision bindings.`,
        )
      }
      expectedByKey.set(entrantKey, strategyRevisionId)
    }
  }

  const executionEntrants = Object.entries(
    input.integrityIdentity.executionEntrants,
  ).sort(([left], [right]) => utf8KeyOrder(left, right))
  for (const [key, evidence] of executionEntrants) {
    if (
      !evidence ||
      typeof evidence !== "object" ||
      evidence.entrantKey !== key
    ) {
      throw new IntegrityEvidenceInputError(
        "Execution entrant map keys must exactly match entrant evidence keys.",
      )
    }
  }

  const identityInput = {
    compatibility: input.integrityIdentity.compatibility,
    authorityBundleHash: input.integrityIdentity.authorityBundleHash,
    registryGeneration: input.integrityIdentity.registryGeneration,
    expectedEntrants: [...expectedByKey.entries()].map(
      ([entrantKey, strategyRevisionId]) => ({
        entrantKey,
        strategyRevisionId,
      }),
    ),
    entrants: executionEntrants.map(([, evidence]) => evidence),
  }
  const identity = isCandidate
    ? createCandidateMatchSetIntegrityIdentityV119(identityInput)
    : semanticAuthority.selection.semanticAuthorityKey === "runtime-v1.17"
      ? createCandidateMatchSetIntegrityIdentityV117(identityInput)
      : createMatchSetIntegrityIdentity(identityInput)
  const tuple = identity.compatibility.tuple
  if (
    identity.compatibility.tupleId !== semanticAuthority.selection.tupleId ||
    tuple.rules !== semanticAuthority.selection.rulesVersion ||
    tuple.engine !== semanticAuthority.selection.engineVersion ||
    tuple.runtimeAbi !== semanticAuthority.selection.runtimeAbiVersion ||
    tuple.chronicle !== semanticAuthority.selection.chronicleVersion ||
    tuple.arenaCatalog !== semanticAuthority.selection.arenaCatalogVersion ||
    tuple.setPolicy !== semanticAuthority.selection.setPolicyVersion
  ) {
    throw new IntegrityEvidenceInputError(
      "MatchSet compatibility tuple does not match its semantic authority selection.",
    )
  }

  const candidateScenarios: Array<{
    arenaId: string
    scenario: Readonly<SetScenarioV137>
  }> = []
  if (isCandidate) {
    if (
      identity.compatibility.tupleId !==
      CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID
    ) {
      throw new IntegrityEvidenceInputError(
        "Candidate MatchSet requires the exact runtime-v1.19 tuple.",
      )
    }
    const byScenario = new Map<string, CreateMatchRecordInput[]>()
    for (const match of input.matches) {
      if (!("semanticAuthorityKey" in match)) continue
      const rows = byScenario.get(match.scenarioId) ?? []
      rows.push(match)
      byScenario.set(match.scenarioId, rows)
    }
    for (const rows of byScenario.values()) {
      if (rows.length !== 4) {
        throw new IntegrityEvidenceInputError(
          "Candidate scenario requires exactly four conditions.",
        )
      }
      const first = rows.find(
        (match) =>
          "semanticAuthorityKey" in match && match.conditionOrdinal === 0,
      )
      if (!first || !("semanticAuthorityKey" in first)) {
        throw new IntegrityEvidenceInputError(
          "Candidate scenario is missing canonical condition zero.",
        )
      }
      const scenario = createSetScenarioV137({
        arenaCatalogVersion: first.arenaCatalogVersion,
        arenaSemanticGeometryHash: first.arenaSemanticGeometryHash,
        entrantA: {
          entrantKey: first.bottomEntrantKey,
          playerId: first.bottomPlayerId,
        },
        entrantB: {
          entrantKey: first.topEntrantKey,
          playerId: first.topPlayerId,
        },
        baseSeed: first.seed,
      })
      const conditionIds = new Set(
        rows.map((match) =>
          "semanticAuthorityKey" in match ? match.conditionId : "",
        ),
      )
      if (
        scenario.scenarioId !== first.scenarioId ||
        conditionIds.size !== 4 ||
        scenario.conditions.some(
          (condition) => !conditionIds.has(condition.conditionId),
        ) ||
        rows.some(
          (match) =>
            match.arenaVariantId !== first.arenaVariantId ||
            match.seed !== first.seed ||
            !("semanticAuthorityKey" in match) ||
            match.scenarioId !== first.scenarioId,
        )
      ) {
        throw new IntegrityEvidenceInputError(
          "Candidate scenario membership is incomplete or substituted.",
        )
      }
      candidateScenarios.push({
        arenaId: first.arenaVariantId,
        scenario,
      })
    }
  }

  const pairs = input.matches.map((match) => {
    const evidencePair = createMatchExecutionEvidencePair(identity, {
      bottomEntrantKey: match.bottomEntrantKey,
      topEntrantKey: match.topEntrantKey,
      bottomStrategyRevisionId: match.bottomStrategyRevisionId,
      topStrategyRevisionId: match.topStrategyRevisionId,
    })
    validateCreateMatchInput(
      {
        ...match,
        integrityIdentity: {
          matchSetId: input.id,
          identity,
          evidencePair,
        },
      },
      now,
    )
    return evidencePair
  })

  const linkedEntrantKeys = new Set<string>()
  for (const entrant of input.competitionEntrants ?? []) {
    const evidence = identity.entrantsByKey[entrant.executionEntrantKey]
    if (
      !evidence ||
      evidence.strategyRevisionId !== entrant.strategyRevisionId
    ) {
      throw new IntegrityEvidenceInputError(
        "Competition entrant execution evidence binding is missing or invalid.",
      )
    }
    if (linkedEntrantKeys.has(entrant.executionEntrantKey)) {
      throw new IntegrityEvidenceInputError(
        "Competition entrant execution evidence links must be distinct.",
      )
    }
    linkedEntrantKeys.add(entrant.executionEntrantKey)
  }

  return Object.freeze({
    identity,
    pairs: Object.freeze(pairs),
    candidateScenarios: Object.freeze(candidateScenarios),
  })
}

export const insertMatchSetWithMatrixOnClient = async (
  client: PoolClient,
  input: CreateMatchSetFromMatrixInput,
): Promise<void> => {
  const semanticAuthority =
    input.semanticAuthorityKey === undefined
      ? resolveFileCurrentSchedulingSemanticAuthority()
      : resolveSchedulingSemanticAuthority(input.semanticAuthorityKey)
  const validated = validateMatchSetCreation(input, semanticAuthority)

  if (input.semanticAuthorityKey === undefined) {
    const head = await lockSemanticAuthoritySelectionHead(client)
    assertCountedSemanticAuthoritySelection(
      head,
      semanticAuthority.selection,
      semanticAuthority.selectionRoot,
    )
  }

  const repositories = createRepositories(client)
  const revisionIds = new Set<StrategyRevisionId>()
  const isCandidate = validated.candidateScenarios.length > 0

  for (const match of input.matches) {
    await repositories.assertStrategyRevisionCanBeUsed(
      match.bottomStrategyRevisionId,
    )
    await repositories.assertStrategyRevisionCanBeUsed(
      match.topStrategyRevisionId,
    )
    if (!isCandidate) {
      const arena = await repositories.getArenaVariant(match.arenaVariantId)
      if (!arena) {
        throw new Error(`ArenaVariant not found: ${match.arenaVariantId}`)
      }
    }
    revisionIds.add(match.bottomStrategyRevisionId)
    revisionIds.add(match.topStrategyRevisionId)
  }

  for (const revisionId of revisionIds) {
    await repositories.lockStrategyRevision(revisionId)
  }

  if (isCandidate) {
    for (const { arenaId, scenario } of validated.candidateScenarios) {
      const catalog = await repositories.lockReleasedArenaCatalogEntry(
        scenario.arenaCatalogVersion,
        arenaId,
      )
      if (catalog.semanticGeometryHash !== scenario.arenaSemanticGeometryHash) {
        throw new IntegrityEvidenceInputError(
          "Frozen arena catalog identity does not match the candidate scenario.",
        )
      }
    }
    for (const entrant of validated.identity.normalizedEntrants) {
      const admission = await repositories.getStrategyRevisionV119Admission(
        entrant.strategyRevisionId,
      )
      const certificate = entrant.conformanceCertificateRef
      if (
        !admission ||
        !certificate ||
        admission.strategyRevisionId !== entrant.strategyRevisionId ||
        admission.languageId !== entrant.laneIdentity.languageId ||
        admission.providerId !== entrant.laneIdentity.providerId ||
        admission.laneId !== entrant.laneIdentity.adapterId ||
        admission.semanticTupleId !==
          validated.identity.compatibility.tupleId ||
        admission.artifactSha256 !==
          `sha256:${entrant.laneIdentity.artifactSha256}` ||
        admission.reviewedCertificateId !== certificate.certificateId ||
        admission.reviewedCertificateSha256 !==
          `sha256:${certificate.certificateRecordHash}`
      ) {
        throw new IntegrityEvidenceInputError(
          `Strategy Revision ${entrant.strategyRevisionId} lacks exact runtime-v1.19 admission evidence.`,
        )
      }
    }
  }

  const matchSet = input.matchSet ?? {}
  const integritySqlValues = [...matchSetIntegritySqlValues(validated.identity)]
  // node-postgres serializes JavaScript arrays as PostgreSQL arrays. The
  // normalized entrant set is one JSONB document, so serialize it explicitly.
  integritySqlValues[9] = JSON.stringify(integritySqlValues[9])
  await client.query(
    `
        insert into match_sets (
          id,
          status,
          preset_id,
          preset_version,
          matrix,
          creator_user_id,
          competition_preset_id,
          competition_preset_version,
          scoring_policy_version,
          visibility,
          entrant_snapshot_set,
          publication_policy,
          duplicate_key,
          locked_at,
          compatibility_tuple_id,
          compatibility_rules_version,
          compatibility_engine_version,
          compatibility_runtime_abi_version,
          compatibility_chronicle_version,
          compatibility_arena_catalog_version,
          compatibility_set_policy_version,
          authority_bundle_hash,
          authority_registry_generation,
          execution_evidence_set,
          execution_evidence_set_hash,
          semantic_authority_selection,
          semantic_authority_selection_root
        )
        values (
          $1,
          'pending',
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26
        )
      `,
    [
      input.id,
      matchSet.presetId ?? null,
      matchSet.presetVersion ?? null,
      JSON.stringify(input.matches),
      matchSet.creatorUserId ?? null,
      matchSet.competitionPresetId ?? null,
      matchSet.competitionPresetVersion ?? null,
      matchSet.scoringPolicyVersion ?? null,
      matchSet.visibility ?? null,
      JSON.stringify(matchSet.entrantSnapshotSet ?? []),
      JSON.stringify(matchSet.publicationPolicy ?? {}),
      matchSet.duplicateKey ?? null,
      matchSet.lockedAt ?? null,
      ...integritySqlValues,
      semanticAuthority.selection,
      semanticAuthority.selectionRoot,
    ],
  )

  for (const entrant of validated.identity.normalizedEntrants) {
    await client.query(
      `
        insert into match_set_execution_entrants (
          match_set_id, entrant_key, strategy_revision_id, lane_identity,
          lane_identity_hash, containment_certificate_kind,
          containment_certificate_id, containment_certificate_version,
          containment_certificate_hash, conformance_certificate_kind,
          conformance_certificate_id, conformance_certificate_version,
          conformance_certificate_hash, scheduling_status,
          scheduling_reason_code, scheduling_evaluated_at,
          scheduling_fresh_until, authority_registry_generation,
          execution_snapshot, authority_bundle_hash
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
      `,
      [
        ...matchSetExecutionEntrantSqlValues(input.id, entrant),
        validated.identity.authorityBundleHash,
      ],
    )
  }

  for (const entrant of input.competitionEntrants ?? []) {
    await client.query(
      `
          insert into competition_entrants (
            id,
            match_set_id,
            entrant_index,
            strategy_revision_id,
            owner_user_id,
            owner_handle,
            display_label,
            source_hash,
            source_bytes,
            runtime,
            engine_compatibility,
            snapshot,
            execution_entrant_key
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `,
      [
        entrant.id,
        input.id,
        entrant.entrantIndex,
        entrant.strategyRevisionId,
        entrant.ownerUserId,
        entrant.ownerHandle,
        entrant.displayLabel,
        entrant.sourceHash,
        entrant.sourceBytes,
        entrant.runtime,
        entrant.engineCompatibility,
        entrant.snapshot,
        entrant.executionEntrantKey,
      ],
    )
  }

  for (const { arenaId, scenario } of validated.candidateScenarios) {
    await client.query(
      `insert into set_scenarios (
         match_set_id, scenario_id, set_policy_version,
         arena_catalog_version, arena_id, arena_semantic_geometry_hash,
         entrant_a_key, entrant_b_key, entrant_a_player_id,
         entrant_b_player_id, base_seed
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        input.id,
        scenario.scenarioId,
        scenario.setPolicyVersion,
        scenario.arenaCatalogVersion,
        arenaId,
        scenario.arenaSemanticGeometryHash,
        scenario.entrantA.entrantKey,
        scenario.entrantB.entrantKey,
        scenario.entrantA.playerId,
        scenario.entrantB.playerId,
        scenario.baseSeed,
      ],
    )
    for (const condition of scenario.conditions) {
      await client.query(
        `insert into set_conditions (
           match_set_id, scenario_id, condition_id, condition_ordinal,
           condition_suffix, request_identity, arena_catalog_version,
           arena_semantic_geometry_hash, bottom_entrant_key, top_entrant_key,
           initial_initiative_entrant_key, bottom_player_id, top_player_id,
           initial_initiative_player_id
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
         )`,
        [
          input.id,
          scenario.scenarioId,
          condition.conditionId,
          condition.ordinal,
          condition.suffix,
          condition.requestIdentity,
          scenario.arenaCatalogVersion,
          scenario.arenaSemanticGeometryHash,
          condition.bottomEntrantKey,
          condition.topEntrantKey,
          condition.initialInitiativeEntrantKey,
          condition.bottomPlayerId,
          condition.topPlayerId,
          condition.initialInitiativePlayerId,
        ],
      )
    }
  }

  for (const [matrixIndex, match] of input.matches.entries()) {
    const evidencePair = validated.pairs[matrixIndex]!
    if ("semanticAuthorityKey" in match) {
      await client.query(
        `
          insert into matches (
            id, bottom_strategy_revision_id, top_strategy_revision_id,
            arena_variant_id, seed, bottom_player_id, top_player_id, status,
            integrity_match_set_id, bottom_execution_entrant_key,
            top_execution_entrant_key, bottom_execution_evidence,
            top_execution_evidence, execution_evidence_pair_hash,
            successor_match_set_id, successor_scenario_id,
            successor_condition_id, successor_condition_ordinal,
            successor_arena_catalog_version,
            successor_arena_semantic_geometry_hash,
            successor_bottom_entrant_key, successor_top_entrant_key,
            successor_initial_initiative_entrant_key,
            initial_initiative_player_id,
            semantic_authority_selection_root
          ) values (
            $1, $2, $3, $4, $5, $6, $7, 'pending',
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
          )`,
        [
          match.id,
          match.bottomStrategyRevisionId,
          match.topStrategyRevisionId,
          match.arenaVariantId,
          match.seed,
          match.bottomPlayerId,
          match.topPlayerId,
          ...matchExecutionEvidencePairSqlValues(input.id, evidencePair),
          input.id,
          match.scenarioId,
          match.conditionId,
          match.conditionOrdinal,
          match.arenaCatalogVersion,
          match.arenaSemanticGeometryHash,
          match.bottomEntrantKey,
          match.topEntrantKey,
          match.initialInitiativeEntrantKey,
          match.initialInitiativePlayerId,
          semanticAuthority.selectionRoot,
        ],
      )
    } else {
      await client.query(
        `
          insert into matches (
            id, bottom_strategy_revision_id, top_strategy_revision_id,
            arena_variant_id, seed, bottom_player_id, top_player_id, status,
            integrity_match_set_id, bottom_execution_entrant_key,
            top_execution_entrant_key, bottom_execution_evidence,
            top_execution_evidence, execution_evidence_pair_hash,
            semantic_authority_selection_root
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, 'pending',
            $8, $9, $10, $11, $12, $13, $14
          )
        `,
        [
          match.id,
          match.bottomStrategyRevisionId,
          match.topStrategyRevisionId,
          match.arenaVariantId,
          match.seed,
          match.bottomPlayerId,
          match.topPlayerId,
          ...matchExecutionEvidencePairSqlValues(input.id, evidencePair),
          semanticAuthority.selectionRoot,
        ],
      )
    }
    await client.query(
      `
          insert into match_jobs (
            id, match_id, status, integrity_match_set_id,
            bottom_execution_entrant_key, top_execution_entrant_key,
            bottom_execution_evidence, top_execution_evidence,
            execution_evidence_pair_hash, semantic_authority_selection_root
          )
          values ($1, $2, 'queued', $3, $4, $5, $6, $7, $8, $9)
        `,
      [
        createMatchJobId(match.id),
        match.id,
        ...matchExecutionEvidencePairSqlValues(input.id, evidencePair),
        semanticAuthority.selectionRoot,
      ],
    )
    await client.query(
      `
          insert into match_set_matches (match_set_id, match_id, matrix_index)
          values ($1, $2, $3)
        `,
      [input.id, match.id, matrixIndex],
    )
  }
}

const insertMatchSetWithMatrix = async (
  pool: Pool,
  input: CreateMatchSetFromMatrixInput,
): Promise<void> => {
  if (input.semanticAuthorityKey !== "runtime-v1.19") {
    return withTransaction(pool, (client) =>
      insertMatchSetWithMatrixOnClient(client, input),
    )
  }
  const client = await pool.connect()
  try {
    await client.query("begin isolation level serializable")
    await insertMatchSetWithMatrixOnClient(client, input)
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

export const createMatchSetService = (pool: Pool) => ({
  async createFromMatrix(
    input: CreateMatchSetFromMatrixInput,
  ): Promise<{ matchSetId: MatchSetId; matchIds: MatchId[] }> {
    await insertMatchSetWithMatrix(pool, input)
    return {
      matchSetId: input.id,
      matchIds: input.matches.map((match) => match.id),
    }
  },

  async createFromPreset(
    input:
      | CreateMatchSetFromPresetInput
      | CreateMatchSetFromPresetInputV117
      | CreateMatchSetFromPresetInputV119,
  ): Promise<{ matchSetId: MatchSetId; matchIds: MatchId[] }> {
    const semanticAuthority =
      "semanticAuthorityKey" in input
        ? resolveSchedulingSemanticAuthority(input.semanticAuthorityKey)
        : resolveFileCurrentSchedulingSemanticAuthority()
    if (semanticAuthority.selection.semanticAuthorityKey === "runtime-v1.19") {
      const preset = resolveVersionedMatchSetPreset({
        semanticAuthorityKey: "runtime-v1.19",
        presetId: input.presetId,
      })
      if (!preset || !("semanticAuthorityKey" in preset)) {
        throw new IntegrityEvidenceInputError(
          "Explicit runtime-v1.19 preset dispatch is required.",
        )
      }
      const matches = generateCandidatePresetMatrixV119({
        ...input,
        semanticAuthorityKey: "runtime-v1.19",
      })
      await insertMatchSetWithMatrix(pool, {
        id: input.id,
        ...(!("semanticAuthorityKey" in input)
          ? {}
          : { semanticAuthorityKey: "runtime-v1.19" as const }),
        matches,
        integrityIdentity: input.integrityIdentity,
        matchSet: { presetId: preset.id },
      })
      return {
        matchSetId: input.id,
        matchIds: matches.map((match) => match.id),
      }
    }
    const preset = getMatchSetPresetV117(input.presetId)
    const matches = generatePresetMatrixV117(input)
    await insertMatchSetWithMatrix(pool, {
      id: input.id,
      ...("semanticAuthorityKey" in input &&
      input.semanticAuthorityKey === "runtime-v1.17"
        ? { semanticAuthorityKey: "runtime-v1.17" as const }
        : {}),
      matches,
      integrityIdentity: input.integrityIdentity,
      matchSet: {
        presetId: preset.id,
        presetVersion: preset.version,
      },
    })
    return { matchSetId: input.id, matchIds: matches.map((match) => match.id) }
  },

  async getMatchSetStatus(id: MatchSetId): Promise<MatchSetStatus | null> {
    const result = await pool.query<{ status: MatchSetStatus }>(
      "select status from match_sets where id = $1",
      [id],
    )
    return result.rows[0]?.status ?? null
  },
})
