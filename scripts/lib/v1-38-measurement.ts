import { createHash } from "node:crypto"
import {
  admitCanonicalJsonValue,
  assertPublicOutputLeakSafe,
  type JsonValue,
} from "@cowards/spec"

type RecordValue = Record<string, unknown>

const SHA256 = /^sha256:[0-9a-f]{64}$/u

const ACTIVATION_PROMPT_ROOT =
  "sha256:6d0fdbfa92179e0a3a2d6024c1171d5f066da8f1db6e524358967551dc226134" as const

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
}

const isHash = (value: unknown): value is `sha256:${string}` =>
  typeof value === "string" && SHA256.test(value)

const isIdentity = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 256

const fail = (): never => {
  throw new TypeError("V138_MEASUREMENT_FREEZE_INPUT_INVALID")
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as RecordValue)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

export type V138MeasurementGateId =
  | "source_hard_cap_bytes"
  | "source_preferred_target_bytes"
  | "direct_execution_p99_ms"
  | "league_strategy_count"
  | "behavioral_family_count"
  | "independent_planner_core_count"
  | "distinct_finalist_count"
  | "consecutive_response_count"
  | "response_set_score"
  | "independent_probe_set_score"
  | "fresh_red_team_set_score"
  | "advanced_library_set_score"

type GateSpec = Readonly<{
  id: V138MeasurementGateId
  startingValue: number
  comparator: "at_most" | "less_than" | "at_least" | "greater_than"
  denominatorType: string
  replicationUnit: string
  benchmark: "fixed" | "not_applicable"
  hardware: "fixed" | "not_applicable"
  evidenceRole: "hard_gate" | "preference_only" | "regression_only"
  maySatisfyRobustness: boolean
}>

const GATE_SPECS: readonly GateSpec[] = Object.freeze([
  { id: "source_hard_cap_bytes", startingValue: 65_536, comparator: "at_most", denominatorType: "strategy_source_bytes", replicationUnit: "strategy_revision", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: false },
  { id: "source_preferred_target_bytes", startingValue: 49_152, comparator: "less_than", denominatorType: "strategy_source_bytes", replicationUnit: "strategy_revision", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "preference_only", maySatisfyRobustness: false },
  { id: "direct_execution_p99_ms", startingValue: 5, comparator: "less_than", denominatorType: "fixed_benchmark_invocations", replicationUnit: "invocation", benchmark: "fixed", hardware: "fixed", evidenceRole: "hard_gate", maySatisfyRobustness: false },
  { id: "league_strategy_count", startingValue: 12, comparator: "at_least", denominatorType: "eligible_strategy_inventory", replicationUnit: "strategy_revision", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: false },
  { id: "behavioral_family_count", startingValue: 6, comparator: "at_least", denominatorType: "eligible_behavioral_family_inventory", replicationUnit: "behavioral_family", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: false },
  { id: "independent_planner_core_count", startingValue: 5, comparator: "at_least", denominatorType: "eligible_independent_core_inventory", replicationUnit: "planner_core", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: false },
  { id: "distinct_finalist_count", startingValue: 3, comparator: "at_least", denominatorType: "eligible_finalist_inventory", replicationUnit: "finalist", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: true },
  { id: "consecutive_response_count", startingValue: 2, comparator: "at_least", denominatorType: "declared_response_iterations", replicationUnit: "response_iteration", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: true },
  { id: "response_set_score", startingValue: 0.55, comparator: "greater_than", denominatorType: "complete_untouched_condition_sets", replicationUnit: "set", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: true },
  { id: "independent_probe_set_score", startingValue: 0.6, comparator: "greater_than", denominatorType: "complete_independent_probe_sets", replicationUnit: "set", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: true },
  { id: "fresh_red_team_set_score", startingValue: 0.6, comparator: "less_than", denominatorType: "complete_fresh_red_team_sets", replicationUnit: "set", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "hard_gate", maySatisfyRobustness: true },
  { id: "advanced_library_set_score", startingValue: 0.7, comparator: "greater_than", denominatorType: "complete_advanced_regression_sets", replicationUnit: "set", benchmark: "not_applicable", hardware: "not_applicable", evidenceRole: "regression_only", maySatisfyRobustness: false },
])

