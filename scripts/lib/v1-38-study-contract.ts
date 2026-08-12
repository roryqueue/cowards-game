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

export const V138_ACCOUNTING_DISPOSITIONS = Object.freeze([
  "accepted",
  "rejected",
  "invalid",
  "duplicate_identical",
  "duplicate_conflicting",
  "player_violation",
  "system_failure",
  "retried",
  "unfilled",
  "unused",
] as const)

type V138AccountingDisposition = typeof V138_ACCOUNTING_DISPOSITIONS[number]

export interface V138AccountingAttempt {
  readonly allocationId: string
  readonly attemptId: string
  readonly disposition: V138AccountingDisposition
  readonly cellIdentity: string | null
  readonly processValid: boolean
  readonly completeCell: boolean
  readonly runtimeValid: boolean
  readonly systemValid: boolean
  readonly legalInformationValid: boolean
  readonly privacyValid: boolean
  readonly identityJoinProved: boolean
  readonly retryOf: string | null
}

export interface V138AccountingClosure {
  readonly schemaVersion: "v1.38-accounting-closure-v1"
  readonly identityDomain: "cowards-game:v1.38:accounting-closure:v1"
  readonly declaredAllocationCount: number
  readonly declaredAllocationRoot: `sha256:${string}`
  readonly allocationIds: readonly string[]
  readonly attempts: readonly V138AccountingAttempt[]
  readonly acceptedCells: readonly Readonly<{
    cellIdentity: string
    attemptId: string
  }>[]
}

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("V138_CANONICAL_JSON_INVALID")
  return admitted.canonicalBytes
}

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const domainRoot = (domain: string, value: unknown): `sha256:${string}` =>
  sha256(Buffer.concat([
    Buffer.from(domain, "utf8"),
    Buffer.from([0]),
    canonicalBytes(value),
  ]))

const id = (value: unknown, prefix: string): value is string =>
  typeof value === "string" && new RegExp(`^${prefix}:[A-Za-z0-9._:-]{1,240}$`, "u").test(value)

export const deriveV138AllocationRoot = (
  allocationIds: readonly string[],
): `sha256:${string}` => domainRoot(
  "cowards-game:v1.38:declared-allocations:v1",
  allocationIds,
)

const parseAccountingClosure = (input: unknown): V138AccountingClosure => {
  if (!isRecord(input) || !exactKeys(input, [
    "schemaVersion", "identityDomain", "declaredAllocationCount", "declaredAllocationRoot",
    "allocationIds", "attempts", "acceptedCells",
  ]) || input.schemaVersion !== "v1.38-accounting-closure-v1" ||
    input.identityDomain !== "cowards-game:v1.38:accounting-closure:v1" ||
    !isBoundedInteger(input.declaredAllocationCount, 1_000_000) ||
    typeof input.declaredAllocationRoot !== "string" || !SHA256.test(input.declaredAllocationRoot) ||
    !Array.isArray(input.allocationIds) || input.allocationIds.length > 1_000_000 ||
    !input.allocationIds.every((value) => id(value, "allocation")) ||
    !Array.isArray(input.attempts) || input.attempts.length > 1_000_000 ||
    !Array.isArray(input.acceptedCells) || input.acceptedCells.length > 1_000_000) throw new TypeError()

  for (const attempt of input.attempts) {
    if (!isRecord(attempt) || !exactKeys(attempt, [
      "allocationId", "attemptId", "disposition", "cellIdentity", "processValid",
      "completeCell", "runtimeValid", "systemValid", "legalInformationValid",
      "privacyValid", "identityJoinProved", "retryOf",
    ]) || !id(attempt.allocationId, "allocation") || !id(attempt.attemptId, "attempt") ||
      !V138_ACCOUNTING_DISPOSITIONS.includes(attempt.disposition as V138AccountingDisposition) ||
      (attempt.cellIdentity !== null && !id(attempt.cellIdentity, "cell")) ||
      (attempt.retryOf !== null && !id(attempt.retryOf, "attempt")) ||
      !["processValid", "completeCell", "runtimeValid", "systemValid", "legalInformationValid",
        "privacyValid", "identityJoinProved"].every((key) => typeof attempt[key] === "boolean")) {
      throw new TypeError()
    }
  }
  for (const cell of input.acceptedCells) {
    if (!isRecord(cell) || !exactKeys(cell, ["cellIdentity", "attemptId"]) ||
      !id(cell.cellIdentity, "cell") || !id(cell.attemptId, "attempt")) throw new TypeError()
  }
  return input as unknown as V138AccountingClosure
}

