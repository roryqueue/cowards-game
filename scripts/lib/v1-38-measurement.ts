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