const INPUT_KEYS = [
  "schemaVersion", "studyPolicyRoot", "sourceKind", "calibrationRoot",
  "calibrationBounded", "frozenBeforeCandidateOutput", "candidateOutputInspected",
  "formationOutcomeInspected", "holdoutOutcomeInspected", "stoppedRouteOutcomeInspected",
  "eligibleInventoryRoot", "implementationRoot", "fixedBenchmarkIdentity",
  "fixedHardwareIdentity", "replacements",
] as const

const REPLACEMENT_KEYS = [
  "gateId", "replacementValue", "denominatorType", "replicationUnit",
  "eligibleInventoryRoot", "implementationRoot", "benchmarkIdentity",
  "hardwareIdentity", "calibrationRoot", "justification",
] as const

interface FreezeInput {
  readonly schemaVersion: "v1.38-measurement-freeze-input-v1"
  readonly studyPolicyRoot: `sha256:${string}`
  readonly sourceKind: "activation_prompt_fallback" | "profile_neutral_calibration"
  readonly calibrationRoot: `sha256:${string}` | null
  readonly calibrationBounded: true
  readonly frozenBeforeCandidateOutput: true
  readonly candidateOutputInspected: false
  readonly formationOutcomeInspected: false
  readonly holdoutOutcomeInspected: false
  readonly stoppedRouteOutcomeInspected: false
  readonly eligibleInventoryRoot: `sha256:${string}`
  readonly implementationRoot: `sha256:${string}`
  readonly fixedBenchmarkIdentity: string
  readonly fixedHardwareIdentity: string
  readonly replacements: readonly RecordValue[]
}

const parseInput = (input: unknown): FreezeInput => {
  if (!isRecord(input)) fail()
  const record = input as RecordValue
  if (!exactKeys(record, INPUT_KEYS)) fail()
  if (
    record.schemaVersion !== "v1.38-measurement-freeze-input-v1" ||
    (record.sourceKind !== "activation_prompt_fallback" && record.sourceKind !== "profile_neutral_calibration") ||
    !isHash(record.studyPolicyRoot) || !isHash(record.eligibleInventoryRoot) ||
    !isHash(record.implementationRoot) || !isIdentity(record.fixedBenchmarkIdentity) ||
    !isIdentity(record.fixedHardwareIdentity) || record.calibrationBounded !== true ||
    record.frozenBeforeCandidateOutput !== true || record.candidateOutputInspected !== false ||
    record.formationOutcomeInspected !== false || record.holdoutOutcomeInspected !== false ||
    record.stoppedRouteOutcomeInspected !== false || !Array.isArray(record.replacements)
  ) fail()
  const replacements = record.replacements as unknown[]
  if (record.sourceKind === "activation_prompt_fallback") {
    if (record.calibrationRoot !== null || replacements.length !== 0) fail()
  } else if (!isHash(record.calibrationRoot) || replacements.length === 0) {
    fail()
  }
  return record as unknown as FreezeInput
}

export interface V138FrozenMeasurementGate {
  readonly id: V138MeasurementGateId
  readonly startingValue: number
  readonly comparator: GateSpec["comparator"]
  readonly denominator: Readonly<{
    type: string
    replicationUnit: string
    eligibleInventoryRoot: `sha256:${string}`
    implementationRoot: `sha256:${string}`
    benchmarkIdentity: string
    hardwareIdentity: string
  }>
  readonly provenance: Readonly<{
    disposition: "declared_activation_prompt_fallback" | "bounded_profile_neutral_replacement"
    sourceRoot: `sha256:${string}`
    justification: string
  }>
  readonly evidenceRole: GateSpec["evidenceRole"]
  readonly maySatisfyRobustness: boolean
}