export const V138AccountingClosureSchema = schema(
  parseAccountingClosure,
  "V138_ACCOUNTING_CLOSURE_INVALID",
)

export type V138AccountingStopReason =
  | "allocation_inventory_mismatch"
  | "missing_or_conflicting_identity"
  | "conflicting_duplicate"
  | "accepted_integrity_failure"
  | "accepted_cell_mismatch"

export interface V138AccountingClosureResult {
  readonly status: "closed" | "stopped"
  readonly reason: V138AccountingStopReason | null
  readonly chargedCount: number
  readonly acceptedCount: number
  readonly chargedLedgerRoot: `sha256:${string}`
  readonly acceptedCellRoot: `sha256:${string}`
}

export const validateV138AccountingClosure = (
  input: unknown,
): Readonly<V138AccountingClosureResult> => {
  let closure: Readonly<V138AccountingClosure>
  try {
    closure = V138AccountingClosureSchema.parse(input)
  } catch {
    return deepFreeze({
      status: "stopped",
      reason: "missing_or_conflicting_identity",
      chargedCount: 0,
      acceptedCount: 0,
      chargedLedgerRoot: domainRoot("cowards-game:v1.38:charged-ledger:v1", []),
      acceptedCellRoot: domainRoot("cowards-game:v1.38:accepted-cells:v1", []),
    })
  }
  const chargedCount = closure.attempts.length
  const acceptedAttempts = closure.attempts.filter(({ disposition }) => disposition === "accepted")
  const roots = {
    chargedLedgerRoot: domainRoot("cowards-game:v1.38:charged-ledger:v1", closure.attempts),
    acceptedCellRoot: domainRoot("cowards-game:v1.38:accepted-cells:v1", closure.acceptedCells),
  }
  const stop = (reason: V138AccountingStopReason): Readonly<V138AccountingClosureResult> => deepFreeze({
    status: "stopped",
    reason,
    chargedCount,
    acceptedCount: acceptedAttempts.length,
    ...roots,
  })
  if (closure.declaredAllocationCount !== closure.allocationIds.length ||
    closure.declaredAllocationRoot !== deriveV138AllocationRoot(closure.allocationIds) ||
    new Set(closure.allocationIds).size !== closure.allocationIds.length) {
    return stop("allocation_inventory_mismatch")
  }
  const allocations = new Set(closure.allocationIds)
  if (closure.attempts.length !== closure.allocationIds.length ||
    new Set(closure.attempts.map(({ attemptId }) => attemptId)).size !== closure.attempts.length ||
    new Set(closure.attempts.map(({ allocationId }) => allocationId)).size !== closure.attempts.length ||
    closure.attempts.some(({ allocationId }) => !allocations.has(allocationId))) {
    return stop("missing_or_conflicting_identity")
  }
  if (closure.attempts.some(({ disposition }) => disposition === "duplicate_conflicting")) {
    return stop("conflicting_duplicate")
  }
  if (acceptedAttempts.some((attempt) =>
    attempt.cellIdentity === null || attempt.retryOf !== null || !attempt.processValid ||
    !attempt.completeCell || !attempt.runtimeValid || !attempt.systemValid ||
    !attempt.legalInformationValid || !attempt.privacyValid || !attempt.identityJoinProved)) {
    return stop("accepted_integrity_failure")
  }
  const acceptedIdentities = acceptedAttempts.map(({ cellIdentity }) => cellIdentity as string)
  if (new Set(acceptedIdentities).size !== acceptedIdentities.length ||
    new Set(closure.acceptedCells.map(({ cellIdentity }) => cellIdentity)).size !== closure.acceptedCells.length ||
    closure.acceptedCells.length !== acceptedAttempts.length ||
    closure.acceptedCells.some((cell) => !acceptedAttempts.some((attempt) =>
      attempt.attemptId === cell.attemptId && attempt.cellIdentity === cell.cellIdentity))) {
    return stop("accepted_cell_mismatch")
  }
  return deepFreeze({
    status: "closed",
    reason: null,
    chargedCount,
    acceptedCount: acceptedAttempts.length,
    ...roots,
  })
}

