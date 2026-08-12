import { createHash } from "node:crypto"

import {
  admitCanonicalJsonValue,
  assertPublicOutputLeakSafe,
  type JsonValue,
} from "@cowards/spec"

type UnknownRecord = Record<string, unknown>
type Hash = `sha256:${string}`

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const DIRECTIONS = new Set(["UP", "RIGHT", "DOWN", "LEFT"])
const ACTIONS = new Set([
  "MOVE", "ADVANCE", "PUSH", "BLOCK", "TURN_LEFT", "TURN_RIGHT",
  "TURN_AROUND", "TURN_TO_STONE", "WAIT",
])

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: UnknownRecord, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

const isHash = (value: unknown): value is Hash =>
  typeof value === "string" && SHA256.test(value)

const sha256 = (value: string | Uint8Array): Hash =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as UnknownRecord)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("V138_CANONICAL_VALUE_INVALID")
  return admitted.canonicalBytes
}

type Facing = "UP" | "RIGHT" | "DOWN" | "LEFT"

interface OpeningSoldier {
  readonly opaqueId: string
  readonly sourceOrder: number
  readonly x: number
  readonly y: number
  readonly facing: Facing
  readonly actions: readonly string[]
}

interface OpeningEntrant {
  readonly opaqueId: string
  readonly soldiers: readonly OpeningSoldier[]
}

interface OpeningProjection {
  readonly schemaVersion: "v1.38-synthetic-opening-projection-v1"
  readonly board: Readonly<{ width: number; height: number }>
  readonly entrants: readonly [OpeningEntrant, OpeningEntrant]
}

const OPENING_KEYS = ["schemaVersion", "board", "entrants"] as const
const ENTRANT_KEYS = ["opaqueId", "soldiers"] as const
const SOLDIER_KEYS = ["opaqueId", "sourceOrder", "x", "y", "facing", "actions"] as const

const parseOpening = (input: unknown): OpeningProjection => {
  const fail = (): never => { throw new TypeError("V138_OPENING_PROJECTION_INVALID") }
  if (!isRecord(input)) fail()
  const record = input as UnknownRecord
  if (!exactKeys(record, OPENING_KEYS) ||
    record.schemaVersion !== "v1.38-synthetic-opening-projection-v1" ||
    !isRecord(record.board) || !exactKeys(record.board, ["width", "height"]) ||
    !Number.isInteger(record.board.width) || !Number.isInteger(record.board.height) ||
    (record.board.width as number) < 1 || (record.board.height as number) < 1 ||
    !Array.isArray(record.entrants) || record.entrants.length !== 2) fail()
  const board = record.board as UnknownRecord
  const entrants = record.entrants as unknown[]
  const width = board.width as number
  const height = board.height as number
  for (const entrant of entrants) {
    if (!isRecord(entrant)) fail()
    const entrantRecord = entrant as UnknownRecord
    if (!exactKeys(entrantRecord, ENTRANT_KEYS) ||
      typeof entrantRecord.opaqueId !== "string" || entrantRecord.opaqueId.length === 0 ||
      !Array.isArray(entrantRecord.soldiers) || entrantRecord.soldiers.length === 0 || entrantRecord.soldiers.length > 64) fail()
    const soldiers = entrantRecord.soldiers as unknown[]
    for (const soldier of soldiers) {
      if (!isRecord(soldier) || !exactKeys(soldier, SOLDIER_KEYS) ||
        typeof soldier.opaqueId !== "string" || soldier.opaqueId.length === 0 ||
        !Number.isInteger(soldier.sourceOrder) || !Number.isInteger(soldier.x) || !Number.isInteger(soldier.y) ||
        (soldier.x as number) < 0 || (soldier.x as number) >= width ||
        (soldier.y as number) < 0 || (soldier.y as number) >= height ||
        !DIRECTIONS.has(soldier.facing as string) || !Array.isArray(soldier.actions) ||
        soldier.actions.length > 64 || soldier.actions.some((action) => typeof action !== "string" || !ACTIONS.has(action))) fail()
    }
  }
  return input as unknown as OpeningProjection
}