const replacementFor = (
  input: FreezeInput,
  spec: GateSpec,
): RecordValue | undefined => {
  const matches = input.replacements.filter((entry) => isRecord(entry) && entry.gateId === spec.id)
  if (matches.length > 1) fail()
  return matches[0]
}

const validateReplacement = (
  replacement: RecordValue,
  input: FreezeInput,
  spec: GateSpec,
): number => {
  const replacementValue = replacement.replacementValue
  if (!exactKeys(replacement, REPLACEMENT_KEYS) ||
    replacement.gateId !== spec.id || typeof replacementValue !== "number" ||
    !Number.isFinite(replacementValue) || replacementValue < 0 ||
    replacement.denominatorType !== spec.denominatorType ||
    replacement.replicationUnit !== spec.replicationUnit ||
    replacement.eligibleInventoryRoot !== input.eligibleInventoryRoot ||
    replacement.implementationRoot !== input.implementationRoot ||
    replacement.benchmarkIdentity !== (spec.benchmark === "fixed" ? input.fixedBenchmarkIdentity : "not_applicable:profile-neutral") ||
    replacement.hardwareIdentity !== (spec.hardware === "fixed" ? input.fixedHardwareIdentity : "not_applicable:profile-neutral") ||
    replacement.calibrationRoot !== input.calibrationRoot ||
    replacement.justification !== "bounded_profile_neutral_benchmark_calibration") fail()
  return replacementValue as number
}

export const freezeV138MeasurementPolicy = (rawInput: unknown) => {
  const input = parseInput(rawInput)
  const seenReplacementIds = new Set<string>()
  for (const entry of input.replacements) {
    if (!isRecord(entry) || !exactKeys(entry, REPLACEMENT_KEYS)) fail()
    const gateId = entry.gateId
    if (typeof gateId !== "string" || !GATE_SPECS.some((spec) => spec.id === gateId) ||
      seenReplacementIds.has(gateId)) fail()
    seenReplacementIds.add(gateId as string)
  }

  const gates: readonly V138FrozenMeasurementGate[] = GATE_SPECS.map((spec) => {
    const replacement = replacementFor(input, spec)
    if (input.sourceKind === "profile_neutral_calibration" && replacement === undefined) {
      return {
        id: spec.id,
        startingValue: spec.startingValue,
        comparator: spec.comparator,
        denominator: {
          type: spec.denominatorType,
          replicationUnit: spec.replicationUnit,
          eligibleInventoryRoot: input.eligibleInventoryRoot,
          implementationRoot: input.implementationRoot,
          benchmarkIdentity: spec.benchmark === "fixed" ? input.fixedBenchmarkIdentity : "not_applicable:profile-neutral",
          hardwareIdentity: spec.hardware === "fixed" ? input.fixedHardwareIdentity : "not_applicable:profile-neutral",
        },
        provenance: {
          disposition: "declared_activation_prompt_fallback" as const,
          sourceRoot: ACTIVATION_PROMPT_ROOT,
          justification: "activation_prompt_starting_value",
        },
        evidenceRole: spec.evidenceRole,
        maySatisfyRobustness: spec.maySatisfyRobustness,
      }
    }
    const value = replacement === undefined
      ? spec.startingValue
      : validateReplacement(replacement, input, spec)
    return {
      id: spec.id,
      startingValue: value,
      comparator: spec.comparator,
      denominator: {
        type: spec.denominatorType,
        replicationUnit: spec.replicationUnit,
        eligibleInventoryRoot: input.eligibleInventoryRoot,
        implementationRoot: input.implementationRoot,
        benchmarkIdentity: spec.benchmark === "fixed" ? input.fixedBenchmarkIdentity : "not_applicable:profile-neutral",
        hardwareIdentity: spec.hardware === "fixed" ? input.fixedHardwareIdentity : "not_applicable:profile-neutral",
      },
      provenance: replacement === undefined
        ? {
            disposition: "declared_activation_prompt_fallback" as const,
            sourceRoot: ACTIVATION_PROMPT_ROOT,
            justification: "activation_prompt_starting_value",
          }
        : {
            disposition: "bounded_profile_neutral_replacement" as const,
            sourceRoot: input.calibrationRoot!,
            justification: replacement.justification as string,
          },
      evidenceRole: spec.evidenceRole,
      maySatisfyRobustness: spec.maySatisfyRobustness,
    }
  })

  return deepFreeze({
    schemaVersion: "v1.38-frozen-measurement-policy-v1" as const,
    policyKind: "profile_neutral_measurement_policy" as const,
    studyPolicyRoot: input.studyPolicyRoot,
    frozenBeforeCandidateOutput: true as const,
    gates,
    robustnessGateIds: gates.filter((gate) => gate.maySatisfyRobustness).map((gate) => gate.id),
    redTeamRule: {
      directPass: "fresh_red_team_below_60_percent" as const,
      counterBranch: "counter_found_then_next_declared_response_clears_frozen_adaptation_target" as const,
      counterDoesNotSoftenThreshold: true as const,
    },
    advancedLibrary: {
      evidenceRole: "regression_only" as const,
      robustnessEvidence: false as const,
      balanceEvidence: false as const,
    },
  })
}

