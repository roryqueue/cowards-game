import { z } from "zod"
import { hashCanonicalIdentity } from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { ARENA_CATALOG_VERSION_V1_37 } from "./arena-catalog-v1-37.js"
import type { JsonValue } from "./types.js"

export const SET_CONDITION_POLICY_VERSION_V1_37 =
  "canonical-set-policy-v1.37-four-condition-v1" as const

const SET_SCENARIO_IDENTITY_DOMAIN_V1_37 =
  "cowards-game:set-scenario:v1.37" as const
const SET_CONDITION_IDENTITY_DOMAIN_V1_37 =
  "cowards-game:set-condition:v1.37" as const
const SET_REQUEST_IDENTITY_DOMAIN_V1_37 =
  "cowards-game:set-condition-request:v1.37" as const
const textEncoder = new TextEncoder()

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const SET_CONDITION_POLICY_V1_37 = deepFreeze({
  schemaVersion: "canonical-set-policy-v1.37-contract-v1",
  version: SET_CONDITION_POLICY_VERSION_V1_37,
  lifecycle: {
    status: "candidate",
    active: false,
    activationOwner: "Phase-260-Plan-14",
  },
  conditionCount: 4,
  fairnessSemanticsSource: "explicit-condition-fields",
  seedCarriesFairnessSemantics: false,
  completion: {
    requiresEveryCanonicalCondition: true,
    playerViolationIsTerminalEvidence: true,
    systemFailureIsTerminalEvidence: false,
    partialMatrixCounts: false,
    completionOrderAffectsScoring: false,
  },
} as const)

export type SetConditionParticipantV137 = "a" | "b"

export interface SetConditionPolicyRowV137 {
  ordinal: 0 | 1 | 2 | 3
  suffix:
    | "a-bottom-a-first"
    | "a-bottom-b-first"
    | "a-top-a-first"
    | "a-top-b-first"
  bottom: SetConditionParticipantV137
  top: SetConditionParticipantV137
  initialInitiative: SetConditionParticipantV137
}

export const CANONICAL_SET_CONDITION_ROWS_V1_37: SetConditionPolicyRowV137[] =
  deepFreeze([
    {
      ordinal: 0,
      suffix: "a-bottom-a-first",
      bottom: "a",
      top: "b",
      initialInitiative: "a",
    },
    {
      ordinal: 1,
      suffix: "a-bottom-b-first",
      bottom: "a",
      top: "b",
      initialInitiative: "b",
    },
    {
      ordinal: 2,
      suffix: "a-top-a-first",
      bottom: "b",
      top: "a",
      initialInitiative: "a",
    },
    {
      ordinal: 3,
      suffix: "a-top-b-first",
      bottom: "b",
      top: "a",
      initialInitiative: "b",
    },
  ]) as SetConditionPolicyRowV137[]

export interface SetScenarioEntrantV137 {
  entrantKey: string
  playerId: string
}

export interface CreateSetScenarioV137Input {
  arenaCatalogVersion: typeof ARENA_CATALOG_VERSION_V1_37
  arenaSemanticGeometryHash: `sha256:${string}`
  entrantA: SetScenarioEntrantV137
  entrantB: SetScenarioEntrantV137
  baseSeed: string
}

export interface SetConditionV137 {
  ordinal: 0 | 1 | 2 | 3
  suffix: SetConditionPolicyRowV137["suffix"]
  scenarioId: `set-scenario:sha256:${string}`
  conditionId: `set-condition:sha256:${string}`
  requestIdentity: `set-request:sha256:${string}`
  baseSeed: string
  bottomEntrantKey: string
  topEntrantKey: string
  initialInitiativeEntrantKey: string
  bottomPlayerId: string
  topPlayerId: string
  initialInitiativePlayerId: string
}

export interface SetScenarioV137 extends CreateSetScenarioV137Input {
  schemaVersion: "canonical-set-scenario-v1.37"
  setPolicyVersion: typeof SET_CONDITION_POLICY_VERSION_V1_37
  scenarioId: `set-scenario:sha256:${string}`
  conditions: SetConditionV137[]
}

export class SetConditionPolicyV137Error extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = "SetConditionPolicyV137Error"
    this.code = code
  }
}

const PublicIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u)
const Sha256Schema = z.string().regex(/^sha256:[0-9a-f]{64}$/u)
const ScenarioIdSchema = z
  .string()
  .regex(/^set-scenario:sha256:[0-9a-f]{64}$/u)
const ConditionIdSchema = z
  .string()
  .regex(/^set-condition:sha256:[0-9a-f]{64}$/u)
const RequestIdentitySchema = z
  .string()
  .regex(/^set-request:sha256:[0-9a-f]{64}$/u)
const EntrantSchema = z
  .object({ entrantKey: PublicIdSchema, playerId: PublicIdSchema })
  .strict()

const CreateSetScenarioV137InputSchema = z
  .object({
    arenaCatalogVersion: z.literal(ARENA_CATALOG_VERSION_V1_37),
    arenaSemanticGeometryHash: Sha256Schema,
    entrantA: EntrantSchema,
    entrantB: EntrantSchema,
    baseSeed: PublicIdSchema,
  })
  .strict()

