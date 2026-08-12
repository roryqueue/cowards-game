import { describe, expect, it } from "vitest"

import {
  buildV138PreSearchMeasurementPolicy,
  evaluateV138FrozenGates,
  freezeV138MeasurementPolicy,
  lintV138Claim,
  renderV138PreSearchMeasurementPolicy,
  validateV138ReportState,
} from "./lib/v1-38-measurement.js"

const HASH_A = `sha256:${"a".repeat(64)}` as const
const HASH_B = `sha256:${"b".repeat(64)}` as const
const HASH_C = `sha256:${"c".repeat(64)}` as const
const HASH_D = "sha256:6d0fdbfa92179e0a3a2d6024c1171d5f066da8f1db6e524358967551dc226134" as const
const HASH_E = `sha256:${"e".repeat(64)}` as const

const fallbackInput = () => ({
  schemaVersion: "v1.38-measurement-freeze-input-v1",
  studyPolicyRoot: HASH_A,
  sourceKind: "activation_prompt_fallback",
  calibrationRoot: null,
  calibrationBounded: true,
  frozenBeforeCandidateOutput: true,
  candidateOutputInspected: false,
  formationOutcomeInspected: false,
  holdoutOutcomeInspected: false,
  stoppedRouteOutcomeInspected: false,
  eligibleInventoryRoot: HASH_B,
  implementationRoot: HASH_C,
  fixedBenchmarkIdentity: "direct-execution-benchmark:v1",
  fixedHardwareIdentity: "profile-neutral-fixed-class:v1",
  replacements: [],
}) as const

describe("Phase 262 profile-neutral measurement gates", () => {
  it("freezes every starting value with its exact denominator and allowed provenance", () => {
    const policy = freezeV138MeasurementPolicy(fallbackInput())
    expect(policy.studyPolicyRoot).toBe(HASH_A)
    expect(policy.gates.map((gate) => [
      gate.id,
      gate.startingValue,
      gate.denominator.type,
      gate.denominator.replicationUnit,
      gate.evidenceRole,
    ])).toEqual([
      ["source_hard_cap_bytes", 65_536, "strategy_source_bytes", "strategy_revision", "hard_gate"],
      ["source_preferred_target_bytes", 49_152, "strategy_source_bytes", "strategy_revision", "preference_only"],
      ["direct_execution_p99_ms", 5, "fixed_benchmark_invocations", "invocation", "hard_gate"],
      ["league_strategy_count", 12, "eligible_strategy_inventory", "strategy_revision", "hard_gate"],
      ["behavioral_family_count", 6, "eligible_behavioral_family_inventory", "behavioral_family", "hard_gate"],
      ["independent_planner_core_count", 5, "eligible_independent_core_inventory", "planner_core", "hard_gate"],
      ["distinct_finalist_count", 3, "eligible_finalist_inventory", "finalist", "hard_gate"],
      ["consecutive_response_count", 2, "declared_response_iterations", "response_iteration", "hard_gate"],
      ["response_set_score", 0.55, "complete_untouched_condition_sets", "set", "hard_gate"],
      ["independent_probe_set_score", 0.6, "complete_independent_probe_sets", "set", "hard_gate"],
      ["fresh_red_team_set_score", 0.6, "complete_fresh_red_team_sets", "set", "hard_gate"],
      ["advanced_library_set_score", 0.7, "complete_advanced_regression_sets", "set", "regression_only"],
    ])
    for (const gate of policy.gates) {
      expect(Number.isFinite(gate.startingValue)).toBe(true)
      expect(gate.denominator.eligibleInventoryRoot).toBe(HASH_B)
      expect(gate.denominator.implementationRoot).toBe(HASH_C)
      expect(gate.denominator.benchmarkIdentity.length).toBeGreaterThan(0)
      expect(gate.denominator.hardwareIdentity.length).toBeGreaterThan(0)
      expect(gate.provenance).toEqual({
        disposition: "declared_activation_prompt_fallback",
        sourceRoot: HASH_D,
        justification: "activation_prompt_starting_value",
      })
    }
    expect(policy.redTeamRule).toEqual({
      directPass: "fresh_red_team_below_60_percent",
      counterBranch: "counter_found_then_next_declared_response_clears_frozen_adaptation_target",
      counterDoesNotSoftenThreshold: true,
    })
  })

  it("accepts only bounded profile-neutral replacements with matching exact roots", () => {
    const input = {
      ...fallbackInput(),
      sourceKind: "profile_neutral_calibration" as const,
      calibrationRoot: HASH_E,
      replacements: [{
        gateId: "direct_execution_p99_ms",
        replacementValue: 4,
        denominatorType: "fixed_benchmark_invocations",
        replicationUnit: "invocation",
        eligibleInventoryRoot: HASH_B,
        implementationRoot: HASH_C,
        benchmarkIdentity: "direct-execution-benchmark:v1",
        hardwareIdentity: "profile-neutral-fixed-class:v1",
        calibrationRoot: HASH_E,
        justification: "bounded_profile_neutral_benchmark_calibration",
      }],
    } as const
    const policy = freezeV138MeasurementPolicy(input)
    const gate = policy.gates.find((entry) => entry.id === "direct_execution_p99_ms")!
    expect(gate.startingValue).toBe(4)
    expect(gate.provenance).toEqual({
      disposition: "bounded_profile_neutral_replacement",
      sourceRoot: HASH_E,
      justification: "bounded_profile_neutral_benchmark_calibration",
    })
  })

  it("rejects late, ambiguous, non-finite, mismatched, and outcome-informed calibration", () => {
    const base = fallbackInput()
    const invalidInputs: unknown[] = [
      { ...base, frozenBeforeCandidateOutput: false },
      { ...base, candidateOutputInspected: true },
      { ...base, formationOutcomeInspected: true },
      { ...base, holdoutOutcomeInspected: true },
      { ...base, stoppedRouteOutcomeInspected: true },
      { ...base, sourceKind: "candidate_result" },
      { ...base, unknownCalibrationSource: true },
      {
        ...base,
        sourceKind: "profile_neutral_calibration",
        calibrationRoot: HASH_E,
        replacements: [{
          gateId: "direct_execution_p99_ms",
          replacementValue: Number.NaN,
          denominatorType: "fixed_benchmark_invocations",
          replicationUnit: "invocation",
          eligibleInventoryRoot: HASH_B,
          implementationRoot: HASH_C,
          benchmarkIdentity: "direct-execution-benchmark:v1",
          hardwareIdentity: "profile-neutral-fixed-class:v1",
          calibrationRoot: HASH_E,
          justification: "bounded_profile_neutral_benchmark_calibration",
        }],
      },
      {
        ...base,
        sourceKind: "profile_neutral_calibration",
        calibrationRoot: HASH_E,
        replacements: [{
          gateId: "direct_execution_p99_ms",
          replacementValue: 4,
          denominatorType: "fixed_benchmark_invocations",
          replicationUnit: "invocation",
          eligibleInventoryRoot: HASH_D,
          implementationRoot: HASH_C,
          benchmarkIdentity: "direct-execution-benchmark:v1",
          hardwareIdentity: "profile-neutral-fixed-class:v1",
          calibrationRoot: HASH_E,
          justification: "bounded_profile_neutral_benchmark_calibration",
        }],
      },
    ]
    for (const invalid of invalidInputs) {
      expect(() => freezeV138MeasurementPolicy(invalid as never))
        .toThrow("V138_MEASUREMENT_FREEZE_INPUT_INVALID")
    }
  })

  it("keeps Advanced-library evidence mechanically regression-only", () => {
    const policy = freezeV138MeasurementPolicy(fallbackInput())
    const advanced = policy.gates.find((gate) => gate.id === "advanced_library_set_score")!
    expect(advanced.evidenceRole).toBe("regression_only")
    expect(advanced.maySatisfyRobustness).toBe(false)
    expect(policy.robustnessGateIds).not.toContain("advanced_library_set_score")
  })
})