export type V138ProcessStatus = "process_failure" | "process_valid"
export type V138CurrentRulesOutcome =
  | "not_evaluated"
  | "metagame_passed"
  | "metagame_failed"
  | "no_robust_pure_finalist"
export type V138FormationOutcome =
  | "not_evaluated"
  | "formation_rejected"
  | "formation_empirical_pass"
export type V138HoldoutStatus = "unopened" | "clean" | "contaminated"

export interface V138ReportState {
  readonly processStatus: V138ProcessStatus
  readonly currentRulesOutcome: V138CurrentRulesOutcome
  readonly formationOutcome: V138FormationOutcome
  readonly holdoutStatus: V138HoldoutStatus
}

const REPORT_KEYS = [
  "processStatus", "currentRulesOutcome", "formationOutcome", "holdoutStatus",
] as const
const CURRENT_OUTCOMES: readonly Exclude<V138CurrentRulesOutcome, "not_evaluated">[] = Object.freeze([
  "metagame_passed", "metagame_failed", "no_robust_pure_finalist",
])
const FORMATION_OUTCOMES: readonly Exclude<V138FormationOutcome, "not_evaluated">[] = Object.freeze([
  "formation_rejected", "formation_empirical_pass",
])
const OPENED_HOLDOUT_STATES: readonly Exclude<V138HoldoutStatus, "unopened">[] = Object.freeze([
  "clean", "contaminated",
])

const reportStateKey = (state: V138ReportState): string =>
  `${state.processStatus}|${state.currentRulesOutcome}|${state.formationOutcome}|${state.holdoutStatus}`

export const V138_VALID_REPORT_STATES: readonly Readonly<V138ReportState>[] = deepFreeze([
  {
    processStatus: "process_failure",
    currentRulesOutcome: "not_evaluated",
    formationOutcome: "not_evaluated",
    holdoutStatus: "unopened",
  },
  ...CURRENT_OUTCOMES.map((currentRulesOutcome) => ({
    processStatus: "process_valid" as const,
    currentRulesOutcome,
    formationOutcome: "not_evaluated" as const,
    holdoutStatus: "unopened" as const,
  })),
  ...CURRENT_OUTCOMES.flatMap((currentRulesOutcome) =>
    FORMATION_OUTCOMES.flatMap((formationOutcome) =>
      OPENED_HOLDOUT_STATES.map((holdoutStatus) => ({
        processStatus: "process_valid" as const,
        currentRulesOutcome,
        formationOutcome,
        holdoutStatus,
      })))),
])

const VALID_REPORT_STATE_KEYS = new Set(V138_VALID_REPORT_STATES.map(reportStateKey))

