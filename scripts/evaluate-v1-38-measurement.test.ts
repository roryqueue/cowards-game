import { describe, expect, it } from "vitest"

import {
  freezeV138MeasurementPolicy,
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