const hardGateInput = () => ({
  schemaVersion: "v1.38-frozen-gate-evaluation-v1",
  runtimeViolationCount: 0,
  systemFailureCount: 0,
  legalInformationViolationCount: 0,
  privateDataLeakCount: 0,
  missingCellCount: 0,
  conflictingResultCount: 0,
  unprovedIdentityJoinCount: 0,
  populationGatePassed: true,
  diversityGatePassed: true,
  finalistGatePassed: true,
  consecutiveResponseGatePassed: true,
  probeGatePassed: true,
  redTeamGatePassed: true,
  robustPureAvailable: true,
  advancedRegressionPassed: true,
  attractiveCompositeScore: 1,
}) as const

describe("Phase 262 orthogonal reporting and non-compensating interpretation", () => {
  it("accepts only the exhaustive orthogonal report-state table", () => {
    const currentOutcomes = [
      "metagame_passed",
      "metagame_failed",
      "no_robust_pure_finalist",
    ] as const
    const valid = [
      {
        processStatus: "process_failure",
        currentRulesOutcome: "not_evaluated",
        formationOutcome: "not_evaluated",
        holdoutStatus: "unopened",
      },
      ...currentOutcomes.map((currentRulesOutcome) => ({
        processStatus: "process_valid" as const,
        currentRulesOutcome,
        formationOutcome: "not_evaluated" as const,
        holdoutStatus: "unopened" as const,
      })),
      ...currentOutcomes.flatMap((currentRulesOutcome) =>
        (["formation_rejected", "formation_empirical_pass"] as const).flatMap((formationOutcome) =>
          (["clean", "contaminated"] as const).map((holdoutStatus) => ({
            processStatus: "process_valid" as const,
            currentRulesOutcome,
            formationOutcome,
            holdoutStatus,
          })))),
    ]
    expect(valid).toHaveLength(16)
    for (const state of valid) expect(validateV138ReportState(state)).toEqual(state)

    for (const invalid of [
      { processStatus: "process_failure", currentRulesOutcome: "metagame_failed", formationOutcome: "not_evaluated", holdoutStatus: "unopened" },
      { processStatus: "process_valid", currentRulesOutcome: "not_evaluated", formationOutcome: "not_evaluated", holdoutStatus: "unopened" },
      { processStatus: "process_valid", currentRulesOutcome: "metagame_passed", formationOutcome: "formation_empirical_pass", holdoutStatus: "unopened" },
      { processStatus: "process_valid", currentRulesOutcome: "metagame_passed", formationOutcome: "not_evaluated", holdoutStatus: "contaminated" },
      { processStatus: "process_valid", currentRulesOutcome: "metagame_passed", formationOutcome: "formation_empirical_pass", holdoutStatus: "clean", extra: true },
    ]) expect(() => validateV138ReportState(invalid)).toThrow("V138_REPORT_STATE_INVALID")
  })

  it("evaluates integrity gates first and never lets a composite compensate", () => {
    expect(evaluateV138FrozenGates({
      ...hardGateInput(),
      systemFailureCount: 1,
      populationGatePassed: true,
      attractiveCompositeScore: Number.MAX_VALUE,
    })).toEqual({
      status: "stopped_process_integrity",
      failedGate: "system_failure_count",
      empiricalEvaluated: false,
      currentRulesOutcome: "not_evaluated",
      downstreamAuthority: false,
    })
    expect(evaluateV138FrozenGates({
      ...hardGateInput(),
      probeGatePassed: false,
      attractiveCompositeScore: Number.MAX_VALUE,
    })).toMatchObject({
      status: "process_valid_empirical_failure",
      failedGate: "probe_gate",
      empiricalEvaluated: true,
      currentRulesOutcome: "metagame_failed",
      downstreamAuthority: false,
    })
    expect(evaluateV138FrozenGates({
      ...hardGateInput(),
      robustPureAvailable: false,
      advancedRegressionPassed: true,
    })).toMatchObject({
      status: "process_valid_empirical_failure",
      failedGate: "robust_pure_unavailable",
      currentRulesOutcome: "no_robust_pure_finalist",
    })
    expect(evaluateV138FrozenGates(hardGateInput())).toMatchObject({
      status: "process_valid_empirical_pass",
      failedGate: null,
      currentRulesOutcome: "metagame_passed",
      downstreamAuthority: false,
    })
  })

  it("allows only qualified oracle-relative claims and rejects overclaim or omission", () => {
    const qualified = {
      claim: "Oracle-relative robustness held for the named frozen evaluation scope.",
      oracleIds: ["oracle:structured-v1", "oracle:distiller-v1"],
      budgetRoot: HASH_A,
      populationRoot: HASH_B,
      conditionRoot: HASH_C,
      identityRoot: HASH_D,
      versions: ["measurement-policy-v1", "engine-v1.4"],
    } as const
    expect(lintV138Claim(qualified)).toEqual({ ok: true, reason: null })
    for (const claim of [
      "The threshold was softened after review.",
      "Failures were selectively omitted.",
      "Production authorization is granted.",
      "The game is solved.",
      "This establishes exact exploitability.",
      "The finalist is mathematically optimal.",
      "This proves permanent balance.",
      "The policy is unexploitable.",
      "This is a Nash equilibrium.",
      "The game is meta-free.",
      "The game can never develop a meta.",
    ]) expect(lintV138Claim({ ...qualified, claim })).toMatchObject({ ok: false })
    expect(lintV138Claim({ ...qualified, oracleIds: [] })).toEqual({
      ok: false,
      reason: "missing_oracle_qualifier",
    })
    expect(lintV138Claim({ ...qualified, extra: true })).toEqual({
      ok: false,
      reason: "claim_shape_invalid",
    })
  })

  it("renders a byte-stable privacy-safe policy with six false authority denials", () => {
    const measurementPolicy = freezeV138MeasurementPolicy(fallbackInput())
    const bytes = new TextEncoder()
    const buildInput = {
      measurementPolicy,
      sourceBytes: bytes.encode("measurement-source"),
      testBytes: bytes.encode("measurement-tests"),
      studyPolicyBytes: bytes.encode("study-policy"),
      inputPolicyBytes: bytes.encode(JSON.stringify(measurementPolicy)),
      generatorBytes: bytes.encode("measurement-generator"),
    }
    const policy = buildV138PreSearchMeasurementPolicy(buildInput)
    expect(policy.studyPolicyRoot).toBe(HASH_A)
    expect(policy.admission).toEqual({ admit03: "blocked", matrixAdmissionStatus: "blocked" })
    expect(policy.custody).toEqual({ seal01: "unmet", custodyClaimed: false })
    expect(Object.values(policy.authority)).toEqual([false, false, false, false, false, false])
    expect(renderV138PreSearchMeasurementPolicy(policy))
      .toBe(renderV138PreSearchMeasurementPolicy(buildV138PreSearchMeasurementPolicy(buildInput)))
    expect(JSON.stringify(policy)).not.toMatch(/StrategyMemory|SoldierMemory|objectivePayload|hostPath|rawDiagnostic/u)
  })
})