const mirrorFacing = (facing: Facing): Facing =>
  facing === "LEFT" ? "RIGHT" : facing === "RIGHT" ? "LEFT" : facing

const rotateFacing = (facing: Facing): Facing => ({
  UP: "DOWN", RIGHT: "LEFT", DOWN: "UP", LEFT: "RIGHT",
})[facing] as Facing

const mirrorAction = (action: string): string =>
  action === "TURN_LEFT" ? "TURN_RIGHT" : action === "TURN_RIGHT" ? "TURN_LEFT" : action

const normalizeOpening = (
  input: OpeningProjection,
  horizontal: boolean,
  swapRotate: boolean,
): string => {
  const entrants = swapRotate ? [...input.entrants].reverse() : [...input.entrants]
  const projected = entrants.map((entrant) => entrant.soldiers.map((soldier) => {
    let x = soldier.x
    let y = soldier.y
    let facing = soldier.facing
    let actions = [...soldier.actions]
    if (swapRotate) {
      x = input.board.width - 1 - x
      y = input.board.height - 1 - y
      facing = rotateFacing(facing)
      actions = actions.map(mirrorAction)
    }
    if (horizontal) {
      x = input.board.width - 1 - x
      facing = mirrorFacing(facing)
      actions = actions.map(mirrorAction)
    }
    return { x, y, facing, actions }
  }).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))))
  return Buffer.from(canonicalBytes({ board: input.board, entrants: projected })).toString("utf8")
}

export const canonicalizeV138OpeningCluster = (rawInput: unknown): Hash => {
  const input = parseOpening(rawInput)
  const variants = [
    normalizeOpening(input, false, false),
    normalizeOpening(input, true, false),
    normalizeOpening(input, false, true),
    normalizeOpening(input, true, true),
  ].sort()
  return sha256(`cowards-game:v1.38:opening-cluster:v1\0${variants[0]}`)
}

export type V138ClassifierId =
  | "opening_entropy" | "scripted_opening" | "convoy" | "reserve_hoarding"
  | "persistent_turtle" | "stone_shield" | "interaction" | "inactivity"
  | "draw" | "match_length" | "response_gap" | "pure_worst_case" | "confounders"

const CLASSIFIER_IDS: readonly V138ClassifierId[] = Object.freeze([
  "opening_entropy", "scripted_opening", "convoy", "reserve_hoarding",
  "persistent_turtle", "stone_shield", "interaction", "inactivity", "draw",
  "match_length", "response_gap", "pure_worst_case", "confounders",
])

const EVIDENCE_KEYS = [
  "schemaVersion", "eligibleCellInventoryRoot", "implementationRoot",
  "expectedCellIds", "observations",
] as const
const OBSERVATION_KEYS = [
  "cellId", "replicationId", "openingCluster", "feasibleOpeningChoices", "openingChoiceCounts",
  "convoy", "reserveHoarding", "persistentTurtle", "stoneShield", "interaction", "inactive",
  "draw", "matchLength", "responseGap", "pureWorstCase", "sideGap", "initiativeGap",
  "opaqueIdGap", "soldierOrderGap", "sourceOrderGap",
] as const

interface Observation {
  readonly cellId: string
  readonly replicationId: string
  readonly openingCluster: string
  readonly feasibleOpeningChoices: number
  readonly openingChoiceCounts: readonly number[]
  readonly convoy: boolean
  readonly reserveHoarding: boolean
  readonly persistentTurtle: boolean
  readonly stoneShield: boolean
  readonly interaction: boolean
  readonly inactive: boolean
  readonly draw: boolean
  readonly matchLength: number
  readonly responseGap: number
  readonly pureWorstCase: number
  readonly sideGap: number
  readonly initiativeGap: number
  readonly opaqueIdGap: number
  readonly soldierOrderGap: number
  readonly sourceOrderGap: number
}