const SetConditionV137Schema = z
  .object({
    ordinal: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    suffix: z.enum([
      "a-bottom-a-first",
      "a-bottom-b-first",
      "a-top-a-first",
      "a-top-b-first",
    ]),
    scenarioId: ScenarioIdSchema,
    conditionId: ConditionIdSchema,
    requestIdentity: RequestIdentitySchema,
    baseSeed: PublicIdSchema,
    bottomEntrantKey: PublicIdSchema,
    topEntrantKey: PublicIdSchema,
    initialInitiativeEntrantKey: PublicIdSchema,
    bottomPlayerId: PublicIdSchema,
    topPlayerId: PublicIdSchema,
    initialInitiativePlayerId: PublicIdSchema,
  })
  .strict()

const SetScenarioV137Schema = CreateSetScenarioV137InputSchema.extend({
  schemaVersion: z.literal("canonical-set-scenario-v1.37"),
  setPolicyVersion: z.literal(SET_CONDITION_POLICY_VERSION_V1_37),
  scenarioId: ScenarioIdSchema,
  conditions: z.array(SetConditionV137Schema),
}).strict()

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    throw new SetConditionPolicyV137Error(
      `SET_POLICY_CANONICAL_ENCODING_${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

const hashValue = (
  domain: string,
  value: JsonValue,
): string =>
  hashCanonicalIdentity("semanticTuple", [
    textEncoder.encode(domain),
    canonicalBytes(value),
  ])

const canonicalEqual = (left: unknown, right: unknown): boolean => {
  try {
    const leftBytes = canonicalBytes(left as JsonValue)
    const rightBytes = canonicalBytes(right as JsonValue)
    return (
      leftBytes.byteLength === rightBytes.byteLength &&
      leftBytes.every((value, index) => value === rightBytes[index])
    )
  } catch {
    return false
  }
}

const participant = (
  input: CreateSetScenarioV137Input,
  key: SetConditionParticipantV137,
): SetScenarioEntrantV137 => (key === "a" ? input.entrantA : input.entrantB)

export const createSetScenarioV137 = (
  inputValue: CreateSetScenarioV137Input,
): SetScenarioV137 => {
  const parsed = CreateSetScenarioV137InputSchema.safeParse(inputValue)
  if (!parsed.success) {
    throw new SetConditionPolicyV137Error("INVALID_SET_SCENARIO_INPUT")
  }
  const input = parsed.data as CreateSetScenarioV137Input
  if (
    input.entrantA.entrantKey === input.entrantB.entrantKey ||
    input.entrantA.playerId === input.entrantB.playerId
  ) {
    throw new SetConditionPolicyV137Error("SET_SCENARIO_ENTRANTS_NOT_DISTINCT")
  }

  const scenarioId = `set-scenario:sha256:${hashValue(
    SET_SCENARIO_IDENTITY_DOMAIN_V1_37,
    {
      setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
      arenaCatalogVersion: input.arenaCatalogVersion,
      arenaSemanticGeometryHash: input.arenaSemanticGeometryHash,
      entrantAKey: input.entrantA.entrantKey,
      entrantBKey: input.entrantB.entrantKey,
      baseSeed: input.baseSeed,
    },
  )}` as const

  const conditions = CANONICAL_SET_CONDITION_ROWS_V1_37.map((row) => {
    const bottom = participant(input, row.bottom)
    const top = participant(input, row.top)
    const initialInitiative = participant(input, row.initialInitiative)
    const conditionId = `set-condition:sha256:${hashValue(
      SET_CONDITION_IDENTITY_DOMAIN_V1_37,
      { scenarioId, suffix: row.suffix },
    )}` as const
    const requestSource = {
      scenarioId,
      conditionId,
      ordinal: row.ordinal,
      suffix: row.suffix,
      baseSeed: input.baseSeed,
      bottomEntrantKey: bottom.entrantKey,
      topEntrantKey: top.entrantKey,
      initialInitiativeEntrantKey: initialInitiative.entrantKey,
      bottomPlayerId: bottom.playerId,
      topPlayerId: top.playerId,
      initialInitiativePlayerId: initialInitiative.playerId,
    }
    return {
      ...requestSource,
      requestIdentity: `set-request:sha256:${hashValue(
        SET_REQUEST_IDENTITY_DOMAIN_V1_37,
        requestSource,
      )}` as const,
    }
  })

  return deepFreeze({
    schemaVersion: "canonical-set-scenario-v1.37",
    setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
    arenaCatalogVersion: input.arenaCatalogVersion,
    arenaSemanticGeometryHash: input.arenaSemanticGeometryHash,
    entrantA: { ...input.entrantA },
    entrantB: { ...input.entrantB },
    baseSeed: input.baseSeed,
    scenarioId,
    conditions,
  }) as SetScenarioV137
}

export const parseSetScenarioV137 = (input: unknown): SetScenarioV137 => {
  const parsed = SetScenarioV137Schema.safeParse(input)
  if (!parsed.success) {
    throw new SetConditionPolicyV137Error("SET_SCENARIO_MEMBERSHIP_MISMATCH")
  }
  const candidate = parsed.data as SetScenarioV137
  const expected = createSetScenarioV137({
    arenaCatalogVersion: candidate.arenaCatalogVersion,
    arenaSemanticGeometryHash: candidate.arenaSemanticGeometryHash,
    entrantA: candidate.entrantA,
    entrantB: candidate.entrantB,
    baseSeed: candidate.baseSeed,
  })
  if (candidate.scenarioId !== expected.scenarioId) {
    throw new SetConditionPolicyV137Error("SET_SCENARIO_MEMBERSHIP_MISMATCH")
  }
  if (
    candidate.conditions.length !== expected.conditions.length ||
    new Set(candidate.conditions.map(({ conditionId }) => conditionId)).size !==
      expected.conditions.length
  ) {
    throw new SetConditionPolicyV137Error("SET_SCENARIO_MEMBERSHIP_MISMATCH")
  }
  const candidateById = new Map(
    candidate.conditions.map((condition) => [condition.conditionId, condition]),
  )
  if (
    expected.conditions.some(
      (condition) =>
        !canonicalEqual(candidateById.get(condition.conditionId), condition),
    )
  ) {
    throw new SetConditionPolicyV137Error("SET_SCENARIO_MEMBERSHIP_MISMATCH")
  }
  return expected
}

export type SetConditionAttemptResultV137 =
  | "success"
  | "player_violation"
  | "system_failure"

export interface SetConditionAttemptEvidenceV137 {
  conditionId: SetConditionV137["conditionId"]
  requestIdentity: SetConditionV137["requestIdentity"]
  attempt: number
  result: SetConditionAttemptResultV137
  retryable: boolean
}

const SetConditionAttemptEvidenceV137Schema = z
  .object({
    conditionId: ConditionIdSchema,
    requestIdentity: RequestIdentitySchema,
    attempt: z.number().int().positive(),
    result: z.enum(["success", "player_violation", "system_failure"]),
    retryable: z.boolean(),
  })
  .strict()

export interface SetScenarioCompletionV137 {
  status: "complete" | "pending" | "degraded"
  counted: boolean
  terminalConditionIds: SetConditionV137["conditionId"][]
  unresolvedConditionIds: SetConditionV137["conditionId"][]
}

export const evaluateSetScenarioCompletionV137 = (
  scenarioInput: unknown,
  evidenceInput: readonly SetConditionAttemptEvidenceV137[],
): SetScenarioCompletionV137 => {
  const scenario = parseSetScenarioV137(scenarioInput)
  const conditionById = new Map(
    scenario.conditions.map((condition) => [condition.conditionId, condition]),
  )
  const evidenceByCondition = new Map<
    string,
    SetConditionAttemptEvidenceV137[]
  >()
  for (const input of evidenceInput) {
    const parsed = SetConditionAttemptEvidenceV137Schema.safeParse(input)
    if (!parsed.success) {
      throw new SetConditionPolicyV137Error("INVALID_SET_ATTEMPT_EVIDENCE")
    }
    const evidence = parsed.data as SetConditionAttemptEvidenceV137
    const condition = conditionById.get(evidence.conditionId)
    if (!condition) {
      throw new SetConditionPolicyV137Error("UNKNOWN_SET_CONDITION")
    }
    if (evidence.requestIdentity !== condition.requestIdentity) {
      throw new SetConditionPolicyV137Error("SET_RETRY_IDENTITY_MISMATCH")
    }
    const list = evidenceByCondition.get(evidence.conditionId) ?? []
    list.push(evidence)
    evidenceByCondition.set(evidence.conditionId, list)
  }

  const terminalConditionIds: SetConditionV137["conditionId"][] = []
  const unresolvedConditionIds: SetConditionV137["conditionId"][] = []
  let degraded = false
  for (const condition of scenario.conditions) {
    const attempts = [...(evidenceByCondition.get(condition.conditionId) ?? [])]
      .sort((left, right) => left.attempt - right.attempt)
    for (let index = 0; index < attempts.length; index += 1) {
      if (attempts[index]!.attempt !== index + 1) {
        throw new SetConditionPolicyV137Error("INVALID_SET_ATTEMPT_SEQUENCE")
      }
      if (
        attempts[index]!.result !== "system_failure" &&
        index !== attempts.length - 1
      ) {
        throw new SetConditionPolicyV137Error("ATTEMPT_AFTER_TERMINAL_EVIDENCE")
      }
    }
    const latest = attempts.at(-1)
    if (
      latest &&
      (latest.result === "success" || latest.result === "player_violation")
    ) {
      terminalConditionIds.push(condition.conditionId)
      continue
    }
    unresolvedConditionIds.push(condition.conditionId)
    if (latest?.result === "system_failure" && !latest.retryable) {
      degraded = true
    }
  }

  const complete = terminalConditionIds.length === scenario.conditions.length
  return {
    status: complete ? "complete" : degraded ? "degraded" : "pending",
    counted: complete,
    terminalConditionIds,
    unresolvedConditionIds,
  }
}