export const validateV138ReportState = (input: unknown): Readonly<V138ReportState> => {
  if (!isRecord(input) || !exactKeys(input, REPORT_KEYS) ||
    (input.processStatus !== "process_failure" && input.processStatus !== "process_valid") ||
    !["not_evaluated", ...CURRENT_OUTCOMES].includes(input.currentRulesOutcome as V138CurrentRulesOutcome) ||
    !["not_evaluated", ...FORMATION_OUTCOMES].includes(input.formationOutcome as V138FormationOutcome) ||
    !["unopened", ...OPENED_HOLDOUT_STATES].includes(input.holdoutStatus as V138HoldoutStatus)) {
    throw new TypeError("V138_REPORT_STATE_INVALID")
  }
  const state = input as unknown as V138ReportState
  if (!VALID_REPORT_STATE_KEYS.has(reportStateKey(state))) {
    throw new TypeError("V138_REPORT_STATE_INVALID")
  }
  return deepFreeze(globalThis.structuredClone(state))
}

const GATE_EVALUATION_KEYS = [
  "schemaVersion", "runtimeViolationCount", "systemFailureCount",
  "legalInformationViolationCount", "privateDataLeakCount", "missingCellCount",
  "conflictingResultCount", "unprovedIdentityJoinCount", "populationGatePassed",
  "diversityGatePassed", "finalistGatePassed", "consecutiveResponseGatePassed",
  "probeGatePassed", "redTeamGatePassed", "robustPureAvailable",
  "advancedRegressionPassed", "attractiveCompositeScore",
] as const

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0

export type V138FrozenGateFailure =
  | "runtime_violation_count"
  | "system_failure_count"
  | "legal_information_violation_count"
  | "private_data_leak_count"
  | "missing_cell_count"
  | "conflicting_result_count"
  | "unproved_identity_join_count"
  | "population_gate"
  | "diversity_gate"
  | "finalist_gate"
  | "consecutive_response_gate"
  | "probe_gate"
  | "red_team_gate"
  | "robust_pure_unavailable"

export const evaluateV138FrozenGates = (input: unknown) => {
  if (!isRecord(input) || !exactKeys(input, GATE_EVALUATION_KEYS) ||
    input.schemaVersion !== "v1.38-frozen-gate-evaluation-v1" ||
    ![
      input.runtimeViolationCount, input.systemFailureCount,
      input.legalInformationViolationCount, input.privateDataLeakCount,
      input.missingCellCount, input.conflictingResultCount,
      input.unprovedIdentityJoinCount,
    ].every(isCount) ||
    ![
      input.populationGatePassed, input.diversityGatePassed,
      input.finalistGatePassed, input.consecutiveResponseGatePassed,
      input.probeGatePassed, input.redTeamGatePassed,
      input.robustPureAvailable, input.advancedRegressionPassed,
    ].every((value) => typeof value === "boolean") ||
    typeof input.attractiveCompositeScore !== "number" ||
    !Number.isFinite(input.attractiveCompositeScore)) {
    throw new TypeError("V138_FROZEN_GATE_EVALUATION_INVALID")
  }

  const integrityGates: readonly [V138FrozenGateFailure, number][] = [
    ["runtime_violation_count", input.runtimeViolationCount as number],
    ["system_failure_count", input.systemFailureCount as number],
    ["legal_information_violation_count", input.legalInformationViolationCount as number],
    ["private_data_leak_count", input.privateDataLeakCount as number],
    ["missing_cell_count", input.missingCellCount as number],
    ["conflicting_result_count", input.conflictingResultCount as number],
    ["unproved_identity_join_count", input.unprovedIdentityJoinCount as number],
  ]
  const failedIntegrity = integrityGates.find(([, count]) => count !== 0)
  if (failedIntegrity !== undefined) {
    return deepFreeze({
      status: "stopped_process_integrity" as const,
      failedGate: failedIntegrity[0],
      empiricalEvaluated: false as const,
      currentRulesOutcome: "not_evaluated" as const,
      downstreamAuthority: false as const,
    })
  }

  const empiricalGates: readonly [V138FrozenGateFailure, boolean][] = [
    ["population_gate", input.populationGatePassed as boolean],
    ["diversity_gate", input.diversityGatePassed as boolean],
    ["finalist_gate", input.finalistGatePassed as boolean],
    ["consecutive_response_gate", input.consecutiveResponseGatePassed as boolean],
    ["probe_gate", input.probeGatePassed as boolean],
    ["red_team_gate", input.redTeamGatePassed as boolean],
  ]
  const failedEmpirical = empiricalGates.find(([, passed]) => !passed)
  if (failedEmpirical !== undefined) {
    return deepFreeze({
      status: "process_valid_empirical_failure" as const,
      failedGate: failedEmpirical[0],
      empiricalEvaluated: true as const,
      currentRulesOutcome: "metagame_failed" as const,
      downstreamAuthority: false as const,
    })
  }
  if (input.robustPureAvailable !== true) {
    return deepFreeze({
      status: "process_valid_empirical_failure" as const,
      failedGate: "robust_pure_unavailable" as const,
      empiricalEvaluated: true as const,
      currentRulesOutcome: "no_robust_pure_finalist" as const,
      downstreamAuthority: false as const,
    })
  }
  return deepFreeze({
    status: "process_valid_empirical_pass" as const,
    failedGate: null,
    empiricalEvaluated: true as const,
    currentRulesOutcome: "metagame_passed" as const,
    downstreamAuthority: false as const,
  })
}

