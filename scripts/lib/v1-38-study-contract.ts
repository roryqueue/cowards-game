type ExactSchema<T> = Readonly<{
  parse(input: unknown): Readonly<T>
  safeParse(input: unknown):
    | Readonly<{ success: true; data: Readonly<T> }>
    | Readonly<{ success: false; error: TypeError }>
}>

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as RecordValue)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const schema = <T>(
  parser: (input: unknown) => T,
  errorCode: string,
): ExactSchema<T> => Object.freeze({
  parse(input: unknown): Readonly<T> {
    try {
      return deepFreeze(globalThis.structuredClone(parser(input)))
    } catch {
      throw new TypeError(errorCode)
    }
  },
  safeParse(input: unknown) {
    try {
      return Object.freeze({ success: true as const, data: this.parse(input) })
    } catch {
      return Object.freeze({ success: false as const, error: new TypeError(errorCode) })
    }
  },
})

const isExactArray = <T>(
  value: unknown,
  expected: readonly T[],
): value is T[] =>
  Array.isArray(value) && value.length === expected.length &&
  value.every((entry, index) => entry === expected[index])

const isBoundedInteger = (value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum

const SHA256 = /^sha256:[0-9a-f]{64}$/u

const ARMS = [
  "current_edge_protocol",
  "inward_rank_protocol",
  "bracket_shield_protocol",
] as const

const CONTRASTS = [
  { id: "bracket_vs_current", left: "bracket_shield_protocol", right: "current_edge_protocol" },
  { id: "inward_vs_current", left: "inward_rank_protocol", right: "current_edge_protocol" },
  { id: "bracket_vs_inward", left: "bracket_shield_protocol", right: "inward_rank_protocol" },
] as const

const SPLITS = [
  { split: "development", opponentField: "development_opponents", disclosure: "iterative", selectionUse: "response_search" },
  { split: "validation", opponentField: "validation_opponents", disclosure: "bounded", selectionUse: "eligibility" },
  { split: "probe", opponentField: "independent_probe_opponents", disclosure: "aggregate_only", selectionUse: "robustness_screen" },
  { split: "sealed", opponentField: "sealed_opponents", disclosure: "custodian_only", selectionUse: "post_freeze_evaluation" },
] as const

const CELL_IDENTITY_FIELDS = [
  "arm",
  "split",
  "opponent_field",
  "arena_semantic_geometry_hash",
  "bottom_entrant",
  "top_entrant",
  "initial_initiative_entrant",
  "root_seed_block",
] as const

const FORBIDDEN_CLAIMS = [
  "exact_exploitability",
  "nash_equilibrium",
  "optimality",
  "permanent_balance",
  "solved_game",
  "meta_free",
] as const

const FORBIDDEN_INPUTS = [
  "candidate_output",
  "formation_state",
  "holdout_preimage",
  "route_5_outcome",
  "stopped_route_outcome",
  "runtime_private_data",
] as const

export interface V138StudyPolicy {
  readonly schemaVersion: "v1.38-study-policy-v1"
  readonly policyKind: "pre_search_study_policy"
  readonly identityDomain: "cowards-game:v1.38:pre-search-study-policy:v1"
  readonly primaryEstimand: RecordValue
  readonly pairedContrasts: readonly RecordValue[]
  readonly fixedPolicyTransfer: RecordValue
  readonly scoring: RecordValue
  readonly conditions: RecordValue
  readonly arenas: RecordValue
  readonly splits: readonly RecordValue[]
  readonly matchedRootSeedBlocks: RecordValue
  readonly completeCells: RecordValue
  readonly stoppingAndResponseAdmission: RecordValue
  readonly selection: RecordValue
  readonly claims: RecordValue
  readonly forbiddenInputs: readonly string[]
}

const parseStudyPolicy = (input: unknown): V138StudyPolicy => {
  if (!isRecord(input) || !exactKeys(input, [
    "schemaVersion", "policyKind", "identityDomain", "primaryEstimand",
    "pairedContrasts", "fixedPolicyTransfer", "scoring", "conditions",
    "arenas", "splits", "matchedRootSeedBlocks", "completeCells",
    "stoppingAndResponseAdmission", "selection", "claims", "forbiddenInputs",
  ])) throw new TypeError()
  if (
    input.schemaVersion !== "v1.38-study-policy-v1" ||
    input.policyKind !== "pre_search_study_policy" ||
    input.identityDomain !== "cowards-game:v1.38:pre-search-study-policy:v1"
  ) throw new TypeError()

  const primary = input.primaryEstimand
  if (!isRecord(primary) || !exactKeys(primary, ["unit", "factoryPolicy", "adaptation", "arms"]) ||
    primary.unit !== "adapted_metagame_set_score_difference" ||
    primary.factoryPolicy !== "fixed_across_arms" ||
    primary.adaptation !== "separate_per_arm" ||
    !isExactArray(primary.arms, ARMS)) throw new TypeError()

  if (!Array.isArray(input.pairedContrasts) || input.pairedContrasts.length !== CONTRASTS.length) {
    throw new TypeError()
  }
  input.pairedContrasts.forEach((entry, index) => {
    const expected = CONTRASTS[index]!
    if (!isRecord(entry) || !exactKeys(entry, ["id", "left", "right"]) ||
      entry.id !== expected.id || entry.left !== expected.left || entry.right !== expected.right) {
      throw new TypeError()
    }
  })

  const transfer = input.fixedPolicyTransfer
  if (!isRecord(transfer) || !exactKeys(transfer, ["role", "primaryEvidence", "finalistSelectionEligible"]) ||
    transfer.role !== "secondary_screening_only" || transfer.primaryEvidence !== false ||
    transfer.finalistSelectionEligible !== false) throw new TypeError()

  const scoring = input.scoring
  if (!isRecord(scoring) || !exactKeys(scoring, ["win", "draw", "loss"]) ||
    scoring.win !== 1 || scoring.draw !== 0.5 || scoring.loss !== 0) throw new TypeError()

  const conditions = input.conditions
  if (!isRecord(conditions) || !exactKeys(conditions, [
    "sides", "entrantInitiativeStates", "requiresFullCartesianProduct", "seedCarriesFairnessSemantics",
  ]) || !isExactArray(conditions.sides, ["bottom", "top"]) ||
    !isExactArray(conditions.entrantInitiativeStates, ["entrant_a", "entrant_b"]) ||
    conditions.requiresFullCartesianProduct !== true || conditions.seedCarriesFairnessSemantics !== false) {
    throw new TypeError()
  }

  const arenas = input.arenas
  if (!isRecord(arenas) || !exactKeys(arenas, [
    "catalogVersion", "semanticGeometryIdentityDomain", "designSemanticGeometryHashes",
    "duplicateLabelsDoNotCreateCells",
  ]) || arenas.catalogVersion !== "canonical-arena-catalog-v1.37" ||
    arenas.semanticGeometryIdentityDomain !== "cowards-game:arena-semantic-geometry:v1" ||
    !Array.isArray(arenas.designSemanticGeometryHashes) || arenas.designSemanticGeometryHashes.length < 2 ||
    !arenas.designSemanticGeometryHashes.every((value) => typeof value === "string" && SHA256.test(value)) ||
    new Set(arenas.designSemanticGeometryHashes).size !== arenas.designSemanticGeometryHashes.length ||
    arenas.duplicateLabelsDoNotCreateCells !== true) throw new TypeError()

  if (!Array.isArray(input.splits) || input.splits.length !== SPLITS.length) throw new TypeError()
  input.splits.forEach((entry, index) => {
    const expected = SPLITS[index]!
    if (!isRecord(entry) || !exactKeys(entry, ["split", "opponentField", "disclosure", "selectionUse"]) ||
      entry.split !== expected.split || entry.opponentField !== expected.opponentField ||
      entry.disclosure !== expected.disclosure || entry.selectionUse !== expected.selectionUse) throw new TypeError()
  })

  const seeds = input.matchedRootSeedBlocks
  if (!isRecord(seeds) || !exactKeys(seeds, ["required", "identityDomain", "pairingScope"]) ||
    seeds.required !== true || seeds.identityDomain !== "cowards-game:v1.38:matched-root-seed-block:v1" ||
    seeds.pairingScope !== "all_arms_contrasts_conditions_arenas_splits_opponents") throw new TypeError()

  const cells = input.completeCells
  if (!isRecord(cells) || !exactKeys(cells, [
    "identityFields", "requireUniqueIdentity", "missingDisposition",
    "identicalDuplicateDisposition", "conflictingDuplicateDisposition",
  ]) || !isExactArray(cells.identityFields, CELL_IDENTITY_FIELDS) || cells.requireUniqueIdentity !== true ||
    cells.missingDisposition !== "stop_incomplete" ||
    cells.identicalDuplicateDisposition !== "charge_and_exclude_duplicate" ||
    cells.conflictingDuplicateDisposition !== "stop_integrity") throw new TypeError()

  const admission = input.stoppingAndResponseAdmission
  if (!isRecord(admission) || !exactKeys(admission, [
    "stoppingRuleFrozenBeforeCandidateOutput", "responseRequiresProcessValidCompleteCells",
    "systemFailureAdmissible", "legalInformationViolationAdmissible", "privateDataLeakAdmissible",
  ]) || admission.stoppingRuleFrozenBeforeCandidateOutput !== true ||
    admission.responseRequiresProcessValidCompleteCells !== true || admission.systemFailureAdmissible !== false ||
    admission.legalInformationViolationAdmissible !== false || admission.privateDataLeakAdmissible !== false) {
    throw new TypeError()
  }

  const selection = input.selection
  if (!isRecord(selection) || !exactKeys(selection, [
    "finalistEligibility", "finalistMinimum", "finalistMaximum", "portfolioSelection",
    "robustPureSelection", "finalistHashesFreezeBeforeSealedAccess",
  ]) || selection.finalistEligibility !== "complete_validation_and_probe_only" ||
    selection.finalistMinimum !== 3 || selection.finalistMaximum !== 3 ||
    selection.portfolioSelection !== "diverse_pure_strategies" ||
    selection.robustPureSelection !== "maximin_oracle_relative_pure" ||
    selection.finalistHashesFreezeBeforeSealedAccess !== true) throw new TypeError()

  const claims = input.claims
  if (!isRecord(claims) || !exactKeys(claims, ["scope", "compositeCannotOverrideHardGate", "forbidden"]) ||
    claims.scope !== "oracle_relative_only" || claims.compositeCannotOverrideHardGate !== true ||
    !isExactArray(claims.forbidden, FORBIDDEN_CLAIMS) || !isExactArray(input.forbiddenInputs, FORBIDDEN_INPUTS)) {
    throw new TypeError()
  }
  return input as unknown as V138StudyPolicy
}

export const V138StudyPolicySchema = schema(
  parseStudyPolicy,
  "V138_STUDY_POLICY_INVALID",
)

export interface V138OpportunityVector {
  readonly schemaVersion: "v1.38-opportunity-vector-v1"
  readonly identityDomain: "cowards-game:v1.38:opportunity-vector:v1"
  readonly attemptedCandidates: number
  readonly acceptedResponseSlots: number
  readonly unfilledResponseSlots: number
  readonly unfilledDisposition: "burn_and_report" | "stop_and_report"
  readonly responseRounds: number
  readonly searchEvaluations: number
  readonly teacherNodes: number
  readonly distillationWorkUnits: number
  readonly matches: number
  readonly modelAttempts: number
  readonly modelTokens: number
  readonly humanEffortMinutes: number
  readonly humanSubmissions: number
  readonly replayReviewMinutes: number
  readonly cachePolicy: "cold_profile_neutral" | "cold_per_arm"
  readonly retryAttempts: number
  readonly hardwareClass: string
  readonly runtimeLimitMs: number
  readonly sourceLimitBytes: number
  readonly objectiveLimitBytes: number
  readonly strategyMemoryLimitBytes: number
  readonly soldierMemoryLimitBytes: number
  readonly outputLimitBytes: number
}

export const V138_OPPORTUNITY_DIMENSIONS = Object.freeze([
  "attemptedCandidates", "acceptedResponseSlots", "unfilledResponseSlots", "unfilledDisposition",
  "responseRounds", "searchEvaluations", "teacherNodes", "distillationWorkUnits",
  "matches", "modelAttempts", "modelTokens", "humanEffortMinutes", "humanSubmissions",
  "replayReviewMinutes", "cachePolicy", "retryAttempts", "hardwareClass", "runtimeLimitMs",
  "sourceLimitBytes", "objectiveLimitBytes", "strategyMemoryLimitBytes",
  "soldierMemoryLimitBytes", "outputLimitBytes",
] as const)

const parseOpportunityVector = (input: unknown): V138OpportunityVector => {
  if (!isRecord(input) || !exactKeys(input, [
    "schemaVersion", "identityDomain", ...V138_OPPORTUNITY_DIMENSIONS,
  ]) || input.schemaVersion !== "v1.38-opportunity-vector-v1" ||
    input.identityDomain !== "cowards-game:v1.38:opportunity-vector:v1") throw new TypeError()
  for (const key of [
    "attemptedCandidates", "acceptedResponseSlots", "unfilledResponseSlots", "responseRounds",
    "searchEvaluations", "teacherNodes", "distillationWorkUnits", "matches", "modelAttempts",
    "modelTokens", "humanEffortMinutes", "humanSubmissions", "replayReviewMinutes", "retryAttempts",
  ] as const) if (!isBoundedInteger(input[key], 1_000_000_000)) throw new TypeError()
  for (const key of [
    "runtimeLimitMs", "sourceLimitBytes", "objectiveLimitBytes", "strategyMemoryLimitBytes",
    "soldierMemoryLimitBytes", "outputLimitBytes",
  ] as const) if (!isBoundedInteger(input[key], 16 * 1024 * 1024) || input[key] === 0) throw new TypeError()
  const unfilledResponseSlots = input.unfilledResponseSlots as number
  const acceptedResponseSlots = input.acceptedResponseSlots as number
  if (unfilledResponseSlots > acceptedResponseSlots ||
    (input.unfilledDisposition !== "burn_and_report" && input.unfilledDisposition !== "stop_and_report") ||
    (input.cachePolicy !== "cold_profile_neutral" && input.cachePolicy !== "cold_per_arm") ||
    typeof input.hardwareClass !== "string" || !/^[a-z0-9][a-z0-9._-]{0,127}$/u.test(input.hardwareClass)) {
    throw new TypeError()
  }
  return input as unknown as V138OpportunityVector
}

export const V138OpportunityVectorSchema = schema(
  parseOpportunityVector,
  "V138_OPPORTUNITY_VECTOR_INVALID",
)