const uniqueGeometryHashes = [...new Set(
  CANONICAL_ARENA_CATALOG_V1_37.arenas.map(({ semanticGeometryHash }) => semanticGeometryHash),
)]

export const V138_CANONICAL_STUDY_POLICY = V138StudyPolicySchema.parse({
  schemaVersion: "v1.38-study-policy-v1",
  policyKind: "pre_search_study_policy",
  identityDomain: "cowards-game:v1.38:pre-search-study-policy:v1",
  primaryEstimand: {
    unit: "adapted_metagame_set_score_difference",
    factoryPolicy: "fixed_across_arms",
    adaptation: "separate_per_arm",
    arms: ARMS,
  },
  pairedContrasts: CONTRASTS,
  fixedPolicyTransfer: {
    role: "secondary_screening_only",
    primaryEvidence: false,
    finalistSelectionEligible: false,
  },
  scoring: { win: 1, draw: 0.5, loss: 0 },
  conditions: {
    sides: ["bottom", "top"],
    entrantInitiativeStates: ["entrant_a", "entrant_b"],
    requiresFullCartesianProduct: true,
    seedCarriesFairnessSemantics: false,
  },
  arenas: {
    catalogVersion: "canonical-arena-catalog-v1.37",
    semanticGeometryIdentityDomain: "cowards-game:arena-semantic-geometry:v1",
    designSemanticGeometryHashes: uniqueGeometryHashes,
    duplicateLabelsDoNotCreateCells: true,
  },
  splits: SPLITS,
  matchedRootSeedBlocks: {
    required: true,
    identityDomain: "cowards-game:v1.38:matched-root-seed-block:v1",
    pairingScope: "all_arms_contrasts_conditions_arenas_splits_opponents",
  },
  completeCells: {
    identityFields: CELL_IDENTITY_FIELDS,
    requireUniqueIdentity: true,
    missingDisposition: "stop_incomplete",
    identicalDuplicateDisposition: "charge_and_exclude_duplicate",
    conflictingDuplicateDisposition: "stop_integrity",
  },
  stoppingAndResponseAdmission: {
    stoppingRuleFrozenBeforeCandidateOutput: true,
    responseRequiresProcessValidCompleteCells: true,
    systemFailureAdmissible: false,
    legalInformationViolationAdmissible: false,
    privateDataLeakAdmissible: false,
  },
  selection: {
    finalistEligibility: "complete_validation_and_probe_only",
    finalistMinimum: 3,
    finalistMaximum: 3,
    portfolioSelection: "diverse_pure_strategies",
    robustPureSelection: "maximin_oracle_relative_pure",
    finalistHashesFreezeBeforeSealedAccess: true,
  },
  claims: {
    scope: "oracle_relative_only",
    compositeCannotOverrideHardGate: true,
    forbidden: FORBIDDEN_CLAIMS,
  },
  forbiddenInputs: FORBIDDEN_INPUTS,
})