const CLAIM_KEYS = [
  "claim", "oracleIds", "budgetRoot", "populationRoot", "conditionRoot",
  "identityRoot", "versions",
] as const

const FORBIDDEN_CLAIM_PATTERNS: readonly RegExp[] = Object.freeze([
  /soften(?:ed|ing)?\s+(?:the\s+)?threshold/iu,
  /lower(?:ed|ing)?\s+(?:the\s+)?threshold/iu,
  /selective(?:ly)?\s+omitt/iu,
  /omitt(?:ed|ing)?\s+failures?/iu,
  /production\s+authori[sz]ation/iu,
  /authori[sz](?:e|ed|ing)?\s+production/iu,
  /solved[ -]game|game\s+is\s+solved/iu,
  /exact\s+exploitability/iu,
  /\boptimal(?:ity|ly)?\b/iu,
  /permanent\s+balance/iu,
  /\bunexploitable\b/iu,
  /\bnash\b/iu,
  /meta[ -]free/iu,
  /never\s+develop\s+a\s+meta|cannot\s+develop\s+a\s+meta/iu,
])

export type V138ClaimLintReason =
  | "claim_shape_invalid"
  | "forbidden_claim"
  | "not_oracle_relative"
  | "missing_oracle_qualifier"
  | "missing_budget_qualifier"
  | "missing_population_qualifier"
  | "missing_condition_qualifier"
  | "missing_identity_qualifier"
  | "missing_version_qualifier"

const claimFailure = (reason: V138ClaimLintReason) => deepFreeze({ ok: false as const, reason })

export const lintV138Claim = (input: unknown) => {
  if (!isRecord(input) || !exactKeys(input, CLAIM_KEYS) ||
    typeof input.claim !== "string" || input.claim.length === 0 || input.claim.length > 2_000 ||
    !Array.isArray(input.oracleIds) || !Array.isArray(input.versions)) {
    return claimFailure("claim_shape_invalid")
  }
  if (FORBIDDEN_CLAIM_PATTERNS.some((pattern) => pattern.test(input.claim as string))) {
    return claimFailure("forbidden_claim")
  }
  if (!/oracle-relative/iu.test(input.claim as string)) return claimFailure("not_oracle_relative")
  if (input.oracleIds.length === 0 || !input.oracleIds.every((value) => isIdentity(value))) {
    return claimFailure("missing_oracle_qualifier")
  }
  if (!isHash(input.budgetRoot)) return claimFailure("missing_budget_qualifier")
  if (!isHash(input.populationRoot)) return claimFailure("missing_population_qualifier")
  if (!isHash(input.conditionRoot)) return claimFailure("missing_condition_qualifier")
  if (!isHash(input.identityRoot)) return claimFailure("missing_identity_qualifier")
  if (input.versions.length === 0 || !input.versions.every((value) => isIdentity(value))) {
    return claimFailure("missing_version_qualifier")
  }
  return deepFreeze({ ok: true as const, reason: null })
}

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("V138_MEASUREMENT_CANONICAL_JSON_INVALID")
  return admitted.canonicalBytes
}