interface ClassifierInput {
  readonly eligibleCellInventoryRoot: Hash
  readonly implementationRoot: Hash
  readonly expectedCellIds: readonly string[]
  readonly observations: readonly Observation[]
}

const parseClassifierInput = (input: unknown): ClassifierInput => {
  const fail = (): never => { throw new TypeError("V138_CLASSIFIER_EVIDENCE_INVALID") }
  if (!isRecord(input)) fail()
  const record = input as UnknownRecord
  if (!exactKeys(record, EVIDENCE_KEYS) ||
    record.schemaVersion !== "v1.38-synthetic-classifier-evidence-v1" ||
    !isHash(record.eligibleCellInventoryRoot) || !isHash(record.implementationRoot) ||
    !Array.isArray(record.expectedCellIds) || !Array.isArray(record.observations) ||
    record.expectedCellIds.length === 0 || record.expectedCellIds.length > 10_000 ||
    record.expectedCellIds.some((id) => typeof id !== "string" || id.length === 0 || id.length > 256) ||
    new Set(record.expectedCellIds).size !== record.expectedCellIds.length) fail()
  const expected = new Set(record.expectedCellIds as string[])
  const observations = record.observations as unknown[]
  const seen = new Set<string>()
  for (const observation of observations) {
    if (!isRecord(observation)) fail()
    const observationRecord = observation as UnknownRecord
    if (!exactKeys(observationRecord, OBSERVATION_KEYS) ||
      typeof observationRecord.cellId !== "string" || !expected.has(observationRecord.cellId) || seen.has(observationRecord.cellId) ||
      typeof observationRecord.replicationId !== "string" || observationRecord.replicationId.length === 0 ||
      typeof observationRecord.openingCluster !== "string" || observationRecord.openingCluster.length === 0 ||
      !Number.isInteger(observationRecord.feasibleOpeningChoices) || (observationRecord.feasibleOpeningChoices as number) < 1 ||
      !Array.isArray(observationRecord.openingChoiceCounts) || observationRecord.openingChoiceCounts.length !== observationRecord.feasibleOpeningChoices ||
      observationRecord.openingChoiceCounts.some((count) => !Number.isInteger(count) || count < 0) ||
      (observationRecord.openingChoiceCounts as number[]).reduce((sum, count) => sum + count, 0) < 1) fail()
    for (const key of ["convoy", "reserveHoarding", "persistentTurtle", "stoneShield", "interaction", "inactive", "draw"] as const) {
      if (typeof observationRecord[key] !== "boolean") fail()
    }
    for (const key of ["matchLength", "responseGap", "pureWorstCase", "sideGap", "initiativeGap", "opaqueIdGap", "soldierOrderGap", "sourceOrderGap"] as const) {
      if (typeof observationRecord[key] !== "number" || !Number.isFinite(observationRecord[key]) || (observationRecord[key] as number) < 0) fail()
    }
    seen.add(observationRecord.cellId as string)
  }
  if (seen.size !== expected.size) fail()
  return input as unknown as ClassifierInput
}

const normalizedEntropy = (counts: readonly number[], feasibleChoices: number): number => {
  if (feasibleChoices <= 1) return 1
  const total = counts.reduce((sum, value) => sum + value, 0)
  const entropy = counts.reduce((sum, value) => {
    if (value === 0) return sum
    const probability = value / total
    return sum - probability * Math.log(probability)
  }, 0)
  return entropy / Math.log(feasibleChoices)
}