export interface V138PreSearchStudyPolicyBuildInput {
  readonly studyPolicy: unknown
  readonly sourceBytes: Uint8Array
  readonly testBytes: Uint8Array
  readonly inputPolicyBytes: Uint8Array
  readonly generatorBytes: Uint8Array
}

const isBytes = (value: unknown): value is Uint8Array => value instanceof Uint8Array

export const serializeV138StudyPolicyInput = (input: unknown): Uint8Array =>
  canonicalBytes(V138StudyPolicySchema.parse(input))

export const buildV138PreSearchStudyPolicy = (input: V138PreSearchStudyPolicyBuildInput) => {
  if (!isRecord(input) || !exactKeys(input, [
    "studyPolicy", "sourceBytes", "testBytes", "inputPolicyBytes", "generatorBytes",
  ]) || !isBytes(input.sourceBytes) || !isBytes(input.testBytes) ||
    !isBytes(input.inputPolicyBytes) || !isBytes(input.generatorBytes)) {
    throw new TypeError("V138_PRE_SEARCH_STUDY_POLICY_INPUT_INVALID")
  }
  const studyPolicy = V138StudyPolicySchema.parse(input.studyPolicy)
  const expectedInputPolicyBytes = serializeV138StudyPolicyInput(studyPolicy)
  if (input.inputPolicyBytes.byteLength !== expectedInputPolicyBytes.byteLength ||
    !input.inputPolicyBytes.every((value, index) => value === expectedInputPolicyBytes[index])) {
    throw new TypeError("V138_PRE_SEARCH_STUDY_POLICY_INPUT_INVALID")
  }
  const sourceBindings = {
    studyContractSourceSha256: sha256(input.sourceBytes),
    testSourceSha256: sha256(input.testBytes),
    inputPolicySha256: sha256(input.inputPolicyBytes),
    generatorSha256: sha256(input.generatorBytes),
  }
  const schemaRoots = {
    studySchemaRoot: domainRoot("cowards-game:v1.38:study-schema:v1", {
      sourceSha256: sourceBindings.studyContractSourceSha256,
      policy: studyPolicy,
    }),
    opportunitySchemaRoot: domainRoot("cowards-game:v1.38:opportunity-schema:v1", {
      sourceSha256: sourceBindings.studyContractSourceSha256,
      dimensions: V138_OPPORTUNITY_DIMENSIONS,
    }),
    accountingSchemaRoot: domainRoot("cowards-game:v1.38:accounting-schema:v1", {
      sourceSha256: sourceBindings.studyContractSourceSha256,
      dispositions: V138_ACCOUNTING_DISPOSITIONS,
    }),
  }
  const payload = {
    schemaVersion: "v1.38-pre-search-study-policy-v1" as const,
    policyKind: "pre_search_study_policy" as const,
    policyStatus: "ready" as const,
    studyPolicy,
    opportunityDimensions: V138_OPPORTUNITY_DIMENSIONS,
    accountingDispositions: V138_ACCOUNTING_DISPOSITIONS,
    sourceBindings,
    schemaRoots,
    admission: { admit03: "blocked" as const, matrixAdmissionStatus: "blocked" as const },
    custody: { seal01: "unmet" as const, custodyClaimed: false as const },
    authority: {
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      productionAuthorized: false as const,
      liveWorkAuthorized: false as const,
    },
  }
  const policy = deepFreeze({
    ...payload,
    policyRoot: domainRoot("cowards-game:v1.38:pre-search-study-policy-root:v1", payload),
  })
  assertPublicOutputLeakSafe(policy, "v1.38 pre-search study policy")
  return policy
}

export const renderV138PreSearchStudyPolicy = (policy: unknown): string =>
  `${new TextDecoder().decode(canonicalBytes(policy as JsonValue))}\n`
import { createHash } from "node:crypto"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  admitCanonicalJsonValue,
  assertPublicOutputLeakSafe,
  type JsonValue,
} from "@cowards/spec"