const sha256 = (value: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const domainRoot = (domain: string, value: unknown): `sha256:${string}` =>
  sha256(Buffer.concat([
    Buffer.from(domain, "utf8"),
    Buffer.from([0]),
    canonicalBytes(value),
  ]))

const isBytes = (value: unknown): value is Uint8Array => value instanceof Uint8Array

const MEASUREMENT_BUILD_KEYS = [
  "measurementPolicy", "sourceBytes", "testBytes", "studyPolicyBytes",
  "inputPolicyBytes", "generatorBytes",
] as const

export interface V138PreSearchMeasurementPolicyBuildInput {
  readonly measurementPolicy: ReturnType<typeof freezeV138MeasurementPolicy>
  readonly sourceBytes: Uint8Array
  readonly testBytes: Uint8Array
  readonly studyPolicyBytes: Uint8Array
  readonly inputPolicyBytes: Uint8Array
  readonly generatorBytes: Uint8Array
}

export const buildV138PreSearchMeasurementPolicy = (
  input: V138PreSearchMeasurementPolicyBuildInput,
) => {
  if (!isRecord(input) || !exactKeys(input, MEASUREMENT_BUILD_KEYS) ||
    !isBytes(input.sourceBytes) || !isBytes(input.testBytes) ||
    !isBytes(input.studyPolicyBytes) || !isBytes(input.inputPolicyBytes) ||
    !isBytes(input.generatorBytes) || !isRecord(input.measurementPolicy) ||
    input.measurementPolicy.schemaVersion !== "v1.38-frozen-measurement-policy-v1" ||
    !isHash(input.measurementPolicy.studyPolicyRoot)) {
    throw new TypeError("V138_PRE_SEARCH_MEASUREMENT_POLICY_INPUT_INVALID")
  }
  const sourceBindings = {
    measurementSourceSha256: sha256(input.sourceBytes),
    measurementTestSha256: sha256(input.testBytes),
    studyPolicyArtifactSha256: sha256(input.studyPolicyBytes),
    measurementInputPolicySha256: sha256(input.inputPolicyBytes),
    generatorSha256: sha256(input.generatorBytes),
  }
  const payload = {
    schemaVersion: "v1.38-pre-search-measurement-policy-v1" as const,
    policyKind: "pre_search_measurement_policy" as const,
    policyStatus: "ready" as const,
    studyPolicyRoot: input.measurementPolicy.studyPolicyRoot,
    measurementPolicy: input.measurementPolicy,
    reportStates: V138_VALID_REPORT_STATES,
    claimPolicy: {
      scope: "oracle_relative_only" as const,
      qualifiers: ["oracles", "budget", "population", "conditions", "identities", "versions"] as const,
      thresholdSofteningAllowed: false as const,
      selectiveFailureOmissionAllowed: false as const,
      compositeMayOverrideHardGate: false as const,
    },
    sourceBindings,
    admission: { admit03: "blocked" as const, matrixAdmissionStatus: "blocked" as const },
    custody: { seal01: "unmet" as const, custodyClaimed: false as const },
    authority: {
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      holdoutOpenAuthorized: false as const,
      productionAuthorized: false as const,
      liveWorkAuthorized: false as const,
    },
  }
  const policy = deepFreeze({
    ...payload,
    policyRoot: domainRoot("cowards-game:v1.38:pre-search-measurement-policy-root:v1", payload),
  })
  assertPublicOutputLeakSafe(policy, "v1.38 pre-search measurement policy")
  return policy
}

export const renderV138PreSearchMeasurementPolicy = (policy: unknown): string =>
  `${new TextDecoder().decode(canonicalBytes(policy as JsonValue))}\n`