const replicationMean = (observations: readonly Observation[], value: (entry: Observation) => number): number => {
  const groups = new Map<string, number[]>()
  for (const observation of observations) {
    const group = groups.get(observation.replicationId) ?? []
    group.push(value(observation))
    groups.set(observation.replicationId, group)
  }
  const means = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([, values]) => values.reduce((sum, item) => sum + item, 0) / values.length)
  return means.reduce((sum, item) => sum + item, 0) / means.length
}

const RULES = Object.freeze({
  opening_entropy: { comparator: "at_least", threshold: 0.35 },
  scripted_opening: { comparator: "at_most", threshold: 0.8 },
  convoy: { comparator: "at_most", threshold: 0.5 },
  reserve_hoarding: { comparator: "at_most", threshold: 0.5 },
  persistent_turtle: { comparator: "at_most", threshold: 0.5 },
  stone_shield: { comparator: "at_most", threshold: 0.5 },
  interaction: { comparator: "at_least", threshold: 0.25 },
  inactivity: { comparator: "at_most", threshold: 0.5 },
  draw: { comparator: "at_most", threshold: 0.5 },
  match_length: { comparator: "at_most", threshold: 120 },
  response_gap: { comparator: "at_most", threshold: 0.2 },
  pure_worst_case: { comparator: "at_least", threshold: 0.4 },
  confounders: { comparator: "at_most", threshold: 0.05 },
} satisfies Record<V138ClassifierId, { comparator: "at_least" | "at_most"; threshold: number }>)

const passes = (value: number, rule: { comparator: "at_least" | "at_most"; threshold: number }): boolean =>
  rule.comparator === "at_least" ? value >= rule.threshold : value <= rule.threshold

export const evaluateV138Classifiers = (rawInput: unknown) => {
  const input = parseClassifierInput(rawInput)
  const observations = [...input.observations].sort((left, right) => left.cellId.localeCompare(right.cellId))
  const clusterCounts = new Map<string, number>()
  for (const observation of observations) clusterCounts.set(observation.openingCluster, (clusterCounts.get(observation.openingCluster) ?? 0) + 1)
  const maxClusterShare = Math.max(...clusterCounts.values()) / observations.length
  const values: Record<V138ClassifierId, number> = {
    opening_entropy: replicationMean(observations, (entry) => normalizedEntropy(entry.openingChoiceCounts, entry.feasibleOpeningChoices)),
    scripted_opening: maxClusterShare,
    convoy: replicationMean(observations, (entry) => Number(entry.convoy)),
    reserve_hoarding: replicationMean(observations, (entry) => Number(entry.reserveHoarding)),
    persistent_turtle: replicationMean(observations, (entry) => Number(entry.persistentTurtle)),
    stone_shield: replicationMean(observations, (entry) => Number(entry.stoneShield)),
    interaction: replicationMean(observations, (entry) => Number(entry.interaction)),
    inactivity: replicationMean(observations, (entry) => Number(entry.inactive)),
    draw: replicationMean(observations, (entry) => Number(entry.draw)),
    match_length: replicationMean(observations, (entry) => entry.matchLength),
    response_gap: replicationMean(observations, (entry) => entry.responseGap),
    pure_worst_case: replicationMean(observations, (entry) => entry.pureWorstCase),
    confounders: replicationMean(observations, (entry) => Math.max(entry.sideGap, entry.initiativeGap, entry.opaqueIdGap, entry.soldierOrderGap, entry.sourceOrderGap)),
  }
  const denominator = deepFreeze({
    type: "complete_unique_cells" as const,
    eligibleCellInventoryRoot: input.eligibleCellInventoryRoot,
    replicationUnit: "matched_root_seed_block" as const,
    replicationTreatment: "mean_of_replication_means" as const,
    missingnessRule: "reject_missing_duplicate_or_conflicting_cells" as const,
    normalizationProfile: "v1.38-profile-neutral-classifier-normalization-v1" as const,
    implementationRoot: input.implementationRoot,
  })
  const classifiers = CLASSIFIER_IDS.map((id) => deepFreeze({
    id,
    value: values[id],
    comparator: RULES[id].comparator,
    threshold: RULES[id].threshold,
    hardGatePassed: passes(values[id], RULES[id]),
    denominator,
  }))
  const failedHardGates = classifiers.filter((entry) => !entry.hardGatePassed).map((entry) => entry.id)
  return deepFreeze({
    schemaVersion: "v1.38-classifier-evaluation-v1" as const,
    status: failedHardGates.length === 0 ? "passed" as const : "rejected" as const,
    classifiers,
    failedHardGates,
    compositeMayCompensate: false as const,
    openingClusters: [...clusterCounts.entries()].sort(([left], [right]) => left.localeCompare(right))
      .map(([cluster, count]) => ({ cluster, count })),
  })
}

const PROFILE_RECORDS = deepFreeze([
  {
    id: "current_edge_rank",
    protocolOnly: true,
    materialization: "forbidden_before_phase_267",
    top: { y: [0], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "DOWN" },
    bottom: { y: [11], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "UP" },
  },
  {
    id: "full_inward_rank",
    protocolOnly: true,
    materialization: "forbidden_before_phase_267",
    top: { y: [1], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "DOWN" },
    bottom: { y: [10], x: [2, 3, 4, 5, 6, 7, 8, 9], facing: "UP" },
  },
  {
    id: "edge_anchored_bracket",
    protocolOnly: true,
    materialization: "forbidden_before_phase_267",
    top: { y: [0, 1], xByY: { "0": [2, 3, 8, 9], "1": [4, 5, 6, 7] }, facing: "DOWN" },
    bottom: { y: [10, 11], xByY: { "10": [4, 5, 6, 7], "11": [2, 3, 8, 9] }, facing: "UP" },
    rationale: [
      "rear-wing behind squares are off-board",
      "the four empty center rear squares form an initially sealed pocket",
      "all eight directly inward squares are empty",
      "only four Soldiers remain on the first-Contraction boundary",
      "protection decays as the formation moves rather than disabling Backstab globally",
    ],
  },
] as const)

const EQUAL_COMPUTE_DIMENSIONS = Object.freeze([
  "doctrine_families", "candidate_attempts", "accepted_response_slots", "response_rounds",
  "structured_search_evaluations", "teacher_nodes", "distillation_work", "matches",
  "model_attempts", "model_tokens", "human_hours", "human_submissions", "replay_review",
  "side", "initiative", "design_arena", "split", "runtime_limits", "source_limits",
  "objective_limits", "memory_limits", "output_limits", "hardware_class", "cache_policy", "retry_policy",
])

export const buildV138PreFormationProtocolPolicy = (input: {
  readonly studyPolicyRoot: Hash
  readonly measurementPolicyRoot: Hash
  readonly classifierImplementationRoot: Hash
}) => {
  if (!isHash(input.studyPolicyRoot) || !isHash(input.measurementPolicyRoot) || !isHash(input.classifierImplementationRoot) ||
    !exactKeys(input as unknown as UnknownRecord, ["studyPolicyRoot", "measurementPolicyRoot", "classifierImplementationRoot"])) {
    throw new TypeError("V138_PROTOCOL_POLICY_INPUT_INVALID")
  }
  const policy = deepFreeze({
    schemaVersion: "v1.38-pre-formation-protocol-policy-v1" as const,
    policyKind: "protocol_only_profile_neutral_classifier_policy" as const,
    policyStatus: "ready" as const,
    protocolOnly: true as const,
    materialization: "forbidden_before_phase_267" as const,
    profiles: PROFILE_RECORDS,
    unchangedRules: {
      transitionAuthority: "canonical_MATCH_KERNEL_only",
      initialFacing: "unchanged_inward",
      cycleCap: "unchanged", movementAndReversal: "unchanged", collisionAndPush: "unchanged",
      backstabGeometryAndTiming: "unchanged", activationCounts: "unchanged", arenas: "unchanged",
      runtime: "unchanged", scoring: "unchanged", contraction: "unchanged", outcomes: "unchanged",
    },
    commonRoot: {
      temperature: "profile_agnostic_cold",
      sourceDataEligibility: "no_profile_conditioned_or_current_trained_input",
      trainingDataEligibility: "no_profile_conditioned_or_current_trained_input",
      promptTemplateEligibility: "profile_identity_and_geometry_substitution_only",
      cacheEligibility: "branch_empty_and_profile_isolated",
      matchedRootSeedBlocks: true,
    },
    matchedExecutionOrder: {
      opaqueSlotShape: true,
      branchNeutralCounterbalancing: true,
      fixedSideInitiativeArenaOrder: true,
      reorderEquivalenceRequired: true,
    },
    equalCompute: {
      aggregation: "no_fungible_scalar",
      dimensions: EQUAL_COMPUTE_DIMENSIONS,
      failuresCharged: true,
      unusedBudgetRecorded: true,
      materialInequalityInvalidatesComparison: true,
    },
    holdoutConstruction: {
      policyOnly: true,
      realCommitmentPresent: false,
      opponentPreimagesPresent: false,
      schedulePreimagesPresent: false,
      commonProfileAgnosticOpponentConstruction: true,
      commonProfileAgnosticScheduleConstruction: true,
      profileConditionedInputs: 0,
      currentTrainedInputs: 0,
      sourceTrainingPromptCacheLineageExclusionRequired: true,
    },
    custodyProcedure: {
      namedSeparateCustodianRequired: true,
      approvedPrivateStoreRequired: true,
      authorizedOpeningActorRequired: true,
      accessAndQueryLedgerRequired: true,
      oneBoundedSafeReceiptOnly: true,
      openOrdinal: 1,
      prematureAccessDisposition: "contaminated_terminal",
      uncertainEvaluatorStateDisposition: "contaminated_terminal",
      replacementOrSecondOpenAllowed: false,
      retentionAndRetirementPolicyRequired: true,
    },
    telemetry: [
      "opening_cluster", "feasible_choice_normalized_entropy", "forced_evacuation",
      "unselected_first_contraction_reserve", "first_interaction", "backstab_timing_and_cause",
      "pushes", "blocks", "no_advance_stone", "center_rush", "wing_guard", "convoy",
      "persistent_turtle", "draw", "match_length", "active_survival", "response_gap",
      "pure_policy_worst_case", "best_response_graph", "side_initiative_id_and_order_confounders",
    ],
    classifiers: CLASSIFIER_IDS.map((id) => ({ ...RULES[id], id, denominator: "complete_unique_cells", replicationTreatment: "mean_of_replication_means" })),
    hardRejection: {
      scriptedOpening: true, convoyOrStoneShieldTurtle: true, materiallyLowerInteraction: true,
      worseOracleRelativeExploitability: true, equalityOrIntegrityFailure: true,
      confounderFailure: true, compositeMayCompensate: false,
    },
    evidenceRoles: { fixedPolicyTransfer: "secondary_screening_only", advancedLibrary: "regression_only", claims: "oracle_relative_only" },
    sourceBindings: input,
    authority: {
      satisfiesAdmit03: false, satisfiesSeal01: false, candidateSearchAuthorized: false,
      phase263Authorized: false, formationMaterializationAuthorized: false,
      holdoutOpenAuthorized: false, liveWorkAuthorized: false, productionAuthorized: false,
      publicExposureAuthorized: false,
    },
  })
  assertPublicOutputLeakSafe(policy, "v1.38 pre-formation protocol policy")
  return policy
}

export const renderV138PreFormationProtocolPolicy = (
  policy: ReturnType<typeof buildV138PreFormationProtocolPolicy>,
): string => `${Buffer.from(canonicalBytes(policy as unknown as JsonValue)).toString("utf8")}\n`
